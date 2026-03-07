import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { SddPaths } from './state.js';

export const README_SDD_BLOCK_START = '<!-- SDD:ONBOARDING:START -->';
export const README_SDD_BLOCK_END = '<!-- SDD:ONBOARDING:END -->';
export const AGENT_SDD_BLOCK_START = '<!-- SDD:GUIA:START -->';
export const AGENT_SDD_BLOCK_END = '<!-- SDD:GUIA:END -->';
export const ROOT_AGENTS_SDD_BLOCK_START = '<!-- SDD:ROOT-AGENTS:START -->';
export const ROOT_AGENTS_SDD_BLOCK_END = '<!-- SDD:ROOT-AGENTS:END -->';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function upsertMarkedBlock(
  source: string,
  startMarker: string,
  endMarker: string,
  blockContent: string
): { content: string; changed: boolean; hasMarkers: boolean } {
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

function buildReadmeBlock(memoryDir: string): string {
  return `## Onboarding SDD

Ordem de leitura para qualquer agente novo:
1. \`README.md\` (este bloco)
2. \`${memoryDir}/agente.md\`
3. \`${memoryDir}/core/index.md\`
4. \`${memoryDir}/core/arquitetura.md\`
5. \`${memoryDir}/core/servicos.md\`
6. \`${memoryDir}/core/spec-tecnologica.md\`
7. \`${memoryDir}/core/repo-map.md\`
8. \`${memoryDir}/core/frontend-decisions.md\` (quando frontend estiver ativado)

Comandos essenciais:
- \`openspec sdd onboard system\`
- \`openspec sdd next\`
- \`openspec sdd context FEAT-###\`
- \`openspec sdd finalize --ref FEAT-###\``;
}

function buildAgentGuideBlock(memoryDir: string): string {
  return `# Guia Operacional SDD

Trilha oficial:
1. Rode \`openspec sdd onboard system\`.
2. Use \`openspec sdd next\` para escolher trabalho pronto.
3. Use \`openspec sdd start FEAT-###\` para abrir execução.
4. Use \`openspec sdd context FEAT-###\` antes de codar.
5. Após archive, rode \`openspec sdd finalize --ref FEAT-###\`.

Fontes canônicas:
- Estados: \`${memoryDir}/state/*.yaml\`
- Views: \`${memoryDir}/core/*.md\` e \`${memoryDir}/pendencias/*.md\`
- Workspace ativo por feature: \`${memoryDir}/active/FEAT-###/\``;
}

function buildRootAgentsBlock(memoryDir: string): string {
  return `## SDD Operational Contract

Agents working in this repository must treat documentation sync as part of feature completion.

Required execution order:
1. Run \`openspec sdd onboard system\` before broad work.
2. Run \`openspec sdd start FEAT-###\` before implementation.
3. Use \`openspec sdd context FEAT-###\` before coding.
4. Before archive/finalize, update the documentation affected by the feature:
   - \`README.md\`
   - \`${memoryDir}/agente.md\`
   - \`${memoryDir}/core/*.md\`
   - \`AGENTS.md\`
   - \`AGENT.md\`
5. Run \`openspec sdd finalize --ref FEAT-###\` to consolidate memory.

Canonical state lives in \`${memoryDir}/state/*.yaml\`. Markdown files are operational views or guides derived from that state.`;
}

export async function syncSddGuideDocs(
  projectRoot: string,
  paths: SddPaths
): Promise<{
  updatedReadme: boolean;
  updatedAgentGuide: boolean;
  updatedRootAgents: boolean;
  readmeHadMarkers: boolean;
  agentHadMarkers: boolean;
  rootAgentsHadMarkers: boolean;
}> {
  const readmePath = path.join(projectRoot, 'README.md');
  const agentPath = path.join(paths.memoryRoot, 'agente.md');
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  const agentCompatPath = path.join(projectRoot, 'AGENT.md');
  const memoryDirName = path.relative(projectRoot, paths.memoryRoot) || '.sdd';

  const readmeExists = await fileExists(readmePath);
  const agentExists = await fileExists(agentPath);
  const agentsExists = await fileExists(agentsPath);
  const agentCompatExists = await fileExists(agentCompatPath);
  const readmeRaw = readmeExists ? await fs.readFile(readmePath, 'utf-8') : '# Projeto\n';
  const agentRaw = agentExists ? await fs.readFile(agentPath, 'utf-8') : '';
  const agentsRaw = agentsExists ? await fs.readFile(agentsPath, 'utf-8') : '# AGENTS\n';
  const agentCompatRaw = agentCompatExists
    ? await fs.readFile(agentCompatPath, 'utf-8')
    : '# AGENT\n';

  const readmeUpdate = upsertMarkedBlock(
    readmeRaw,
    README_SDD_BLOCK_START,
    README_SDD_BLOCK_END,
    buildReadmeBlock(memoryDirName)
  );
  const agentUpdate = upsertMarkedBlock(
    agentRaw,
    AGENT_SDD_BLOCK_START,
    AGENT_SDD_BLOCK_END,
    buildAgentGuideBlock(memoryDirName)
  );
  const agentsUpdate = upsertMarkedBlock(
    agentsRaw,
    ROOT_AGENTS_SDD_BLOCK_START,
    ROOT_AGENTS_SDD_BLOCK_END,
    buildRootAgentsBlock(memoryDirName)
  );
  const agentCompatUpdate = upsertMarkedBlock(
    agentCompatRaw,
    ROOT_AGENTS_SDD_BLOCK_START,
    ROOT_AGENTS_SDD_BLOCK_END,
    buildRootAgentsBlock(memoryDirName)
  );

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
    updatedReadme: readmeUpdate.changed,
    updatedAgentGuide: agentUpdate.changed,
    updatedRootAgents: agentsUpdate.changed || agentCompatUpdate.changed,
    readmeHadMarkers: readmeUpdate.hasMarkers,
    agentHadMarkers: agentUpdate.hasMarkers,
    rootAgentsHadMarkers: agentsUpdate.hasMarkers && agentCompatUpdate.hasMarkers,
  };
}

export async function validateSddGuideDocs(
  projectRoot: string,
  paths: SddPaths
): Promise<{
  documentationSync: boolean;
  missingBlocks: string[];
}> {
  const readmePath = path.join(projectRoot, 'README.md');
  const agentPath = path.join(paths.memoryRoot, 'agente.md');
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  const agentCompatPath = path.join(projectRoot, 'AGENT.md');
  const missingBlocks: string[] = [];

  const readmeRaw = (await fileExists(readmePath)) ? await fs.readFile(readmePath, 'utf-8') : '';
  const agentRaw = (await fileExists(agentPath)) ? await fs.readFile(agentPath, 'utf-8') : '';
  const agentsRaw = (await fileExists(agentsPath)) ? await fs.readFile(agentsPath, 'utf-8') : '';
  const agentCompatRaw = (await fileExists(agentCompatPath))
    ? await fs.readFile(agentCompatPath, 'utf-8')
    : '';

  if (!readmeRaw.includes(README_SDD_BLOCK_START) || !readmeRaw.includes(README_SDD_BLOCK_END)) {
    missingBlocks.push('README.md::SDD:ONBOARDING');
  }
  if (!agentRaw.includes(AGENT_SDD_BLOCK_START) || !agentRaw.includes(AGENT_SDD_BLOCK_END)) {
    missingBlocks.push('.sdd/agente.md::SDD:GUIA');
  }
  if (
    !agentsRaw.includes(ROOT_AGENTS_SDD_BLOCK_START) ||
    !agentsRaw.includes(ROOT_AGENTS_SDD_BLOCK_END)
  ) {
    missingBlocks.push('AGENTS.md::SDD:ROOT-AGENTS');
  }
  if (
    !agentCompatRaw.includes(ROOT_AGENTS_SDD_BLOCK_START) ||
    !agentCompatRaw.includes(ROOT_AGENTS_SDD_BLOCK_END)
  ) {
    missingBlocks.push('AGENT.md::SDD:ROOT-AGENTS');
  }

  return {
    documentationSync: missingBlocks.length === 0,
    missingBlocks,
  };
}
