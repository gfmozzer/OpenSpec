import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CLI_NAME } from '../branding.js';
import {
  ID_PATTERNS,
  type BacklogItem,
  type DiscoveryRecord,
  type FrontendGapRecord,
  type TechDebtRecord,
} from './types.js';
import { loadProjectSddConfig, loadStateSnapshot, resolveSddPaths } from './state.js';
import { renderViews } from './views.js';
import { syncSddGuideDocs, validateSddGuideDocs } from './docs-sync.js';

export interface SddCheckOptions {
  render?: boolean;
  strict?: boolean;
}

export interface SddCheckReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    discovery: number;
    backlog: number;
    techDebt: number;
    finalizeQueue: number;
    frontendEnabled: boolean;
    frontendGaps: number;
    frontendRoutes: number;
    progress_global: {
      done: number;
      total: number;
      percent: number;
    };
    progress_by_radar: Array<{
      radar_id: string;
      done: number;
      total: number;
      percent: number;
    }>;
    ready_for_parallel: number;
    blocked: number;
    lock_conflicts: number;
    documentation_sync: boolean;
    core_views_stale: boolean;
    missing_architecture_fields: string[];
    frontend_coverage_sync: boolean;
    features_missing_frontend_declaration: string[];
    features_with_frontend_conflict: string[];
    features_missing_fgap_link: string[];
    graph: {
      readyForParallel: number;
      blocked: number;
      lockConflicts: number;
    };
  };
}

function checkUniqueIds<T extends { id: string }>(
  items: T[],
  scope: string,
  errors: string[]
): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`ID duplicado "${item.id}" em ${scope}`);
    }
    seen.add(item.id);
  }
}

const FORBIDDEN_TITLE_PATTERNS = ['debate:', 'insight:', '(preencher', '(placeholder'];

function hasForbiddenTitleToken(title: string): string | null {
  const lowered = title.toLowerCase();
  for (const token of FORBIDDEN_TITLE_PATTERNS) {
    if (lowered.includes(token)) return token;
  }
  return null;
}

function validateDiscoveryRecords(records: DiscoveryRecord[], errors: string[]): void {
  for (const record of records) {
    if (record.type === 'INS' && !ID_PATTERNS.insight.test(record.id)) {
      errors.push(`Registro de discovery ${record.id} e INS, mas nao segue INS-####`);
    }
    if (record.type === 'DEB' && !ID_PATTERNS.debate.test(record.id)) {
      errors.push(`Registro de discovery ${record.id} e DEB, mas nao segue DEB-####`);
    }
    if (record.type === 'RAD' && !ID_PATTERNS.epicOrRadar.test(record.id)) {
      errors.push(`Registro de discovery ${record.id} e RAD, mas nao segue RAD-### ou EPIC-####`);
    }
    if (record.type === 'EPIC' && !ID_PATTERNS.epicOrRadar.test(record.id)) {
      errors.push(`Registro de discovery ${record.id} e EPIC, mas nao segue EPIC-#### (ou RAD-### legado)`);
    }
    if (record.type === 'EPIC') {
      const forbidden = hasForbiddenTitleToken(record.title);
      if (forbidden) {
        errors.push(
          `EPIC ${record.id} possui titulo invalido com token proibido "${forbidden}": "${record.title}"`
        );
      }
    }
  }
}

function validateBacklog(items: BacklogItem[], errors: string[], warnings: string[]): void {
  const ids = new Set(items.map((item) => item.id));
  const lockOwners = new Map<string, string[]>();

  for (const item of items) {
    const forbidden = hasForbiddenTitleToken(item.title);
    if (forbidden) {
      errors.push(
        `FEAT ${item.id} possui titulo invalido com token proibido "${forbidden}": "${item.title}"`
      );
    }

    if (item.origin_type !== 'direct' && !item.origin_ref) {
      warnings.push(
        `Item de backlog ${item.id} tem origin_type="${item.origin_type}" mas origin_ref vazio`
      );
    }

    for (const dep of item.blocked_by) {
      if (!ids.has(dep)) {
        warnings.push(`Item de backlog ${item.id} bloqueado por referencia inexistente: ${dep}`);
      }
    }

    for (const lock of item.lock_domains) {
      const owners = lockOwners.get(lock) || [];
      owners.push(item.id);
      lockOwners.set(lock, owners);
    }
  }

  for (const [lock, owners] of lockOwners.entries()) {
    if (owners.length > 1) {
      warnings.push(`Lock domain "${lock}" compartilhado por: ${owners.join(', ')}`);
    }
  }
}

function validateReferentialIntegrity(
  snapshot: any,
  errors: string[],
  warnings: string[],
  isStrict: boolean
): void {
  const discoveryIds = new Set<string>();
  if (snapshot.discoveryIndex?.records) {
    snapshot.discoveryIndex.records.forEach((r: any) => discoveryIds.add(r.id));
  }
  
  const backlogIds = new Set<string>();
  if (snapshot.backlog?.items) {
    snapshot.backlog.items.forEach((f: any) => backlogIds.add(f.id));
  }

  for (const item of snapshot.backlog.items || []) {
    if ((item.origin_type === 'epic' || item.origin_type === 'radar' || item.origin_type === 'INS' || item.origin_type === 'DEB') && item.origin_ref) {
      if (!discoveryIds.has(item.origin_ref)) {
        const msg = `FEAT ${item.id} aponta para origin_ref="${item.origin_ref}" que nao existe no index de discovery.`;
        if (isStrict) errors.push(msg);
        else warnings.push(`[LEGACY] ${msg}`);
      }
    }
    for (const dep of item.blocked_by || []) {
      if (!backlogIds.has(dep)) {
        const msg = `FEAT ${item.id} bloqueada por referencia inexistente: ${dep}`;
        if (isStrict) errors.push(msg);
        else warnings.push(`[LEGACY] ${msg}`);
      }
    }
  }

  for (const rec of snapshot.discoveryIndex.records || []) {
    for (const rel of rec.related_ids || []) {
      if (!discoveryIds.has(rel) && !backlogIds.has(rel)) {
        const msg = `Discovery ${rec.id} tem related_id="${rel}" referenciando ID inexistente no ecossistema (nem Discovery nem Backlog).`;
        if (isStrict) errors.push(msg);
        else warnings.push(`[LEGACY] ${msg}`);
      }
    }
  }

  if (snapshot.finalizeQueue?.items) {
    for (const fq of snapshot.finalizeQueue.items) {
      if (!backlogIds.has(fq.feature_id)) {
        const msg = `Fila de Finalize possui entrada para feature_id="${fq.feature_id}" bloqueada por feature inexistente.`;
        if (isStrict) errors.push(msg);
        else warnings.push(`[LEGACY] ${msg}`);
      }
    }
  }

  if (snapshot.unblockEvents?.events) {
    for (const ev of snapshot.unblockEvents.events) {
      if (!backlogIds.has(ev.feature_id) && ev.feature_id !== 'INITIAL') {
        const msg = `Unblock event disparado para feature_id="${ev.feature_id}" que nao esta mais listada no backlog.`;
        if (isStrict) errors.push(msg);
        else warnings.push(`[LEGACY] ${msg}`);
      }
      if (ev.unblocked_by && ev.unblocked_by !== 'INITIAL' && !backlogIds.has(ev.unblocked_by)) {
        const msg = `Unblock event disparado por unblocked_by="${ev.unblocked_by}" apontando para FEAT inexistente.`;
        if (isStrict) errors.push(msg);
        else warnings.push(`[LEGACY] ${msg}`);
      }
    }
  }
}


function computeGraphSummary(items: BacklogItem[]): {
  readyForParallel: number;
  blocked: number;
  lockConflicts: number;
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
  let blocked = 0;
  let readyForParallel = 0;

  for (const item of items) {
    if (item.status === 'DONE' || item.status === 'ARCHIVED') continue;
    const unresolvedDeps = item.blocked_by.filter((depId) => {
      const dep = byId.get(depId);
      return !dep || dep.status !== 'DONE';
    });
    const isBlocked = item.status === 'BLOCKED' || unresolvedDeps.length > 0;
    if (isBlocked) blocked++;
  }

  for (const item of runnable) {
    for (const lock of item.lock_domains) {
      const owners = lockOwners.get(lock) || [];
      owners.push(item.id);
      lockOwners.set(lock, owners);
    }
  }

  const conflictingIds = new Set<string>();
  for (const owners of lockOwners.values()) {
    if (owners.length > 1) {
      for (const id of owners) conflictingIds.add(id);
    }
  }

  for (const item of runnable) {
    const hasConflict = conflictingIds.has(item.id);
    if (item.status === 'READY' && !hasConflict) {
      readyForParallel++;
    }
  }

  return {
    readyForParallel,
    blocked,
    lockConflicts: conflictingIds.size,
  };
}

function roundPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function computeProgress(
  items: BacklogItem[]
): {
  progressGlobal: { done: number; total: number; percent: number };
  progressByRadar: Array<{ radar_id: string; done: number; total: number; percent: number }>;
} {
  const activeItems = items.filter((item) => item.status !== 'ARCHIVED');
  const total = activeItems.length;
  const done = activeItems.filter((item) => item.status === 'DONE').length;

  const byRadar = new Map<string, { done: number; total: number }>();
  for (const item of activeItems) {
    if ((item.origin_type !== 'radar' && item.origin_type !== 'epic') || !item.origin_ref) continue;
    const current = byRadar.get(item.origin_ref) || { done: 0, total: 0 };
    current.total += 1;
    if (item.status === 'DONE') current.done += 1;
    byRadar.set(item.origin_ref, current);
  }

  const progressByRadar = Array.from(byRadar.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([radar_id, values]) => ({
      radar_id,
      done: values.done,
      total: values.total,
      percent: roundPercent(values.done, values.total),
    }));

  return {
    progressGlobal: {
      done,
      total,
      percent: roundPercent(done, total),
    },
    progressByRadar,
  };
}

function validateTechDebt(items: TechDebtRecord[], errors: string[]): void {
  for (const item of items) {
    if (!ID_PATTERNS.techDebt.test(item.id)) {
      errors.push(`Item de divida tecnica ${item.id} nao segue TD-###`);
    }
  }
}

function validateFrontendReferences(
  gaps: FrontendGapRecord[],
  backlog: BacklogItem[],
  errors: string[],
  warnings: string[]
): void {
  const gapIds = new Set(gaps.map((g) => g.id));
  for (const item of backlog) {
    for (const gapRef of item.frontend_gap_refs) {
      if (!gapIds.has(gapRef)) {
        warnings.push(`Item de backlog ${item.id} referencia gap de frontend inexistente: ${gapRef}`);
      }
    }
  }

  const featureIds = new Set(backlog.map((b) => b.id));
  for (const gap of gaps) {
    if (gap.resolved_by_feature && !featureIds.has(gap.resolved_by_feature)) {
      errors.push(
        `Gap de frontend ${gap.id} com resolved_by_feature=${gap.resolved_by_feature} nao foi encontrado no backlog`
      );
    }
  }
}

async function validateActiveTaskChecklist(
  activeDir: string,
  items: BacklogItem[],
  warnings: string[]
): Promise<void> {
  const taskCandidates = ['3-tarefas.md', '3-tasks.md'];
  const requiredMarkers = ['frontend-impact', 'README.md', 'finalize --ref FEAT-'];
  for (const item of items) {
    if (item.status !== 'IN_PROGRESS') continue;
    let taskDocPath = '';
    for (const fileName of taskCandidates) {
      const candidate = path.join(activeDir, item.id, fileName);
      if (existsSync(candidate)) {
        taskDocPath = candidate;
        break;
      }
    }
    if (!taskDocPath) {
      warnings.push(`Checklist de tarefas ausente para ${item.id} em .sdd/active|execucao.`);
      continue;
    }
    const content = await fs.readFile(taskDocPath, 'utf-8').catch(() => '');
    const missing = requiredMarkers.filter((marker) => !content.includes(marker));
    if (missing.length > 0) {
      warnings.push(
        `Checklist incompleto em ${path.basename(taskDocPath)} (${item.id}): faltando ${missing.join(', ')}`
      );
    }
  }
}

async function validateWorkspaceCoherence(
  activeDir: string,
  archivedDir: string,
  items: BacklogItem[],
  warnings: string[]
): Promise<void> {
  for (const item of items) {
    const activePath = path.join(activeDir, item.id);
    const archivedPath = path.join(archivedDir, item.id);
    const activeExists = existsSync(activePath);
    const archivedExists = existsSync(archivedPath);

    if (item.status === 'IN_PROGRESS' && !activeExists) {
      warnings.push(`Feature ${item.id} em IN_PROGRESS sem workspace ativo em .sdd/active.`);
    }

    if ((item.status === 'DONE' || item.status === 'ARCHIVED') && activeExists) {
      warnings.push(`Feature ${item.id} concluida ainda presente em .sdd/active.`);
    }

    if (item.status === 'IN_PROGRESS' && archivedExists) {
      warnings.push(`Feature ${item.id} em IN_PROGRESS ja possui workspace em .sdd/archived.`);
    }
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

function featureHasMetadataFrontendEvidence(item: BacklogItem): boolean {
  const routes = [
    ...item.produces.map(parseRouteToken),
    ...item.consumes.map(parseRouteToken),
    ...(item.frontend_surface_tokens || []).map(parseRouteToken),
  ].filter((value): value is string => Boolean(value));
  const surfaces = (item.frontend_surface_tokens || []).map((value) => value.trim()).filter(Boolean);
  return (
    routes.length > 0 ||
    surfaces.length > 0 ||
    item.touches.includes('frontend') ||
    item.execution_kind === 'frontend_coverage'
  );
}

async function validateCanonicalSddStructure(
  memoryRoot: string,
  errors: string[]
): Promise<void> {
  const forbiddenTopLevelDirs = ['backlog', 'features', 'finalize', 'queue'];

  for (const dirName of forbiddenTopLevelDirs) {
    const candidate = path.join(memoryRoot, dirName);
    if (existsSync(candidate)) {
      errors.push(
        `Estrutura SDD nao canônica detectada: ${path.relative(process.cwd(), candidate)}. Use apenas state/, pendencias|planejamento/, active|execucao/ e archived|arquivados/.`
      );
    }
  }

  const forbiddenNestedPaths = [path.join(memoryRoot, 'backlog', 'features')];
  for (const candidate of forbiddenNestedPaths) {
    if (existsSync(candidate)) {
      errors.push(
        `Estrutura SDD nao canônica detectada: ${path.relative(process.cwd(), candidate)}. Backlog de features deve existir apenas em .sdd/state/backlog.yaml e nas views renderizadas de planejamento.`
      );
    }
  }
}

export class SddCheckCommand {
  async execute(projectRoot: string, options: SddCheckOptions = {}): Promise<SddCheckReport> {
    let config;
    let paths;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      config = await loadProjectSddConfig(projectRoot);
      paths = resolveSddPaths(projectRoot, config);
    } catch (error) {
      return {
        valid: false,
        errors: [(error as Error).message],
        warnings,
        summary: {
          discovery: 0,
          backlog: 0,
          techDebt: 0,
          finalizeQueue: 0,
          frontendEnabled: false,
          frontendGaps: 0,
          frontendRoutes: 0,
          progress_global: { done: 0, total: 0, percent: 0 },
          progress_by_radar: [],
          ready_for_parallel: 0,
          blocked: 0,
          lock_conflicts: 0,
          documentation_sync: false,
          core_views_stale: true,
          missing_architecture_fields: [],
          frontend_coverage_sync: true,
          features_missing_frontend_declaration: [],
          features_with_frontend_conflict: [],
          features_missing_fgap_link: [],
          graph: {
            readyForParallel: 0,
            blocked: 0,
            lockConflicts: 0,
          },
        },
      };
    }

    if (!existsSync(paths.memoryRoot)) {
      throw new Error(`Diretorio de memoria SDD nao encontrado em ${paths.memoryRoot}. Execute "${CLI_NAME} sdd init".`);
    }

    await validateCanonicalSddStructure(paths.memoryRoot, errors);

    const requiredFiles = [
      paths.stateFiles.discoveryIndex,
      paths.stateFiles.backlog,
      paths.stateFiles.techDebt,
      paths.stateFiles.finalizeQueue,
      paths.stateFiles.skillCatalog,
      paths.stateFiles.unblockEvents,
      paths.stateFiles.sourceIndex,
    ];
    for (const filePath of requiredFiles) {
      if (!existsSync(filePath)) {
        errors.push(`Arquivo de estado obrigatorio ausente: ${path.relative(projectRoot, filePath)}`);
      }
    }
    if (config.frontend.enabled) {
      if (!existsSync(paths.stateFiles.frontendGaps)) {
        errors.push(`Arquivo de estado de frontend ausente: ${path.relative(projectRoot, paths.stateFiles.frontendGaps)}`);
      }
      if (!existsSync(paths.stateFiles.frontendMap)) {
        errors.push(`Arquivo de estado de frontend ausente: ${path.relative(projectRoot, paths.stateFiles.frontendMap)}`);
      }
    }
    const canonicalFiles = [
      paths.stateFiles.architecture,
      paths.stateFiles.serviceCatalog,
      paths.stateFiles.techStack,
      paths.stateFiles.integrationContracts,
      paths.stateFiles.repoMap,
    ];
    for (const filePath of canonicalFiles) {
      if (!existsSync(filePath)) {
        errors.push(`Arquivo canônico ausente: ${path.relative(projectRoot, filePath)}`);
      }
    }
    if (config.frontend.enabled && !existsSync(paths.stateFiles.frontendDecisions)) {
      errors.push(
        `Arquivo canônico de frontend ausente: ${path.relative(projectRoot, paths.stateFiles.frontendDecisions)}`
      );
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
        summary: {
          discovery: 0,
          backlog: 0,
          techDebt: 0,
          finalizeQueue: 0,
          frontendEnabled: config.frontend.enabled,
          frontendGaps: 0,
          frontendRoutes: 0,
          progress_global: { done: 0, total: 0, percent: 0 },
          progress_by_radar: [],
          ready_for_parallel: 0,
          blocked: 0,
          lock_conflicts: 0,
          documentation_sync: false,
          core_views_stale: true,
          missing_architecture_fields: [],
          frontend_coverage_sync: true,
          features_missing_frontend_declaration: [],
          features_with_frontend_conflict: [],
          features_missing_fgap_link: [],
          graph: {
            readyForParallel: 0,
            blocked: 0,
            lockConflicts: 0,
          },
        },
      };
    }

    let snapshot;
    try {
      snapshot = await loadStateSnapshot(paths, config);
    } catch (error) {
      return {
        valid: false,
        errors: [`Schema de estado invalido: ${(error as Error).message}`],
        warnings,
        summary: {
          discovery: 0,
          backlog: 0,
          techDebt: 0,
          finalizeQueue: 0,
          frontendEnabled: config.frontend.enabled,
          frontendGaps: 0,
          frontendRoutes: 0,
          progress_global: { done: 0, total: 0, percent: 0 },
          progress_by_radar: [],
          ready_for_parallel: 0,
          blocked: 0,
          lock_conflicts: 0,
          documentation_sync: false,
          core_views_stale: true,
          missing_architecture_fields: [],
          frontend_coverage_sync: true,
          features_missing_frontend_declaration: [],
          features_with_frontend_conflict: [],
          features_missing_fgap_link: [],
          graph: {
            readyForParallel: 0,
            blocked: 0,
            lockConflicts: 0,
          },
        },
      };
    }

    checkUniqueIds(snapshot.discoveryIndex.records, 'discovery-index.records', errors);
    checkUniqueIds(snapshot.backlog.items, 'backlog.items', errors);
    checkUniqueIds(snapshot.techDebt.items, 'tech-debt.items', errors);

    validateDiscoveryRecords(snapshot.discoveryIndex.records, errors);
    validateBacklog(snapshot.backlog.items, errors, warnings);
    validateTechDebt(snapshot.techDebt.items, errors);

    const isStrict = options.strict ?? false;
    validateReferentialIntegrity(snapshot, errors, warnings, isStrict);

    if (config.frontend.enabled && snapshot.frontendGaps) {
      checkUniqueIds(snapshot.frontendGaps.items, 'frontend-gaps.items', errors);
      validateFrontendReferences(snapshot.frontendGaps.items, snapshot.backlog.items, errors, warnings);
    }
    await validateActiveTaskChecklist(paths.activeDir, snapshot.backlog.items, warnings);
    await validateWorkspaceCoherence(
      paths.activeDir,
      paths.archivedDir,
      snapshot.backlog.items,
      warnings
    );

    const featuresMissingFrontendDeclaration = config.frontend.enabled
      ? snapshot.backlog.items
          .filter((item) => item.status !== 'ARCHIVED' && item.status !== 'DONE')
          .filter((item) => (item.frontend_impact_status || 'unknown') === 'unknown')
          .map((item) => item.id)
      : [];

    const featuresWithFrontendConflict = config.frontend.enabled
      ? snapshot.backlog.items
          .filter((item) => item.status !== 'ARCHIVED' && item.status !== 'DONE')
          .filter((item) => (item.frontend_impact_status || 'unknown') === 'none')
          .filter((item) => featureHasMetadataFrontendEvidence(item))
          .map((item) => item.id)
      : [];

    const featuresMissingFgapLink = config.frontend.enabled
      ? snapshot.backlog.items
          .filter((item) => item.status !== 'ARCHIVED' && item.status !== 'DONE')
          .filter((item) => (item.frontend_impact_status || 'unknown') === 'required')
          .filter((item) => item.frontend_gap_refs.length === 0)
          .map((item) => item.id)
      : [];

    const missingArchitectureFields: string[] = [];
    if (snapshot.architecture.nodes.length === 0) {
      missingArchitectureFields.push('architecture.nodes vazio');
    }
    if (snapshot.serviceCatalog.services.length === 0) {
      missingArchitectureFields.push('service-catalog.services vazio');
    }
    if (snapshot.techStack.items.length === 0) {
      missingArchitectureFields.push('tech-stack.items vazio');
    }
    if (snapshot.integrationContracts.contracts.length === 0) {
      missingArchitectureFields.push('integration-contracts.contracts vazio');
    }
    if (snapshot.repoMap.items.length === 0) {
      missingArchitectureFields.push('repo-map.items vazio');
    }
    const hasFrontendDecisionDemand =
      config.frontend.enabled &&
      (
        (snapshot.frontendGaps?.items.length ?? 0) > 0 ||
        snapshot.backlog.items.some((item) => featureHasMetadataFrontendEvidence(item))
      );
    if (hasFrontendDecisionDemand && (snapshot.frontendDecisions?.items.length ?? 0) === 0) {
      missingArchitectureFields.push('frontend-decisions.items vazio');
    }

    const shouldRender = options.render ?? config.views.autoRender;
    if (shouldRender && errors.length === 0) {
      await renderViews(paths, config, snapshot);
      await syncSddGuideDocs(projectRoot, paths, config);
    }
    const coreFiles = [
      path.join(paths.coreDir, 'index.md'),
      path.join(paths.coreDir, 'servicos.md'),
      path.join(paths.coreDir, 'spec-tecnologica.md'),
      path.join(paths.coreDir, 'repo-map.md'),
    ];
    if (config.frontend.enabled) {
      coreFiles.push(path.join(paths.coreDir, 'frontend-map.md'));
      coreFiles.push(path.join(paths.coreDir, 'frontend-sitemap.md'));
      coreFiles.push(path.join(paths.coreDir, 'frontend-decisions.md'));
    }
    const coreViewsStale = coreFiles.some((file) => !existsSync(file));
    const docsValidation = await validateSddGuideDocs(projectRoot, paths, config);
    if (!docsValidation.documentationSync) {
      warnings.push(
        `Blocos de onboarding nao sincronizados: ${docsValidation.missingBlocks.join(', ')}`
      );
    }
    if (featuresMissingFrontendDeclaration.length > 0) {
      warnings.push(
        `Features sem declaracao de impacto frontend: ${featuresMissingFrontendDeclaration.join(', ')}`
      );
    }
    if (featuresWithFrontendConflict.length > 0) {
      warnings.push(
        `Features com conflito de cobertura frontend: ${featuresWithFrontendConflict.join(', ')}`
      );
    }
    if (featuresMissingFgapLink.length > 0) {
      warnings.push(
        `Features com frontend_impact=required sem FGAP vinculado: ${featuresMissingFgapLink.join(', ')}`
      );
    }

    const graph = computeGraphSummary(snapshot.backlog.items);
    const progress = computeProgress(snapshot.backlog.items);
    const frontendCoverageSync =
      featuresMissingFrontendDeclaration.length === 0 &&
      featuresWithFrontendConflict.length === 0 &&
      featuresMissingFgapLink.length === 0;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        discovery: snapshot.discoveryIndex.records.length,
        backlog: snapshot.backlog.items.length,
        techDebt: snapshot.techDebt.items.length,
        finalizeQueue: snapshot.finalizeQueue.items.length,
        frontendEnabled: config.frontend.enabled,
        frontendGaps: snapshot.frontendGaps?.items.length ?? 0,
        frontendRoutes: snapshot.frontendMap?.routes.length ?? 0,
        progress_global: progress.progressGlobal,
        progress_by_radar: progress.progressByRadar,
        ready_for_parallel: graph.readyForParallel,
        blocked: graph.blocked,
        lock_conflicts: graph.lockConflicts,
        documentation_sync: docsValidation.documentationSync,
        core_views_stale: coreViewsStale,
        missing_architecture_fields: missingArchitectureFields,
        frontend_coverage_sync: frontendCoverageSync,
        features_missing_frontend_declaration: featuresMissingFrontendDeclaration,
        features_with_frontend_conflict: featuresWithFrontendConflict,
        features_missing_fgap_link: featuresMissingFgapLink,
        graph,
      },
    };
  }
}
