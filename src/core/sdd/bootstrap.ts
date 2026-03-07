import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { SddPaths, SddRuntimeConfig } from './state.js';
import {
  loadStateSnapshot,
  saveArchitectureState,
  saveIntegrationContractsState,
  saveRepoMapState,
  saveServiceCatalogState,
  saveTechStackState,
} from './state.js';

export type BootstrapMode = 'empty-only' | 'merge' | 'replace';

export interface BootstrapContextOptions {
  mode?: BootstrapMode;
  deep?: boolean;
}

export interface BootstrapContextReport {
  mode: BootstrapMode;
  deep: boolean;
  detected: {
    package_name: string;
    tech_stack_count: number;
    repo_map_count: number;
    architecture_nodes_count: number;
    service_catalog_count: number;
    integration_contracts_count: number;
  };
  updated: {
    tech_stack: boolean;
    repo_map: boolean;
    architecture: boolean;
    service_catalog: boolean;
    integration_contracts: boolean;
  };
  notes: string[];
}

type RepoMapRecord = {
  path: string;
  kind: string;
  service_ref: string;
  notes: string;
};

type TechStackRecord = {
  layer: string;
  technology: string;
  version: string;
  purpose: string;
  constraints: string[];
};

type ServiceRecord = {
  id: string;
  name: string;
  responsibility: string;
  owner_refs: string[];
  repo_paths: string[];
  contracts: string[];
  external_dependencies: string[];
};

type ArchitectureNode = {
  id: string;
  name: string;
  kind: string;
  description: string;
  repo_paths: string[];
  depends_on: string[];
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

async function readTextIfExists(filePath: string): Promise<string> {
  if (!(await fileExists(filePath))) return '';
  return fs.readFile(filePath, 'utf-8');
}

function buildDepsMap(packageJson: Record<string, unknown> | null): Record<string, string> {
  return {
    ...(typeof packageJson?.dependencies === 'object' && packageJson.dependencies
      ? (packageJson.dependencies as Record<string, string>)
      : {}),
    ...(typeof packageJson?.devDependencies === 'object' && packageJson.devDependencies
      ? (packageJson.devDependencies as Record<string, string>)
      : {}),
  };
}

function addTechStackEntry(
  entries: TechStackRecord[],
  layer: string,
  technology: string,
  version: string | undefined,
  purpose: string,
  constraints: string[] = []
): void {
  if (entries.some((item) => item.layer === layer && item.technology === technology)) return;
  entries.push({
    layer,
    technology,
    version: version || '',
    purpose,
    constraints,
  });
}

function inferTechStack(
  packageJson: Record<string, unknown> | null,
  options: { hasTsconfig: boolean }
): TechStackRecord[] {
  const deps = buildDepsMap(packageJson);
  const entries: TechStackRecord[] = [];

  addTechStackEntry(
    entries,
    'runtime',
    'nodejs',
    typeof packageJson?.engines === 'object' && packageJson.engines
      ? ((packageJson.engines as Record<string, string>).node ?? '')
      : '',
    'Runtime principal do projeto'
  );

  if (options.hasTsconfig || deps.typescript) {
    addTechStackEntry(entries, 'language', 'typescript', deps.typescript, 'Linguagem principal');
  }
  if (deps['@nestjs/core'] || deps['@nestjs/common']) {
    addTechStackEntry(
      entries,
      'backend',
      'nestjs',
      deps['@nestjs/core'] || deps['@nestjs/common'],
      'Framework backend'
    );
  }
  if (deps.rails) addTechStackEntry(entries, 'backend', 'rails', deps.rails, 'Framework backend');
  if (deps.express) addTechStackEntry(entries, 'backend', 'express', deps.express, 'Servidor HTTP');
  if (deps.fastify) addTechStackEntry(entries, 'backend', 'fastify', deps.fastify, 'Servidor HTTP');
  if (deps.react) addTechStackEntry(entries, 'frontend', 'react', deps.react, 'Interface');
  if (deps.next) addTechStackEntry(entries, 'frontend', 'nextjs', deps.next, 'Framework frontend/fullstack');
  if (deps.vue) addTechStackEntry(entries, 'frontend', 'vue', deps.vue, 'Interface');
  if (deps['@prisma/client'] || deps.prisma) {
    addTechStackEntry(
      entries,
      'database',
      'prisma',
      deps['@prisma/client'] || deps.prisma,
      'ORM e modelagem'
    );
  }
  if (deps.typeorm) addTechStackEntry(entries, 'database', 'typeorm', deps.typeorm, 'ORM');
  if (deps.mongoose) addTechStackEntry(entries, 'database', 'mongoose', deps.mongoose, 'ODM');
  if (deps.redis || deps['ioredis']) {
    addTechStackEntry(entries, 'infra', 'redis', deps.redis || deps['ioredis'], 'Cache/fila');
  }
  if (deps.kafkajs) addTechStackEntry(entries, 'infra', 'kafka', deps.kafkajs, 'Mensageria');
  if (deps.amqplib) addTechStackEntry(entries, 'infra', 'rabbitmq', deps.amqplib, 'Mensageria');
  if (deps['@temporalio/client'] || deps['@temporalio/worker']) {
    addTechStackEntry(
      entries,
      'infra',
      'temporal',
      deps['@temporalio/client'] || deps['@temporalio/worker'],
      'Orquestracao de workflows'
    );
  }
  if (deps.vitest) addTechStackEntry(entries, 'test', 'vitest', deps.vitest, 'Testes');
  if (deps.jest || deps['@jest/core']) {
    addTechStackEntry(entries, 'test', 'jest', deps.jest || deps['@jest/core'], 'Testes');
  }

  return entries;
}

function classifyRootEntry(name: string): { kind: string; notes: string } {
  const map: Record<string, { kind: string; notes: string }> = {
    src: { kind: 'source', notes: 'Codigo-fonte principal' },
    apps: { kind: 'workspace', notes: 'Aplicacoes/servicos' },
    services: { kind: 'workspace', notes: 'Servicos' },
    packages: { kind: 'workspace', notes: 'Pacotes compartilhados' },
    libs: { kind: 'workspace', notes: 'Bibliotecas internas' },
    lib: { kind: 'workspace', notes: 'Bibliotecas internas' },
    test: { kind: 'test', notes: 'Testes automatizados' },
    docs: { kind: 'docs', notes: 'Documentacao' },
    config: { kind: 'config', notes: 'Configuracoes' },
    openspec: { kind: 'openspec', notes: 'Runtime do OpenSpec' },
    package_json: { kind: 'manifest', notes: 'Manifesto principal' },
  };
  return map[name] || { kind: 'directory', notes: 'Diretorio detectado no projeto' };
}

async function inferRepoMap(projectRoot: string, deep: boolean): Promise<RepoMapRecord[]> {
  const entries: RepoMapRecord[] = [];
  const rootCandidates = [
    'src',
    'apps',
    'services',
    'packages',
    'libs',
    'lib',
    'test',
    'docs',
    'config',
    'openspec',
  ];

  for (const candidate of rootCandidates) {
    if (await fileExists(path.join(projectRoot, candidate))) {
      const { kind, notes } = classifyRootEntry(candidate);
      entries.push({ path: candidate, kind, service_ref: '', notes });
    }
  }
  if (await fileExists(path.join(projectRoot, 'package.json'))) {
    const { kind, notes } = classifyRootEntry('package_json');
    entries.push({ path: 'package.json', kind, service_ref: '', notes });
  }

  if (!deep) return entries;

  const deepContainers = ['apps', 'services', 'packages'];
  for (const container of deepContainers) {
    const base = path.join(projectRoot, container);
    if (!(await fileExists(base))) continue;
    const dirEntries = await fs.readdir(base, { withFileTypes: true }).catch(() => []);
    for (const entry of dirEntries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      const relPath = `${container}/${entry.name}`;
      entries.push({
        path: relPath,
        kind: 'service-module',
        service_ref: slugify(entry.name),
        notes: 'Modulo detectado durante inspecao profunda',
      });
    }
  }

  return entries;
}

function inferServiceCatalog(
  packageName: string,
  serviceId: string,
  repoMap: RepoMapRecord[],
  techStack: TechStackRecord[]
): ServiceRecord[] {
  const services: ServiceRecord[] = [];
  const externalDeps = techStack
    .filter((item) => item.layer === 'infra' || item.layer === 'database')
    .map((item) => item.technology);

  services.push({
    id: serviceId,
    name: packageName,
    responsibility: 'Servico inicial detectado no bootstrap de contexto',
    owner_refs: [],
    repo_paths: repoMap
      .filter((item) => item.kind === 'source' || item.kind === 'workspace')
      .map((item) => item.path),
    contracts: [],
    external_dependencies: externalDeps,
  });

  const moduleServices = repoMap.filter((item) => item.kind === 'service-module');
  for (const module of moduleServices) {
    const id = module.service_ref || slugify(module.path.split('/').pop() || module.path);
    if (!id || services.some((service) => service.id === id)) continue;
    services.push({
      id,
      name: module.path,
      responsibility: 'Modulo/servico detectado em inspeção de repositório existente',
      owner_refs: [],
      repo_paths: [module.path],
      contracts: [],
      external_dependencies: externalDeps,
    });
  }

  return services;
}

function inferArchitectureNodes(services: ServiceRecord[], repoMap: RepoMapRecord[]): ArchitectureNode[] {
  return services.map((service) => ({
    id: `arch-${service.id}`,
    name: service.name,
    kind: 'service',
    description: service.responsibility || 'Servico detectado automaticamente',
    repo_paths:
      service.repo_paths.length > 0
        ? service.repo_paths
        : repoMap.filter((item) => item.service_ref === service.id).map((item) => item.path),
    depends_on: [],
  }));
}

async function inferIntegrationContracts(projectRoot: string, packageJson: Record<string, unknown> | null): Promise<string[]> {
  const deps = buildDepsMap(packageJson);
  const contracts = new Set<string>();

  const addIfPresent = (tokens: string[], contract: string) => {
    if (tokens.some((token) => deps[token])) contracts.add(contract);
  };

  addIfPresent(['@prisma/client', 'prisma', 'typeorm', 'sequelize', 'pg'], 'db:sql');
  addIfPresent(['mongoose', 'mongodb'], 'db:mongodb');
  addIfPresent(['redis', 'ioredis'], 'infra:redis');
  addIfPresent(['kafkajs'], 'infra:kafka');
  addIfPresent(['amqplib'], 'infra:rabbitmq');
  addIfPresent(['@temporalio/client', '@temporalio/worker'], 'infra:temporal');
  addIfPresent(['stripe'], 'external:stripe');
  addIfPresent(['@aws-sdk/client-s3', 'aws-sdk'], 'external:s3');
  addIfPresent(['twilio'], 'external:twilio');
  addIfPresent(['whatsapp-web.js'], 'external:whatsapp');

  const compose = await readTextIfExists(path.join(projectRoot, 'docker-compose.yml'));
  if (compose.includes('redis')) contracts.add('infra:redis');
  if (compose.includes('postgres')) contracts.add('db:sql');
  if (compose.includes('kafka')) contracts.add('infra:kafka');
  if (compose.includes('rabbitmq')) contracts.add('infra:rabbitmq');

  if (typeof packageJson?.bin === 'object' && packageJson.bin) {
    contracts.add('interface:cli');
  }
  if (typeof packageJson?.publishConfig === 'object' && packageJson.publishConfig) {
    contracts.add('distribution:npm');
  }

  return Array.from(contracts).sort();
}

function mergeByKey<T>(current: T[], inferred: T[], keyOf: (item: T) => string): T[] {
  const byKey = new Map<string, T>(current.map((item) => [keyOf(item), item]));
  for (const item of inferred) {
    const key = keyOf(item);
    if (!byKey.has(key)) byKey.set(key, item);
  }
  return Array.from(byKey.values());
}

function resolveAppliedState<T>(
  current: T[],
  inferred: T[],
  mode: BootstrapMode
): { next: T[]; changed: boolean } {
  if (mode === 'empty-only') {
    if (current.length > 0) return { next: current, changed: false };
    return { next: inferred, changed: JSON.stringify(current) !== JSON.stringify(inferred) };
  }
  if (mode === 'replace') {
    return { next: inferred, changed: JSON.stringify(current) !== JSON.stringify(inferred) };
  }
  return { next: current, changed: false };
}

export async function bootstrapInitialContext(
  projectRoot: string,
  paths: SddPaths,
  config: SddRuntimeConfig,
  options: BootstrapContextOptions = {}
): Promise<BootstrapContextReport> {
  const mode = options.mode || 'empty-only';
  const deep = options.deep ?? false;
  const notes: string[] = [];
  const snapshot = await loadStateSnapshot(paths, config);
  const packageJson = await readJsonFile(path.join(projectRoot, 'package.json'));
  const hasTsconfig = await fileExists(path.join(projectRoot, 'tsconfig.json'));
  const packageName =
    typeof packageJson?.name === 'string' && packageJson.name.trim().length > 0
      ? packageJson.name.trim()
      : path.basename(projectRoot);
  const serviceId = slugify(packageName) || 'app';

  const inferredTechStack = inferTechStack(packageJson, { hasTsconfig });
  const inferredRepoMap = await inferRepoMap(projectRoot, deep);
  const inferredServiceCatalog = inferServiceCatalog(
    packageName,
    serviceId,
    inferredRepoMap,
    inferredTechStack
  );
  const inferredArchitecture = inferArchitectureNodes(inferredServiceCatalog, inferredRepoMap);
  const inferredContracts = await inferIntegrationContracts(projectRoot, packageJson);

  const updated = {
    tech_stack: false,
    repo_map: false,
    architecture: false,
    service_catalog: false,
    integration_contracts: false,
  };

  const techApplied =
    mode === 'merge'
      ? mergeByKey(snapshot.techStack.items, inferredTechStack, (item) => `${item.layer}:${item.technology}`)
      : resolveAppliedState(snapshot.techStack.items, inferredTechStack, mode).next;
  if (JSON.stringify(snapshot.techStack.items) !== JSON.stringify(techApplied)) {
    snapshot.techStack.items = techApplied;
    await saveTechStackState(paths, snapshot.techStack);
    updated.tech_stack = true;
  }

  const repoApplied =
    mode === 'merge'
      ? mergeByKey(snapshot.repoMap.items, inferredRepoMap, (item) => item.path)
      : resolveAppliedState(snapshot.repoMap.items, inferredRepoMap, mode).next;
  if (JSON.stringify(snapshot.repoMap.items) !== JSON.stringify(repoApplied)) {
    snapshot.repoMap.items = repoApplied;
    await saveRepoMapState(paths, snapshot.repoMap);
    updated.repo_map = true;
  }

  const serviceApplied =
    mode === 'merge'
      ? mergeByKey(snapshot.serviceCatalog.services, inferredServiceCatalog, (item) => item.id)
      : resolveAppliedState(snapshot.serviceCatalog.services, inferredServiceCatalog, mode).next;
  if (JSON.stringify(snapshot.serviceCatalog.services) !== JSON.stringify(serviceApplied)) {
    snapshot.serviceCatalog.services = serviceApplied;
    await saveServiceCatalogState(paths, snapshot.serviceCatalog);
    updated.service_catalog = true;
  }

  const architectureApplied =
    mode === 'merge'
      ? mergeByKey(snapshot.architecture.nodes, inferredArchitecture, (item) => item.id)
      : resolveAppliedState(snapshot.architecture.nodes, inferredArchitecture, mode).next;
  if (JSON.stringify(snapshot.architecture.nodes) !== JSON.stringify(architectureApplied)) {
    snapshot.architecture.nodes = architectureApplied;
    await saveArchitectureState(paths, snapshot.architecture);
    updated.architecture = true;
  }

  const contractsApplied =
    mode === 'merge'
      ? Array.from(new Set([...snapshot.integrationContracts.contracts, ...inferredContracts])).sort()
      : resolveAppliedState(snapshot.integrationContracts.contracts, inferredContracts, mode).next;
  if (JSON.stringify(snapshot.integrationContracts.contracts) !== JSON.stringify(contractsApplied)) {
    snapshot.integrationContracts.contracts = contractsApplied;
    await saveIntegrationContractsState(paths, snapshot.integrationContracts);
    updated.integration_contracts = true;
  }

  if (!packageJson) {
    notes.push('package.json nao encontrado; parte da inferencia foi limitada.');
  }
  if (!deep) {
    notes.push('Modo padrao (nao profundo): use sdd init-context para inspeção aprofundada.');
  }

  return {
    mode,
    deep,
    detected: {
      package_name: packageName,
      tech_stack_count: inferredTechStack.length,
      repo_map_count: inferredRepoMap.length,
      architecture_nodes_count: inferredArchitecture.length,
      service_catalog_count: inferredServiceCatalog.length,
      integration_contracts_count: inferredContracts.length,
    },
    updated,
    notes,
  };
}
