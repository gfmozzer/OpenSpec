import path from 'node:path';
import { promises as fs } from 'node:fs';
import { buildSddInternalReadme } from './default-bootstrap-files.js';
import { CLI_NAME } from '../branding.js';
export const README_SDD_BLOCK_START = '<!-- SDD:ONBOARDING:START -->';
export const README_SDD_BLOCK_END = '<!-- SDD:ONBOARDING:END -->';
export const AGENT_SDD_BLOCK_START = '<!-- SDD:GUIA:START -->';
export const AGENT_SDD_BLOCK_END = '<!-- SDD:GUIA:END -->';
export const ROOT_AGENTS_SDD_BLOCK_START = '<!-- SDD:ROOT-AGENTS:START -->';
export const ROOT_AGENTS_SDD_BLOCK_END = '<!-- SDD:ROOT-AGENTS:END -->';
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
function upsertMarkedBlock(source, startMarker, endMarker, blockContent) {
    const replacement = `${startMarker}\n${blockContent.trim()}\n${endMarker}`;
    const startIndex = source.indexOf(startMarker);
    const endIndex = source.indexOf(endMarker);
    if (startIndex >= 0 && endIndex > startIndex) {
        const before = source.slice(0, startIndex);
        const after = source.slice(endIndex + endMarker.length);
        const next = `${before}${replacement}${after}`;
        return { content: next, changed: next !== source, hasMarkers: true };
    }
    const prefix = source.length > 0 && !source.endsWith('\n') ? `${source}\n\n` : `${source}\n`;
    const next = `${prefix}${replacement}\n`;
    return { content: next, changed: true, hasMarkers: false };
}
function buildReadmeBlock(memoryDir, config) {
    return `## Onboarding SDD

Ordem de leitura para qualquer agente novo:
1. \`README.md\` (este bloco)
2. \`${memoryDir}/AGENT.md\`
3. \`${memoryDir}/core/index.md\`
4. \`${memoryDir}/core/arquitetura.md\`
5. \`${memoryDir}/core/servicos.md\`
6. \`${memoryDir}/core/spec-tecnologica.md\`
7. \`${memoryDir}/core/repo-map.md\`
8. \`${memoryDir}/core/fontes.md\`
9. \`${memoryDir}/core/frontend-sitemap.md\` (quando frontend estiver ativado)
10. \`${memoryDir}/core/frontend-decisions.md\` (quando frontend estiver ativado)

Comandos essenciais:
- \`${CLI_NAME} sdd onboard system\`
- \`${CLI_NAME} sdd next\`
- \`${CLI_NAME} sdd context FEAT-###\`
- \`${CLI_NAME} sdd frontend-impact FEAT-### --status required|none --reason "..."\`
- \`${CLI_NAME} sdd finalize --ref FEAT-###\``;
}
function buildAgentGuideBlock(memoryDir, config) {
    const planningDir = config?.folders.planning || 'pendencias';
    const activeDir = config?.folders.active || 'active';
    const depositoDir = config?.folders.deposito || 'deposito';
    const promptsDir = 'prompts';
    return `# Guia Operacional SDD

Trilha oficial:
1. Rode \`${CLI_NAME} sdd onboard system\`.
2. Use \`${CLI_NAME} sdd next\` para escolher trabalho pronto.
3. Use \`${CLI_NAME} sdd start FEAT-###\` para abrir execução.
4. Use \`${CLI_NAME} sdd context FEAT-###\` antes de codar.
5. Declare impacto de frontend com \`${CLI_NAME} sdd frontend-impact FEAT-### ...\`.
6. Após archive, rode \`${CLI_NAME} sdd finalize --ref FEAT-###\`.

Fontes canônicas:
- Estados: \`${memoryDir}/state/*.yaml\`
- Views: \`${memoryDir}/core/*.md\` e \`${memoryDir}/${planningDir}/*.md\`
- Workspace ativo por feature: \`${memoryDir}/${activeDir}/FEAT-###/\`
- Deposito bruto: \`${memoryDir}/${depositoDir}/\` (PRDs, RFCs, wireframes e referencias)
- Prompts recomendados: \`${memoryDir}/${promptsDir}/\``;
}
function buildRootAgentsBlock(memoryDir) {
    return `## SDD Operational Contract

Agents working in this repository must treat documentation sync as part of feature completion.

Required execution order:
1. Run \`${CLI_NAME} sdd onboard system\` before broad work.
2. Run \`${CLI_NAME} sdd start FEAT-###\` before implementation.
3. Use \`${CLI_NAME} sdd context FEAT-###\` before coding.
4. Before archive/finalize, declare frontend impact with \`${CLI_NAME} sdd frontend-impact FEAT-### ...\`.
5. Before archive/finalize, update the documentation affected by the feature:
   - \`README.md\`
   - \`${memoryDir}/AGENT.md\`
   - \`${memoryDir}/core/*.md\`
   - \`AGENTS.md\`
   - \`AGENT.md\`
6. Run \`${CLI_NAME} sdd finalize --ref FEAT-###\` to consolidate memory.

Canonical state lives in \`${memoryDir}/state/*.yaml\`. Markdown files are operational views or guides derived from that state.`;
}
export async function syncSddGuideDocs(projectRoot, paths, config) {
    const readmePath = path.join(projectRoot, 'README.md');
    const internalReadmePath = path.join(paths.memoryRoot, 'README.md');
    const agentPath = path.join(paths.memoryRoot, 'AGENT.md');
    const legacyAgentPath = path.join(paths.memoryRoot, 'agente.md');
    const agentsPath = path.join(projectRoot, 'AGENTS.md');
    const agentCompatPath = path.join(projectRoot, 'AGENT.md');
    const memoryDirName = path.relative(projectRoot, paths.memoryRoot) || '.sdd';
    const readmeExists = await fileExists(readmePath);
    const agentExists = await fileExists(agentPath);
    const legacyAgentExists = await fileExists(legacyAgentPath);
    const agentsExists = await fileExists(agentsPath);
    const agentCompatExists = await fileExists(agentCompatPath);
    const readmeRaw = readmeExists ? await fs.readFile(readmePath, 'utf-8') : '# Projeto\n';
    const agentRaw = agentExists
        ? await fs.readFile(agentPath, 'utf-8')
        : legacyAgentExists
            ? await fs.readFile(legacyAgentPath, 'utf-8')
            : '';
    const agentsRaw = agentsExists ? await fs.readFile(agentsPath, 'utf-8') : '# AGENTS\n';
    const agentCompatRaw = agentCompatExists
        ? await fs.readFile(agentCompatPath, 'utf-8')
        : '# AGENT\n';
    const readmeUpdate = upsertMarkedBlock(readmeRaw, README_SDD_BLOCK_START, README_SDD_BLOCK_END, buildReadmeBlock(memoryDirName, config));
    const agentUpdate = upsertMarkedBlock(agentRaw, AGENT_SDD_BLOCK_START, AGENT_SDD_BLOCK_END, buildAgentGuideBlock(memoryDirName, config));
    const agentsUpdate = upsertMarkedBlock(agentsRaw, ROOT_AGENTS_SDD_BLOCK_START, ROOT_AGENTS_SDD_BLOCK_END, buildRootAgentsBlock(memoryDirName));
    const agentCompatUpdate = upsertMarkedBlock(agentCompatRaw, ROOT_AGENTS_SDD_BLOCK_START, ROOT_AGENTS_SDD_BLOCK_END, buildRootAgentsBlock(memoryDirName));
    const internalReadmeContent = buildSddInternalReadme(memoryDirName, {
        discovery: config?.folders.discovery,
        planning: config?.folders.planning,
        skills: config?.folders.skills,
        templates: config?.folders.templates,
        active: config?.folders.active,
        deposito: config?.folders.deposito,
        prompts: 'prompts',
    });
    const currentInternalReadme = (await fileExists(internalReadmePath))
        ? await fs.readFile(internalReadmePath, 'utf-8')
        : '';
    const internalReadmeChanged = currentInternalReadme !== internalReadmeContent;
    if (internalReadmeChanged) {
        await fs.writeFile(internalReadmePath, internalReadmeContent, 'utf-8');
    }
    if (readmeUpdate.changed) {
        await fs.writeFile(readmePath, readmeUpdate.content, 'utf-8');
    }
    if (agentUpdate.changed) {
        await fs.writeFile(agentPath, agentUpdate.content, 'utf-8');
    }
    if (agentsUpdate.changed) {
        await fs.writeFile(agentsPath, agentsUpdate.content, 'utf-8');
    }
    if (agentCompatUpdate.changed) {
        await fs.writeFile(agentCompatPath, agentCompatUpdate.content, 'utf-8');
    }
    return {
        updatedInternalReadme: internalReadmeChanged,
        updatedReadme: readmeUpdate.changed,
        updatedAgentGuide: agentUpdate.changed,
        updatedRootAgents: agentsUpdate.changed || agentCompatUpdate.changed,
        readmeHadMarkers: readmeUpdate.hasMarkers,
        agentHadMarkers: agentUpdate.hasMarkers,
        rootAgentsHadMarkers: agentsUpdate.hasMarkers && agentCompatUpdate.hasMarkers,
    };
}
export async function validateSddGuideDocs(projectRoot, paths, config) {
    const readmePath = path.join(projectRoot, 'README.md');
    const internalReadmePath = path.join(paths.memoryRoot, 'README.md');
    const memoryDirName = path.relative(projectRoot, paths.memoryRoot) || '.sdd';
    const agentPath = path.join(paths.memoryRoot, 'AGENT.md');
    const legacyAgentPath = path.join(paths.memoryRoot, 'agente.md');
    const agentsPath = path.join(projectRoot, 'AGENTS.md');
    const agentCompatPath = path.join(projectRoot, 'AGENT.md');
    const missingBlocks = [];
    const readmeRaw = (await fileExists(readmePath)) ? await fs.readFile(readmePath, 'utf-8') : '';
    const internalReadmeRaw = (await fileExists(internalReadmePath))
        ? await fs.readFile(internalReadmePath, 'utf-8')
        : '';
    const agentRaw = (await fileExists(agentPath))
        ? await fs.readFile(agentPath, 'utf-8')
        : (await fileExists(legacyAgentPath))
            ? await fs.readFile(legacyAgentPath, 'utf-8')
            : '';
    const agentsRaw = (await fileExists(agentsPath)) ? await fs.readFile(agentsPath, 'utf-8') : '';
    const agentCompatRaw = (await fileExists(agentCompatPath))
        ? await fs.readFile(agentCompatPath, 'utf-8')
        : '';
    if (!readmeRaw.includes(README_SDD_BLOCK_START) || !readmeRaw.includes(README_SDD_BLOCK_END)) {
        missingBlocks.push('README.md::SDD:ONBOARDING');
    }
    if (internalReadmeRaw !==
        buildSddInternalReadme(path.relative(projectRoot, paths.memoryRoot) || '.sdd', {
            discovery: config?.folders.discovery,
            planning: config?.folders.planning,
            skills: config?.folders.skills,
            templates: config?.folders.templates,
            active: config?.folders.active,
            deposito: config?.folders.deposito,
            prompts: 'prompts',
        })) {
        missingBlocks.push(`${memoryDirName}/README.md::SDD:INTERNAL`);
    }
    if (!agentRaw.includes(AGENT_SDD_BLOCK_START) || !agentRaw.includes(AGENT_SDD_BLOCK_END)) {
        missingBlocks.push(`${memoryDirName}/AGENT.md::SDD:GUIA`);
    }
    if (!agentsRaw.includes(ROOT_AGENTS_SDD_BLOCK_START) ||
        !agentsRaw.includes(ROOT_AGENTS_SDD_BLOCK_END)) {
        missingBlocks.push('AGENTS.md::SDD:ROOT-AGENTS');
    }
    if (!agentCompatRaw.includes(ROOT_AGENTS_SDD_BLOCK_START) ||
        !agentCompatRaw.includes(ROOT_AGENTS_SDD_BLOCK_END)) {
        missingBlocks.push('AGENT.md::SDD:ROOT-AGENTS');
    }
    return {
        documentationSync: missingBlocks.length === 0,
        missingBlocks,
    };
}
//# sourceMappingURL=docs-sync.js.map