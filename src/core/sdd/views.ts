import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { SddPaths, SddRuntimeConfig, SddStateSnapshot } from './state.js';

function formatDate(iso?: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toISOString().slice(0, 10);
}

function renderCoreIndex(state: SddStateSnapshot, config: SddRuntimeConfig): string {
  const frontendEnabled = config.frontend.enabled ? 'ativado' : 'desativado';

  return `# Indice Core SDD

Este documento e gerado automaticamente a partir dos arquivos em \`.sdd/state/\`.

## Resumo
- Registros de discovery: ${state.discoveryIndex.records.length}
- Features no backlog: ${state.backlog.items.length}
- Itens de divida tecnica: ${state.techDebt.items.length}
- Itens na fila de finalize: ${state.finalizeQueue.items.length}
- Catalogo de skills: ${state.skillCatalog.skills.length} skills / ${state.skillCatalog.bundles.length} bundles
- Modulo de frontend: ${frontendEnabled}

## Referencias
- \`.sdd/core/arquitetura.md\`
- \`.sdd/pendencias/backlog-features.md\`
- \`.sdd/pendencias/tech-debt.md\`
${config.frontend.enabled ? '- `.sdd/core/frontend-map.md`\n- `.sdd/pendencias/frontend-gaps.md`' : ''}
`;
}

function renderBacklog(state: SddStateSnapshot): string {
  const rows = state.backlog.items
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => {
      const blocked = item.blocked_by.length > 0 ? item.blocked_by.join(', ') : '-';
      return `| ${item.id} | ${item.status} | ${item.title} | ${item.origin_type} | ${item.scale} | ${blocked} |`;
    });

  return `# Backlog de Features

Documento gerado a partir de \`.sdd/state/backlog.yaml\`.

| ID | Status | Titulo | Origem | Escala | Bloqueado por |
| --- | --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem itens | - | - | - |'}
`;
}

function renderTechDebt(state: SddStateSnapshot): string {
  const rows = state.techDebt.items
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => `| ${item.id} | ${item.status} | ${item.title} | ${formatDate(item.updated_at)} |`);

  return `# Divida Tecnica

Documento gerado a partir de \`.sdd/state/tech-debt.yaml\`.

| ID | Status | Titulo | Atualizado |
| --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem itens | - |'}
`;
}

function renderFrontendMap(state: SddStateSnapshot): string {
  const routes = (state.frontendMap?.routes ?? [])
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path));

  const lines = routes.map((route) => {
    const files =
      route.implemented_files.length > 0
        ? ` (${route.implemented_files.join(', ')})`
        : '';
    return `- \`${route.path}\` [${route.ui_status}]${files}`;
  });

  return `# Mapa de Frontend

Documento gerado a partir de \`.sdd/state/frontend-map.yaml\`.

${lines.length > 0 ? lines.join('\n') : '- Sem rotas mapeadas.'}
`;
}

function renderFrontendGaps(state: SddStateSnapshot): string {
  const rows = (state.frontendGaps?.items ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => {
      const resolvedBy = item.resolved_by_feature || '-';
      return `| ${item.id} | ${item.status} | ${item.title} | ${item.origin_feature || '-'} | ${resolvedBy} |`;
    });

  return `# Gaps de Frontend

Documento gerado a partir de \`.sdd/state/frontend-gaps.yaml\`.

| ID | Status | Titulo | Feature de origem | Resolvido por |
| --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem gaps | - | - |'}
`;
}

export async function renderViews(
  paths: SddPaths,
  config: SddRuntimeConfig,
  state: SddStateSnapshot
): Promise<void> {
  const writes: Array<Promise<void>> = [
    fs.writeFile(path.join(paths.coreDir, 'index.md'), renderCoreIndex(state, config), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'backlog-features.md'), renderBacklog(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'tech-debt.md'), renderTechDebt(state), 'utf-8'),
  ];

  if (config.frontend.enabled) {
    writes.push(
      fs.writeFile(path.join(paths.coreDir, 'frontend-map.md'), renderFrontendMap(state), 'utf-8'),
      fs.writeFile(
        path.join(paths.pendenciasDir, 'frontend-gaps.md'),
        renderFrontendGaps(state),
        'utf-8'
      )
    );
  }

  await Promise.all(writes);
}
