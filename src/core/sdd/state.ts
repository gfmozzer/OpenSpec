import path from 'node:path';
import { promises as fs } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import {
  BacklogStateSchema,
  DiscoveryIndexStateSchema,
  FinalizeQueueStateSchema,
  FrontendGapsStateSchema,
  FrontendMapStateSchema,
  SkillCatalogStateSchema,
  TechDebtStateSchema,
  type BacklogState,
  type DiscoveryIndexState,
  type FinalizeQueueState,
  type FrontendGapsState,
  type FrontendMapState,
  type SkillCatalogState,
  type TechDebtState,
} from './types.js';

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
    frontendGaps: string;
    frontendMap: string;
  };
}

export interface SddStateSnapshot {
  discoveryIndex: DiscoveryIndexState;
  backlog: BacklogState;
  techDebt: TechDebtState;
  finalizeQueue: FinalizeQueueState;
  skillCatalog: SkillCatalogState;
  frontendGaps?: FrontendGapsState;
  frontendMap?: FrontendMapState;
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
      frontendGaps: path.join(stateDir, 'frontend-gaps.yaml'),
      frontendMap: path.join(stateDir, 'frontend-map.yaml'),
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
  await fs.writeFile(filePath, content, 'utf-8');
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
  await writeYamlIfMissing(paths.stateFiles.skillCatalog, { version: 1, skills: [], bundles: [] });

  if (config.frontend.enabled) {
    await writeYamlIfMissing(paths.stateFiles.frontendGaps, { version: 1, items: [] });
    await writeYamlIfMissing(paths.stateFiles.frontendMap, { version: 1, routes: [] });
  }

  await writeFileIfMissing(
    path.join(paths.coreDir, 'arquitetura.md'),
    '# Arquitetura\n\nDocumento arquitetural de alto nivel do projeto.\n'
  );
}

async function readYaml(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseYaml(content);
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

  let frontendGaps: FrontendGapsState | undefined;
  let frontendMap: FrontendMapState | undefined;
  if (config.frontend.enabled) {
    frontendGaps = FrontendGapsStateSchema.parse(await readYaml(paths.stateFiles.frontendGaps));
    frontendMap = FrontendMapStateSchema.parse(await readYaml(paths.stateFiles.frontendMap));
  }

  return {
    discoveryIndex,
    backlog,
    techDebt,
    finalizeQueue,
    skillCatalog,
    frontendGaps,
    frontendMap,
  };
}
