import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  ID_PATTERNS,
  type BacklogItem,
  type DiscoveryRecord,
  type FrontendGapRecord,
  type TechDebtRecord,
} from './types.js';
import { loadProjectSddConfig, loadStateSnapshot, resolveSddPaths } from './state.js';
import { renderViews } from './views.js';

export interface SddCheckOptions {
  render?: boolean;
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

function validateDiscoveryRecords(records: DiscoveryRecord[], errors: string[]): void {
  for (const record of records) {
    if (record.type === 'INS' && !ID_PATTERNS.insight.test(record.id)) {
      errors.push(`Registro de discovery ${record.id} e INS, mas nao segue INS-###`);
    }
    if (record.type === 'DEB' && !ID_PATTERNS.debate.test(record.id)) {
      errors.push(`Registro de discovery ${record.id} e DEB, mas nao segue DEB-###`);
    }
    if (record.type === 'RAD' && !ID_PATTERNS.radar.test(record.id)) {
      errors.push(`Registro de discovery ${record.id} e RAD, mas nao segue RAD-###`);
    }
  }
}

function validateBacklog(items: BacklogItem[], warnings: string[]): void {
  for (const item of items) {
    if (item.origin_type !== 'direct' && !item.origin_ref) {
      warnings.push(
        `Item de backlog ${item.id} tem origin_type="${item.origin_type}" mas origin_ref vazio`
      );
    }
  }
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

export class SddCheckCommand {
  async execute(projectRoot: string, options: SddCheckOptions = {}): Promise<SddCheckReport> {
    const config = await loadProjectSddConfig(projectRoot);
    const paths = resolveSddPaths(projectRoot, config);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!existsSync(paths.memoryRoot)) {
      throw new Error(`Diretorio de memoria SDD nao encontrado em ${paths.memoryRoot}. Execute "openspec sdd init".`);
    }

    const requiredFiles = [
      paths.stateFiles.discoveryIndex,
      paths.stateFiles.backlog,
      paths.stateFiles.techDebt,
      paths.stateFiles.finalizeQueue,
      paths.stateFiles.skillCatalog,
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
        },
      };
    }

    checkUniqueIds(snapshot.discoveryIndex.records, 'discovery-index.records', errors);
    checkUniqueIds(snapshot.backlog.items, 'backlog.items', errors);
    checkUniqueIds(snapshot.techDebt.items, 'tech-debt.items', errors);

    validateDiscoveryRecords(snapshot.discoveryIndex.records, errors);
    validateBacklog(snapshot.backlog.items, warnings);
    validateTechDebt(snapshot.techDebt.items, errors);

    if (config.frontend.enabled && snapshot.frontendGaps) {
      checkUniqueIds(snapshot.frontendGaps.items, 'frontend-gaps.items', errors);
      validateFrontendReferences(snapshot.frontendGaps.items, snapshot.backlog.items, errors, warnings);
    }

    const shouldRender = options.render ?? config.views.autoRender;
    if (shouldRender && errors.length === 0) {
      await renderViews(paths, config, snapshot);
    }

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
      },
    };
  }
}
