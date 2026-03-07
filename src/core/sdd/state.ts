import path from 'node:path';
import { promises as fs } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import {
  ArchitectureStateSchema,
  BacklogStateSchema,
  DiscoveryIndexStateSchema,
  FinalizeQueueStateSchema,
  IntegrationContractsStateSchema,
  FrontendDecisionsStateSchema,
  UnblockEventsStateSchema,
  FrontendGapsStateSchema,
  FrontendMapStateSchema,
  RepoMapStateSchema,
  SkillCatalogStateSchema,
  ServiceCatalogStateSchema,
  TechStackStateSchema,
  TechDebtStateSchema,
  type ArchitectureState,
  type BacklogState,
  type DiscoveryIndexState,
  type FinalizeQueueState,
  type FrontendDecisionsState,
  type FrontendGapsState,
  type FrontendMapState,
  type IntegrationContractsState,
  type RepoMapState,
  type SkillCatalogState,
  type ServiceCatalogState,
  type TechStackState,
  type TechDebtState,
  type UnblockEventsState,
} from './types.js';
import {
  DEFAULT_CURATED_SKILL_CATALOG,
  REPO_CONTEXT_BOOTSTRAP_SKILL_MD,
  buildCuratedBundlesMarkdown,
} from './default-skills.js';

export interface SddRuntimeConfig {
  enabled: boolean;
  memoryDir: string;
  frontend: {
    enabled: boolean;
  };
  views: {
    autoRender: boolean;
  };
}

export interface SddPaths {
  projectRoot: string;
  memoryRoot: string;
  configFile: string;
  coreDir: string;
  discoveryDir: string;
  pendenciasDir: string;
  stateDir: string;
  skillsDir: string;
  templatesDir: string;
  stateFiles: {
    discoveryIndex: string;
    backlog: string;
    techDebt: string;
    finalizeQueue: string;
    skillCatalog: string;
    unblockEvents: string;
    frontendGaps: string;
    frontendMap: string;
    architecture: string;
    serviceCatalog: string;
    techStack: string;
    integrationContracts: string;
    frontendDecisions: string;
    repoMap: string;
  };
}

export interface SddStateSnapshot {
  discoveryIndex: DiscoveryIndexState;
  backlog: BacklogState;
  techDebt: TechDebtState;
  finalizeQueue: FinalizeQueueState;
  skillCatalog: SkillCatalogState;
  unblockEvents: UnblockEventsState;
  frontendGaps?: FrontendGapsState;
  frontendMap?: FrontendMapState;
  architecture: ArchitectureState;
  serviceCatalog: ServiceCatalogState;
  techStack: TechStackState;
  integrationContracts: IntegrationContractsState;
  frontendDecisions?: FrontendDecisionsState;
  repoMap: RepoMapState;
}

const DEFAULT_SDD_CONFIG: SddRuntimeConfig = {
  enabled: true,
  memoryDir: '.sdd',
  frontend: { enabled: false },
  views: { autoRender: true },
};

const DEFAULT_PROJECT_CONFIG = {
  schema: 'spec-driven',
  sdd: DEFAULT_SDD_CONFIG,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeRuntimeConfig(raw: unknown): SddRuntimeConfig {
  if (!isRecord(raw)) {
    return { ...DEFAULT_SDD_CONFIG, frontend: { enabled: false }, views: { autoRender: true } };
  }

  const frontend = isRecord(raw.frontend) ? raw.frontend : {};
  const views = isRecord(raw.views) ? raw.views : {};

  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SDD_CONFIG.enabled,
    memoryDir:
      typeof raw.memoryDir === 'string' && raw.memoryDir.trim().length > 0
        ? raw.memoryDir.trim()
        : DEFAULT_SDD_CONFIG.memoryDir,
    frontend: {
      enabled:
        typeof frontend.enabled === 'boolean'
          ? frontend.enabled
          : DEFAULT_SDD_CONFIG.frontend.enabled,
    },
    views: {
      autoRender:
        typeof views.autoRender === 'boolean'
          ? views.autoRender
          : DEFAULT_SDD_CONFIG.views.autoRender,
    },
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function loadProjectSddConfig(projectRoot: string): Promise<SddRuntimeConfig> {
  const configPathYaml = path.join(projectRoot, 'openspec', 'config.yaml');
  const configPathYml = path.join(projectRoot, 'openspec', 'config.yml');

  const configPath = (await fileExists(configPathYaml))
    ? configPathYaml
    : (await fileExists(configPathYml))
      ? configPathYml
      : null;

  if (!configPath) {
    return { ...DEFAULT_SDD_CONFIG, frontend: { enabled: false }, views: { autoRender: true } };
  }

  const rawContent = await fs.readFile(configPath, 'utf-8');
  const parsed = parseYaml(rawContent);
  const root = isRecord(parsed) ? parsed : {};
  return mergeRuntimeConfig(root.sdd);
}

export async function upsertProjectSddConfig(
  projectRoot: string,
  overrides?: { frontendEnabled?: boolean }
): Promise<SddRuntimeConfig> {
  const openspecDir = path.join(projectRoot, 'openspec');
  await ensureDir(openspecDir);

  const configPathYaml = path.join(openspecDir, 'config.yaml');
  const configPathYml = path.join(openspecDir, 'config.yml');
  const configPath = (await fileExists(configPathYaml))
    ? configPathYaml
    : (await fileExists(configPathYml))
      ? configPathYml
      : configPathYaml;

  let rootConfig: Record<string, unknown> = { ...DEFAULT_PROJECT_CONFIG };

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
  rootConfig.sdd = mergedSdd;

  await fs.writeFile(configPath, stringifyYaml(rootConfig), 'utf-8');
  return mergedSdd;
}

export function resolveSddPaths(projectRoot: string, config: SddRuntimeConfig): SddPaths {
  const memoryRoot = path.resolve(projectRoot, config.memoryDir);
  const stateDir = path.join(memoryRoot, 'state');

  return {
    projectRoot,
    memoryRoot,
    configFile: path.join(memoryRoot, 'config.yaml'),
    coreDir: path.join(memoryRoot, 'core'),
    discoveryDir: path.join(memoryRoot, 'discovery'),
    pendenciasDir: path.join(memoryRoot, 'pendencias'),
    stateDir,
    skillsDir: path.join(memoryRoot, 'skills'),
    templatesDir: path.join(memoryRoot, 'templates'),
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
    },
  };
}

export async function ensureBaseStructure(paths: SddPaths): Promise<void> {
  await Promise.all([
    ensureDir(paths.memoryRoot),
    ensureDir(paths.coreDir),
    ensureDir(paths.discoveryDir),
    ensureDir(paths.pendenciasDir),
    ensureDir(paths.stateDir),
    ensureDir(path.join(paths.memoryRoot, 'active')),
    ensureDir(paths.skillsDir),
    ensureDir(path.join(paths.skillsDir, 'curated')),
    ensureDir(path.join(paths.skillsDir, 'bundles')),
    ensureDir(paths.templatesDir),
    ensureDir(path.join(paths.discoveryDir, '1-insights')),
    ensureDir(path.join(paths.discoveryDir, '2-debates')),
    ensureDir(path.join(paths.discoveryDir, '3-radar')),
    ensureDir(path.join(paths.discoveryDir, '4-discarded')),
    ensureDir(path.join(paths.coreDir, 'dados')),
    ensureDir(path.join(paths.coreDir, 'integracoes')),
    ensureDir(path.join(paths.coreDir, 'adrs')),
  ]);
}

async function writeYamlIfMissing(filePath: string, content: unknown): Promise<void> {
  if (await fileExists(filePath)) {
    return;
  }
  await fs.writeFile(filePath, stringifyYaml(content), 'utf-8');
}

async function writeFileIfMissing(filePath: string, content: string): Promise<void> {
  if (await fileExists(filePath)) {
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

async function ensureCuratedSkillCatalog(filePath: string): Promise<void> {
  if (!(await fileExists(filePath))) {
    await fs.writeFile(filePath, stringifyYaml(DEFAULT_CURATED_SKILL_CATALOG), 'utf-8');
    return;
  }

  const parsed = SkillCatalogStateSchema.safeParse(await readYaml(filePath));
  if (!parsed.success) {
    return;
  }

  if (parsed.data.skills.length === 0 && parsed.data.bundles.length === 0) {
    await fs.writeFile(filePath, stringifyYaml(DEFAULT_CURATED_SKILL_CATALOG), 'utf-8');
  }
}

export async function ensureBaseFiles(paths: SddPaths, config: SddRuntimeConfig): Promise<void> {
  await writeYamlIfMissing(paths.configFile, {
    version: 1,
    generatedBy: 'openspec sdd init',
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

  if (config.frontend.enabled) {
    await writeYamlIfMissing(paths.stateFiles.frontendGaps, { version: 1, items: [] });
    await writeYamlIfMissing(paths.stateFiles.frontendMap, { version: 1, routes: [] });
    await writeYamlIfMissing(paths.stateFiles.frontendDecisions, { version: 1, items: [] });
  }

  await writeFileIfMissing(
    path.join(paths.coreDir, 'arquitetura.md'),
    '# Arquitetura\n\nDocumento arquitetural de alto nivel do projeto.\n'
  );
  await writeFileIfMissing(
    path.join(paths.skillsDir, 'bundles', 'curadoria-pt-br.md'),
    buildCuratedBundlesMarkdown()
  );
  await writeFileIfMissing(
    path.join(paths.skillsDir, 'curated', 'repo-context-bootstrap', 'SKILL.md'),
    REPO_CONTEXT_BOOTSTRAP_SKILL_MD
  );
}

async function readYaml(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseYaml(content);
}

async function writeYaml(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, stringifyYaml(value), 'utf-8');
}

export async function loadStateSnapshot(
  paths: SddPaths,
  config: SddRuntimeConfig
): Promise<SddStateSnapshot> {
  const discoveryIndex = DiscoveryIndexStateSchema.parse(await readYaml(paths.stateFiles.discoveryIndex));
  const backlog = BacklogStateSchema.parse(await readYaml(paths.stateFiles.backlog));
  const techDebt = TechDebtStateSchema.parse(await readYaml(paths.stateFiles.techDebt));
  const finalizeQueue = FinalizeQueueStateSchema.parse(await readYaml(paths.stateFiles.finalizeQueue));
  const skillCatalog = SkillCatalogStateSchema.parse(await readYaml(paths.stateFiles.skillCatalog));
  const unblockEvents = UnblockEventsStateSchema.parse(await readYaml(paths.stateFiles.unblockEvents));
  const architecture = ArchitectureStateSchema.parse(await readYaml(paths.stateFiles.architecture));
  const serviceCatalog = ServiceCatalogStateSchema.parse(await readYaml(paths.stateFiles.serviceCatalog));
  const techStack = TechStackStateSchema.parse(await readYaml(paths.stateFiles.techStack));
  const integrationContracts = IntegrationContractsStateSchema.parse(
    await readYaml(paths.stateFiles.integrationContracts)
  );
  const repoMap = RepoMapStateSchema.parse(await readYaml(paths.stateFiles.repoMap));

  let frontendGaps: FrontendGapsState | undefined;
  let frontendMap: FrontendMapState | undefined;
  let frontendDecisions: FrontendDecisionsState | undefined;
  if (config.frontend.enabled) {
    frontendGaps = FrontendGapsStateSchema.parse(await readYaml(paths.stateFiles.frontendGaps));
    frontendMap = FrontendMapStateSchema.parse(await readYaml(paths.stateFiles.frontendMap));
    frontendDecisions = FrontendDecisionsStateSchema.parse(
      await readYaml(paths.stateFiles.frontendDecisions)
    );
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
  };
}

export async function loadSkillCatalogState(paths: SddPaths): Promise<SkillCatalogState> {
  return SkillCatalogStateSchema.parse(await readYaml(paths.stateFiles.skillCatalog));
}

export type SddCounterType = 'INS' | 'DEB' | 'RAD' | 'FEAT' | 'FGAP' | 'TD';

function formatCounterId(prefix: SddCounterType, value: number): string {
  return `${prefix}-${String(value).padStart(3, '0')}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function saveDiscoveryIndexState(
  paths: SddPaths,
  state: DiscoveryIndexState
): Promise<void> {
  await writeYaml(paths.stateFiles.discoveryIndex, state);
}

export async function saveBacklogState(paths: SddPaths, state: BacklogState): Promise<void> {
  await writeYaml(paths.stateFiles.backlog, state);
}

export async function saveTechDebtState(paths: SddPaths, state: TechDebtState): Promise<void> {
  await writeYaml(paths.stateFiles.techDebt, state);
}

export async function saveFinalizeQueueState(
  paths: SddPaths,
  state: FinalizeQueueState
): Promise<void> {
  await writeYaml(paths.stateFiles.finalizeQueue, state);
}

export async function saveSkillCatalogState(
  paths: SddPaths,
  state: SkillCatalogState
): Promise<void> {
  await writeYaml(paths.stateFiles.skillCatalog, state);
}

export async function saveUnblockEventsState(
  paths: SddPaths,
  state: UnblockEventsState
): Promise<void> {
  await writeYaml(paths.stateFiles.unblockEvents, state);
}

export async function saveFrontendGapsState(
  paths: SddPaths,
  state: FrontendGapsState
): Promise<void> {
  await writeYaml(paths.stateFiles.frontendGaps, state);
}

export async function saveFrontendMapState(paths: SddPaths, state: FrontendMapState): Promise<void> {
  await writeYaml(paths.stateFiles.frontendMap, state);
}

export async function saveArchitectureState(paths: SddPaths, state: ArchitectureState): Promise<void> {
  await writeYaml(paths.stateFiles.architecture, state);
}

export async function saveServiceCatalogState(
  paths: SddPaths,
  state: ServiceCatalogState
): Promise<void> {
  await writeYaml(paths.stateFiles.serviceCatalog, state);
}

export async function saveTechStackState(paths: SddPaths, state: TechStackState): Promise<void> {
  await writeYaml(paths.stateFiles.techStack, state);
}

export async function saveIntegrationContractsState(
  paths: SddPaths,
  state: IntegrationContractsState
): Promise<void> {
  await writeYaml(paths.stateFiles.integrationContracts, state);
}

export async function saveFrontendDecisionsState(
  paths: SddPaths,
  state: FrontendDecisionsState
): Promise<void> {
  await writeYaml(paths.stateFiles.frontendDecisions, state);
}

export async function saveRepoMapState(paths: SddPaths, state: RepoMapState): Promise<void> {
  await writeYaml(paths.stateFiles.repoMap, state);
}

export async function allocateEntityId(paths: SddPaths, type: SddCounterType): Promise<string> {
  const discoveryIndex = DiscoveryIndexStateSchema.parse(await readYaml(paths.stateFiles.discoveryIndex));
  const current = discoveryIndex.counters[type] ?? 0;
  const next = current + 1;
  discoveryIndex.counters[type] = next;
  await saveDiscoveryIndexState(paths, discoveryIndex);
  return formatCounterId(type, next);
}
