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
- \`.sdd/core/servicos.md\`
- \`.sdd/core/spec-tecnologica.md\`
- \`.sdd/core/repo-map.md\`
- \`.sdd/pendencias/backlog-features.md\`
- \`.sdd/pendencias/backlog-graph.md\`
- \`.sdd/pendencias/progress.md\`
- \`.sdd/pendencias/unblocked.md\`
- \`.sdd/pendencias/tech-debt.md\`
${config.frontend.enabled ? '- `.sdd/core/frontend-map.md`\n- `.sdd/core/frontend-decisions.md`\n- `.sdd/pendencias/frontend-gaps.md`' : ''}
`;
}

function renderBacklog(state: SddStateSnapshot): string {
  const rows = state.backlog.items
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => {
      const blocked = item.blocked_by.length > 0 ? item.blocked_by.join(', ') : '-';
      return `| ${item.id} | ${item.status} | ${item.title} | ${item.origin_type} | ${item.scale} | ${item.execution_kind} | ${item.planning_mode} | ${item.parallel_group || '-'} | ${blocked} |`;
    });

  return `# Backlog de Features

Documento gerado a partir de \`.sdd/state/backlog.yaml\`.

| ID | Status | Titulo | Origem | Escala | Tipo | Modo | Grupo paralelo | Bloqueado por |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem itens | - | - | - | - | - | - |'}
`;
}

function renderBacklogGraph(state: SddStateSnapshot): string {
  const grouped = new Map<string, typeof state.backlog.items>();
  const sorted = state.backlog.items.slice().sort((a, b) => a.id.localeCompare(b.id));
  const byId = new Map(sorted.map((item) => [item.id, item]));

  for (const item of sorted) {
    const group = item.origin_ref || 'sem-origem';
    const entries = grouped.get(group) || [];
    entries.push(item);
    grouped.set(group, entries);
  }

  const lines: string[] = ['# Grafo de Backlog', '', 'Documento gerado a partir de `.sdd/state/backlog.yaml`.', ''];
  const groups = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  if (groups.length === 0) {
    lines.push('- Sem features no backlog.');
    return `${lines.join('\n')}\n`;
  }

  for (const [group, items] of groups) {
    lines.push(`## ${group}`);
    for (const item of items) {
      const deps = item.blocked_by.length > 0 ? item.blocked_by.join(', ') : 'nenhuma';
      const locks = item.lock_domains.length > 0 ? item.lock_domains.join(', ') : 'nenhum';
      lines.push(`- ${item.id} [${item.status}] ${item.title}`);
      lines.push(`  - tipo: ${item.execution_kind} | modo: ${item.planning_mode} | grupo: ${item.parallel_group || '-'}`);
      lines.push(`  - depende de: ${deps}`);
      lines.push(`  - lock domains: ${locks}`);
    }
    lines.push('');
  }

  const crossRadLinks: string[] = [];
  for (const item of sorted) {
    for (const depId of item.blocked_by) {
      const dep = byId.get(depId);
      if (!dep) continue;
      const itemOrigin = item.origin_ref || 'sem-origem';
      const depOrigin = dep.origin_ref || 'sem-origem';
      if (itemOrigin === depOrigin) continue;
      crossRadLinks.push(`- ${item.id} (${itemOrigin}) depende de ${dep.id} (${depOrigin})`);
    }
  }

  lines.push('## Cross-RAD links');
  if (crossRadLinks.length === 0) {
    lines.push('- Nenhum link cross-RAD encontrado.');
  } else {
    lines.push(...crossRadLinks.sort());
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function renderDiscovery(state: SddStateSnapshot): string {
  const rows = state.discoveryIndex.records
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((record) => {
      const related = record.related_ids.length > 0 ? record.related_ids.join(', ') : '-';
      return `| ${record.id} | ${record.type} | ${record.status} | ${record.title} | ${related} |`;
    });

  return `# Discovery

Documento gerado a partir de \`.sdd/state/discovery-index.yaml\`.

| ID | Tipo | Status | Titulo | Relacionados |
| --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem itens | - | - |'}
`;
}

function renderFinalizeQueue(state: SddStateSnapshot): string {
  const rows = state.finalizeQueue.items
    .slice()
    .sort((a, b) => a.feature_id.localeCompare(b.feature_id))
    .map((item) => {
      return `| ${item.feature_id} | ${item.status} | ${item.summary || '-'} | ${formatDate(item.created_at)} | ${formatDate(item.completed_at)} |`;
    });

  return `# Fila de Finalize

Documento gerado a partir de \`.sdd/state/finalize-queue.yaml\`.

| Feature | Status | Resumo | Criado | Concluido |
| --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem itens | - | - |'}
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

function roundPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function renderProgress(state: SddStateSnapshot): string {
  const active = state.backlog.items.filter((item) => item.status !== 'ARCHIVED');
  const total = active.length;
  const done = active.filter((item) => item.status === 'DONE').length;
  const globalPercent = roundPercent(done, total);

  const byRadar = new Map<string, { done: number; total: number }>();
  for (const item of active) {
    if (item.origin_type !== 'radar' || !item.origin_ref) continue;
    const current = byRadar.get(item.origin_ref) || { done: 0, total: 0 };
    current.total += 1;
    if (item.status === 'DONE') current.done += 1;
    byRadar.set(item.origin_ref, current);
  }

  const rows = Array.from(byRadar.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([radarId, values]) => {
      const percent = roundPercent(values.done, values.total);
      return `| ${radarId} | ${values.done} | ${values.total} | ${percent}% |`;
    });

  return `# Progresso

Documento gerado a partir de \`.sdd/state/backlog.yaml\`.

## Global
- DONE: ${done}/${total} (${globalPercent}%)

## Por RAD
| RAD | DONE | Total | Percentual |
| --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | 0 | 0 | 0% |'}
`;
}

function renderUnblocked(state: SddStateSnapshot): string {
  const rows = state.unblockEvents.events
    .slice()
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .map((event) => `| ${event.feature_id} | ${event.unblocked_by} | ${event.status} | ${formatDate(event.created_at)} |`);

  return `# Features Desbloqueadas

Documento gerado a partir de \`.sdd/state/unblock-events.yaml\`.

| Feature liberada | Liberada por | Status evento | Data |
| --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem eventos | - |'}
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

function renderServices(state: SddStateSnapshot): string {
  const rows = state.serviceCatalog.services
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((service) => {
      const contracts = service.contracts.length > 0 ? service.contracts.join(', ') : '-';
      const deps =
        service.external_dependencies.length > 0 ? service.external_dependencies.join(', ') : '-';
      const owners = service.owner_refs.length > 0 ? service.owner_refs.join(', ') : '-';
      return `| ${service.id} | ${service.name} | ${service.responsibility || '-'} | ${owners} | ${contracts} | ${deps} |`;
    });

  return `# Catalogo de Servicos

Documento gerado a partir de \`.sdd/state/service-catalog.yaml\`.

| ID | Nome | Responsabilidade | Owners | Contratos | Dependencias externas |
| --- | --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem servicos | - | - | - |'}
`;
}

function renderTechStack(state: SddStateSnapshot): string {
  const rows = state.techStack.items
    .slice()
    .sort((a, b) => {
      if (a.layer === b.layer) return a.technology.localeCompare(b.technology);
      return a.layer.localeCompare(b.layer);
    })
    .map((item) => {
      const constraints = item.constraints.length > 0 ? item.constraints.join(', ') : '-';
      return `| ${item.layer} | ${item.technology} | ${item.version || '-'} | ${item.purpose || '-'} | ${constraints} |`;
    });

  return `# Spec Tecnologica

Documento gerado a partir de \`.sdd/state/tech-stack.yaml\`.

| Camada | Tecnologia | Versao | Proposito | Restricoes |
| --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | - | Sem itens | - |'}
`;
}

function renderFrontendDecisions(state: SddStateSnapshot): string {
  const rows = (state.frontendDecisions?.items ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => {
      const refs = item.related_refs.length > 0 ? item.related_refs.join(', ') : '-';
      const routes = item.route_refs.length > 0 ? item.route_refs.join(', ') : '-';
      return `| ${item.id} | ${item.status} | ${item.title} | ${routes} | ${refs} |`;
    });

  return `# Decisoes de Frontend

Documento gerado a partir de \`.sdd/state/frontend-decisions.yaml\`.

| ID | Status | Titulo | Rotas | Refs |
| --- | --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | Sem decisoes | - | - |'}
`;
}

function renderRepoMap(state: SddStateSnapshot): string {
  const rows = state.repoMap.items
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((item) => `| ${item.path} | ${item.kind} | ${item.service_ref || '-'} | ${item.notes || '-'} |`);

  return `# Mapa do Repositorio

Documento gerado a partir de \`.sdd/state/repo-map.yaml\`.

| Path | Tipo | Servico | Observacoes |
| --- | --- | --- | --- |
${rows.length > 0 ? rows.join('\n') : '| - | - | - | Sem itens |'}
`;
}

export async function renderViews(
  paths: SddPaths,
  config: SddRuntimeConfig,
  state: SddStateSnapshot
): Promise<void> {
  const writes: Array<Promise<void>> = [
    fs.writeFile(path.join(paths.coreDir, 'index.md'), renderCoreIndex(state, config), 'utf-8'),
    fs.writeFile(path.join(paths.coreDir, 'servicos.md'), renderServices(state), 'utf-8'),
    fs.writeFile(path.join(paths.coreDir, 'spec-tecnologica.md'), renderTechStack(state), 'utf-8'),
    fs.writeFile(path.join(paths.coreDir, 'repo-map.md'), renderRepoMap(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'backlog-features.md'), renderBacklog(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'backlog-graph.md'), renderBacklogGraph(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'discovery.md'), renderDiscovery(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'finalize-queue.md'), renderFinalizeQueue(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'progress.md'), renderProgress(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'tech-debt.md'), renderTechDebt(state), 'utf-8'),
    fs.writeFile(path.join(paths.pendenciasDir, 'unblocked.md'), renderUnblocked(state), 'utf-8'),
  ];

  if (config.frontend.enabled) {
    writes.push(
      fs.writeFile(path.join(paths.coreDir, 'frontend-map.md'), renderFrontendMap(state), 'utf-8'),
      fs.writeFile(
        path.join(paths.coreDir, 'frontend-decisions.md'),
        renderFrontendDecisions(state),
        'utf-8'
      ),
      fs.writeFile(
        path.join(paths.pendenciasDir, 'frontend-gaps.md'),
        renderFrontendGaps(state),
        'utf-8'
      )
    );
  }

  await Promise.all(writes);
}
