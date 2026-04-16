import path from 'node:path';
import { existsSync, promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse as parseYaml } from 'yaml';
import { createChange } from '../../utils/change-utils.js';
import { AI_TOOLS } from '../config.js';
import { CLI_NAME } from '../branding.js';
import { LENSES, validateDocumentAgainstLens } from './lenses.js';
import { adrFileName, generateAdrTemplate } from './adr.js';
import { TransitionEngine } from './transition-engine.js';
import { suggestSkills } from './skills.js';
import {
  allocateEntityId,
  loadProjectSddConfig,
  loadStateSnapshot,
  loadSkillCatalogState,
  nowIso,
  resolveSddPaths,
  saveArchitectureState,
  saveBacklogState,
  saveDiscoveryIndexState,
  saveFinalizeQueueState,
  saveFrontendDecisionsState,
  saveFrontendGapsState,
  saveFrontendMapState,
  saveIntegrationContractsState,
  saveRepoMapState,
  saveServiceCatalogState,
  saveSourceIndexState,
  saveTechStackState,
  saveUnblockEventsState,
  type SddPaths,
  type SddRuntimeConfig,
  type SddStateSnapshot,
} from './state.js';
import { BUILT_IN_SDD_SKILLS } from './default-skills.js';
import type {
  BacklogItem,
  DiscoveryRecord,
  ExecutionKind,
  FinalizeQueueItem,
  FlowMode,
  PlanningMode,
  Scale,
  SkillCatalogEntry,
  SourceDocumentRecord,
  SkillRoutingRule,
} from './types.js';
import { renderViews } from './views.js';
import { syncSddGuideDocs } from './docs-sync.js';

const execFileAsync = promisify(execFile);

const RADAR_TO_DISCOVERY_STATUS: Record<string, DiscoveryRecord['status']> = {
  READY: 'READY',
  PLANNED: 'PLANNED',
  SPLIT: 'SPLIT',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function stripFunctionalTitlePrefixes(value: string): string {
  return value
    .replace(/^\s*debate:\s*/i, '')
    .replace(/^\s*insight:\s*/i, '')
    .trim();
}

function computeCanonicalTitle(value: string): string {
  const normalized = stripFunctionalTitlePrefixes(value)
    .replace(/\s+/g, ' ')
    .trim();
  const fallback = normalized || 'Sem titulo canonico';
  return fallback.slice(0, 60).trim();
}

function ensureMemoryInitialized(paths: SddPaths): Promise<void> {
  return fs.access(paths.memoryRoot).catch(() => {
    throw new Error(`Diretorio ${paths.memoryRoot} nao encontrado. Execute "${CLI_NAME} sdd init".`);
  });
}

function findDiscoveryRecord(records: DiscoveryRecord[], id: string): DiscoveryRecord | undefined {
  return records.find((record) => record.id === id);
}

function markdownDebateTemplate(insight: DiscoveryRecord, debateId: string): string {
  const now = nowIso();
  return `# Debate ${debateId}

## 1) Pergunta de decisao (obrigatorio)
Decidir ____ em vez de ____ para resolver ____.

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
- Pras:
- Contras:

### Opcao B
- Proposta:
- Pras:
- Contras:

### Opcao C (opcional)
- Proposta:
- Pras:
- Contras:

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
- Evidencias:

### Agente B (defende B)
- Argumento:
- Evidencias:

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:

### B critica A
- Riscos concretos:

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 |  |  |  |
| Complexidade de implementacao | 2 |  |  |  |
| Risco tecnico | 3 |  |  |  |
| Custo operacional | 2 |  |  |  |
| Tempo de entrega | 2 |  |  |  |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C):
- Justificativa:
- Riscos aceitos:
- Condicoes de reversao:

## 8) Saida
- APPROVED -> EPIC-####
- DISCARDED -> Registro em discarded

## Metadados
- Insight de origem: ${insight.id}
- Titulo do insight: ${insight.title}
- Criado em: ${insight.created_at || now}
- Debate aberto em: ${now}
`;
}

function markdownInsightTemplate(id: string, title: string, text: string): string {
  return `# Insight ${id}

## Titulo
${title}

## Descricao
${text}
`;
}

function markdownRadarTemplate(debate: DiscoveryRecord, radarId: string, rationale?: string): string {
  return `# Epic ${radarId}

## Origem
- Debate: ${debate.id}
- Titulo base: ${debate.title}

## Resumo aprovado
${rationale || '(preencher resumo aprovado)'}

## Status
READY
`;
}

function markdownRadarFromDepositoTemplate(
  radarId: string,
  title: string,
  sourceCount: number,
  rationale?: string
): string {
  return `# Epic ${radarId}

## Origem
- Origem: ingestao de deposito
- Fontes indexadas: ${sourceCount}

## Resumo aprovado
${rationale || 'Planejamento inicial gerado a partir dos insumos do deposito.'}

## Titulo
${title}

## Status
READY
`;
}

function markdownDiscardTemplate(debate: DiscoveryRecord, rationale?: string): string {
  return `# Descartado ${debate.id}

## Origem
- Debate: ${debate.id}
- Titulo: ${debate.title}

## Motivo do descarte
${rationale || '(motivo nao informado)'}
`;
}

interface MetaEvolutionConfig {
  enabled: boolean;
  audit_interval_days: number;
  placeholder_markers: string[];
  health_alert_threshold: number;
}

const DEFAULT_META_EVOLUTION_CONFIG: MetaEvolutionConfig = {
  enabled: true,
  audit_interval_days: 180,
  placeholder_markers: ['(preencher', '(placeholder', 'todo', 'tbd'],
  health_alert_threshold: 75,
};

const FORCED_TRANSITION_MARKERS = [
  '--force-transition',
  'forced_transition',
  'transição forçada',
  'transicao forcada',
];

function normalizePercent(part: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((part / total) * 10000) / 100;
}

async function readMetaEvolutionConfig(paths: SddPaths): Promise<MetaEvolutionConfig> {
  try {
    const raw = parseYaml(await fs.readFile(paths.configFile, 'utf-8')) as Record<string, unknown> | null;
    const candidate =
      raw && typeof raw === 'object' && raw.meta_evolution && typeof raw.meta_evolution === 'object'
        ? (raw.meta_evolution as Record<string, unknown>)
        : {};
    const placeholderMarkers = Array.isArray(candidate.placeholder_markers)
      ? candidate.placeholder_markers
          .map((value) => String(value).trim().toLowerCase())
          .filter((value) => value.length > 0)
      : DEFAULT_META_EVOLUTION_CONFIG.placeholder_markers;
    return {
      enabled:
        typeof candidate.enabled === 'boolean'
          ? candidate.enabled
          : DEFAULT_META_EVOLUTION_CONFIG.enabled,
      audit_interval_days:
        typeof candidate.audit_interval_days === 'number' &&
        Number.isFinite(candidate.audit_interval_days) &&
        candidate.audit_interval_days > 0
          ? candidate.audit_interval_days
          : DEFAULT_META_EVOLUTION_CONFIG.audit_interval_days,
      placeholder_markers:
        placeholderMarkers.length > 0
          ? placeholderMarkers
          : DEFAULT_META_EVOLUTION_CONFIG.placeholder_markers,
      health_alert_threshold:
        typeof candidate.health_alert_threshold === 'number' &&
        Number.isFinite(candidate.health_alert_threshold) &&
        candidate.health_alert_threshold >= 0 &&
        candidate.health_alert_threshold <= 100
          ? candidate.health_alert_threshold
          : DEFAULT_META_EVOLUTION_CONFIG.health_alert_threshold,
    };
  } catch {
    return { ...DEFAULT_META_EVOLUTION_CONFIG };
  }
}

async function listFilesRecursive(rootDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        files.push(full);
      }
    }
  }

  await walk(rootDir);
  return files;
}

function hasPlaceholder(content: string, markers: string[]): boolean {
  const normalized = content.toLowerCase();
  return markers.some((marker) => normalized.includes(marker));
}

async function collectAuditArtifacts(paths: SddPaths): Promise<string[]> {
  const roots = [paths.activeDir, paths.archivedDir, paths.discoveryDir, path.join(paths.coreDir, 'adrs')];
  const markdownFiles: string[] = [];
  for (const root of roots) {
    const files = await listFilesRecursive(root);
    for (const filePath of files) {
      if (filePath.endsWith('.md')) markdownFiles.push(filePath);
    }
  }
  return markdownFiles;
}

function debateHasRealDeliberation(content: string): boolean {
  const lower = content.toLowerCase();
  const sectionIndex = lower.indexOf('## 7) decisao do mediador');
  if (sectionIndex < 0) return false;
  const tail = content.slice(sectionIndex);
  const escolhaMatch = tail.match(/- Escolha \(A\/B\/C\):\s*(.+)/i);
  const justificativaMatch = tail.match(/- Justificativa:\s*(.+)/i);
  if (!escolhaMatch || !justificativaMatch) return false;
  const escolha = escolhaMatch[1].trim().toLowerCase();
  const justificativa = justificativaMatch[1].trim().toLowerCase();
  const invalidTokens = ['(preencher', '____', '-', ''];
  const escolhaInvalid = invalidTokens.some((token) => escolha === token || escolha.includes(token));
  const justificativaInvalid = invalidTokens.some(
    (token) => justificativa === token || justificativa.includes(token)
  );
  return !escolhaInvalid && !justificativaInvalid;
}

async function collectForcedTransitions(paths: SddPaths): Promise<{ total: number; featureRefs: string[] }> {
  const roots = [paths.activeDir, paths.archivedDir];
  let count = 0;
  const featureRefs = new Set<string>();
  for (const root of roots) {
    const files = await listFilesRecursive(root);
    for (const filePath of files) {
      if (!filePath.endsWith('.md') || !/4-(changelog|historico)\.md$/i.test(filePath)) continue;
      const content = (await fs.readFile(filePath, 'utf-8').catch(() => '')).toLowerCase();
      if (FORCED_TRANSITION_MARKERS.some((marker) => content.includes(marker))) {
        count += 1;
        const match = filePath.match(/FEAT-\d{3,}/);
        if (match?.[0]) featureRefs.add(match[0]);
      }
    }
  }
  return { total: count, featureRefs: Array.from(featureRefs).sort() };
}

function sourceTypeFromRelativePath(relativePath: string): SourceDocumentRecord['type'] {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/prds/')) return 'prd';
  if (normalized.includes('/rfcs/')) return 'rfc';
  if (normalized.includes('/briefings/')) return 'briefing';
  if (normalized.includes('/historias/')) return 'historia';
  if (normalized.includes('/wireframes/')) return 'wireframe';
  if (normalized.includes('/html-mocks/')) return 'html_mock';
  if (normalized.includes('/referencias-visuais/')) return 'referencia_visual';
  if (normalized.includes('/entrevistas/')) return 'entrevista';
  if (normalized.includes('/anexos/')) return 'anexo';
  if (normalized.includes('/legado/')) return 'legado';
  return 'outro';
}

function defaultConsolidationTargets(type: SourceDocumentRecord['type']): string[] {
  switch (type) {
    case 'prd':
    case 'briefing':
    case 'historia':
      return ['contexto', 'epic', 'backlog'];
    case 'wireframe':
    case 'html_mock':
    case 'referencia_visual':
      return ['frontend-map', 'frontend-gaps', 'frontend-decisions', 'backlog'];
    case 'rfc':
      return ['arquitetura', 'servicos', 'integration-contracts', 'backlog'];
    case 'legado':
      return ['repo-map', 'arquitetura', 'backlog'];
    case 'entrevista':
      return ['insights', 'epic'];
    default:
      return ['contexto'];
  }
}

function deriveInitialFeatureTitles(
  sources: SourceDocumentRecord[],
  frontendEnabled: boolean
): string[] {
  const types = new Set(sources.map((source) => source.type));
  const titles: string[] = [];

  if (types.has('prd') || types.has('historia') || types.has('briefing') || types.has('rfc')) {
    titles.push('Nucleo de negocio inicial e contratos principais');
  }
  if (
    frontendEnabled &&
    (types.has('wireframe') || types.has('html_mock') || types.has('referencia_visual'))
  ) {
    titles.push('Estrutura inicial de frontend baseada nas referencias');
  }
  if (types.has('legado')) {
    titles.push('Mapeamento e adaptacao do legado para a arquitetura atual');
  }

  titles.push('Consolidar documentacao operacional e trilha de handoff');
  return Array.from(new Set(titles));
}

async function listFilesRecursively(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(absolute)));
      continue;
    }
    if (!entry.isFile()) continue;
    files.push(absolute);
  }
  return files;
}

function sourceTitleFromPath(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  const cleaned = base.replace(/[-_]+/g, ' ').trim();
  if (!cleaned) return base || 'fonte sem titulo';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function normalizeSourceStatus(
  current: SourceDocumentRecord['status'],
  desired: SourceDocumentRecord['status']
): SourceDocumentRecord['status'] {
  const order: Record<SourceDocumentRecord['status'], number> = {
    RAW: 0,
    INDEXED: 1,
    NORMALIZED: 2,
    PLANNED: 3,
    ARCHIVED: 4,
  };
  return order[current] >= order[desired] ? current : desired;
}

function nextSourceId(existingIds: string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const match = /^SRC-(\d+)$/.exec(id);
    if (!match) continue;
    const numeric = Number(match[1]);
    if (Number.isFinite(numeric)) {
      max = Math.max(max, numeric);
    }
  }
  return `SRC-${String(max + 1).padStart(3, '0')}`;
}

async function extractSourceSummary(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const textLike = new Set([
    '.md',
    '.txt',
    '.rst',
    '.adoc',
    '.json',
    '.yaml',
    '.yml',
    '.html',
    '.htm',
    '.csv',
  ]);
  if (!textLike.has(ext)) {
    return '';
  }

  const raw = await fs.readFile(filePath, 'utf-8').catch(() => '');
  if (!raw.trim()) return '';
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^#+\s*/, '').replace(/<[^>]+>/g, '').trim())
    .filter((line) => line.length > 0);
  const candidate = lines.find((line) => line.length > 20) || lines[0] || '';
  return candidate.slice(0, 220);
}

async function findDebateFile(paths: SddPaths, debateId: string): Promise<string | null> {
  const debateDir = paths.discoveryDebatesDir;
  const entries = await fs.readdir(debateDir, { withFileTypes: true }).catch(() => []);
  const found = entries.find((entry) => entry.isFile() && entry.name.startsWith(`${debateId}-`));
  if (!found) return null;
  return path.join(debateDir, found.name);
}

function validateDebateDocument(content: string): string[] {
  const missing = validateDocumentAgainstLens(content, LENSES.debate);

  if (content.includes('Decidir ____ em vez de ____ para resolver ____.')) {
    missing.push('Preencher a pergunta de decisao com contexto real');
  }
  if (/\- Escolha \(A\/B\/C\):\s*$/m.test(content)) {
    missing.push('Informar a escolha do mediador em "Escolha (A/B/C)"');
  }
  if (/\- Justificativa:\s*$/m.test(content)) {
    missing.push('Informar justificativa da decisao do mediador');
  }

  return missing;
}

function pickTopSkills(
  catalogSkills: SkillCatalogEntry[],
  ids: string[] | undefined,
  max = 3
): string[] {
  if (!ids || ids.length === 0) return [];
  const known = new Set(catalogSkills.map((skill) => skill.id));
  return ids.filter((id) => known.has(id)).slice(0, max);
}

function bundlesForSkills(catalog: { skills: SkillCatalogEntry[] }, skillIds: string[]): string[] {
  return Array.from(
    new Set(
      catalog.skills
        .filter((skill) => skillIds.includes(skill.id))
        .flatMap((skill) => skill.bundle_ids)
    )
  );
}

function syncCounterFromId(discoveryIndex: {
  counters: Record<'INS' | 'DEB' | 'RAD' | 'EPIC' | 'FEAT' | 'FGAP' | 'TD', number>;
}, id: string): void {
  const [prefix, numeric] = id.split('-');
  if (!prefix || !numeric) return;
  if (!['INS', 'DEB', 'RAD', 'EPIC', 'FEAT', 'FGAP', 'TD'].includes(prefix)) return;
  const value = Number(numeric);
  if (!Number.isFinite(value)) return;
  const counterKey = prefix as 'INS' | 'DEB' | 'RAD' | 'EPIC' | 'FEAT' | 'FGAP' | 'TD';
  discoveryIndex.counters[counterKey] = Math.max(discoveryIndex.counters[counterKey] || 0, value);
}

async function getRuntime(projectRoot: string): Promise<{
  config: SddRuntimeConfig;
  paths: SddPaths;
}> {
  const config = await loadProjectSddConfig(projectRoot);
  const paths = resolveSddPaths(projectRoot, config);
  await ensureMemoryInitialized(paths);
  return { config, paths };
}

async function persistAndRender(
  paths: SddPaths,
  config: SddRuntimeConfig,
  render: boolean | undefined
): Promise<void> {
  if (!render && render !== undefined) return;
  if (!config.views.autoRender && render === undefined) return;
  const snapshot = await loadStateSnapshot(paths, config);
  await renderViews(paths, config, snapshot);
}

function relProjectPath(paths: SddPaths, absolutePath: string): string {
  return path.relative(paths.projectRoot, absolutePath).replace(/\\/g, '/');
}

function coreDocRef(paths: SddPaths, name: string): string {
  return relProjectPath(paths, path.join(paths.coreDir, name));
}

function planningDocRef(paths: SddPaths, name: string): string {
  return relProjectPath(paths, path.join(paths.pendenciasDir, name));
}

function activeFeatureRef(paths: SddPaths, featureId: string, fileName: string): string {
  return relProjectPath(paths, path.join(paths.activeDir, featureId, fileName));
}

function featureActiveDir(paths: SddPaths, featureId: string): string {
  return path.join(paths.activeDir, featureId);
}

interface ActiveDocNames {
  spec: string;
  plan: string;
  tasks: string;
  changelog: string;
}

function activeDocNamesForLayout(config: SddRuntimeConfig): ActiveDocNames {
  if (config.layout === 'pt-BR') {
    return {
      spec: '1-especificacao.md',
      plan: '2-planejamento.md',
      tasks: '3-tarefas.md',
      changelog: '4-historico.md',
    };
  }
  return {
    spec: '1-spec.md',
    plan: '2-plan.md',
    tasks: '3-tasks.md',
    changelog: '4-changelog.md',
  };
}

function activeDocCandidateNames(config: SddRuntimeConfig): string[] {
  const preferred = activeDocNamesForLayout(config);
  const english = ['1-spec.md', '2-plan.md', '3-tasks.md', '4-changelog.md'];
  const portuguese = ['1-especificacao.md', '2-planejamento.md', '3-tarefas.md', '4-historico.md'];
  return Array.from(new Set([preferred.spec, preferred.plan, preferred.tasks, preferred.changelog, ...english, ...portuguese]));
}

async function resolveActiveDocRefs(paths: SddPaths, featureId: string, config: SddRuntimeConfig): Promise<string[]> {
  const activePath = featureActiveDir(paths, featureId);
  const names = activeDocCandidateNames(config);
  const refs: string[] = [];
  for (const name of names) {
    const filePath = path.join(activePath, name);
    if (await pathExists(filePath)) {
      refs.push(activeFeatureRef(paths, featureId, name));
    }
  }
  return refs;
}

async function writeFileAlways(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

function buildActiveSpecDoc(feature: BacklogItem): string {
  const adrRef = feature.requires_adr
    ? `.sdd/core/adrs/${adrFileName(feature.id)}`
    : '-';
  return `# Spec ${feature.id}

## Resumo da Entrega
- Titulo: ${feature.title}
- Origem: ${feature.origin_type}${feature.origin_ref ? ` (${feature.origin_ref})` : ''}
- Tipo: ${feature.execution_kind}
- Modo: ${feature.planning_mode}
- Fluxo: ${feature.flow_mode}
- Etapa atual: ${feature.current_stage}

## Gates
- Proposta: ${feature.gates.proposta.status}
- Planejamento: ${feature.gates.planejamento.status}
- Tarefas: ${feature.gates.tarefas.status}

## Objetivo
- Descreva detalhadamente o resultado esperado.
- Adicione contexto de negocio ou motivacao clara.
- Liste impactos positivos para usuario ou sistema.

## Referencias
- Feature: ${feature.id}
- Acceptance refs: ${feature.acceptance_refs.join(', ') || '-'}
- ADR: ${adrRef}
`;
}

function buildActivePlanDoc(feature: BacklogItem, recommendedBundles: string[]): string {
  return `# Plano ${feature.id}

## Impacto Arquitetural
- Serviços/touches: ${feature.touches.join(', ') || '-'}
- Lock domains: ${feature.lock_domains.join(', ') || '-'}

## Impacto Frontend
- Frontend gaps relacionados: ${feature.frontend_gap_refs.join(', ') || '-'}
- Rotas/áreas impactadas: (preencher)
- Declaracao obrigatoria: ${CLI_NAME} sdd frontend-impact ${feature.id} --status required|none --reason "<justificativa>"

## Contratos Afetados
- Consome: ${feature.consumes.join(', ') || '-'}
- Produz: ${feature.produces.join(', ') || '-'}

## Skills e Bundles Sugeridos
- Skills: ${feature.recommended_skills.join(', ') || '-'}
- Bundles: ${recommendedBundles.join(', ') || '-'}
`;
}

function buildActiveTasksDoc(feature: BacklogItem, paths: SddPaths): string {
  const memoryAgentGuide = relProjectPath(paths, path.join(paths.memoryRoot, 'AGENT.md'));
  const coreDocsDir = relProjectPath(paths, paths.coreDir);
  return `# Tasks ${feature.id}

1. Entender contexto com \`${CLI_NAME} sdd context ${feature.id}\`.
2. Confirmar plano e tarefas técnicas.
3. Implementar com rastreabilidade no changelog.
4. Declarar impacto de frontend (obrigatorio) com \`${CLI_NAME} sdd frontend-impact ${feature.id} ...\`.
5. Se frontend_impact_status=required, abrir/atualizar FGAP antes do finalize.
6. Atualizar, se houve impacto, a documentação operacional e canônica:
   - \`README.md\`
   - \`${memoryAgentGuide}\`
   - \`AGENTS.md\`
   - \`AGENT.md\`
   - \`${coreDocsDir}/arquitetura.md\`
   - \`${coreDocsDir}/servicos.md\`
   - \`${coreDocsDir}/spec-tecnologica.md\`
   - \`${coreDocsDir}/repo-map.md\`
   - \`${coreDocsDir}/frontend-decisions.md\` (quando aplicável)
7. Validar e preparar finalize.

## Dependências
- blocked_by: ${feature.blocked_by.join(', ') || '-'}

## Definição de pronto
- A feature não está pronta enquanto as mudanças de documentação e handoff não estiverem refletidas.

## Checklist DOD
- [DOC] Atualizar documentacao central e de handoff
- [UI] Declarar impacto frontend e registrar lacunas/decisoes quando aplicavel
- [ARQ] Arquivar a mudanca tecnica no OpenSpec
- [MEM] Consolidar memoria com \`${CLI_NAME} sdd finalize --ref ${feature.id}\`
`;
}

function buildActiveChangelogDoc(feature: BacklogItem): string {
  return `# Changelog ${feature.id}

## Entradas
- ${nowIso()} - Workspace criado automaticamente para execução da feature.

## Mudanças
- (preencher durante implementação)
`;
}

async function ensureFeatureActiveWorkspace(
  paths: SddPaths,
  config: SddRuntimeConfig,
  feature: BacklogItem,
  recommendedBundles: string[]
): Promise<{ activePath: string; generatedDocs: string[]; handoffSeedRefs: string[] }> {
  const activePath = featureActiveDir(paths, feature.id);
  const names = activeDocNamesForLayout(config);
  const docs = [
    path.join(activePath, names.spec),
    path.join(activePath, names.plan),
    path.join(activePath, names.tasks),
    path.join(activePath, names.changelog),
  ];
  await writeFileAlways(docs[0], buildActiveSpecDoc(feature));
  await writeFileAlways(docs[1], buildActivePlanDoc(feature, recommendedBundles));
  await writeFileAlways(docs[2], buildActiveTasksDoc(feature, paths));
  await writeFileAlways(docs[3], buildActiveChangelogDoc(feature));
  const handoffSeedRefs = [feature.id, feature.origin_ref].filter((v): v is string => Boolean(v));
  return {
    activePath,
    generatedDocs: docs.map((doc) => path.relative(paths.projectRoot, doc)),
    handoffSeedRefs,
  };
}

export class SddInsightCommand {
  async execute(projectRoot: string, text: string, options?: { title?: string; render?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Insight vazio. Informe um texto para registrar.');
    }

    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const id = await allocateEntityId(paths, 'INS');
    syncCounterFromId(snapshot.discoveryIndex, id);
    const now = nowIso();
    const title = (options?.title || trimmed.split('\n')[0] || 'Insight sem titulo').slice(0, 120);
    const titleCanonical = computeCanonicalTitle(title);

    const record: DiscoveryRecord = {
      id,
      type: 'INS',
      title,
      title_canonical: titleCanonical,
      status: 'NEW',
      origin_prompt: trimmed,
      related_ids: [],
      created_at: now,
      updated_at: now,
    };

    snapshot.discoveryIndex.records.push(record);
    await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);

    const filePath = path.join(paths.discoveryInsightsDir, `${id}-${slugify(title)}.md`);
    await fs.writeFile(filePath, markdownInsightTemplate(id, title, trimmed), 'utf-8');
    await persistAndRender(paths, config, options?.render);

    return { id, title, filePath };
  }
}

export class SddDebateCommand {
  async execute(
    projectRoot: string,
    insightId: string,
    options?: { title?: string; render?: boolean; agent?: string }
  ) {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const insight = findDiscoveryRecord(snapshot.discoveryIndex.records, insightId);

    if (!insight || insight.type !== 'INS') {
      throw new Error(`Insight ${insightId} nao encontrado.`);
    }

    const id = await allocateEntityId(paths, 'DEB');
    syncCounterFromId(snapshot.discoveryIndex, id);
    const now = nowIso();
    const title = (options?.title || `Debate: ${insight.title}`).slice(0, 120);
    const titleCanonical = computeCanonicalTitle(
      options?.title || insight.title_canonical || insight.title
    );
    const debate: DiscoveryRecord = {
      id,
      type: 'DEB',
      title,
      title_canonical: titleCanonical,
      status: 'OPEN',
      origin_prompt: `Debate originado de ${insight.id}${options?.agent ? ` por ${options.agent}` : ''}`,
      related_ids: [insight.id],
      created_at: now,
      updated_at: now,
    };

    TransitionEngine.assertValid(insight.type, insight.status, 'DEBATED');
    insight.status = 'DEBATED';
    insight.related_ids = Array.from(new Set([...insight.related_ids, id]));
    insight.updated_at = now;

    snapshot.discoveryIndex.records.push(debate);
    await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);

    const filePath = path.join(paths.discoveryDebatesDir, `${id}-${slugify(title)}.md`);
    await fs.writeFile(filePath, markdownDebateTemplate(insight, id), 'utf-8');
    await persistAndRender(paths, config, options?.render);

    return { id, title, filePath };
  }
}

export class SddDecideCommand {
  async execute(
    projectRoot: string,
    debateId: string,
    outcome: 'radar' | 'epic' | 'discard',
    options?: { title?: string; rationale?: string; render?: boolean }
  ) {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const debate = findDiscoveryRecord(snapshot.discoveryIndex.records, debateId);
    if (!debate || debate.type !== 'DEB') {
      throw new Error(`Debate ${debateId} nao encontrado.`);
    }

    const debateFile = await findDebateFile(paths, debateId);
    if (!debateFile) {
      throw new Error(
        `Arquivo do debate ${debateId} nao encontrado em ${path.relative(projectRoot, paths.discoveryDebatesDir)}.`
      );
    }
    const debateContent = await fs.readFile(debateFile, 'utf-8');
    const missingSections = validateDebateDocument(debateContent);
    if (missingSections.length > 0) {
      throw new Error(
        `Debate ${debateId} incompleto. Preencha secoes obrigatorias antes de decidir:\n- ${missingSections.join('\n- ')}`
      );
    }

    const now = nowIso();
    const targetStatus = outcome === 'radar' || outcome === 'epic' ? 'APPROVED' : 'DISCARDED';
    TransitionEngine.assertValid(debate.type, debate.status, targetStatus);
    debate.status = targetStatus;
    debate.updated_at = now;

    if (outcome === 'discard') {
      const discardPath = path.join(paths.discoveryDiscardedDir, `${debate.id}-${slugify(debate.title)}.md`);
      await fs.writeFile(discardPath, markdownDiscardTemplate(debate, options?.rationale), 'utf-8');
      await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);
      await persistAndRender(paths, config, options?.render);
      return { outcome, debateId, discardPath };
    }

    const radarId = await allocateEntityId(paths, 'EPIC');
    syncCounterFromId(snapshot.discoveryIndex, radarId);
    const radarTitle = (options?.title || debate.title_canonical || debate.title).slice(0, 120);
    const radarRecord: DiscoveryRecord = {
      id: radarId,
      type: 'EPIC',
      title: radarTitle,
      status: 'READY',
      origin_prompt: options?.rationale,
      related_ids: [debate.id, ...debate.related_ids],
      created_at: now,
      updated_at: now,
    };

    debate.related_ids = Array.from(new Set([...debate.related_ids, radarId]));
    snapshot.discoveryIndex.records.push(radarRecord);
    await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);

    const radarPath = path.join(paths.discoveryEpicDir, `${radarId}-${slugify(radarTitle)}.md`);
    await fs.writeFile(radarPath, markdownRadarTemplate(debate, radarId, options?.rationale), 'utf-8');
    await persistAndRender(paths, config, options?.render);

    return { outcome, debateId, radarId, radarPath };
  }
}

function resolveRadar(record: DiscoveryRecord | undefined): asserts record is DiscoveryRecord {
  if (!record || (record.type !== 'RAD' && record.type !== 'EPIC')) {
    throw new Error('Referencia EPIC/RAD invalida.');
  }
}

function resolveFeat(items: BacklogItem[], id: string): BacklogItem {
  const feat = items.find((item) => item.id === id);
  if (!feat) {
    throw new Error(`Feature ${id} nao encontrada no backlog.`);
  }
  return feat;
}

function buildBacklogItem(
  id: string,
  title: string,
  originType: BacklogItem['origin_type'],
  originRef: string | undefined,
  scale: Scale,
  recommendedSkills: string[],
  options?: {
    parallelGroup?: string;
    executionKind?: ExecutionKind;
    planningMode?: PlanningMode;
    flowMode?: FlowMode;
    acceptanceRefs?: string[];
    touches?: string[];
    lockDomains?: string[];
    produces?: string[];
    consumes?: string[];
  }
): BacklogItem {
  const flowMode = options?.flowMode || 'padrao';
  const gates =
    flowMode === 'direto'
      ? {
          proposta: { status: 'nao_exigida' as const, approved_at: '', approved_by: '', note: '' },
          planejamento: { status: 'nao_exigida' as const, approved_at: '', approved_by: '', note: '' },
          tarefas: { status: 'rascunho' as const, approved_at: '', approved_by: '', note: '' },
        }
      : {
          proposta: { status: 'rascunho' as const, approved_at: '', approved_by: '', note: '' },
          planejamento: { status: 'rascunho' as const, approved_at: '', approved_by: '', note: '' },
          tarefas: { status: 'rascunho' as const, approved_at: '', approved_by: '', note: '' },
        };
  return {
    id,
    title,
    status: 'READY',
    origin_type: originType,
    origin_ref: originRef,
    scale,
    summary: '',
    blocked_by: [],
    touches: options?.touches || [],
    lock_domains: options?.lockDomains || [],
    parallel_group: options?.parallelGroup || '',
    execution_kind: options?.executionKind || 'feature',
    planning_mode: options?.planningMode || 'local_plan',
    flow_mode: flowMode,
    current_stage: 'proposta',
    gates,
    acceptance_refs: options?.acceptanceRefs || [],
    produces: options?.produces || [],
    consumes: options?.consumes || [],
    priority_score: 0,
    dependency_count: 0,
    agent_role: '',
    recommended_skills: recommendedSkills,
    change_name: '',
    branch_name: '',
    worktree_path: '',
    start_commit_sha: '',
    requires_adr: false,
    frontend_impact_status: 'unknown',
    frontend_impact_reason: '',
    frontend_impact_declared_at: '',
    frontend_surface_tokens: [],
    frontend_gap_refs: [],
    spec_refs: [],
    last_sync_at: nowIso(),
    archived_at: '',
    done_at: '',
    unblocked_at: '',
  };
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function classifyFeatureShape(title: string): {
  executionKind: ExecutionKind;
  touches: string[];
  lockDomains: string[];
  produces: string[];
  consumes: string[];
  planningMode: PlanningMode;
} {
  const normalized = title.toLowerCase();

  if (includesAny(normalized, ['migracao', 'migration', 'seed', 'backfill'])) {
    return {
      executionKind: 'migration',
      touches: ['database'],
      lockDomains: ['schema-change'],
      produces: ['dados-migrados'],
      consumes: ['modelo-de-dominio'],
      planningMode: 'local_plan',
    };
  }

  if (includesAny(normalized, ['frontend', 'tela', 'ui', 'pagina', 'rota'])) {
    return {
      executionKind: 'frontend_coverage',
      touches: ['frontend'],
      lockDomains: ['frontend-route'],
      produces: ['interface-usuario'],
      consumes: ['api-ou-contrato'],
      planningMode: 'local_plan',
    };
  }

  if (includesAny(normalized, ['infra', 'deploy', 'helm', 'terraform', 'pipeline'])) {
    return {
      executionKind: 'infra',
      touches: ['infra'],
      lockDomains: ['infra-shared'],
      produces: ['infra-configurada'],
      consumes: [],
      planningMode: 'local_plan',
    };
  }

  if (includesAny(normalized, ['docs', 'documentacao', 'adr', 'manual'])) {
    return {
      executionKind: 'documentation',
      touches: ['docs'],
      lockDomains: [],
      produces: ['documentacao-atualizada'],
      consumes: ['implementacao-concluida'],
      planningMode: 'direct_tasks',
    };
  }

  const authLock = includesAny(normalized, ['auth', 'autoriz', 'permiss'])
    ? ['auth-rules']
    : [];
  return {
    executionKind: 'feature',
    touches: ['backend'],
    lockDomains: authLock,
    produces: ['capacidade-de-negocio'],
    consumes: [],
    planningMode: 'local_plan',
  };
}

function normalizeTitle(value: string): string {
  return slugify(value.replace(/\s+/g, ' '));
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const stopWords = new Set(['a', 'an', 'and', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'for', 'na', 'no', 'o', 'para', 'por', 'the', 'to']);
  const filterTokens = (value: string): string[] => {
    const tokens = value.split('-').filter(Boolean);
    const filtered = tokens.filter((token) => !stopWords.has(token));
    return filtered.length > 0 ? filtered : tokens;
  };
  const sa = new Set(filterTokens(a));
  const sb = new Set(filterTokens(b));
  const intersection = [...sa].filter((token) => sb.has(token)).length;
  const union = new Set([...sa, ...sb]).size;
  if (union === 0) return 0;
  return intersection / union;
}

function intersects(a: string[], b: string[]): boolean {
  const setB = new Set(b);
  return a.some((v) => setB.has(v));
}

function unresolvedDependencies(item: BacklogItem, all: BacklogItem[]): string[] {
  const byId = new Map(all.map((entry) => [entry.id, entry]));
  return item.blocked_by.filter((depId) => {
    const dep = byId.get(depId);
    return !dep || dep.status !== 'DONE';
  });
}

function lockConflictWithActive(item: BacklogItem, all: BacklogItem[]): string[] {
  if (item.lock_domains.length === 0) return [];
  const conflicts: string[] = [];
  for (const other of all) {
    if (other.id === item.id) continue;
    if (other.status !== 'IN_PROGRESS') continue;
    if (intersects(item.lock_domains, other.lock_domains)) {
      conflicts.push(other.id);
    }
  }
  return conflicts;
}

function featureReadiness(item: BacklogItem, all: BacklogItem[]): 'READY' | 'BLOCKED' | 'LOCK_CONFLICT' {
  if (unresolvedDependencies(item, all).length > 0 || item.status === 'BLOCKED') return 'BLOCKED';
  if (lockConflictWithActive(item, all).length > 0) return 'LOCK_CONFLICT';
  return 'READY';
}

function updateDependencyMetadata(items: BacklogItem[]): void {
  for (const item of items) {
    item.dependency_count = item.blocked_by.length;
  }
}

function parseRouteToken(value: string): string | null {
  const token = value.trim();
  if (!token) return null;
  if (token.startsWith('route:')) {
    const raw = token.slice('route:'.length).trim();
    if (!raw) return null;
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  if (token.startsWith('/')) return token;
  const inlineRoute = token.match(/\/[a-z0-9_\-/:]*/i);
  if (inlineRoute && inlineRoute[0]) return inlineRoute[0];
  return null;
}

function inferRouteTargetsFromFeature(feature: BacklogItem): string[] {
  const routes = [
    ...feature.produces.map(parseRouteToken),
    ...feature.consumes.map(parseRouteToken),
    ...(feature.frontend_surface_tokens || []).map(parseRouteToken),
  ].filter((value): value is string => Boolean(value));
  return Array.from(new Set(routes));
}

function inferSurfaceTargetsFromFeature(feature: BacklogItem): string[] {
  return Array.from(
    new Set((feature.frontend_surface_tokens || []).map((token) => token.trim()).filter(Boolean))
  );
}

async function gitHeadCommit(projectRoot: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
    return stdout.trim();
  } catch {
    return '';
  }
}

async function gitChangedFiles(projectRoot: string, baseRef: string): Promise<{
  files: string[];
  warning: string;
}> {
  if (!baseRef) {
    return { files: [], warning: 'base_ref_ausente' };
  }
  try {
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', `${baseRef}..HEAD`], {
      cwd: projectRoot,
    });
    const files = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return { files, warning: '' };
  } catch {
    return { files: [], warning: 'git_diff_indisponivel' };
  }
}

function isFrontendPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const frontendDirs = [
    '/frontend/',
    '/web/',
    '/ui/',
    '/app/',
    '/pages/',
    '/components/',
    '/routes/',
    '/views/',
    '/templates/',
    '/public/',
  ];
  if (frontendDirs.some((segment) => normalized.includes(segment))) return true;
  if (
    normalized.includes('/src/') &&
    (normalized.includes('/src/app/') ||
      normalized.includes('/src/pages/') ||
      normalized.includes('/src/components/'))
  ) {
    return true;
  }
  return /\.(tsx|jsx|vue|svelte|css|scss|sass|less|html)$/.test(normalized);
}

function detectFrontendImpactEvidence(
  feature: BacklogItem,
  changedFiles: string[]
): {
  metadata_routes: string[];
  metadata_surfaces: string[];
  diff_files: string[];
  evidence_sources: Array<'metadata' | 'diff'>;
  has_frontend_evidence: boolean;
} {
  const metadataRoutes = inferRouteTargetsFromFeature(feature);
  const metadataSurfaces = inferSurfaceTargetsFromFeature(feature);
  const diffFiles = changedFiles.filter(isFrontendPath);
  const metadataEvidence =
    metadataRoutes.length > 0 ||
    metadataSurfaces.length > 0 ||
    feature.execution_kind === 'frontend_coverage' ||
    feature.touches.includes('frontend');
  const sources: Array<'metadata' | 'diff'> = [];
  if (metadataEvidence) sources.push('metadata');
  if (diffFiles.length > 0) sources.push('diff');
  return {
    metadata_routes: metadataRoutes,
    metadata_surfaces: metadataSurfaces,
    diff_files: diffFiles,
    evidence_sources: sources,
    has_frontend_evidence: sources.length > 0,
  };
}

function ensureRouteInFrontendMap(
  snapshot: Awaited<ReturnType<typeof loadStateSnapshot>>,
  routePath: string,
  gapId: string
): void {
  if (!snapshot.frontendMap) return;
  const routeId = `route-${slugify(routePath) || 'root'}`;
  const existing = snapshot.frontendMap.routes.find((route) => route.id === routeId);
  if (existing) {
    existing.ui_status = existing.ui_status === 'OK' ? 'PARTIAL' : existing.ui_status;
    existing.source_gap_ids = Array.from(new Set([...(existing.source_gap_ids || []), gapId]));
    return;
  }
  snapshot.frontendMap.routes.push({
    id: routeId,
    path: routePath,
    parent_id: '',
    label: '',
    nav_surface: '',
    ui_status: 'GAP',
    source_gap_ids: [gapId],
    implemented_files: [],
    notes: '',
  });
}

async function maybeCreateAutomaticFrontendGap(
  paths: SddPaths,
  snapshot: Awaited<ReturnType<typeof loadStateSnapshot>>,
  feature: BacklogItem,
  options?: {
    force?: boolean;
    routeTargets?: string[];
    detectionSources?: Array<'metadata' | 'diff' | 'manual'>;
  }
): Promise<string> {
  if (!snapshot.frontendGaps || !snapshot.frontendMap) return '';
  if (feature.frontend_gap_refs.length > 0) return '';

  const backendImpact =
    feature.touches.includes('backend') ||
    feature.execution_kind === 'feature' ||
    feature.execution_kind === 'migration';
  if (!backendImpact && !options?.force) return '';

  const gapId = await allocateEntityId(paths, 'FGAP');
  syncCounterFromId(snapshot.discoveryIndex, gapId);
  const now = nowIso();
  const routeTargets = Array.from(
    new Set([...(options?.routeTargets || []), ...inferRouteTargetsFromFeature(feature)])
  );

  snapshot.frontendGaps.items.push({
    id: gapId,
    title: `Cobertura frontend pendente para ${feature.id}: ${feature.title}`,
    status: 'OPEN',
    origin_kind: 'automatic',
    detection_sources: options?.detectionSources || ['metadata'],
    origin_feature: feature.id,
    backend_refs: [feature.id],
    frontend_scope: '',
    route_targets: routeTargets,
    menu_targets: [],
    suggested_files: [],
    implemented_files: [],
    resolved_by_feature: '',
    related_route_ids: routeTargets.map((route) => `route-${slugify(route) || 'root'}`),
    notes: 'Gerado automaticamente no finalize para evitar perda de rastreabilidade.',
    created_at: now,
    updated_at: now,
  });
  feature.frontend_gap_refs = Array.from(new Set([...feature.frontend_gap_refs, gapId]));
  feature.summary = [feature.summary || '', `FGAP automático criado: ${gapId}`]
    .filter(Boolean)
    .join('\n');

  for (const routePath of routeTargets) {
    ensureRouteInFrontendMap(snapshot, routePath, gapId);
  }

  return gapId;
}

function resolveRoutedSkills(snapshot: SddStateSnapshot, touches: string[]): string[] {
  let injectedSkills: string[] = [];
  if (touches.length > 0 && snapshot.skillRouting && snapshot.skillRouting.routes) {
    for (const touch of touches) {
      const route = snapshot.skillRouting.routes.find((r: SkillRoutingRule) => r.domain === touch);
      if (route && route.skills) {
        injectedSkills.push(...route.skills);
      }
    }
  }

  if (injectedSkills.length === 0 && snapshot.skillRouting && snapshot.skillRouting.default_skills) {
    injectedSkills = [...snapshot.skillRouting.default_skills];
  }

  // fallback extremo
  if (injectedSkills.length === 0) {
    injectedSkills = ['architecture', 'concise-planning', 'context-window-management'];
  }

  return Array.from(new Set(injectedSkills)).slice(0, 5);
}

export class SddBreakdownCommand {
  async execute(
    projectRoot: string,
    radarId: string,
    options?: {
      titles?: string[];
      scale?: Scale;
      mode?: 'graph' | 'flat';
      incremental?: boolean;
      dedupe?: 'strict' | 'normal' | 'off';
      render?: boolean;
    }
  ) {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const radar = findDiscoveryRecord(snapshot.discoveryIndex.records, radarId);
    resolveRadar(radar);

    const catalog = await loadSkillCatalogState(paths);
    const mode = options?.mode || 'graph';
    const dedupe = options?.dedupe || 'normal';
    const incremental = options?.incremental ?? false;
    const titles =
      options?.titles && options.titles.length > 0 ? options.titles : [radar.title || `Feature de ${radar.id}`];
    const created: BacklogItem[] = [];
    const linkedExisting: string[] = [];
    const rewiredMap = new Map<string, Set<string>>();
    const skippedDuplicates: Array<{ title: string; existing_feature_id: string }> = [];
    const parallelGroup = `radar-${radar.id.toLowerCase()}`;
    const existingItems = snapshot.backlog.items.slice();

    for (const rawTitle of titles) {
      const title = rawTitle.trim();
      if (!title) continue;
      const shape = classifyFeatureShape(title);
      const normalizedTitle = normalizeTitle(title);

      const duplicate = existingItems.find((item) => {
        if (dedupe === 'off') return false;
        const sameOrigin = item.origin_ref === radar.id;
        const itemNorm = normalizeTitle(item.title);
        if (dedupe === 'strict') {
          return sameOrigin && itemNorm === normalizedTitle;
        }
        const sim = similarity(itemNorm, normalizedTitle);
        return sim >= 0.85 && intersects(item.touches, shape.touches);
      });

      if (duplicate) {
        linkedExisting.push(duplicate.id);
        skippedDuplicates.push({ title, existing_feature_id: duplicate.id });
        continue;
      }

      const id = await allocateEntityId(paths, 'FEAT');
      syncCounterFromId(snapshot.discoveryIndex, id);
      const recommended = resolveRoutedSkills(snapshot, shape.touches);
      const item = buildBacklogItem(
        id,
        title,
        'radar',
        radar.id,
        options?.scale || 'STANDARD',
        recommended,
        {
          parallelGroup,
          executionKind: shape.executionKind,
          planningMode: shape.planningMode,
          acceptanceRefs: [radar.id],
          touches: shape.touches,
          lockDomains: shape.lockDomains,
          produces: shape.produces,
          consumes: shape.consumes,
        }
      );
      snapshot.backlog.items.push(item);
      existingItems.push(item);
      created.push(item);
    }

    if (created.length === 0 && linkedExisting.length === 0) {
      throw new Error('Nenhuma feature criada no breakdown. Informe pelo menos um titulo valido.');
    }

    if (mode === 'graph') {
      const domainOrMigration = created
        .filter((item) => item.execution_kind === 'migration' || item.title.toLowerCase().includes('modelo'))
        .map((item) => item.id);
      const apiOrBackend = created
        .filter((item) => item.execution_kind === 'feature' || item.title.toLowerCase().includes('api'))
        .map((item) => item.id);

      for (const item of created) {
        if (item.execution_kind === 'feature') {
          item.blocked_by = Array.from(
            new Set([...item.blocked_by, ...domainOrMigration.filter((dep) => dep !== item.id)])
          );
        }
        if (item.execution_kind === 'frontend_coverage') {
          item.blocked_by = Array.from(
            new Set([...item.blocked_by, ...apiOrBackend.filter((dep) => dep !== item.id)])
          );
        }
        if (item.execution_kind === 'documentation') {
          item.blocked_by = created
            .filter((other) => other.id !== item.id && other.execution_kind !== 'documentation')
            .map((other) => other.id);
        }
        if (item.blocked_by.length > 0) {
          item.consumes = Array.from(new Set([...item.consumes, ...item.blocked_by]));
          TransitionEngine.assertValid('FEAT', item.status, 'BLOCKED');
          item.status = 'BLOCKED';
        }
      }
    }

    if (incremental && created.length > 0) {
      for (const createdItem of created) {
        const addedDeps = new Set<string>();
        for (const existing of snapshot.backlog.items) {
          if (existing.id === createdItem.id) continue;
          if (intersects(createdItem.consumes, existing.produces) && existing.status !== 'DONE') {
            createdItem.blocked_by = Array.from(new Set([...createdItem.blocked_by, existing.id]));
            addedDeps.add(existing.id);
          }
          if (intersects(existing.consumes, createdItem.produces) && createdItem.status !== 'DONE') {
            existing.blocked_by = Array.from(new Set([...existing.blocked_by, createdItem.id]));
            if (existing.status === 'READY') existing.status = 'BLOCKED';
            const deps = rewiredMap.get(existing.id) || new Set<string>();
            deps.add(createdItem.id);
            rewiredMap.set(existing.id, deps);
          }
          if (
            existing.status === 'IN_PROGRESS' &&
            intersects(createdItem.lock_domains, existing.lock_domains)
          ) {
            createdItem.status = 'BLOCKED';
            createdItem.summary = `${createdItem.summary || ''}\nLOCK_CONFLICT com ${existing.id}`.trim();
          }
        }
        if (addedDeps.size > 0) {
          TransitionEngine.assertValid('FEAT', createdItem.status, 'BLOCKED');
          createdItem.status = 'BLOCKED';
          const deps = rewiredMap.get(createdItem.id) || new Set<string>();
          for (const dep of addedDeps) deps.add(dep);
          rewiredMap.set(createdItem.id, deps);
        }
      }
    }

    updateDependencyMetadata(snapshot.backlog.items);

    if (radar.status !== 'SPLIT') {
      TransitionEngine.assertValid(radar.type, radar.status, 'SPLIT');
      radar.status = 'SPLIT';
      radar.updated_at = nowIso();
    }
    radar.related_ids = Array.from(new Set([...radar.related_ids, ...created.map((item) => item.id)]));

    await saveBacklogState(paths, snapshot.backlog);
    await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);
    await persistAndRender(paths, config, options?.render);

    return {
      radarId: radar.id,
      created: created.map((item) => item.id),
      linked_existing: linkedExisting,
      rewired_dependencies: Array.from(rewiredMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([feature_id, deps]) => ({
          feature_id,
          added_blocked_by: Array.from(deps).sort(),
        })),
      skipped_duplicates: skippedDuplicates,
    };
  }
}

export class SddIngestDepositoCommand {
  async execute(
    projectRoot: string,
    options?: {
      sourceDir?: string;
      title?: string;
      radarId?: string;
      titles?: string[];
      scale?: Scale;
      flowMode?: FlowMode;
      start?: boolean;
      render?: boolean;
    }
  ): Promise<{
    source_dir: string;
    scanned_files: number;
    indexed_created: number;
    indexed_updated: number;
    radar_id: string;
    created_features: string[];
    linked_existing: string[];
    started_feature_id: string;
    active_path: string;
    generated_docs: string[];
    start_warning: string;
    used_skills: string[];
    recommended_prompt: string;
  }> {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const now = nowIso();

    const sourceDir = options?.sourceDir
      ? path.resolve(projectRoot, options.sourceDir)
      : paths.depositoDir;
    const sourceDirExists = await pathExists(sourceDir);
    if (!sourceDirExists) {
      throw new Error(`Diretorio de deposito nao encontrado: ${sourceDir}`);
    }

    const scannedFiles = (await listFilesRecursively(sourceDir))
      .filter((filePath) => !path.basename(filePath).startsWith('.'))
      .filter((filePath) => path.basename(filePath).toLowerCase() !== 'readme.md')
      .sort((a, b) => a.localeCompare(b));

    if (scannedFiles.length === 0) {
      throw new Error('Nenhuma fonte encontrada no deposito. Adicione arquivos e rode novamente.');
    }

    const sourceByPath = new Map(
      snapshot.sourceIndex.sources.map((source) => [source.path.replace(/\\/g, '/'), source])
    );
    const scannedSourceRefs = new Set<string>();
    let indexedCreated = 0;
    let indexedUpdated = 0;

    for (const filePath of scannedFiles) {
      const relative = relProjectPath(paths, filePath);
      const normalizedPath = relative.replace(/\\/g, '/');
      const type = sourceTypeFromRelativePath(normalizedPath);
      const title = sourceTitleFromPath(filePath);
      const summary = await extractSourceSummary(filePath);
      const existing = sourceByPath.get(normalizedPath);

      if (!existing) {
        const id = nextSourceId(snapshot.sourceIndex.sources.map((source) => source.id));
        const created: SourceDocumentRecord = {
          id,
          type,
          path: normalizedPath,
          title,
          status: 'INDEXED',
          summary,
          imported_at: now,
          updated_at: now,
          used_by: [],
          notes: [],
          consolidation_targets: defaultConsolidationTargets(type),
        };
        snapshot.sourceIndex.sources.push(created);
        sourceByPath.set(normalizedPath, created);
        scannedSourceRefs.add(created.id);
        indexedCreated += 1;
        continue;
      }

      existing.type = type;
      existing.title = existing.title || title;
      existing.status = normalizeSourceStatus(existing.status, 'INDEXED');
      existing.summary = existing.summary || summary;
      existing.updated_at = now;
      existing.consolidation_targets = Array.from(
        new Set([...existing.consolidation_targets, ...defaultConsolidationTargets(type)])
      );
      scannedSourceRefs.add(existing.id);
      indexedUpdated += 1;
    }

    let radarId = options?.radarId || '';
    let radar = radarId
      ? snapshot.discoveryIndex.records.find((record) => record.id === radarId && (record.type === 'RAD' || record.type === 'EPIC'))
      : undefined;

    if (!radar) {
      radarId = await allocateEntityId(paths, 'EPIC');
      syncCounterFromId(snapshot.discoveryIndex, radarId);
      radar = {
        id: radarId,
        type: 'EPIC',
        title: (options?.title || 'Planejamento inicial a partir do deposito').slice(0, 120),
        status: 'READY',
        origin_prompt: `Gerado por ingestao de deposito em ${now}`,
        related_ids: [],
        created_at: now,
        updated_at: now,
      };
      snapshot.discoveryIndex.records.push(radar);
      const radarPath = path.join(paths.discoveryEpicDir, `${radarId}-${slugify(radar.title)}.md`);
      await fs.writeFile(
        radarPath,
        markdownRadarFromDepositoTemplate(radarId, radar.title, scannedFiles.length, options?.title),
        'utf-8'
      );
    }

    await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);
    await saveSourceIndexState(paths, snapshot.sourceIndex);

    const plannedTitles =
      options?.titles && options.titles.length > 0
        ? options.titles.filter((title) => title.trim().length > 0)
        : deriveInitialFeatureTitles(
            snapshot.sourceIndex.sources.filter((source) => scannedSourceRefs.has(source.id)),
            config.frontend.enabled
          );

    const breakdownResult = await new SddBreakdownCommand().execute(projectRoot, radarId, {
      titles: plannedTitles,
      scale: options?.scale || 'STANDARD',
      mode: 'graph',
      incremental: true,
      dedupe: 'normal',
      render: false,
    });

    const postPlan = await loadStateSnapshot(paths, config);
    const usedByRefs = [radarId, ...breakdownResult.created, ...breakdownResult.linked_existing];
    for (const source of postPlan.sourceIndex.sources) {
      if (!scannedSourceRefs.has(source.id)) continue;
      source.used_by = Array.from(new Set([...source.used_by, ...usedByRefs]));
      source.status = normalizeSourceStatus(source.status, 'PLANNED');
      source.updated_at = nowIso();
      source.consolidation_targets = Array.from(
        new Set([...source.consolidation_targets, 'radar', 'backlog'])
      );
    }
    await saveSourceIndexState(paths, postPlan.sourceIndex);

    const shouldStart = options?.start ?? true;
    let startedFeatureId = '';
    let activePath = '';
    let generatedDocs: string[] = [];
    let startWarning = '';

    if (shouldStart) {
      const candidateIds = new Set([...breakdownResult.created, ...breakdownResult.linked_existing]);
      const candidates = postPlan.backlog.items
        .filter((item) => candidateIds.has(item.id))
        .filter((item) => featureReadiness(item, postPlan.backlog.items) === 'READY')
        .sort((a, b) => a.id.localeCompare(b.id));
      const candidate = candidates[0];

      if (candidate) {
        const started = await new SddStartCommand().execute(projectRoot, candidate.id, {
          scale: options?.scale,
          flowMode: options?.flowMode,
          render: false,
        });
        startedFeatureId = started.featureId;
        activePath = started.active_path;
        generatedDocs = started.generated_docs;
      } else {
        startWarning =
          'Nenhuma FEAT pronta para iniciar automaticamente (dependencias/locks pendentes). Use "opensdd sdd next".';
      }
    }

    await persistAndRender(paths, config, options?.render);

    return {
      source_dir: relProjectPath(paths, sourceDir),
      scanned_files: scannedFiles.length,
      indexed_created: indexedCreated,
      indexed_updated: indexedUpdated,
      radar_id: radarId,
      created_features: breakdownResult.created,
      linked_existing: breakdownResult.linked_existing,
      started_feature_id: startedFeatureId,
      active_path: activePath,
      generated_docs: generatedDocs,
      start_warning: startWarning,
      used_skills: [
        'source-intake-sdd',
        'business-extractor-sdd',
        'frontend-extractor-sdd',
        'planning-normalizer-sdd',
      ],
      recommended_prompt: relProjectPath(paths, path.join(paths.promptsDir, '01-ingestao-deposito.md')),
    };
  }
}

function inferOriginType(input: string): BacklogItem['origin_type'] {
  if (/^(?:RAD|EPIC)-\d{3,}$/.test(input)) return 'epic';
  if (/^FGAP-\d{3,}$/.test(input)) return 'frontend_gap';
  if (/^TD-\d{3,}$/.test(input)) return 'tech_debt';
  return 'direct';
}

export class SddStartCommand {
  async execute(
    projectRoot: string,
    refOrText: string,
    options?: { scale?: Scale; render?: boolean; schema?: string; force?: boolean; flowMode?: FlowMode; forceTransition?: boolean }
  ) {
    const value = refOrText.trim();
    if (!value) {
      throw new Error('Informe uma referencia ou descricao para iniciar.');
    }

    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const catalog = await loadSkillCatalogState(paths);
    const now = nowIso();

    let feature: BacklogItem | undefined;
    if (/^FEAT-\d{3,}$/.test(value)) {
      feature = resolveFeat(snapshot.backlog.items, value);
    } else if (/^(?:RAD|EPIC)-\d{3,}$/.test(value)) {
      const existing = snapshot.backlog.items.find(
        (item) => (item.origin_type === 'radar' || item.origin_type === 'epic') && item.origin_ref === value
      );
      if (existing) {
        feature = existing;
      } else {
        const id = await allocateEntityId(paths, 'FEAT');
        syncCounterFromId(snapshot.discoveryIndex, id);
        const radar = findDiscoveryRecord(snapshot.discoveryIndex.records, value);
        resolveRadar(radar);
        const title = radar.title || `Feature de ${value}`;
        const shape = classifyFeatureShape(title);
        const recommended = resolveRoutedSkills(snapshot, shape.touches);
        feature = buildBacklogItem(
          id,
          title,
          'epic',
          value,
          options?.scale || 'STANDARD',
          recommended,
          {
            parallelGroup: `epic-${value.toLowerCase()}`,
            executionKind: shape.executionKind,
            planningMode: shape.planningMode,
            acceptanceRefs: [value],
            touches: shape.touches,
            lockDomains: shape.lockDomains,
              produces: shape.produces,
              consumes: shape.consumes,
              flowMode: options?.flowMode,
            }
          );
        snapshot.backlog.items.push(feature);
      }
    } else {
      const id = await allocateEntityId(paths, 'FEAT');
      syncCounterFromId(snapshot.discoveryIndex, id);
      const shape = classifyFeatureShape(value);
      const recommended = resolveRoutedSkills(snapshot, shape.touches);
      feature = buildBacklogItem(
        id,
        value,
        inferOriginType(value),
        /^([A-Z]+-\d{3,})$/.test(value) ? value : undefined,
        options?.scale || 'STANDARD',
        recommended,
        {
          executionKind: shape.executionKind,
          planningMode: shape.planningMode,
          touches: shape.touches,
          lockDomains: shape.lockDomains,
          produces: shape.produces,
          consumes: shape.consumes,
          flowMode: options?.flowMode,
        }
      );
      snapshot.backlog.items.push(feature);
    }

    if (options?.flowMode) {
      feature.flow_mode = options.flowMode;
      if (options.flowMode === 'direto') {
        feature.gates.proposta.status = 'nao_exigida';
        feature.gates.planejamento.status = 'nao_exigida';
      }
    }

    const unresolved = unresolvedDependencies(feature, snapshot.backlog.items);
    const lockConflicts = lockConflictWithActive(feature, snapshot.backlog.items);
    const startGuardrails = {
      blocked_check: {
        ok: unresolved.length === 0,
        unresolved,
      },
      lock_check: {
        ok: lockConflicts.length === 0,
        conflicts: lockConflicts,
      },
      forced: !!options?.force,
    };

    if (unresolved.length > 0 && !options?.force) {
      throw new Error(
        `Nao foi possivel iniciar ${feature.id}: blocked_by pendente (${unresolved.join(', ')}). Use --force para bypass explicito.`
      );
    }

    if (lockConflicts.length > 0 && !options?.force) {
      throw new Error(
        `Nao foi possivel iniciar ${feature.id}: lock conflict com ${lockConflicts.join(', ')}. Use --force para bypass explicito.`
      );
    }

    if (!feature.change_name) {
      const base =
        slugify(`${feature.id}-${feature.title}`).slice(0, 50).replace(/-+$/g, '') ||
        feature.id.toLowerCase();
      const changeName = base;
      const existingChangeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
      const existingChangeMetadata = path.join(existingChangeDir, '.openspec.yaml');
      const archivedChangeDir = path.join(projectRoot, 'openspec', 'changes', 'archive', changeName);
      const canAdoptExistingChange =
        existsSync(existingChangeDir) &&
        existsSync(existingChangeMetadata) &&
        !existsSync(archivedChangeDir);

      if (!canAdoptExistingChange) {
        await createChange(projectRoot, changeName, { schema: options?.schema });
      }

      feature.change_name = changeName;
    }

    let startLensViolations: string[] = [];
    if (feature.origin_type === 'epic' && feature.origin_ref) {
      const parentDir = paths.discoveryEpicDir;
      const files = await fs.readdir(parentDir).catch(() => []);
      const parentFile = files.find((f: string) => f.startsWith(`${feature.origin_ref}-`));
      if (parentFile) {
        const content = await fs.readFile(path.join(parentDir, parentFile), 'utf-8').catch(() => '');
        if (content) {
          const miss = validateDocumentAgainstLens(content, LENSES.epic);
          startLensViolations.push(...miss.map((m: string) => `Epic: ${m}`));
        } else {
          startLensViolations.push(`Epic Original (${feature.origin_ref}) vazio ou inacessível.`);
        }
      } else {
        startLensViolations.push(`Epic Original (${feature.origin_ref}) não encontrado.`);
      }
    }

    TransitionEngine.assertValid('FEAT', feature.status, 'IN_PROGRESS', {
      forceTransition: options?.forceTransition,
      lensViolations: startLensViolations
    });
    feature.status = 'IN_PROGRESS';
    feature.current_stage = 'execucao';
    feature.last_sync_at = now;
    if (!feature.start_commit_sha) {
      feature.start_commit_sha = await gitHeadCommit(projectRoot);
    }
    if (feature.execution_kind === 'frontend_coverage' && feature.frontend_impact_status === 'unknown') {
      feature.frontend_impact_status = 'required';
    }
    feature.recommended_skills = resolveRoutedSkills(snapshot, feature.touches);
    if (options?.force && (unresolved.length > 0 || lockConflicts.length > 0)) {
      const notes = [
        unresolved.length > 0 ? `FORCED blocked_by pendente: ${unresolved.join(', ')}` : '',
        lockConflicts.length > 0 ? `FORCED lock conflict: ${lockConflicts.join(', ')}` : '',
      ].filter(Boolean);
      feature.summary = [feature.summary || '', ...notes].filter(Boolean).join('\n');
    }

    if ((feature.origin_type === 'radar' || feature.origin_type === 'epic') && feature.origin_ref) {
      const radar = findDiscoveryRecord(snapshot.discoveryIndex.records, feature.origin_ref);
      if (radar && (radar.type === 'RAD' || radar.type === 'EPIC')) {
        const shouldPromoteParent = radar.status === 'READY' || radar.status === 'PLANNED';
        if (shouldPromoteParent) {
          TransitionEngine.assertValid(radar.type, radar.status, 'IN_PROGRESS');
          radar.status = 'IN_PROGRESS';
          radar.updated_at = now;
        }
      }
    }

    const recommendedBundles = bundlesForSkills(catalog, feature.recommended_skills);
    const activeWorkspace = await ensureFeatureActiveWorkspace(paths, config, feature, recommendedBundles);
    if (feature.requires_adr) {
      const adrDir = path.join(paths.coreDir, 'adrs');
      const adrPath = path.join(adrDir, adrFileName(feature.id));
      const adrExists = await pathExists(adrPath);
      if (!adrExists) {
        await fs.mkdir(adrDir, { recursive: true });
        await fs.writeFile(adrPath, generateAdrTemplate(feature, now), 'utf-8');
      }
    }

    updateDependencyMetadata(snapshot.backlog.items);
    await saveBacklogState(paths, snapshot.backlog);
    await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);
    await persistAndRender(paths, config, options?.render);

    return {
      featureId: feature.id,
      changeName: feature.change_name,
      status: feature.status,
      start_guardrails: startGuardrails,
      active_path: path.relative(paths.projectRoot, activeWorkspace.activePath),
      generated_docs: activeWorkspace.generatedDocs,
      recommended_bundles: recommendedBundles,
      handoff_seed_refs: activeWorkspace.handoffSeedRefs,
      flow_mode: feature.flow_mode,
      start_commit_sha: feature.start_commit_sha || '',
    };
  }
}

async function buildFinalizeQueue(
  paths: SddPaths,
  backlogItems: BacklogItem[],
  queueItems: FinalizeQueueItem[]
): Promise<FinalizeQueueItem[]> {
  const queueByFeature = new Map(queueItems.map((item) => [item.feature_id, item]));
  const archiveRoot = path.join(paths.projectRoot, 'openspec', 'changes', 'archive');

  for (const item of backlogItems) {
    if (!item.change_name) continue;
    if (item.status === 'DONE') continue;
    const archivedPath = path.join(archiveRoot, item.change_name);
    const archived = await fs
      .access(archivedPath)
      .then(() => true)
      .catch(() => false);
    if (!archived) continue;

    if (!queueByFeature.has(item.id)) {
      queueByFeature.set(item.id, {
        feature_id: item.id,
        status: 'PENDING',
        summary: `Consolidar memoria da ${item.id} (${item.change_name})`,
        created_at: nowIso(),
        completed_at: '',
      });
    }

    if (item.status !== 'ARCHIVED') {
      TransitionEngine.assertValid('FEAT', item.status, 'ARCHIVED');
      item.status = 'ARCHIVED';
      item.archived_at = nowIso();
    }
  }

  return Array.from(queueByFeature.values()).sort((a, b) => a.feature_id.localeCompare(b.feature_id));
}

function buildAdrMarkdown(feature: BacklogItem, unlocked: string[], timestamp: string): string {
  const refs = [feature.id, feature.origin_ref].filter(Boolean).join(', ') || '-';
  return `# ADR ${feature.id}

## Contexto
- Feature: ${feature.id} - ${feature.title}
- Origem: ${feature.origin_type}${feature.origin_ref ? ` (${feature.origin_ref})` : ''}
- Finalizado em: ${timestamp}

## Decisao
Consolidar a implementacao da feature ${feature.id} e oficializar o resultado na memoria SDD.

## Mudancas
- Change associado: ${feature.change_name || '-'}
- Tipo de execucao: ${feature.execution_kind}
- Modo de planejamento: ${feature.planning_mode}
- Lock domains: ${feature.lock_domains.length > 0 ? feature.lock_domains.join(', ') : '-'}

## Riscos
- Risco residual documentado em resumo da feature: ${feature.summary || '-'}

## Dependentes liberados
${unlocked.length > 0 ? unlocked.map((id) => `- ${id}`).join('\n') : '- Nenhum'}

## Referencias
- ${refs}
`;
}

function upsertArray<T>(array: T[], predicate: (item: T) => boolean, nextValue: T): void {
  const idx = array.findIndex(predicate);
  if (idx >= 0) {
    array[idx] = nextValue;
    return;
  }
  array.push(nextValue);
}

function gateSatisfied(status: string): boolean {
  return status === 'aprovada' || status === 'nao_exigida';
}

export class SddFinalizeCommand {
  async execute(
    projectRoot: string,
    options?: {
      ref?: string;
      allReady?: boolean;
      render?: boolean;
      noAdr?: boolean;
      forceFrontend?: boolean;
      forceTransition?: boolean;
    }
  ) {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    snapshot.finalizeQueue.items = await buildFinalizeQueue(
      paths,
      snapshot.backlog.items,
      snapshot.finalizeQueue.items
    );

    const pending = snapshot.finalizeQueue.items.filter((item) => item.status === 'PENDING');
    const targets = options?.allReady
      ? pending.map((item) => item.feature_id)
      : options?.ref
        ? [options.ref]
        : pending.slice(0, 1).map((item) => item.feature_id);

    if (targets.length === 0) {
      await saveFinalizeQueueState(paths, snapshot.finalizeQueue);
      await saveBacklogState(paths, snapshot.backlog);
      await saveUnblockEventsState(paths, snapshot.unblockEvents);
      await persistAndRender(paths, config, options?.render);
      return {
        finalized: [],
        unblocked: [],
        pending: pending.length,
        updated_core_docs: [],
        updated_readme: false,
        updated_agent_guide: false,
        doc_warnings: [],
        auto_frontend_gaps: [],
        frontend_guardrails: [],
      };
    }

    const finalized: string[] = [];
    const unblocked = new Set<string>();
    const updatedCoreDocs = new Set<string>();
    const docWarnings: string[] = [];
    const autoFrontendGaps: string[] = [];
    const frontendGuardrails: Array<{
      feature_id: string;
      declared_status: 'unknown' | 'none' | 'required';
      evidence_sources: string[];
      auto_gap_created: string;
      blocked: boolean;
      forced: boolean;
      reasons: string[];
    }> = [];
    const now = nowIso();
    const existingEvents = new Set(
      snapshot.unblockEvents.events.map((event) => `${event.feature_id}:${event.unblocked_by}`)
    );

    for (const featureId of targets) {
      const feature = snapshot.backlog.items.find((item) => item.id === featureId);
      if (!feature) continue;
      if (
        feature.flow_mode === 'rigoroso' &&
        (!gateSatisfied(feature.gates.proposta.status) ||
          !gateSatisfied(feature.gates.planejamento.status) ||
          !gateSatisfied(feature.gates.tarefas.status))
      ) {
        docWarnings.push(
          `${feature.id} em modo rigoroso sem gates aprovados (proposta=${feature.gates.proposta.status}, planejamento=${feature.gates.planejamento.status}, tarefas=${feature.gates.tarefas.status})`
        );
        continue;
      }

      if (config.frontend.enabled) {
        const changed = await gitChangedFiles(projectRoot, feature.start_commit_sha || '');
        const evidence = detectFrontendImpactEvidence(feature, changed.files);
        const declaredStatus = feature.frontend_impact_status || 'unknown';
        const reasons: string[] = [];
        let autoGapId = '';

        if (declaredStatus === 'unknown') {
          reasons.push('frontend_impact_status=unknown');
        }
        if (declaredStatus === 'none') {
          const reason = (feature.frontend_impact_reason || '').trim();
          if (reason.length < 20) {
            reasons.push('frontend_impact_status=none sem justificativa minima (20 chars)');
          }
          if (evidence.has_frontend_evidence) {
            reasons.push('frontend_impact_status=none contradiz evidencias (metadata/diff)');
          }
        }
        if (declaredStatus === 'required' && feature.frontend_gap_refs.length === 0) {
          autoGapId = await maybeCreateAutomaticFrontendGap(paths, snapshot, feature, {
            force: true,
            routeTargets: evidence.metadata_routes,
            detectionSources:
              evidence.evidence_sources.length > 0
                ? [...evidence.evidence_sources]
                : ['metadata'],
          });
          if (autoGapId) {
            autoFrontendGaps.push(autoGapId);
            docWarnings.push(
              `${feature.id} gerou ${autoGapId} automaticamente (cobertura frontend pendente).`
            );
          }
          reasons.push(
            `frontend_impact_status=required exige FGAP vinculado antes do finalize (${autoGapId || 'nao criado'})`
          );
        }

        if (changed.warning) {
          docWarnings.push(`${feature.id}: deteccao diff com baixa confianca (${changed.warning}).`);
        }

        const blockedByGuardrail = reasons.length > 0;
        const forcedByGuardrail = blockedByGuardrail && !!options?.forceFrontend;
        frontendGuardrails.push({
          feature_id: feature.id,
          declared_status: declaredStatus,
          evidence_sources: evidence.evidence_sources,
          auto_gap_created: autoGapId,
          blocked: blockedByGuardrail,
          forced: forcedByGuardrail,
          reasons,
        });

        if (blockedByGuardrail && !options?.forceFrontend) {
          docWarnings.push(`${feature.id} bloqueada pelos guardrails de frontend: ${reasons.join(' | ')}`);
          continue;
        }
        if (forcedByGuardrail) {
          docWarnings.push(
            `${feature.id} finalizada com --force-frontend apesar de guardrails: ${reasons.join(' | ')}`
          );
        }
      }

      if (feature.requires_adr) {
        const requiredAdrPath = path.join(paths.coreDir, 'adrs', adrFileName(feature.id));
        const adrContent = await fs.readFile(requiredAdrPath, 'utf-8').catch(() => '');
        if (!adrContent.trim()) {
          docWarnings.push(`${feature.id} exige ADR obrigatório ausente: ${relProjectPath(paths, requiredAdrPath)}`);
          if (!options?.forceTransition) {
            continue;
          }
          docWarnings.push(
            `${feature.id} finalizada com --force-transition sem ADR obrigatório preenchido.`
          );
        } else {
          const adrViolations = validateDocumentAgainstLens(adrContent, LENSES.adr);
          if (adrViolations.length > 0) {
            docWarnings.push(
              `${feature.id} ADR obrigatório inválido: ${adrViolations.join(' | ')}`
            );
            if (!options?.forceTransition) {
              continue;
            }
            docWarnings.push(
              `${feature.id} finalizada com --force-transition apesar de violações no ADR obrigatório.`
            );
          }
        }
      }

      // Validação de Lentes nos MDs do Workspace Ativo
      const activePath = path.join(paths.activeDir, feature.id);
      const docNames = activeDocNamesForLayout(config);
      const specPath = path.join(activePath, docNames.spec);
      const planPath = path.join(activePath, docNames.plan);

      let lensViolations: string[] = [];
      const specContent = await fs.readFile(specPath, 'utf8').catch(() => '');
      if (specContent) {
        const miss = validateDocumentAgainstLens(specContent, LENSES.feature_spec);
        lensViolations.push(...miss.map(m => `Spec: ${m}`));
      } else {
        lensViolations.push('Arquivo de especificação não encontrado ou vazio.');
      }

      const planContent = await fs.readFile(planPath, 'utf8').catch(() => '');
      if (planContent) {
        const miss = validateDocumentAgainstLens(planContent, LENSES.feature_plan);
        lensViolations.push(...miss.map(m => `Plan: ${m}`));
      } else {
        lensViolations.push('Arquivo de plano não encontrado ou vazio.');
      }

      try {
        TransitionEngine.assertValid('FEAT', feature.status, 'DONE', {
          forceTransition: options?.forceTransition,
          lensViolations
        });
      } catch (err: any) {
        docWarnings.push(`${feature.id} ${err.message}`);
        continue;
      }
      feature.status = 'DONE';
      feature.current_stage = 'consolidacao';
      feature.done_at = now;
      feature.last_sync_at = now;

      const queue = snapshot.finalizeQueue.items.find((item) => item.feature_id === featureId);
      if (queue) {
        queue.status = 'DONE';
        queue.completed_at = now;
      } else {
        snapshot.finalizeQueue.items.push({
          feature_id: featureId,
          status: 'DONE',
          summary: `Finalizado manualmente: ${featureId}`,
          created_at: now,
          completed_at: now,
        });
      }

      if ((feature.origin_type === 'radar' || feature.origin_type === 'epic') && feature.origin_ref) {
        const siblings = snapshot.backlog.items.filter(
          (item) => (item.origin_type === 'radar' || item.origin_type === 'epic') && item.origin_ref === feature.origin_ref
        );
        if (siblings.every((item) => item.status === 'DONE' || item.status === 'ARCHIVED')) {
          const radar = snapshot.discoveryIndex.records.find((r) => r.id === feature.origin_ref);
          if (radar && (radar.type === 'RAD' || radar.type === 'EPIC')) {
            const targetStatus = RADAR_TO_DISCOVERY_STATUS.DONE;
            if (radar.status !== targetStatus) {
              TransitionEngine.assertValid(radar.type, radar.status, targetStatus);
              radar.status = targetStatus;
              radar.updated_at = now;
            }
          }
        }
      }

      // Consolida memória macro canônica com dados objetivos da feature finalizada.
      upsertArray(
        snapshot.architecture.nodes,
        (node) => node.id === feature.id,
        {
          id: feature.id,
          name: feature.title,
          kind: feature.execution_kind,
          description: feature.summary || '',
          repo_paths: feature.worktree_path ? [feature.worktree_path] : [],
          depends_on: feature.blocked_by,
        }
      );
      updatedCoreDocs.add(coreDocRef(paths, 'arquitetura.md'));

      const serviceId = feature.touches[0] || feature.execution_kind;
      upsertArray(
        snapshot.serviceCatalog.services,
        (service) => service.id === serviceId,
        {
          id: serviceId,
          name: serviceId,
          responsibility: `Consolidado por ${feature.id}`,
          owner_refs: [feature.id],
          repo_paths: feature.worktree_path ? [feature.worktree_path] : [],
          contracts: feature.consumes,
          external_dependencies: [],
        }
      );
      updatedCoreDocs.add(coreDocRef(paths, 'servicos.md'));

      for (const tech of feature.touches) {
        if (!snapshot.techStack.items.some((entry) => entry.layer === tech && entry.technology === tech)) {
          snapshot.techStack.items.push({
            layer: tech,
            technology: tech,
            version: '',
            purpose: `Area impactada por ${feature.id}`,
            constraints: feature.lock_domains,
          });
        }
      }
      updatedCoreDocs.add(coreDocRef(paths, 'spec-tecnologica.md'));

      const contractTokens = Array.from(new Set([...feature.consumes, ...feature.produces]));
      for (const token of contractTokens) {
        const contractRef = `${token}::${feature.id}`;
        if (!snapshot.integrationContracts.contracts.includes(contractRef)) {
          snapshot.integrationContracts.contracts.push(contractRef);
        }
      }

      upsertArray(
        snapshot.repoMap.items,
        (item) => item.path === `openspec/changes/archive/${feature.change_name}`,
        {
          path: `openspec/changes/archive/${feature.change_name || feature.id.toLowerCase()}`,
          kind: 'change-archive',
          service_ref: serviceId,
          notes: `Consolidado no finalize ${feature.id}`,
        }
      );
      updatedCoreDocs.add(coreDocRef(paths, 'repo-map.md'));

      if (config.frontend.enabled && snapshot.frontendDecisions && feature.execution_kind === 'frontend_coverage') {
        upsertArray(
          snapshot.frontendDecisions.items,
          (entry) => entry.id === `FD-${feature.id}`,
          {
            id: `FD-${feature.id}`,
            title: `Decisao de frontend para ${feature.id}`,
            status: 'APPROVED',
            decision: `Cobrir frontend da feature ${feature.id}`,
            rationale: feature.summary || '',
            related_refs: [feature.id, feature.origin_ref || ''].filter(Boolean),
            route_refs: [],
            adr_refs: [`ADR-${feature.id}`],
          }
        );
        updatedCoreDocs.add(coreDocRef(paths, 'frontend-decisions.md'));
      }

      const unlockedByFeature: string[] = [];
      for (const dependant of snapshot.backlog.items) {
        if (dependant.id === feature.id) continue;
        if (!dependant.blocked_by.includes(feature.id)) continue;
        if (dependant.status === 'DONE' || dependant.status === 'ARCHIVED') continue;
        const unresolved = unresolvedDependencies(dependant, snapshot.backlog.items);
        if (unresolved.length > 0) continue;

        if (dependant.status === 'BLOCKED') {
          dependant.status = 'READY';
        }
        dependant.unblocked_at = now;
        dependant.last_sync_at = now;
        unblocked.add(dependant.id);
        unlockedByFeature.push(dependant.id);

        const eventKey = `${dependant.id}:${feature.id}`;
        if (!existingEvents.has(eventKey)) {
          snapshot.unblockEvents.events.push({
            feature_id: dependant.id,
            unblocked_by: feature.id,
            created_at: now,
            status: 'NEW',
          });
          existingEvents.add(eventKey);
        }
      }

      if (!options?.noAdr && !feature.requires_adr) {
        const adrPath = path.join(paths.coreDir, 'adrs', `ADR-${feature.id}.md`);
        await fs.writeFile(adrPath, buildAdrMarkdown(feature, unlockedByFeature, now), 'utf-8');
      }

      const activeDirPath = path.join(paths.activeDir, feature.id);
      const archivedDirPath = path.join(paths.archivedDir, feature.id);
      try {
        const stat = await fs.stat(activeDirPath);
        if (stat.isDirectory()) {
          await fs.mkdir(paths.archivedDir, { recursive: true });
          
          // Try to move folder. If archivedDirPath exists, we might need to remove it or merge it. 
          // Since it's done once, it's safer to overwrite.
          const existingArchive = await fs.stat(archivedDirPath).catch(() => null);
          if (existingArchive) {
              await fs.rm(archivedDirPath, { recursive: true, force: true });
          }
          await fs.rename(activeDirPath, archivedDirPath);
        }
      } catch (err) {
        // Ignore if active directory doesn't exist
      }

      finalized.push(featureId);
    }

    updateDependencyMetadata(snapshot.backlog.items);
    await saveDiscoveryIndexState(paths, snapshot.discoveryIndex);
    await saveBacklogState(paths, snapshot.backlog);
    await saveFinalizeQueueState(paths, snapshot.finalizeQueue);
    await saveUnblockEventsState(paths, snapshot.unblockEvents);
    await saveArchitectureState(paths, snapshot.architecture);
    await saveServiceCatalogState(paths, snapshot.serviceCatalog);
    await saveTechStackState(paths, snapshot.techStack);
    await saveIntegrationContractsState(paths, snapshot.integrationContracts);
    await saveRepoMapState(paths, snapshot.repoMap);
    if (config.frontend.enabled && snapshot.frontendDecisions) {
      await saveFrontendDecisionsState(paths, snapshot.frontendDecisions);
      if (snapshot.frontendGaps) {
        await saveFrontendGapsState(paths, snapshot.frontendGaps);
      }
      if (snapshot.frontendMap) {
        await saveFrontendMapState(paths, snapshot.frontendMap);
      }
    } else if (config.frontend.enabled) {
      docWarnings.push('frontend.enabled=true sem frontend-decisions carregado');
    }
    await persistAndRender(paths, config, options?.render);

    const syncResult = await syncSddGuideDocs(projectRoot, paths, config);

    const remaining = snapshot.finalizeQueue.items.filter((item) => item.status === 'PENDING').length;
    return {
      finalized,
      unblocked: Array.from(unblocked).sort(),
      pending: remaining,
      updated_core_docs: Array.from(updatedCoreDocs).sort(),
      updated_readme: syncResult.updatedReadme,
      updated_agent_guide: syncResult.updatedAgentGuide || syncResult.updatedRootAgents,
      doc_warnings: docWarnings,
      auto_frontend_gaps: autoFrontendGaps,
      frontend_guardrails: frontendGuardrails,
    };
  }
}

export interface SddAuditResult {
  generated_at: string;
  meta_evolution: MetaEvolutionConfig;
  metrics: {
    artifacts_without_placeholder: { ok: number; total: number; percent: number };
    debates_with_real_deliberation: { ok: number; total: number; percent: number };
    adrs_generated_vs_expected: { ok: number; total: number; percent: number };
    forced_transitions: { total: number; feature_refs: string[] };
  };
  score: number;
  healthy: boolean;
  should_open_insight: boolean;
  recommendation: string;
}

export class SddAuditCommand {
  async execute(projectRoot: string): Promise<SddAuditResult> {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const metaEvolution = await readMetaEvolutionConfig(paths);

    const artifacts = await collectAuditArtifacts(paths);
    let placeholderFreeCount = 0;
    for (const artifact of artifacts) {
      const content = await fs.readFile(artifact, 'utf-8').catch(() => '');
      if (!hasPlaceholder(content, metaEvolution.placeholder_markers)) {
        placeholderFreeCount += 1;
      }
    }

    const debateFiles = await fs.readdir(paths.discoveryDebatesDir).catch(() => []);
    let debatesWithRealDeliberation = 0;
    for (const fileName of debateFiles) {
      if (!fileName.endsWith('.md')) continue;
      const debateContent = await fs
        .readFile(path.join(paths.discoveryDebatesDir, fileName), 'utf-8')
        .catch(() => '');
      if (debateHasRealDeliberation(debateContent)) {
        debatesWithRealDeliberation += 1;
      }
    }

    const expectedAdrFeatures = snapshot.backlog.items.filter((item) => item.requires_adr);
    let generatedAdrCount = 0;
    for (const feature of expectedAdrFeatures) {
      const adrPath = path.join(paths.coreDir, 'adrs', adrFileName(feature.id));
      if (existsSync(adrPath)) {
        generatedAdrCount += 1;
      }
    }

    const forcedTransitions = await collectForcedTransitions(paths);

    const placeholdersMetric = {
      ok: placeholderFreeCount,
      total: artifacts.length,
      percent: normalizePercent(placeholderFreeCount, artifacts.length),
    };
    const debateMetric = {
      ok: debatesWithRealDeliberation,
      total: debateFiles.filter((name) => name.endsWith('.md')).length,
      percent: normalizePercent(
        debatesWithRealDeliberation,
        debateFiles.filter((name) => name.endsWith('.md')).length
      ),
    };
    const adrMetric = {
      ok: generatedAdrCount,
      total: expectedAdrFeatures.length,
      percent: normalizePercent(generatedAdrCount, expectedAdrFeatures.length),
    };

    const scoreBase =
      placeholdersMetric.percent * 0.4 + debateMetric.percent * 0.35 + adrMetric.percent * 0.25;
    const forcedPenalty = Math.min(forcedTransitions.total * 2, 20);
    const score = Math.max(0, Math.round((scoreBase - forcedPenalty) * 100) / 100);
    const healthy = score >= metaEvolution.health_alert_threshold;
    const shouldOpenInsight = !healthy && metaEvolution.enabled;
    const recommendation = shouldOpenInsight
      ? `Saude do ciclo abaixo do limiar (${metaEvolution.health_alert_threshold}%). Sugestao: abrir INS com "${CLI_NAME} sdd insight \\"Meta-evolucao SDD: reduzir placeholders e fortalecer deliberacao\\"".`
      : 'Ciclo dentro do limiar configurado. Manter monitoramento semestral.';

    return {
      generated_at: nowIso(),
      meta_evolution: metaEvolution,
      metrics: {
        artifacts_without_placeholder: placeholdersMetric,
        debates_with_real_deliberation: debateMetric,
        adrs_generated_vs_expected: adrMetric,
        forced_transitions: {
          total: forcedTransitions.total,
          feature_refs: forcedTransitions.featureRefs,
        },
      },
      score,
      healthy,
      should_open_insight: shouldOpenInsight,
      recommendation,
    };
  }
}

type ContextEntityType = 'FEAT' | 'RAD' | 'EPIC' | 'FGAP' | 'TD';

function detectContextType(ref: string): ContextEntityType | null {
  if (/^FEAT-\d{3,}$/.test(ref)) return 'FEAT';
  if (/^EPIC-\d{3,}$/.test(ref)) return 'EPIC';
  if (/^RAD-\d{3,}$/.test(ref)) return 'RAD';
  if (/^FGAP-\d{3,}$/.test(ref)) return 'FGAP';
  if (/^TD-\d{3,}$/.test(ref)) return 'TD';
  return null;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listAdrRefs(paths: SddPaths, refs: string[]): Promise<string[]> {
  const adrDir = path.join(paths.coreDir, 'adrs');
  const entries = await fs.readdir(adrDir).catch(() => []);
  const normalized = refs.filter(Boolean);
  return entries
    .filter((name) => name.endsWith('.md'))
    .filter((name) => normalized.some((ref) => name.includes(ref)))
    .map((name) => relProjectPath(paths, path.join(adrDir, name)))
    .sort();
}

export class SddContextCommand {
  async execute(projectRoot: string, ref: string) {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const type = detectContextType(ref);
    if (!type) {
      throw new Error(`Referencia ${ref} invalida. Use FEAT/EPIC/RAD/FGAP/TD.`);
    }

    const coreDocs = [
      coreDocRef(paths, 'index.md'),
      coreDocRef(paths, 'arquitetura.md'),
      coreDocRef(paths, 'servicos.md'),
      coreDocRef(paths, 'spec-tecnologica.md'),
      coreDocRef(paths, 'repo-map.md'),
    ];
    if (config.frontend.enabled) {
      coreDocs.push(coreDocRef(paths, 'frontend-map.md'));
      coreDocs.push(coreDocRef(paths, 'frontend-sitemap.md'));
      coreDocs.push(coreDocRef(paths, 'frontend-decisions.md'));
      coreDocs.push(planningDocRef(paths, 'frontend-auditoria.md'));
    }

    if (type === 'FEAT') {
      const item = snapshot.backlog.items.find((entry) => entry.id === ref);
      if (!item) throw new Error(`Feature ${ref} nao encontrada.`);
      const unresolved = unresolvedDependencies(item, snapshot.backlog.items);
      const lockConflicts = lockConflictWithActive(item, snapshot.backlog.items);
      const predecessorOutputs = item.blocked_by
        .map((depId) => snapshot.backlog.items.find((entry) => entry.id === depId))
        .filter((dep): dep is BacklogItem => Boolean(dep))
        .map((dep) => ({
          feature_id: dep.id,
          status: dep.status,
          produces: dep.produces,
          summary: dep.summary || '',
        }));
      const relevantServices = snapshot.serviceCatalog.services
        .filter((service) => item.touches.includes(service.id) || item.title.includes(service.name))
        .map((service) => ({
          id: service.id,
          name: service.name,
          contracts: service.contracts,
        }));
      const relevantContracts = snapshot.integrationContracts.contracts.filter((contract) =>
        [item.id, ...item.consumes, ...item.produces].some((token) => contract.includes(token))
      );
      const frontendDecisionRefs = [item.id, item.origin_ref].filter((v): v is string => Boolean(v));
      const relevantFrontendDecisions = (snapshot.frontendDecisions?.items ?? [])
        .filter((decision) => decision.related_refs.some((refId) => frontendDecisionRefs.includes(refId)))
        .map((decision) => ({
          id: decision.id,
          title: decision.title,
          status: decision.status,
          route_refs: decision.route_refs,
        }));
      const relevantAdrs = await listAdrRefs(paths, [item.id, item.origin_ref || '', ...item.blocked_by]);
      const activePathAbs = featureActiveDir(paths, item.id);
      const activePath = (await pathExists(activePathAbs))
        ? relProjectPath(paths, activePathAbs)
        : '';
      const activeDocs = await resolveActiveDocRefs(paths, item.id, config);
      const nextAction =
        item.flow_mode === 'rigoroso' && !gateSatisfied(item.gates.proposta.status)
          ? `${CLI_NAME} sdd aprovar ${item.id} --etapa proposta`
          : item.flow_mode === 'rigoroso' && !gateSatisfied(item.gates.planejamento.status)
            ? `${CLI_NAME} sdd aprovar ${item.id} --etapa planejamento`
            : item.flow_mode === 'rigoroso' && !gateSatisfied(item.gates.tarefas.status)
              ? `${CLI_NAME} sdd aprovar ${item.id} --etapa tarefas`
              : `${CLI_NAME} sdd start ${item.id}`;
      const readOrder = [
        'README.md',
        relProjectPath(paths, path.join(paths.memoryRoot, 'AGENT.md')),
        coreDocRef(paths, 'index.md'),
        coreDocRef(paths, 'arquitetura.md'),
        coreDocRef(paths, 'servicos.md'),
        coreDocRef(paths, 'spec-tecnologica.md'),
        coreDocRef(paths, 'repo-map.md'),
        ...relevantAdrs,
        ...coreDocs.filter((doc) => doc.includes('frontend')),
        ...(activePath ? activeDocs : []),
      ];
      return {
        context_pack_version: 1,
        target_id: ref,
        target_type: type,
        summary: `${item.title} [${item.status}]`,
        origin: { type: item.origin_type, ref: item.origin_ref || '' },
        related_discovery: item.origin_ref
          ? snapshot.discoveryIndex.records
              .filter((record) => record.id === item.origin_ref || record.related_ids.includes(ref))
              .map((record) => record.id)
          : [],
        related_gaps: item.frontend_gap_refs,
        recommended_skills: item.recommended_skills,
        recommended_bundles: bundlesForSkills(snapshot.skillCatalog, item.recommended_skills),
        change_name: item.change_name || '',
        blocked_by: item.blocked_by,
        lock_domains: item.lock_domains,
        parallel_group: item.parallel_group,
        planning_mode: item.planning_mode,
        flow_mode: item.flow_mode,
        current_stage: item.current_stage,
        gates: item.gates,
        frontend_impact_status: item.frontend_impact_status,
        frontend_impact_reason: item.frontend_impact_reason || '',
        frontend_impact_declared_at: item.frontend_impact_declared_at || '',
        frontend_surface_tokens: item.frontend_surface_tokens,
        start_commit_sha: item.start_commit_sha || '',
        next_action: nextAction,
        execution_kind: item.execution_kind,
        produces: item.produces,
        consumes: item.consumes,
        predecessor_outputs: predecessorOutputs,
        relevant_adrs: relevantAdrs,
        relevant_services: relevantServices,
        relevant_contracts: relevantContracts,
        relevant_frontend_decisions: relevantFrontendDecisions,
        read_order: Array.from(new Set(readOrder)),
        active_path: activePath,
        unresolved_blocked_by: unresolved,
        lock_conflicts_with: lockConflicts,
        readiness: featureReadiness(item, snapshot.backlog.items),
        core_docs: coreDocs,
      };
    }

    if (type === 'RAD' || type === 'EPIC') {
      const radar = snapshot.discoveryIndex.records.find((record) => record.id === ref && (record.type === 'RAD' || record.type === 'EPIC'));
      if (!radar) throw new Error(`Epic/Radar ${ref} nao encontrado.`);
      const relatedFeatures = snapshot.backlog.items.filter(
        (item) => (item.origin_type === 'radar' || item.origin_type === 'epic') && item.origin_ref === ref
      );
      return {
        context_pack_version: 1,
        target_id: ref,
        target_type: type,
        summary: `${radar.title} [${radar.status}]`,
        related_features: relatedFeatures.map((item) => item.id),
        related_debates: snapshot.discoveryIndex.records
          .filter((record) => record.type === 'DEB' && record.related_ids.includes(ref))
          .map((record) => record.id),
        read_order: [
          'README.md',
          relProjectPath(paths, path.join(paths.memoryRoot, 'AGENT.md')),
          coreDocRef(paths, 'index.md'),
          planningDocRef(paths, 'backlog-graph.md'),
        ],
        core_docs: coreDocs,
      };
    }

    if (type === 'FGAP') {
      const gap = snapshot.frontendGaps?.items.find((item) => item.id === ref);
      if (!gap) throw new Error(`Gap de frontend ${ref} nao encontrado.`);
      return {
        context_pack_version: 1,
        target_id: ref,
        target_type: type,
        summary: `${gap.title} [${gap.status}]`,
        source_feature: gap.origin_feature || '',
        resolved_by_feature: gap.resolved_by_feature || '',
        routes: gap.route_targets,
        read_order: [
          'README.md',
          relProjectPath(paths, path.join(paths.memoryRoot, 'AGENT.md')),
          coreDocRef(paths, 'frontend-map.md'),
          planningDocRef(paths, 'frontend-gaps.md'),
        ],
        core_docs: coreDocs,
      };
    }

    const debt = snapshot.techDebt.items.find((item) => item.id === ref);
    if (!debt) throw new Error(`Divida tecnica ${ref} nao encontrada.`);
    return {
      context_pack_version: 1,
      target_id: ref,
      target_type: type,
      summary: `${debt.title} [${debt.status}]`,
      related_refs: debt.related_refs,
      read_order: [
        'README.md',
        relProjectPath(paths, path.join(paths.memoryRoot, 'AGENT.md')),
        planningDocRef(paths, 'tech-debt.md'),
      ],
      core_docs: coreDocs,
    };
  }
}

export class SddOnboardCommand {
  async execute(
    projectRoot: string,
    target: string = 'system',
    options?: { compact?: boolean }
  ): Promise<Record<string, unknown>> {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const normalized = (target || 'system').trim();
    const contextCmd = new SddContextCommand();

    const baseReadOrder = [
      'README.md',
      relProjectPath(paths, path.join(paths.memoryRoot, 'AGENT.md')),
      coreDocRef(paths, 'index.md'),
      coreDocRef(paths, 'arquitetura.md'),
      coreDocRef(paths, 'servicos.md'),
      coreDocRef(paths, 'spec-tecnologica.md'),
      coreDocRef(paths, 'repo-map.md'),
    ];
    if (config.frontend.enabled) {
      baseReadOrder.push(coreDocRef(paths, 'frontend-map.md'), coreDocRef(paths, 'frontend-decisions.md'));
    }

    const computeGuidedSystemSteps = (
      nextResult: Awaited<ReturnType<SddNextCommand['execute']>>
    ): string[] => {
      if (nextResult.ready.length > 0) {
        return nextResult.ready.map((item) => item.id);
      }

      const inProgress = snapshot.backlog.items.find((item) => item.status === 'IN_PROGRESS');
      if (inProgress) {
        return [
          `${CLI_NAME} sdd context ${inProgress.id}`,
          `${CLI_NAME} archive ${inProgress.change_name || '<change-name>'}`,
          `${CLI_NAME} sdd finalize --ref ${inProgress.id}`,
          `${CLI_NAME} sdd next`,
        ];
      }

      const openDebate = snapshot.discoveryIndex.records.find(
        (record) => record.type === 'DEB' && record.status === 'OPEN'
      );
      if (openDebate) {
        return [
          `${CLI_NAME} sdd decide ${openDebate.id} --outcome epic`,
          `${CLI_NAME} sdd breakdown EPIC-#### --mode graph --incremental`,
          `${CLI_NAME} sdd next`,
        ];
      }

      const activeRadars = snapshot.discoveryIndex.records.filter(
        (record) =>
          (record.type === 'RAD' || record.type === 'EPIC') &&
          ['READY', 'PLANNED', 'SPLIT', 'IN_PROGRESS'].includes(record.status)
      );
      const firstUnplannedRadar = activeRadars.find(
        (radar) =>
          !snapshot.backlog.items.some(
            (item) => (item.origin_type === 'radar' || item.origin_type === 'epic') && item.origin_ref === radar.id
          )
      );
      if (firstUnplannedRadar) {
        return [
          `${CLI_NAME} sdd breakdown ${firstUnplannedRadar.id} --mode graph --incremental`,
          `${CLI_NAME} sdd next`,
          `${CLI_NAME} sdd start FEAT-####`,
        ];
      }

      const firstNewInsight = snapshot.discoveryIndex.records.find(
        (record) => record.type === 'INS' && record.status === 'NEW'
      );
      if (firstNewInsight) {
        return [
          `${CLI_NAME} sdd debate ${firstNewInsight.id}`,
          `${CLI_NAME} sdd decide DEB-#### --outcome epic`,
          `${CLI_NAME} sdd breakdown EPIC-#### --mode graph --incremental`,
          `${CLI_NAME} sdd next`,
        ];
      }

      if (snapshot.discoveryIndex.records.length === 0) {
        return [
          `${CLI_NAME} sdd insight "Descreva o primeiro objetivo do sistema"`,
          `${CLI_NAME} sdd debate INS-####`,
          `${CLI_NAME} sdd decide DEB-#### --outcome epic`,
          `${CLI_NAME} sdd breakdown EPIC-#### --mode graph --incremental`,
          `${CLI_NAME} sdd next`,
        ];
      }

      return [
        `${CLI_NAME} sdd insight "Novo ciclo de melhoria: descreva o objetivo"`,
        `${CLI_NAME} sdd debate INS-####`,
        `${CLI_NAME} sdd decide DEB-#### --outcome epic`,
        `${CLI_NAME} sdd breakdown EPIC-#### --mode graph --incremental`,
        `${CLI_NAME} sdd next`,
      ];
    };

    if (normalized === 'system') {
      const next = await new SddNextCommand().execute(projectRoot, { rank: 'impact', limit: 5 });
      const systemSkills = Array.from(
        new Set(next.ready.flatMap((item) => item.recommended_skills))
      ).slice(0, 10);
      const guidedSteps = computeGuidedSystemSteps(next);
      const payload: Record<string, unknown> = {
        target: 'system',
        summary: 'Onboarding global do sistema',
        read_order: baseReadOrder,
        arquitetura_relevante: snapshot.architecture.nodes,
        stack_relevante: snapshot.techStack.items,
        servicos_afetados: snapshot.serviceCatalog.services,
        contratos_afetados: snapshot.integrationContracts.contracts,
        decisoes_frontend: snapshot.frontendDecisions?.items ?? [],
        skills_bundles_recomendados: {
          skills: systemSkills,
          bundles: bundlesForSkills(snapshot.skillCatalog, systemSkills),
        },
        proximos_passos: guidedSteps,
      };
      if (options?.compact) {
        return {
          target: payload.target,
          summary: payload.summary,
          read_order: payload.read_order,
          proximos_passos: payload.proximos_passos,
        };
      }
      return payload;
    }

    if (/^RAD-\d{3,}$/.test(normalized)) {
      const context = await contextCmd.execute(projectRoot, normalized);
      const relatedFeatures = snapshot.backlog.items.filter(
        (item) => item.origin_type === 'radar' && item.origin_ref === normalized
      );
      const radarSkills = Array.from(
        new Set(relatedFeatures.flatMap((item) => item.recommended_skills))
      ).slice(0, 10);
      return {
        target: normalized,
        summary: `Onboarding da iniciativa ${normalized}`,
        read_order: [
          ...baseReadOrder,
          planningDocRef(paths, 'backlog-graph.md'),
          ...(await Promise.all(
            relatedFeatures.map((item) => resolveActiveDocRefs(paths, item.id, config))
          )).flat(),
        ],
        contexto: context,
        features_relacionadas: relatedFeatures.map((item) => ({
          id: item.id,
          status: item.status,
          title: item.title,
        })),
        skills_bundles_recomendados: {
          skills: radarSkills,
          bundles: bundlesForSkills(snapshot.skillCatalog, radarSkills),
        },
        proximos_passos: relatedFeatures
          .filter((item) => item.status === 'READY' || item.status === 'IN_PROGRESS')
          .map((item) => item.id),
      };
    }

    if (/^FEAT-\d{3,}$/.test(normalized)) {
      const context = await contextCmd.execute(projectRoot, normalized);
      const contextSkills = (context as Record<string, unknown>).recommended_skills as string[] | undefined;
      const featSkills = contextSkills || [];
      return {
        target: normalized,
        summary: `Onboarding de execucao ${normalized}`,
        read_order: (context as Record<string, unknown>).read_order || baseReadOrder,
        contexto: context,
        skills_bundles_recomendados: {
          skills: featSkills,
          bundles: bundlesForSkills(snapshot.skillCatalog, featSkills),
        },
        proximos_passos: [
          `${CLI_NAME} sdd start ${normalized}`,
          `${CLI_NAME} sdd context ${normalized}`,
          `${CLI_NAME} sdd finalize --ref ${normalized}`,
        ],
      };
    }

    throw new Error('Referencia invalida para onboard. Use system, RAD-### ou FEAT-###.');
  }
}

type ApprovalStage = 'proposta' | 'planejamento' | 'tarefas';

export class SddApproveCommand {
  async execute(
    projectRoot: string,
    featureId: string,
    stage: ApprovalStage,
    options?: { by?: string; note?: string; render?: boolean }
  ) {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const feature = resolveFeat(snapshot.backlog.items, featureId);
    const now = nowIso();

    if (feature.flow_mode === 'direto' && (stage === 'proposta' || stage === 'planejamento')) {
      feature.gates[stage].status = 'nao_exigida';
      feature.gates[stage].approved_at = now;
      feature.gates[stage].approved_by = options?.by || '';
      feature.gates[stage].note = options?.note || 'Etapa nao exigida no fluxo direto.';
    } else {
      feature.gates[stage].status = 'aprovada';
      feature.gates[stage].approved_at = now;
      feature.gates[stage].approved_by = options?.by || '';
      feature.gates[stage].note = options?.note || '';
    }

    if (stage === 'proposta') feature.current_stage = 'planejamento';
    if (stage === 'planejamento') feature.current_stage = 'tarefas';
    if (stage === 'tarefas') feature.current_stage = 'execucao';
    feature.last_sync_at = now;

    await saveBacklogState(paths, snapshot.backlog);
    await persistAndRender(paths, config, options?.render);

    return {
      feature_id: feature.id,
      stage,
      status: feature.gates[stage].status,
      approved_at: feature.gates[stage].approved_at || '',
      approved_by: feature.gates[stage].approved_by || '',
      current_stage: feature.current_stage,
    };
  }
}

function computeReadyFeatures(items: BacklogItem[]): {
  ready: BacklogItem[];
  blocked: BacklogItem[];
  conflicts: BacklogItem[];
} {
  const byId = new Map(items.map((item) => [item.id, item]));
  const runnable = items.filter((item) => {
    if (item.status === 'DONE' || item.status === 'ARCHIVED') return false;
    if (item.status === 'BLOCKED') return false;
    const unresolvedDeps = item.blocked_by.filter((depId) => {
      const dep = byId.get(depId);
      return !dep || dep.status !== 'DONE';
    });
    return unresolvedDeps.length === 0;
  });

  const lockOwners = new Map<string, string[]>();

  for (const item of runnable) {
    for (const lock of item.lock_domains) {
      const owners = lockOwners.get(lock) || [];
      owners.push(item.id);
      lockOwners.set(lock, owners);
    }
  }

  const conflictIds = new Set<string>();
  for (const owners of lockOwners.values()) {
    if (owners.length > 1) {
      for (const owner of owners) conflictIds.add(owner);
    }
  }

  const ready: BacklogItem[] = [];
  const blocked: BacklogItem[] = [];
  const conflicts: BacklogItem[] = [];

  for (const item of runnable) {
    if (!(item.status === 'READY' || item.status === 'SYNC_REQUIRED' || item.status === 'VERIFY_FAILED')) {
      continue;
    }
    if (conflictIds.has(item.id)) {
      conflicts.push(item);
      continue;
    }
    ready.push(item);
  }

  for (const item of items) {
    if (item.status === 'DONE' || item.status === 'ARCHIVED') continue;
    const unresolvedDeps = item.blocked_by.filter((depId) => {
      const dep = byId.get(depId);
      return !dep || dep.status !== 'DONE';
    });

    if (unresolvedDeps.length > 0 || item.status === 'BLOCKED') {
      blocked.push(item);
    }
  }

  return { ready, blocked, conflicts };
}

type NextRankMode = 'impact' | 'criticality' | 'fifo';

function extractFeatureNumber(featureId: string): number {
  const value = Number(featureId.split('-')[1]);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function buildDependentsMap(items: BacklogItem[]): Map<string, string[]> {
  const dependents = new Map<string, string[]>();
  for (const item of items) {
    for (const dep of item.blocked_by) {
      const list = dependents.get(dep) || [];
      list.push(item.id);
      dependents.set(dep, list);
    }
  }
  return dependents;
}

function countIndirectDependents(
  featureId: string,
  dependentsMap: Map<string, string[]>
): { direct: number; indirect: number } {
  const directSet = new Set(dependentsMap.get(featureId) || []);
  const visited = new Set<string>([featureId]);
  const queue = [...directSet];
  for (const id of queue) visited.add(id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const next = dependentsMap.get(current) || [];
    for (const candidate of next) {
      if (visited.has(candidate)) continue;
      visited.add(candidate);
      queue.push(candidate);
    }
  }

  return {
    direct: directSet.size,
    indirect: Math.max(0, visited.size - 1 - directSet.size),
  };
}

function lockCriticality(lockDomains: string[]): number {
  if (lockDomains.length === 0) return 0;
  const weights: Record<string, number> = {
    'auth-rules': 3,
    payment: 3,
    'schema-change': 3,
  };
  let total = 0;
  for (const lock of lockDomains) {
    total += weights[lock] ?? 1;
  }
  return total;
}

function lockConflictRisk(item: BacklogItem, items: BacklogItem[]): number {
  if (item.lock_domains.length === 0) return 0;
  let risk = 0;
  for (const other of items) {
    if (other.id === item.id) continue;
    if (other.status !== 'IN_PROGRESS') continue;
    if (intersects(item.lock_domains, other.lock_domains)) {
      risk++;
    }
  }
  return risk;
}

function scoreReadyItem(
  item: BacklogItem,
  items: BacklogItem[],
  dependentsMap: Map<string, string[]>,
  rank: NextRankMode
): { score: number; reasons: string[] } {
  const { direct, indirect } = countIndirectDependents(item.id, dependentsMap);
  const criticality = lockCriticality(item.lock_domains);
  const conflictRisk = lockConflictRisk(item, items);

  if (rank === 'fifo') {
    const score = 1_000_000 - extractFeatureNumber(item.id);
    return {
      score,
      reasons: ['ordem FIFO por numero da feature'],
    };
  }

  if (rank === 'criticality') {
    const score = criticality * 5 + direct * 2 + indirect - conflictRisk;
    return {
      score,
      reasons: [
        `criticidade_lock=${criticality}`,
        `dependentes_diretos=${direct}`,
        `dependentes_indiretos=${indirect}`,
        `risco_conflito=${conflictRisk}`,
      ],
    };
  }

  const score = direct * 5 + indirect * 3 + criticality * 2 - conflictRisk;
  return {
    score,
    reasons: [
      `dependentes_diretos=${direct}`,
      `dependentes_indiretos=${indirect}`,
      `criticidade_lock=${criticality}`,
      `risco_conflito=${conflictRisk}`,
    ],
  };
}

export class SddNextCommand {
  async execute(
    projectRoot: string,
    options?: { rank?: NextRankMode; limit?: number }
  ): Promise<{
    rank: NextRankMode;
    ready: Array<{ id: string; title: string; recommended_skills: string[]; score: number; reasons: string[] }>;
    blocked: Array<{ id: string; title: string; blocked_by: string[] }>;
    conflicts: Array<{ id: string; title: string; lock_domains: string[] }>;
  }> {
    const { config, paths } = await getRuntime(projectRoot);
    const snapshot = await loadStateSnapshot(paths, config);
    const { ready, blocked, conflicts } = computeReadyFeatures(snapshot.backlog.items);
    const rank = options?.rank || 'impact';
    const limit = options?.limit && options.limit > 0 ? Math.floor(options.limit) : 10;
    const dependentsMap = buildDependentsMap(snapshot.backlog.items);

    const rankedReady = ready
      .map((item) => {
        const scored = scoreReadyItem(item, snapshot.backlog.items, dependentsMap, rank);
        return {
          id: item.id,
          title: item.title,
          recommended_skills: item.recommended_skills.slice(0, 3),
          score: scored.score,
          reasons: scored.reasons,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return extractFeatureNumber(a.id) - extractFeatureNumber(b.id);
      })
      .slice(0, limit);

    return {
      rank,
      ready: rankedReady,
      blocked: blocked.map((item) => ({
        id: item.id,
        title: item.title,
        blocked_by: item.blocked_by,
      })),
      conflicts: conflicts.map((item) => ({
        id: item.id,
        title: item.title,
        lock_domains: item.lock_domains,
      })),
    };
  }
}

function buildCuratedSkillContent(entry: SkillCatalogEntry): string {
  if (BUILT_IN_SDD_SKILLS[entry.id]) {
    return BUILT_IN_SDD_SKILLS[entry.id];
  }
  const domainLine = entry.domains.length > 0 ? entry.domains.join(', ') : 'geral';
  const phaseLine = entry.phases.length > 0 ? entry.phases.join(', ') : 'all';
  return `---
name: ${entry.id}
description: ${entry.description || entry.title}
---

# ${entry.title}

## Contexto
- Dominios: ${domainLine}
- Fases: ${phaseLine}

## Instrucoes
${entry.description || 'Aplicar esta skill como apoio especializado durante o planejamento e execucao.'}
`;
}

async function resolveSkillFileRef(paths: SddPaths, skillId: string): Promise<string> {
  const candidates = [
    path.join(paths.skillsCuratedDir, skillId, 'SKILL.md'),
    path.join(paths.skillsCuratedDir, `sdd-curated-${skillId}`, 'SKILL.md'),
    path.join(paths.skillsDir, 'curated', skillId, 'SKILL.md'),
    path.join(paths.skillsDir, 'curated', `sdd-curated-${skillId}`, 'SKILL.md'),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return relProjectPath(paths, candidate);
    }
  }
  return relProjectPath(paths, path.join(paths.skillsCuratedDir, skillId, 'SKILL.md'));
}

function buildSkillInvocationPrompt(input: {
  objective?: string;
  ref?: string;
  skills: Array<{ id: string; path: string; reason: string }>;
}): string {
  const headerObjective = input.objective?.trim()
    ? `Objetivo: ${input.objective.trim()}`
    : 'Objetivo: executar a tarefa usando as skills selecionadas.';
  const refLine = input.ref ? `Contexto de referencia: ${input.ref}` : '';
  const skillsLines = input.skills
    .map((skill, index) => `${index + 1}. ${skill.id} (${skill.path})${skill.reason ? ` - ${skill.reason}` : ''}`)
    .join('\n');

  return `Use as skills abaixo nesta ordem e execute a tarefa com rastreabilidade:

${headerObjective}
${refLine}

Skills obrigatorias:
${skillsLines}

Regras:
1. Cite as skills que esta aplicando no inicio da resposta.
2. Siga a ordem definida acima.
3. Se faltar contexto, consulte primeiro o estado canônico em .sdd/state/*.yaml.
4. Finalize com proximos comandos OpenSDD recomendados.`;
}

export class SddSkillsInvokeCommand {
  async execute(
    projectRoot: string,
    options?: {
      ids?: string[];
      phase?: string;
      domains?: string[];
      bundles?: string[];
      max?: number;
      objective?: string;
      ref?: string;
    }
  ): Promise<{
    selected_skills: Array<{ id: string; title: string; bundles: string[]; path: string; reason: string }>;
    prompt: string;
  }> {
    const { paths } = await getRuntime(projectRoot);
    const catalog = await loadSkillCatalogState(paths);

    const explicitIds = (options?.ids || []).map((id) => id.trim()).filter(Boolean);
    const selectedEntries: Array<{ skill: SkillCatalogEntry; reason: string }> = [];

    if (explicitIds.length > 0) {
      const byId = new Map(catalog.skills.map((skill) => [skill.id, skill]));
      for (const id of explicitIds) {
        const skill = byId.get(id);
        if (!skill) {
          throw new Error(`Skill nao encontrada no catalogo: ${id}`);
        }
        selectedEntries.push({ skill, reason: 'selecionada explicitamente' });
      }
    } else {
      const ranked = suggestSkills(catalog, {
        phase: options?.phase,
        domains: options?.domains,
        bundles: options?.bundles,
        max: options?.max ?? 5,
      });
      selectedEntries.push(
        ...ranked.map((entry) => ({
          skill: entry.skill,
          reason: entry.reasons.join('; ') || 'sugerida por contexto',
        }))
      );
    }

    if (selectedEntries.length === 0) {
      throw new Error('Nenhuma skill selecionada. Informe --ids ou ajuste filtros de sugestao.');
    }

    const selectedSkills = [];
    for (const entry of selectedEntries) {
      selectedSkills.push({
        id: entry.skill.id,
        title: entry.skill.title,
        bundles: entry.skill.bundle_ids,
        path: await resolveSkillFileRef(paths, entry.skill.id),
        reason: entry.reason,
      });
    }

    return {
      selected_skills: selectedSkills,
      prompt: buildSkillInvocationPrompt({
        objective: options?.objective,
        ref: options?.ref,
        skills: selectedSkills.map((skill) => ({
          id: skill.id,
          path: skill.path,
          reason: skill.reason,
        })),
      }),
    };
  }
}

export class SddSkillsSyncCommand {
  async execute(
    projectRoot: string,
    options?: { bundles?: string[]; all?: boolean; tools?: string[] }
  ): Promise<{ synced: number; local_synced: number; tools: string[] }> {
    const { paths } = await getRuntime(projectRoot);
    const catalog = await loadSkillCatalogState(paths);

    const bundleFilter = new Set((options?.bundles || []).map((bundle) => bundle.trim()).filter(Boolean));
    const selected = catalog.skills.filter((entry) => {
      if (options?.all || bundleFilter.size === 0) return true;
      return entry.bundle_ids.some((bundle) => bundleFilter.has(bundle));
    });

    await fs.mkdir(paths.skillsCuratedDir, { recursive: true });
    for (const entry of selected) {
      const localDir = path.join(paths.skillsCuratedDir, `sdd-curated-${entry.id}`);
      await fs.mkdir(localDir, { recursive: true });
      await fs.writeFile(path.join(localDir, 'SKILL.md'), buildCuratedSkillContent(entry), 'utf-8');
    }

    if (selected.length === 0) {
      return { synced: 0, local_synced: 0, tools: [] };
    }

    const targetTools = (options?.tools && options.tools.length > 0
      ? AI_TOOLS.filter((tool) => options.tools?.includes(tool.value))
      : AI_TOOLS
    ).filter((tool) => !!tool.skillsDir);

    const syncedTools: string[] = [];
    for (const tool of targetTools) {
      const skillsRoot = path.join(projectRoot, tool.skillsDir!, 'skills');
      const toolExists = await fs
        .access(path.join(projectRoot, tool.skillsDir!))
        .then(() => true)
        .catch(() => false);
      if (!toolExists) continue;

      await fs.mkdir(skillsRoot, { recursive: true });
      for (const entry of selected) {
        const dir = path.join(skillsRoot, `sdd-curated-${entry.id}`);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'SKILL.md'), buildCuratedSkillContent(entry), 'utf-8');
      }
      syncedTools.push(tool.value);
    }

    return { synced: selected.length, local_synced: selected.length, tools: syncedTools };
  }
}

export class SddFrontendImpactCommand {
  async execute(
    projectRoot: string,
    featureId: string,
    options: {
      status: 'unknown' | 'none' | 'required';
      reason?: string;
      routes?: string[];
      surfaces?: string[];
      render?: boolean;
    }
  ) {
    const { config, paths } = await getRuntime(projectRoot);
    if (!config.frontend.enabled) {
      throw new Error(`Modulo de frontend desativado. Execute "${CLI_NAME} sdd init --frontend".`);
    }

    const snapshot = await loadStateSnapshot(paths, config);
    const feature = resolveFeat(snapshot.backlog.items, featureId);
    const status = options.status;
    const reason = (options.reason || '').trim();
    if (status === 'none' && reason.length < 20) {
      throw new Error('Para frontend_impact=none, informe --reason com no minimo 20 caracteres.');
    }

    const routeTokens = (options.routes || [])
      .map((route) => route.trim())
      .filter(Boolean)
      .map((route) => (route.startsWith('/') ? route : `/${route}`))
      .map((route) => `route:${route}`);
    const extraSurfaces = (options.surfaces || []).map((surface) => surface.trim()).filter(Boolean);
    feature.frontend_surface_tokens = Array.from(
      new Set([...(feature.frontend_surface_tokens || []), ...routeTokens, ...extraSurfaces])
    );
    feature.frontend_impact_status = status;
    feature.frontend_impact_reason = reason;
    feature.frontend_impact_declared_at = nowIso();
    feature.last_sync_at = feature.frontend_impact_declared_at;

    await saveBacklogState(paths, snapshot.backlog);
    await persistAndRender(paths, config, options.render);

    return {
      feature_id: feature.id,
      frontend_impact_status: feature.frontend_impact_status,
      frontend_impact_reason: feature.frontend_impact_reason || '',
      frontend_impact_declared_at: feature.frontend_impact_declared_at || '',
      frontend_surface_tokens: feature.frontend_surface_tokens,
    };
  }
}

export class SddFrontendGapCommand {
  async add(
    projectRoot: string,
    title: string,
    options?: { originFeature?: string; routes?: string[]; menu?: string[]; render?: boolean }
  ) {
    if (!title.trim()) {
      throw new Error('Titulo do gap vazio.');
    }

    const { config, paths } = await getRuntime(projectRoot);
    if (!config.frontend.enabled) {
      throw new Error(`Modulo de frontend desativado. Execute "${CLI_NAME} sdd init --frontend".`);
    }

    const snapshot = await loadStateSnapshot(paths, config);
    const id = await allocateEntityId(paths, 'FGAP');
    const now = nowIso();
    snapshot.frontendGaps!.items.push({
      id,
      title: title.trim(),
      status: 'OPEN',
      origin_kind: 'manual',
      detection_sources: ['manual'],
      origin_feature: options?.originFeature || '',
      backend_refs: [],
      frontend_scope: '',
      route_targets: options?.routes || [],
      menu_targets: options?.menu || [],
      suggested_files: [],
      implemented_files: [],
      resolved_by_feature: '',
      related_route_ids: [],
      notes: '',
      created_at: now,
      updated_at: now,
    });

    for (const routePath of options?.routes || []) {
      const routeId = `route-${slugify(routePath) || 'root'}`;
      const existing = snapshot.frontendMap!.routes.find((route) => route.id === routeId);
      if (existing) {
        existing.ui_status = existing.ui_status === 'OK' ? 'PARTIAL' : existing.ui_status;
        existing.source_gap_ids = Array.from(new Set([...existing.source_gap_ids, id]));
      } else {
        snapshot.frontendMap!.routes.push({
          id: routeId,
          path: routePath,
          parent_id: '',
          label: '',
          nav_surface: '',
          ui_status: 'GAP',
          source_gap_ids: [id],
          implemented_files: [],
          notes: '',
        });
      }
    }

    await saveFrontendGapsState(paths, snapshot.frontendGaps!);
    await saveFrontendMapState(paths, snapshot.frontendMap!);
    await persistAndRender(paths, config, options?.render);

    return { id };
  }

  async resolve(
    projectRoot: string,
    gapId: string,
    options?: { feature?: string; files?: string[]; routes?: string[]; render?: boolean }
  ) {
    const { config, paths } = await getRuntime(projectRoot);
    if (!config.frontend.enabled) {
      throw new Error(`Modulo de frontend desativado. Execute "${CLI_NAME} sdd init --frontend".`);
    }

    const snapshot = await loadStateSnapshot(paths, config);
    const gap = snapshot.frontendGaps!.items.find((item) => item.id === gapId);
    if (!gap) {
      throw new Error(`Gap ${gapId} nao encontrado.`);
    }

    const now = nowIso();
    gap.status = 'DONE';
    gap.resolved_by_feature = options?.feature || '';
    gap.implemented_files = options?.files || [];
    gap.updated_at = now;

    const routeTargets = new Set([...(gap.route_targets || []), ...(options?.routes || [])]);
    for (const routePath of routeTargets) {
      const routeId = `route-${slugify(routePath) || 'root'}`;
      const route = snapshot.frontendMap!.routes.find((entry) => entry.id === routeId);
      if (!route) {
        snapshot.frontendMap!.routes.push({
          id: routeId,
          path: routePath,
          parent_id: '',
          label: '',
          nav_surface: '',
          ui_status: 'OK',
          source_gap_ids: [gap.id],
          implemented_files: options?.files || [],
          notes: '',
        });
        continue;
      }

      route.ui_status = 'OK';
      route.implemented_files = Array.from(
        new Set([...(route.implemented_files || []), ...(options?.files || [])])
      );
      route.source_gap_ids = Array.from(new Set([...(route.source_gap_ids || []), gap.id]));
    }

    await saveFrontendGapsState(paths, snapshot.frontendGaps!);
    await saveFrontendMapState(paths, snapshot.frontendMap!);
    await persistAndRender(paths, config, options?.render);
    return { id: gap.id, status: gap.status };
  }
}
