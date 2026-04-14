import path from 'node:path';
import { promises as fs } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { CLI_NAME, } from '../branding.js';
import { loadProjectSddConfig, loadStateSnapshot, resolveSddPaths, saveBacklogState, saveDiscoveryIndexState, saveFinalizeQueueState, saveFrontendDecisionsState, saveFrontendGapsState, saveFrontendMapState, saveIntegrationContractsState, saveRepoMapState, saveServiceCatalogState, saveSourceIndexState, saveTechDebtState, saveTechStackState, saveUnblockEventsState, } from './state.js';
export const CURRENT_SDD_STATE_VERSION = 2;
const ID_PREFIXES = new Set(['INS', 'DEB', 'RAD', 'EPIC', 'FEAT', 'FGAP', 'TD']);
const REFERENCE_LIKE_VALUE = /\b(?:INS|DEB|RAD|EPIC|FEAT|FGAP|TD)-\d+\b/;
const MIGRATABLE_FILE_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.txt']);
function normalizeId(rawId) {
    const match = /^([A-Z]+)-(\d+)$/.exec(rawId);
    if (!match)
        return rawId;
    const [, prefix, digits] = match;
    if (!ID_PREFIXES.has(prefix))
        return rawId;
    const canonicalPrefix = prefix === 'RAD' ? 'EPIC' : prefix;
    return `${canonicalPrefix}-${digits.padStart(4, '0')}`;
}
function isLegacyId(rawId) {
    const normalized = normalizeId(rawId);
    return normalized !== rawId;
}
function collectReferenceConversions(value, conversions) {
    if (!value)
        return;
    if (Array.isArray(value)) {
        for (const item of value) {
            collectReferenceConversions(item, conversions);
        }
        return;
    }
    if (typeof value === 'object') {
        for (const nested of Object.values(value)) {
            collectReferenceConversions(nested, conversions);
        }
        return;
    }
    if (typeof value !== 'string')
        return;
    const matches = value.match(/\b(?:INS|DEB|RAD|EPIC|FEAT|FGAP|TD)-\d+\b/g);
    if (!matches)
        return;
    for (const match of matches) {
        const normalized = normalizeId(match);
        if (normalized !== match) {
            conversions.set(match, normalized);
        }
    }
}
function replaceExactReferences(value, conversions) {
    let next = value;
    for (const [oldId, newId] of conversions.entries()) {
        next = next.replace(new RegExp(`\\b${oldId}\\b`, 'g'), newId);
    }
    return next;
}
function traverseAndConvertReferences(value, conversions) {
    if (Array.isArray(value)) {
        return value.map((item) => traverseAndConvertReferences(item, conversions));
    }
    if (value && typeof value === 'object') {
        const updatedEntries = Object.entries(value).map(([key, entry]) => [
            key,
            traverseAndConvertReferences(entry, conversions),
        ]);
        return Object.fromEntries(updatedEntries);
    }
    if (typeof value === 'string') {
        return replaceExactReferences(value, conversions);
    }
    return value;
}
async function readStateConfigVersion(configPath) {
    try {
        const raw = parseYaml(await fs.readFile(configPath, 'utf-8'));
        const version = raw?.state_version;
        return typeof version === 'number' && Number.isFinite(version) ? version : 1;
    }
    catch {
        return 1;
    }
}
async function writeStateConfigVersion(configPath) {
    let payload = {};
    try {
        const parsed = parseYaml(await fs.readFile(configPath, 'utf-8'));
        if (parsed && typeof parsed === 'object') {
            payload = parsed;
        }
    }
    catch {
        payload = {};
    }
    payload.version = 1;
    payload.generatedBy = payload.generatedBy || `${CLI_NAME} sdd init`;
    payload.state_version = CURRENT_SDD_STATE_VERSION;
    payload.last_migrated_at = new Date().toISOString();
    await fs.writeFile(configPath, stringifyYaml(payload), 'utf-8');
}
async function listAllFiles(rootDir) {
    const files = [];
    async function walk(currentDir) {
        let entries;
        try {
            entries = await fs.readdir(currentDir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            }
            else {
                files.push(fullPath);
            }
        }
    }
    await walk(rootDir);
    return files;
}
async function safeRenameEntry(entryPath, nextPath) {
    try {
        await fs.rename(entryPath, nextPath);
        return true;
    }
    catch (error) {
        const err = error;
        if (err.code !== 'EEXIST' && err.code !== 'ENOTEMPTY') {
            throw error;
        }
    }
    const entryStat = await fs.lstat(entryPath);
    if (entryStat.isDirectory()) {
        await fs.rm(entryPath, { recursive: true, force: true });
        return false;
    }
    await fs.rm(entryPath, { force: true });
    return false;
}
async function renameFilesystemEntries(rootDir, conversions) {
    const entries = await listAllFiles(rootDir);
    const directories = new Set();
    for (const filePath of entries) {
        let current = path.dirname(filePath);
        while (current.startsWith(rootDir) && current !== rootDir) {
            directories.add(current);
            current = path.dirname(current);
        }
    }
    const targets = [...entries, ...directories].sort((a, b) => b.length - a.length);
    let renamed = 0;
    for (const entryPath of targets) {
        let nextPath = entryPath;
        for (const [oldId, newId] of conversions.entries()) {
            nextPath = nextPath.replace(new RegExp(`\\b${oldId}\\b`, 'g'), newId);
        }
        if (nextPath === entryPath)
            continue;
        try {
            await fs.access(entryPath);
        }
        catch {
            continue;
        }
        await fs.mkdir(path.dirname(nextPath), { recursive: true });
        if (await safeRenameEntry(entryPath, nextPath)) {
            renamed += 1;
        }
    }
    return renamed;
}
async function rewriteFilesystemContents(rootDir, conversions) {
    const files = await listAllFiles(rootDir);
    let updated = 0;
    for (const filePath of files) {
        if (!MIGRATABLE_FILE_EXTENSIONS.has(path.extname(filePath))) {
            continue;
        }
        const original = await fs.readFile(filePath, 'utf8');
        const next = replaceExactReferences(original, conversions)
            .replace(/\borigin_type:\s*radar\b/g, 'origin_type: epic')
            .replace(/\bOrigem:\s*radar\b/g, 'Origem: epic')
            .replace(/\b## Por EPIC\/RAD\b/g, '## Por EPIC')
            .replace(/\|\s*EPIC\/RAD\s*\|/g, '| EPIC |');
        if (next !== original) {
            await fs.writeFile(filePath, next, 'utf8');
            updated += 1;
        }
    }
    return updated;
}
export async function assessSddMigration(projectRoot) {
    const config = await loadProjectSddConfig(projectRoot);
    const paths = resolveSddPaths(projectRoot, config);
    const snapshot = await loadStateSnapshot(paths, config);
    const currentVersion = await readStateConfigVersion(paths.configFile);
    const conversions = new Map();
    collectReferenceConversions(snapshot.discoveryIndex, conversions);
    collectReferenceConversions(snapshot.backlog, conversions);
    collectReferenceConversions(snapshot.techDebt, conversions);
    collectReferenceConversions(snapshot.finalizeQueue, conversions);
    collectReferenceConversions(snapshot.unblockEvents, conversions);
    collectReferenceConversions(snapshot.serviceCatalog, conversions);
    collectReferenceConversions(snapshot.techStack, conversions);
    collectReferenceConversions(snapshot.integrationContracts, conversions);
    collectReferenceConversions(snapshot.repoMap, conversions);
    collectReferenceConversions(snapshot.sourceIndex, conversions);
    if (snapshot.frontendGaps)
        collectReferenceConversions(snapshot.frontendGaps, conversions);
    if (snapshot.frontendMap)
        collectReferenceConversions(snapshot.frontendMap, conversions);
    if (snapshot.frontendDecisions)
        collectReferenceConversions(snapshot.frontendDecisions, conversions);
    const legacyRecords = snapshot.discoveryIndex.records
        .filter((record) => record.type === 'RAD' || isLegacyId(record.id))
        .map((record) => record.id);
    const reasons = [];
    if (currentVersion < CURRENT_SDD_STATE_VERSION) {
        reasons.push(`state_version=${currentVersion} esta abaixo da versao requerida ${CURRENT_SDD_STATE_VERSION}`);
    }
    if (legacyRecords.length > 0) {
        reasons.push(`registros legacy detectados: ${legacyRecords.join(', ')}`);
    }
    if (snapshot.backlog.items.some((item) => item.origin_type === 'radar')) {
        reasons.push('backlog ainda usa origin_type=radar');
    }
    if (snapshot.backlog.items.some((item) => !!item.origin_ref && isLegacyId(item.origin_ref))) {
        reasons.push('backlog ainda referencia IDs legados');
    }
    if (snapshot.discoveryIndex.records.some((record) => record.related_ids.some(isLegacyId))) {
        reasons.push('related_ids ainda apontam para IDs legados');
    }
    if ([...conversions.keys()].some((id) => REFERENCE_LIKE_VALUE.test(id))) {
        reasons.push('existem referencias SDD fora do formato canonico de quatro digitos');
    }
    return {
        currentVersion,
        targetVersion: CURRENT_SDD_STATE_VERSION,
        needsMigration: reasons.length > 0,
        reasons,
        conversions: [...conversions.entries()].map(([from, to]) => ({ from, to })),
        legacyRecords,
    };
}
export class SddMigrateCommand {
    async execute(projectRoot, options) {
        const assessment = await assessSddMigration(projectRoot);
        const messages = [];
        if (!assessment.needsMigration) {
            messages.push(`Estado SDD ja esta na versao ${assessment.targetVersion}. Nenhuma migracao necessaria.`);
            return { converted: 0, messages, assessment };
        }
        if (options?.radToEpic === false) {
            throw new Error('Migracao SDD mandatória nao pode ser desabilitada.');
        }
        const config = await loadProjectSddConfig(projectRoot);
        const paths = resolveSddPaths(projectRoot, config);
        const snapshot = await loadStateSnapshot(paths, config);
        const conversions = new Map(assessment.conversions.map((entry) => [entry.from, entry.to]));
        snapshot.discoveryIndex.records = snapshot.discoveryIndex.records.map((record) => ({
            ...traverseAndConvertReferences(record, conversions),
            id: conversions.get(record.id) || record.id,
            type: record.type === 'RAD' ? 'EPIC' : record.type,
        }));
        const highestByPrefix = new Map();
        for (const record of snapshot.discoveryIndex.records) {
            const match = /^([A-Z]+)-(\d+)$/.exec(record.id);
            if (!match)
                continue;
            const [, prefix, digits] = match;
            highestByPrefix.set(prefix, Math.max(highestByPrefix.get(prefix) || 0, Number(digits)));
        }
        for (const [prefix, current] of Object.entries(snapshot.discoveryIndex.counters)) {
            const candidate = highestByPrefix.get(prefix) || current || 0;
            snapshot.discoveryIndex.counters[prefix] = Math.max(current || 0, candidate);
        }
        snapshot.discoveryIndex.counters.RAD = 0;
        snapshot.backlog.items = traverseAndConvertReferences(snapshot.backlog.items, conversions).map((item) => ({
            ...item,
            id: conversions.get(item.id) || item.id,
            origin_type: item.origin_type === 'radar' ? 'epic' : item.origin_type,
        }));
        snapshot.techDebt.items = traverseAndConvertReferences(snapshot.techDebt.items, conversions).map((item) => ({
            ...item,
            id: conversions.get(item.id) || item.id,
        }));
        snapshot.finalizeQueue.items = traverseAndConvertReferences(snapshot.finalizeQueue.items, conversions);
        snapshot.unblockEvents.events = traverseAndConvertReferences(snapshot.unblockEvents.events, conversions);
        snapshot.serviceCatalog.services = traverseAndConvertReferences(snapshot.serviceCatalog.services, conversions);
        snapshot.techStack.items = traverseAndConvertReferences(snapshot.techStack.items, conversions);
        snapshot.integrationContracts.contracts = traverseAndConvertReferences(snapshot.integrationContracts.contracts, conversions);
        snapshot.repoMap.items = traverseAndConvertReferences(snapshot.repoMap.items, conversions);
        snapshot.sourceIndex.sources = traverseAndConvertReferences(snapshot.sourceIndex.sources, conversions);
        if (snapshot.frontendGaps) {
            snapshot.frontendGaps.items = traverseAndConvertReferences(snapshot.frontendGaps.items, conversions).map((item) => ({
                ...item,
                id: conversions.get(item.id) || item.id,
            }));
        }
        if (snapshot.frontendMap) {
            snapshot.frontendMap.routes = traverseAndConvertReferences(snapshot.frontendMap.routes, conversions);
        }
        if (snapshot.frontendDecisions) {
            snapshot.frontendDecisions.items = traverseAndConvertReferences(snapshot.frontendDecisions.items, conversions);
        }
        await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);
        await saveBacklogState(paths, snapshot.backlog);
        await saveTechDebtState(paths, snapshot.techDebt);
        await saveFinalizeQueueState(paths, snapshot.finalizeQueue);
        await saveUnblockEventsState(paths, snapshot.unblockEvents);
        await saveServiceCatalogState(paths, snapshot.serviceCatalog);
        await saveTechStackState(paths, snapshot.techStack);
        await saveIntegrationContractsState(paths, snapshot.integrationContracts);
        await saveRepoMapState(paths, snapshot.repoMap);
        await saveSourceIndexState(paths, snapshot.sourceIndex);
        if (snapshot.frontendGaps) {
            await saveFrontendGapsState(paths, snapshot.frontendGaps);
        }
        if (snapshot.frontendMap) {
            await saveFrontendMapState(paths, snapshot.frontendMap);
        }
        if (snapshot.frontendDecisions) {
            await saveFrontendDecisionsState(paths, snapshot.frontendDecisions);
        }
        const renamedEntries = await renameFilesystemEntries(paths.memoryRoot, conversions);
        const rewrittenFiles = await rewriteFilesystemContents(paths.memoryRoot, conversions);
        await writeStateConfigVersion(paths.configFile);
        const converted = conversions.size;
        messages.push(`Migracao SDD concluida para state_version=${CURRENT_SDD_STATE_VERSION}. Referencias convertidas: ${converted}.`);
        if (assessment.legacyRecords.length > 0) {
            messages.push(`Registros canonizados: ${assessment.legacyRecords.join(', ')}`);
        }
        messages.push(`Entradas renomeadas no filesystem: ${renamedEntries}.`);
        messages.push(`Arquivos reescritos com referencias canonicas: ${rewrittenFiles}.`);
        return {
            converted,
            messages,
            assessment: {
                ...assessment,
                currentVersion: CURRENT_SDD_STATE_VERSION,
                needsMigration: false,
                reasons: [],
            },
        };
    }
}
//# sourceMappingURL=migrate.js.map