import path from 'node:path';
import { promises as fs } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { ArchitectureStateSchema, BacklogStateSchema, DiscoveryIndexStateSchema, FinalizeQueueStateSchema, IntegrationContractsStateSchema, FrontendDecisionsStateSchema, UnblockEventsStateSchema, FrontendGapsStateSchema, FrontendMapStateSchema, RepoMapStateSchema, SourceIndexStateSchema, SkillCatalogStateSchema, ServiceCatalogStateSchema, TechStackStateSchema, TechDebtStateSchema, } from './types.js';
import { CLI_NAME } from '../branding.js';
import { DEFAULT_CURATED_SKILL_CATALOG, BUILT_IN_SDD_SKILLS, buildCuratedBundlesMarkdown, } from './default-skills.js';
import { buildSddInternalReadme, PROMPT_00_COMECE_POR_AQUI_MD, PROMPT_01_INGESTAO_DEPOSITO_MD, PROMPT_02_NORMALIZAR_PLANEJAMENTO_MD, PROMPT_03_EXECUCAO_FEATURE_MD, PROMPT_04_CONSOLIDACAO_FINALIZE_MD, PROMPTS_README_MD, TEMPLATE_1_SPEC_MD, TEMPLATE_2_PLAN_MD, TEMPLATE_3_TASKS_MD, TEMPLATE_4_CHANGELOG_MD, } from './default-bootstrap-files.js';
const LEGACY_LAYOUT_FOLDERS = {
    discovery: 'discovery',
    planning: 'pendencias',
    skills: 'skills',
    templates: 'templates',
    deposito: 'deposito',
    active: 'active',
};
const PT_BR_LAYOUT_FOLDERS = {
    discovery: 'descoberta',
    planning: 'planejamento',
    skills: 'habilidades',
    templates: 'modelos',
    deposito: 'deposito',
    active: 'execucao',
};
function skillSubfoldersForLayout(layout) {
    if (layout === 'pt-BR') {
        return { curated: 'skills', bundles: 'pacotes' };
    }
    return { curated: 'curated', bundles: 'bundles' };
}
function defaultFoldersForLayout(layout) {
    return layout === 'pt-BR'
        ? { ...PT_BR_LAYOUT_FOLDERS }
        : { ...LEGACY_LAYOUT_FOLDERS };
}
const DEFAULT_SDD_CONFIG = {
    enabled: true,
    memoryDir: '.sdd',
    language: 'pt-BR',
    layout: 'legacy',
    folders: defaultFoldersForLayout('legacy'),
    frontend: { enabled: false },
    views: { autoRender: true },
};
const DEFAULT_PROJECT_CONFIG = {
    schema: 'spec-driven',
    sdd: DEFAULT_SDD_CONFIG,
};
function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function mergeRuntimeConfig(raw) {
    if (!isRecord(raw)) {
        return {
            ...DEFAULT_SDD_CONFIG,
            folders: { ...DEFAULT_SDD_CONFIG.folders },
            frontend: { enabled: false },
            views: { autoRender: true },
        };
    }
    const frontend = isRecord(raw.frontend) ? raw.frontend : {};
    const views = isRecord(raw.views) ? raw.views : {};
    const language = raw.language === 'en-US' ? 'en-US' : 'pt-BR';
    const layout = raw.layout === 'pt-BR' ? 'pt-BR' : 'legacy';
    const folderDefaults = defaultFoldersForLayout(layout);
    const rawFolders = isRecord(raw.folders) ? raw.folders : {};
    // compatibilidade retroativa para nome legado "pendencias"
    const legacyPlanning = typeof rawFolders.pendencias === 'string' && rawFolders.pendencias.trim().length > 0
        ? rawFolders.pendencias.trim()
        : '';
    const planningFolder = typeof rawFolders.planning === 'string' && rawFolders.planning.trim().length > 0
        ? rawFolders.planning.trim()
        : legacyPlanning || folderDefaults.planning;
    return {
        enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SDD_CONFIG.enabled,
        memoryDir: typeof raw.memoryDir === 'string' && raw.memoryDir.trim().length > 0
            ? raw.memoryDir.trim()
            : DEFAULT_SDD_CONFIG.memoryDir,
        language,
        layout,
        folders: {
            discovery: typeof rawFolders.discovery === 'string' && rawFolders.discovery.trim().length > 0
                ? rawFolders.discovery.trim()
                : folderDefaults.discovery,
            planning: planningFolder,
            skills: typeof rawFolders.skills === 'string' && rawFolders.skills.trim().length > 0
                ? rawFolders.skills.trim()
                : folderDefaults.skills,
            templates: typeof rawFolders.templates === 'string' && rawFolders.templates.trim().length > 0
                ? rawFolders.templates.trim()
                : folderDefaults.templates,
            deposito: typeof rawFolders.deposito === 'string' && rawFolders.deposito.trim().length > 0
                ? rawFolders.deposito.trim()
                : folderDefaults.deposito,
            active: typeof rawFolders.active === 'string' && rawFolders.active.trim().length > 0
                ? rawFolders.active.trim()
                : folderDefaults.active,
        },
        frontend: {
            enabled: typeof frontend.enabled === 'boolean'
                ? frontend.enabled
                : DEFAULT_SDD_CONFIG.frontend.enabled,
        },
        views: {
            autoRender: typeof views.autoRender === 'boolean'
                ? views.autoRender
                : DEFAULT_SDD_CONFIG.views.autoRender,
        },
    };
}
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}
export async function loadProjectSddConfig(projectRoot) {
    const configPathYaml = path.join(projectRoot, 'openspec', 'config.yaml');
    const configPathYml = path.join(projectRoot, 'openspec', 'config.yml');
    const configPath = (await fileExists(configPathYaml))
        ? configPathYaml
        : (await fileExists(configPathYml))
            ? configPathYml
            : null;
    if (!configPath) {
        return {
            ...DEFAULT_SDD_CONFIG,
            folders: { ...DEFAULT_SDD_CONFIG.folders },
            frontend: { enabled: false },
            views: { autoRender: true },
        };
    }
    const rawContent = await fs.readFile(configPath, 'utf-8');
    const parsed = parseYaml(rawContent);
    const root = isRecord(parsed) ? parsed : {};
    return mergeRuntimeConfig(root.sdd);
}
export async function upsertProjectSddConfig(projectRoot, overrides) {
    const openspecDir = path.join(projectRoot, 'openspec');
    await ensureDir(openspecDir);
    const configPathYaml = path.join(openspecDir, 'config.yaml');
    const configPathYml = path.join(openspecDir, 'config.yml');
    const configPath = (await fileExists(configPathYaml))
        ? configPathYaml
        : (await fileExists(configPathYml))
            ? configPathYml
            : configPathYaml;
    let rootConfig = { ...DEFAULT_PROJECT_CONFIG };
    if (await fileExists(configPath)) {
        const existing = parseYaml(await fs.readFile(configPath, 'utf-8'));
        if (isRecord(existing)) {
            rootConfig = existing;
        }
    }
    if (typeof rootConfig.schema !== 'string' || rootConfig.schema.trim().length === 0) {
        rootConfig.schema = DEFAULT_PROJECT_CONFIG.schema;
    }
    const mergedSdd = mergeRuntimeConfig(rootConfig.sdd);
    if (overrides?.frontendEnabled !== undefined) {
        mergedSdd.frontend.enabled = overrides.frontendEnabled;
    }
    if (overrides?.language) {
        mergedSdd.language = overrides.language;
    }
    if (overrides?.layout) {
        mergedSdd.layout = overrides.layout;
        mergedSdd.folders = defaultFoldersForLayout(overrides.layout);
    }
    rootConfig.sdd = mergedSdd;
    await fs.writeFile(configPath, stringifyYaml(rootConfig), 'utf-8');
    return mergedSdd;
}
export function resolveSddPaths(projectRoot, config) {
    const memoryRoot = path.resolve(projectRoot, config.memoryDir);
    const stateDir = path.join(memoryRoot, 'state');
    const discoveryDir = path.join(memoryRoot, config.folders.discovery);
    const pendenciasDir = path.join(memoryRoot, config.folders.planning);
    const skillsDir = path.join(memoryRoot, config.folders.skills);
    const skillSubfolders = skillSubfoldersForLayout(config.layout);
    const skillsCuratedDir = path.join(skillsDir, skillSubfolders.curated);
    const skillsBundlesDir = path.join(skillsDir, skillSubfolders.bundles);
    const templatesDir = path.join(memoryRoot, config.folders.templates);
    const promptsDir = path.join(memoryRoot, 'prompts');
    const depositoDir = path.join(memoryRoot, config.folders.deposito);
    const activeDir = path.join(memoryRoot, config.folders.active);
    const discoveryInsightsDir = path.join(discoveryDir, '1-insights');
    const discoveryDebatesDir = path.join(discoveryDir, '2-debates');
    const discoveryRadarDir = path.join(discoveryDir, '3-radar');
    const discoveryDiscardedDir = path.join(discoveryDir, '4-discarded');
    return {
        projectRoot,
        memoryRoot,
        configFile: path.join(memoryRoot, 'config.yaml'),
        coreDir: path.join(memoryRoot, 'core'),
        discoveryDir,
        pendenciasDir,
        stateDir,
        skillsDir,
        skillsCuratedDir,
        skillsBundlesDir,
        skillsCuratedFolderName: skillSubfolders.curated,
        skillsBundlesFolderName: skillSubfolders.bundles,
        templatesDir,
        promptsDir,
        depositoDir,
        activeDir,
        discoveryInsightsDir,
        discoveryDebatesDir,
        discoveryRadarDir,
        discoveryDiscardedDir,
        stateFiles: {
            discoveryIndex: path.join(stateDir, 'discovery-index.yaml'),
            backlog: path.join(stateDir, 'backlog.yaml'),
            techDebt: path.join(stateDir, 'tech-debt.yaml'),
            finalizeQueue: path.join(stateDir, 'finalize-queue.yaml'),
            skillCatalog: path.join(stateDir, 'skill-catalog.yaml'),
            unblockEvents: path.join(stateDir, 'unblock-events.yaml'),
            frontendGaps: path.join(stateDir, 'frontend-gaps.yaml'),
            frontendMap: path.join(stateDir, 'frontend-map.yaml'),
            architecture: path.join(stateDir, 'architecture.yaml'),
            serviceCatalog: path.join(stateDir, 'service-catalog.yaml'),
            techStack: path.join(stateDir, 'tech-stack.yaml'),
            integrationContracts: path.join(stateDir, 'integration-contracts.yaml'),
            frontendDecisions: path.join(stateDir, 'frontend-decisions.yaml'),
            repoMap: path.join(stateDir, 'repo-map.yaml'),
            sourceIndex: path.join(stateDir, 'source-index.yaml'),
        },
    };
}
export async function ensureBaseStructure(paths) {
    await Promise.all([
        ensureDir(paths.memoryRoot),
        ensureDir(paths.coreDir),
        ensureDir(paths.discoveryDir),
        ensureDir(paths.pendenciasDir),
        ensureDir(paths.stateDir),
        ensureDir(paths.activeDir),
        ensureDir(paths.skillsDir),
        ensureDir(paths.skillsCuratedDir),
        ensureDir(paths.skillsBundlesDir),
        ensureDir(paths.templatesDir),
        ensureDir(paths.promptsDir),
        ensureDir(paths.discoveryInsightsDir),
        ensureDir(paths.discoveryDebatesDir),
        ensureDir(paths.discoveryRadarDir),
        ensureDir(paths.discoveryDiscardedDir),
        ensureDir(path.join(paths.coreDir, 'dados')),
        ensureDir(path.join(paths.coreDir, 'integracoes')),
        ensureDir(path.join(paths.coreDir, 'adrs')),
        ensureDir(paths.depositoDir),
        ensureDir(path.join(paths.depositoDir, 'prds')),
        ensureDir(path.join(paths.depositoDir, 'rfcs')),
        ensureDir(path.join(paths.depositoDir, 'briefings')),
        ensureDir(path.join(paths.depositoDir, 'historias')),
        ensureDir(path.join(paths.depositoDir, 'wireframes')),
        ensureDir(path.join(paths.depositoDir, 'html-mocks')),
        ensureDir(path.join(paths.depositoDir, 'referencias-visuais')),
        ensureDir(path.join(paths.depositoDir, 'entrevistas')),
        ensureDir(path.join(paths.depositoDir, 'anexos')),
        ensureDir(path.join(paths.depositoDir, 'legado')),
    ]);
}
async function writeYamlIfMissing(filePath, content) {
    if (await fileExists(filePath)) {
        return;
    }
    await fs.writeFile(filePath, stringifyYaml(content), 'utf-8');
}
async function writeFileIfMissing(filePath, content) {
    if (await fileExists(filePath)) {
        return;
    }
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
}
async function ensureCuratedSkillCatalog(filePath) {
    if (!(await fileExists(filePath))) {
        await fs.writeFile(filePath, stringifyYaml(DEFAULT_CURATED_SKILL_CATALOG), 'utf-8');
        return;
    }
    const parsed = SkillCatalogStateSchema.safeParse(await readYaml(filePath));
    if (!parsed.success) {
        return;
    }
    const existing = parsed.data;
    if (existing.skills.length === 0 && existing.bundles.length === 0) {
        await fs.writeFile(filePath, stringifyYaml(DEFAULT_CURATED_SKILL_CATALOG), 'utf-8');
        return;
    }
    const skillById = new Map(existing.skills.map((entry) => [entry.id, entry]));
    let changed = false;
    for (const defaultSkill of DEFAULT_CURATED_SKILL_CATALOG.skills) {
        if (!skillById.has(defaultSkill.id)) {
            skillById.set(defaultSkill.id, defaultSkill);
            changed = true;
        }
    }
    const bundleById = new Map(existing.bundles.map((entry) => [entry.id, entry]));
    for (const defaultBundle of DEFAULT_CURATED_SKILL_CATALOG.bundles) {
        const existingBundle = bundleById.get(defaultBundle.id);
        if (!existingBundle) {
            bundleById.set(defaultBundle.id, defaultBundle);
            changed = true;
            continue;
        }
        const mergedSkillIds = Array.from(new Set([...existingBundle.skill_ids, ...defaultBundle.skill_ids]));
        if (mergedSkillIds.length !== existingBundle.skill_ids.length) {
            bundleById.set(defaultBundle.id, {
                ...existingBundle,
                skill_ids: mergedSkillIds,
            });
            changed = true;
        }
    }
    if (changed) {
        await fs.writeFile(filePath, stringifyYaml({
            version: 1,
            skills: Array.from(skillById.values()).sort((a, b) => a.id.localeCompare(b.id)),
            bundles: Array.from(bundleById.values()).sort((a, b) => a.id.localeCompare(b.id)),
        }), 'utf-8');
    }
}
export async function ensureBaseFiles(paths, config) {
    await writeYamlIfMissing(paths.configFile, {
        version: 1,
        generatedBy: `${CLI_NAME} sdd init`,
        language: config.language,
        layout: config.layout,
        folders: config.folders,
        frontend: { enabled: config.frontend.enabled },
        views: { autoRender: config.views.autoRender },
    });
    await writeYamlIfMissing(paths.stateFiles.discoveryIndex, {
        version: 1,
        counters: { INS: 0, DEB: 0, RAD: 0, FEAT: 0, FGAP: 0, TD: 0 },
        records: [],
    });
    await writeYamlIfMissing(paths.stateFiles.backlog, { version: 1, items: [] });
    await writeYamlIfMissing(paths.stateFiles.techDebt, { version: 1, items: [] });
    await writeYamlIfMissing(paths.stateFiles.finalizeQueue, { version: 1, items: [] });
    await ensureCuratedSkillCatalog(paths.stateFiles.skillCatalog);
    await writeYamlIfMissing(paths.stateFiles.unblockEvents, { version: 1, events: [] });
    await writeYamlIfMissing(paths.stateFiles.architecture, { version: 1, nodes: [] });
    await writeYamlIfMissing(paths.stateFiles.serviceCatalog, { version: 1, services: [] });
    await writeYamlIfMissing(paths.stateFiles.techStack, { version: 1, items: [] });
    await writeYamlIfMissing(paths.stateFiles.integrationContracts, { version: 1, contracts: [] });
    await writeYamlIfMissing(paths.stateFiles.repoMap, { version: 1, items: [] });
    await writeYamlIfMissing(paths.stateFiles.sourceIndex, { version: 1, sources: [] });
    if (config.frontend.enabled) {
        await writeYamlIfMissing(paths.stateFiles.frontendGaps, { version: 1, items: [] });
        await writeYamlIfMissing(paths.stateFiles.frontendMap, { version: 1, routes: [] });
        await writeYamlIfMissing(paths.stateFiles.frontendDecisions, { version: 1, items: [] });
    }
    await writeFileIfMissing(path.join(paths.coreDir, 'arquitetura.md'), '# Arquitetura\n\nDocumento arquitetural de alto nivel do projeto.\n');
    await writeFileIfMissing(path.join(paths.memoryRoot, 'README.md'), buildSddInternalReadme(path.basename(paths.memoryRoot), {
        discovery: config.folders.discovery,
        planning: config.folders.planning,
        skills: config.folders.skills,
        templates: config.folders.templates,
        active: config.folders.active,
        deposito: config.folders.deposito,
        prompts: 'prompts',
    }));
    await writeFileIfMissing(path.join(paths.skillsBundlesDir, 'curadoria-pt-br.md'), buildCuratedBundlesMarkdown());
    for (const [skillId, content] of Object.entries(BUILT_IN_SDD_SKILLS)) {
        await writeFileIfMissing(path.join(paths.skillsCuratedDir, skillId, 'SKILL.md'), content);
    }
    await writeFileIfMissing(path.join(paths.depositoDir, 'README.md'), `# Deposito de Fontes Brutas\n\nEsta pasta guarda PRDs, RFCs, wireframes, HTMLs, referencias visuais, entrevistas e outros insumos consolidados.\n\nRegra: nada aqui e fonte canonica. O inventario oficial fica em \`.sdd/state/source-index.yaml\`.\n`);
    await writeFileIfMissing(path.join(paths.promptsDir, 'README.md'), PROMPTS_README_MD);
    await writeFileIfMissing(path.join(paths.promptsDir, '00-comece-por-aqui.md'), PROMPT_00_COMECE_POR_AQUI_MD);
    await writeFileIfMissing(path.join(paths.promptsDir, '01-ingestao-deposito.md'), PROMPT_01_INGESTAO_DEPOSITO_MD);
    await writeFileIfMissing(path.join(paths.promptsDir, '02-normalizar-planejamento.md'), PROMPT_02_NORMALIZAR_PLANEJAMENTO_MD);
    await writeFileIfMissing(path.join(paths.promptsDir, '03-execucao-feature.md'), PROMPT_03_EXECUCAO_FEATURE_MD);
    await writeFileIfMissing(path.join(paths.promptsDir, '04-consolidacao-finalize.md'), PROMPT_04_CONSOLIDACAO_FINALIZE_MD);
    await writeFileIfMissing(path.join(paths.templatesDir, 'template-1-spec.md'), TEMPLATE_1_SPEC_MD);
    await writeFileIfMissing(path.join(paths.templatesDir, 'template-2-plan.md'), TEMPLATE_2_PLAN_MD);
    await writeFileIfMissing(path.join(paths.templatesDir, 'template-3-tasks.md'), TEMPLATE_3_TASKS_MD);
    await writeFileIfMissing(path.join(paths.templatesDir, 'template-4-changelog.md'), TEMPLATE_4_CHANGELOG_MD);
    if (config.layout === 'pt-BR') {
        await writeFileIfMissing(path.join(paths.templatesDir, 'modelo-1-especificacao.md'), TEMPLATE_1_SPEC_MD);
        await writeFileIfMissing(path.join(paths.templatesDir, 'modelo-2-planejamento.md'), TEMPLATE_2_PLAN_MD);
        await writeFileIfMissing(path.join(paths.templatesDir, 'modelo-3-tarefas.md'), TEMPLATE_3_TASKS_MD);
        await writeFileIfMissing(path.join(paths.templatesDir, 'modelo-4-historico.md'), TEMPLATE_4_CHANGELOG_MD);
    }
}
async function readYaml(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseYaml(content);
}
async function writeYaml(filePath, value) {
    await fs.writeFile(filePath, stringifyYaml(value), 'utf-8');
}
export async function loadStateSnapshot(paths, config) {
    const discoveryIndex = DiscoveryIndexStateSchema.parse(await readYaml(paths.stateFiles.discoveryIndex));
    const backlog = BacklogStateSchema.parse(await readYaml(paths.stateFiles.backlog));
    const techDebt = TechDebtStateSchema.parse(await readYaml(paths.stateFiles.techDebt));
    const finalizeQueue = FinalizeQueueStateSchema.parse(await readYaml(paths.stateFiles.finalizeQueue));
    const skillCatalog = SkillCatalogStateSchema.parse(await readYaml(paths.stateFiles.skillCatalog));
    const unblockEvents = UnblockEventsStateSchema.parse(await readYaml(paths.stateFiles.unblockEvents));
    const architecture = ArchitectureStateSchema.parse(await readYaml(paths.stateFiles.architecture));
    const serviceCatalog = ServiceCatalogStateSchema.parse(await readYaml(paths.stateFiles.serviceCatalog));
    const techStack = TechStackStateSchema.parse(await readYaml(paths.stateFiles.techStack));
    const integrationContracts = IntegrationContractsStateSchema.parse(await readYaml(paths.stateFiles.integrationContracts));
    const repoMap = RepoMapStateSchema.parse(await readYaml(paths.stateFiles.repoMap));
    const sourceIndex = SourceIndexStateSchema.parse(await readYaml(paths.stateFiles.sourceIndex));
    let frontendGaps;
    let frontendMap;
    let frontendDecisions;
    if (config.frontend.enabled) {
        frontendGaps = FrontendGapsStateSchema.parse(await readYaml(paths.stateFiles.frontendGaps));
        frontendMap = FrontendMapStateSchema.parse(await readYaml(paths.stateFiles.frontendMap));
        frontendDecisions = FrontendDecisionsStateSchema.parse(await readYaml(paths.stateFiles.frontendDecisions));
    }
    return {
        discoveryIndex,
        backlog,
        techDebt,
        finalizeQueue,
        skillCatalog,
        unblockEvents,
        frontendGaps,
        frontendMap,
        architecture,
        serviceCatalog,
        techStack,
        integrationContracts,
        frontendDecisions,
        repoMap,
        sourceIndex,
    };
}
export async function loadSkillCatalogState(paths) {
    return SkillCatalogStateSchema.parse(await readYaml(paths.stateFiles.skillCatalog));
}
function formatCounterId(prefix, value) {
    return `${prefix}-${String(value).padStart(3, '0')}`;
}
export function nowIso() {
    return new Date().toISOString();
}
export async function saveDiscoveryIndexState(paths, state) {
    await writeYaml(paths.stateFiles.discoveryIndex, state);
}
export async function saveBacklogState(paths, state) {
    await writeYaml(paths.stateFiles.backlog, state);
}
export async function saveTechDebtState(paths, state) {
    await writeYaml(paths.stateFiles.techDebt, state);
}
export async function saveFinalizeQueueState(paths, state) {
    await writeYaml(paths.stateFiles.finalizeQueue, state);
}
export async function saveSkillCatalogState(paths, state) {
    await writeYaml(paths.stateFiles.skillCatalog, state);
}
export async function saveUnblockEventsState(paths, state) {
    await writeYaml(paths.stateFiles.unblockEvents, state);
}
export async function saveFrontendGapsState(paths, state) {
    await writeYaml(paths.stateFiles.frontendGaps, state);
}
export async function saveFrontendMapState(paths, state) {
    await writeYaml(paths.stateFiles.frontendMap, state);
}
export async function saveArchitectureState(paths, state) {
    await writeYaml(paths.stateFiles.architecture, state);
}
export async function saveServiceCatalogState(paths, state) {
    await writeYaml(paths.stateFiles.serviceCatalog, state);
}
export async function saveTechStackState(paths, state) {
    await writeYaml(paths.stateFiles.techStack, state);
}
export async function saveIntegrationContractsState(paths, state) {
    await writeYaml(paths.stateFiles.integrationContracts, state);
}
export async function saveFrontendDecisionsState(paths, state) {
    await writeYaml(paths.stateFiles.frontendDecisions, state);
}
export async function saveRepoMapState(paths, state) {
    await writeYaml(paths.stateFiles.repoMap, state);
}
export async function saveSourceIndexState(paths, state) {
    await writeYaml(paths.stateFiles.sourceIndex, state);
}
export async function allocateEntityId(paths, type) {
    const discoveryIndex = DiscoveryIndexStateSchema.parse(await readYaml(paths.stateFiles.discoveryIndex));
    const current = discoveryIndex.counters[type] ?? 0;
    const next = current + 1;
    discoveryIndex.counters[type] = next;
    await saveDiscoveryIndexState(paths, discoveryIndex);
    return formatCounterId(type, next);
}
//# sourceMappingURL=state.js.map