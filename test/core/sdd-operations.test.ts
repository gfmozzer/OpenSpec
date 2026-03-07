import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand } from '../../src/core/sdd/init.js';
import { SddCheckCommand } from '../../src/core/sdd/check.js';
import {
  SddBreakdownCommand,
  SddContextCommand,
  SddDebateCommand,
  SddDecideCommand,
  SddFinalizeCommand,
  SddFrontendGapCommand,
  SddInsightCommand,
  SddNextCommand,
  SddOnboardCommand,
  SddSkillsSyncCommand,
  SddStartCommand,
} from '../../src/core/sdd/operations.js';

async function readYamlFile<T>(filePath: string): Promise<T> {
  return parseYaml(await fs.readFile(filePath, 'utf-8')) as T;
}

async function writeYamlFile(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, stringifyYaml(value), 'utf-8');
}

async function completeDebateTemplate(projectRoot: string, debateId: string): Promise<void> {
  const debateDir = path.join(projectRoot, '.sdd', 'discovery', '2-debates');
  const entries = await fs.readdir(debateDir);
  const fileName = entries.find((name) => name.startsWith(`${debateId}-`));
  if (!fileName) throw new Error(`Debate file not found for ${debateId}`);
  const filePath = path.join(debateDir, fileName);
  let content = await fs.readFile(filePath, 'utf-8');
  content = content.replace(
    'Decidir ____ em vez de ____ para resolver ____.',
    'Decidir politica por workspace em vez de permissao global para resolver controle granular.'
  );
  content = content.replace('- Escolha (A/B/C):', '- Escolha (A/B/C): A');
  content = content.replace('- Justificativa:', '- Justificativa: Opcao A reduz risco operacional com menor custo.');
  await fs.writeFile(filePath, content, 'utf-8');
}

describe('sdd operations', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `openspec-sdd-ops-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
    await fs.mkdir(testDir, { recursive: true });
    await new SddInitCommand().execute(testDir, { render: false });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('executes discovery flow and creates backlog from radar', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Nova estrategia de autorizacao');
    expect(insight.id).toBe('INS-001');

    const debate = await new SddDebateCommand().execute(testDir, insight.id, { agent: 'agente-a' });
    expect(debate.id).toBe('DEB-001');
    await completeDebateTemplate(testDir, debate.id);

    const decision = await new SddDecideCommand().execute(testDir, debate.id, 'radar', {
      rationale: 'Aprovado para planejamento',
    });
    expect(decision.radarId).toBe('RAD-001');

    const breakdown = await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      titles: ['API de autorizacao', 'Politicas por workspace'],
      mode: 'graph',
    });
    expect(breakdown.created).toEqual(['FEAT-001', 'FEAT-002']);

    const backlogRaw = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'backlog.yaml'), 'utf-8')
    ) as Record<string, any>;
    const feat2 = backlogRaw.items.find((item: any) => item.id === 'FEAT-002');
    expect(feat2).toBeDefined();
    expect(feat2.execution_kind).toBeDefined();
    expect(feat2.planning_mode).toBeDefined();
    expect(Array.isArray(feat2.produces)).toBe(true);
  });

  it('fails decide when debate template is incomplete', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Ideia sem debate completo');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await expect(
      new SddDecideCommand().execute(testDir, debate.id, 'radar', {
        rationale: 'Tentativa sem preencher template',
      })
    ).rejects.toThrow(/incompleto/i);
  });

  it('computes next features with graph dependencies and lock conflicts', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Melhorar autorizacao por workspace');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await completeDebateTemplate(testDir, debate.id);
    await new SddDecideCommand().execute(testDir, debate.id, 'radar');

    await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      mode: 'graph',
      titles: ['Modelo de permissao', 'API de autorizacao', 'Tela de permissoes'],
    });

    const next = await new SddNextCommand().execute(testDir);
    expect(next.ready.some((item) => item.id === 'FEAT-001')).toBe(true);
    expect(next.blocked.some((item) => item.id === 'FEAT-003')).toBe(true);
  });

  it('starts feature execution, creates change and finalizes', async () => {
    const start = await new SddStartCommand().execute(testDir, 'Implementar endpoint de auditoria');
    expect(start.featureId).toBe('FEAT-001');
    expect(start.changeName.length).toBeGreaterThan(0);
    expect(start.active_path).toContain('.sdd/active/FEAT-001');
    expect(start.generated_docs).toHaveLength(4);
    const tasksPath = path.join(testDir, '.sdd', 'active', 'FEAT-001', '3-tasks.md');
    const tasksContent = await fs.readFile(tasksPath, 'utf-8');
    expect(tasksContent).toContain('AGENTS.md');
    expect(tasksContent).toContain('README.md');

    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', start.changeName);
    await fs.mkdir(archiveDir, { recursive: true });

    const finalize = await new SddFinalizeCommand().execute(testDir, { allReady: true });
    expect(finalize.finalized).toContain('FEAT-001');

    const context = await new SddContextCommand().execute(testDir, 'FEAT-001');
    expect(context.target_type).toBe('FEAT');
  });

  it('syncs curated skills to configured tool directories', async () => {
    const catalogPath = path.join(testDir, '.sdd', 'state', 'skill-catalog.yaml');
    const catalog = parseYaml(await fs.readFile(catalogPath, 'utf-8')) as Record<string, any>;
    catalog.skills = [
      {
        id: 'skill-sync-test',
        title: 'Skill Sync Test',
        description: 'Skill de teste',
        source_repo: '',
        source_path: '',
        phases: ['plan'],
        domains: ['backend'],
        tools: ['codex'],
        bundle_ids: ['test-bundle'],
        priority: 10,
      },
    ];
    catalog.bundles = [{ id: 'test-bundle', title: 'Bundle Teste', skill_ids: ['skill-sync-test'] }];
    await fs.writeFile(catalogPath, stringifyYaml(catalog), 'utf-8');

    await fs.mkdir(path.join(testDir, '.codex'), { recursive: true });
    const result = await new SddSkillsSyncCommand().execute(testDir, {
      all: true,
      tools: ['codex'],
    });

    expect(result.tools).toContain('codex');
    expect(result.local_synced).toBe(1);
    const skillFile = path.join(
      testDir,
      '.codex',
      'skills',
      'sdd-curated-skill-sync-test',
      'SKILL.md'
    );
    const content = await fs.readFile(skillFile, 'utf-8');
    expect(content).toContain('Skill Sync Test');

    const localSkillFile = path.join(
      testDir,
      '.sdd',
      'skills',
      'curated',
      'sdd-curated-skill-sync-test',
      'SKILL.md'
    );
    const localContent = await fs.readFile(localSkillFile, 'utf-8');
    expect(localContent).toContain('Skill Sync Test');
  });

  it('creates and resolves frontend gaps when frontend module is enabled', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    const gapCommand = new SddFrontendGapCommand();
    const created = await gapCommand.add(testDir, 'Tela de auditoria faltando', {
      routes: ['/auditoria'],
      originFeature: 'FEAT-777',
    });
    expect(created.id).toBe('FGAP-001');

    const resolved = await gapCommand.resolve(testDir, 'FGAP-001', {
      feature: 'FEAT-002',
      files: ['src/pages/auditoria.tsx'],
      routes: ['/auditoria'],
    });
    expect(resolved.status).toBe('DONE');
  });

  it('enforces start guardrails for blocked features and supports --force', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Base de dominio');
    await startCmd.execute(testDir, 'API dependente');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-001');
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-002');
    feat1.status = 'READY';
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-001'];
    await writeYamlFile(backlogPath, backlog);

    await expect(startCmd.execute(testDir, 'FEAT-002')).rejects.toThrow(/blocked_by pendente/i);

    const forced = await startCmd.execute(testDir, 'FEAT-002', { force: true });
    expect(forced.start_guardrails.forced).toBe(true);
    expect(forced.start_guardrails.blocked_check.ok).toBe(false);
    expect(forced.start_guardrails.blocked_check.unresolved).toContain('FEAT-001');
  });

  it('enforces start guardrails for lock conflicts and supports --force', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Auth policy principal');

    await expect(startCmd.execute(testDir, 'Auth policy secundario')).rejects.toThrow(/lock conflict/i);

    const forced = await startCmd.execute(testDir, 'Auth policy fallback', { force: true });
    expect(forced.start_guardrails.forced).toBe(true);
    expect(forced.start_guardrails.lock_check.ok).toBe(false);
    expect(forced.start_guardrails.lock_check.conflicts).toContain('FEAT-001');
  });

  it('returns context payload with graph constraints and readiness', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Base de dominio');
    await startCmd.execute(testDir, 'API dependente');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-002');
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-001'];
    feat2.parallel_group = 'radar-rad-001';
    feat2.planning_mode = 'direct_tasks';
    feat2.execution_kind = 'feature';
    feat2.lock_domains = ['auth-rules'];
    feat2.produces = ['capacidade-de-negocio'];
    feat2.consumes = ['modelo-de-dominio'];
    await writeYamlFile(backlogPath, backlog);

    const context = await new SddContextCommand().execute(testDir, 'FEAT-002');
    expect((context as any).context_pack_version).toBe(1);
    expect((context as any).blocked_by).toEqual(['FEAT-001']);
    expect((context as any).lock_domains).toEqual(['auth-rules']);
    expect((context as any).parallel_group).toBe('radar-rad-001');
    expect((context as any).planning_mode).toBe('direct_tasks');
    expect((context as any).execution_kind).toBe('feature');
    expect((context as any).readiness).toBe('BLOCKED');
    expect(Array.isArray((context as any).read_order)).toBe(true);
    expect((context as any).relevant_services).toBeDefined();
    expect((context as any).relevant_contracts).toBeDefined();
  });

  it('supports breakdown incremental with rewire and cross-RAD dependency linking', async () => {
    await new SddStartCommand().execute(testDir, 'API de estoque');
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const seed = backlog.items.find((item: any) => item.id === 'FEAT-001');
    seed.status = 'READY';
    seed.produces = ['api-ou-contrato'];
    seed.origin_type = 'radar';
    seed.origin_ref = 'RAD-000';
    await writeYamlFile(backlogPath, backlog);

    const insight = await new SddInsightCommand().execute(testDir, 'Novo frontend de estoque');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await completeDebateTemplate(testDir, debate.id);
    await new SddDecideCommand().execute(testDir, debate.id, 'radar');

    const result = await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      mode: 'graph',
      incremental: true,
      dedupe: 'normal',
      titles: ['Tela de estoque'],
    });

    expect(result.created).toContain('FEAT-002');
    expect(result.rewired_dependencies.some((entry) => entry.feature_id === 'FEAT-002')).toBe(true);

    const updatedBacklog = await readYamlFile<Record<string, any>>(backlogPath);
    const created = updatedBacklog.items.find((item: any) => item.id === 'FEAT-002');
    expect(created.blocked_by).toContain('FEAT-001');
  });

  it('deduplicates breakdown by strict/normal and allows duplicates with off', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Projeto de usuarios');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await completeDebateTemplate(testDir, debate.id);
    await new SddDecideCommand().execute(testDir, debate.id, 'radar');

    const first = await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      mode: 'flat',
      dedupe: 'strict',
      titles: ['API de usuarios'],
    });
    expect(first.created).toEqual(['FEAT-001']);

    const strictDuplicate = await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      mode: 'flat',
      dedupe: 'strict',
      titles: ['API de usuarios'],
    });
    expect(strictDuplicate.created).toHaveLength(0);
    expect(strictDuplicate.linked_existing).toContain('FEAT-001');

    const normalDuplicate = await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      mode: 'flat',
      dedupe: 'normal',
      titles: ['Api usuarios'],
    });
    expect(normalDuplicate.created).toHaveLength(0);
    expect(normalDuplicate.linked_existing).toContain('FEAT-001');

    const offDuplicate = await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      mode: 'flat',
      dedupe: 'off',
      titles: ['API de usuarios'],
    });
    expect(offDuplicate.created).toContain('FEAT-002');
  });

  it('ranks next features by impact using dependent graph', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Tarefa base de schema');
    await startCmd.execute(testDir, 'Tarefa intermediaria');
    await startCmd.execute(testDir, 'Tarefa final');
    await startCmd.execute(testDir, 'Tarefa isolada');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);

    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-001');
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-002');
    const feat3 = backlog.items.find((item: any) => item.id === 'FEAT-003');
    const feat4 = backlog.items.find((item: any) => item.id === 'FEAT-004');
    feat1.status = 'READY';
    feat1.lock_domains = ['schema-change'];
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-001'];
    feat3.status = 'BLOCKED';
    feat3.blocked_by = ['FEAT-002'];
    feat4.status = 'READY';
    feat4.lock_domains = [];
    await writeYamlFile(backlogPath, backlog);

    const next = await new SddNextCommand().execute(testDir, { rank: 'impact', limit: 2 });
    expect(next.rank).toBe('impact');
    expect(next.ready[0].id).toBe('FEAT-001');
    expect(next.ready[0].score).toBeGreaterThan(next.ready[1].score);
  });

  it('computes check progress global/by RAD and generates progress.md', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Entrega inicial');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await completeDebateTemplate(testDir, debate.id);
    await new SddDecideCommand().execute(testDir, debate.id, 'radar');
    await new SddBreakdownCommand().execute(testDir, 'RAD-001', {
      mode: 'flat',
      titles: ['API principal', 'Tela principal'],
    });

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-001');
    feat1.status = 'DONE';
    await writeYamlFile(backlogPath, backlog);

    const report = await new SddCheckCommand().execute(testDir, { render: true });
    expect(report.summary.progress_global.percent).toBe(50);
    expect(report.summary.progress_by_radar[0]).toMatchObject({
      radar_id: 'RAD-001',
      done: 1,
      total: 2,
      percent: 50,
    });

    const progressPath = path.join(testDir, '.sdd', 'pendencias', 'progress.md');
    const progressContent = await fs.readFile(progressPath, 'utf-8');
    expect(progressContent).toContain('RAD-001');
  });

  it('finalize generates ADR, unlock events and unblocked view', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Feature base');
    await startCmd.execute(testDir, 'Feature dependente');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-001');
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-002');
    feat1.status = 'IN_PROGRESS';
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-001'];
    await writeYamlFile(backlogPath, backlog);

    const result = await new SddFinalizeCommand().execute(testDir, { ref: 'FEAT-001' });
    expect(result.finalized).toContain('FEAT-001');
    expect(result.unblocked).toContain('FEAT-002');
    expect(Array.isArray(result.updated_core_docs)).toBe(true);

    const adrPath = path.join(testDir, '.sdd', 'core', 'adrs', 'ADR-FEAT-001.md');
    const adrContent = await fs.readFile(adrPath, 'utf-8');
    expect(adrContent).toContain('Dependentes liberados');

    const unblockPath = path.join(testDir, '.sdd', 'state', 'unblock-events.yaml');
    const unblock = await readYamlFile<Record<string, any>>(unblockPath);
    expect(unblock.events.some((event: any) => event.feature_id === 'FEAT-002')).toBe(true);

    const updatedBacklog = await readYamlFile<Record<string, any>>(backlogPath);
    const unlocked = updatedBacklog.items.find((item: any) => item.id === 'FEAT-002');
    expect(unlocked.status).toBe('READY');

    const unblockedViewPath = path.join(testDir, '.sdd', 'pendencias', 'unblocked.md');
    const unblockedView = await fs.readFile(unblockedViewPath, 'utf-8');
    expect(unblockedView).toContain('FEAT-002');
  });

  it('provides onboarding payload for system and feature', async () => {
    const start = await new SddStartCommand().execute(testDir, 'Implementar dashboard');
    const onboard = new SddOnboardCommand();

    const system = await onboard.execute(testDir, 'system');
    expect(system.target).toBe('system');
    expect(Array.isArray(system.read_order)).toBe(true);

    const feature = await onboard.execute(testDir, start.featureId);
    expect(feature.target).toBe(start.featureId);
    expect(Array.isArray(feature.proximos_passos)).toBe(true);
  });

  it('renders source inventory and ships built-in intake skills', async () => {
    const sourceIndexPath = path.join(testDir, '.sdd', 'state', 'source-index.yaml');
    const sourceIndex = await readYamlFile<Record<string, any>>(sourceIndexPath);
    sourceIndex.sources.push({
      id: 'SRC-001',
      type: 'prd',
      path: '.sdd/deposito/prds/produto.md',
      title: 'PRD inicial',
      status: 'INDEXED',
      summary: 'Escopo inicial do produto',
      imported_at: '2026-03-07T12:00:00.000Z',
      updated_at: '2026-03-07T12:00:00.000Z',
      used_by: ['RAD-001'],
      notes: ['fonte consolidada'],
      consolidation_targets: ['contexto', 'radar'],
    });
    await writeYamlFile(sourceIndexPath, sourceIndex);

    const report = await new SddCheckCommand().execute(testDir, { render: true });
    expect(report.valid).toBe(true);

    const fontes = await fs.readFile(path.join(testDir, '.sdd', 'core', 'fontes.md'), 'utf-8');
    expect(fontes).toContain('PRD inicial');
    expect(fontes).toContain('.sdd/deposito/prds/produto.md');

    const intakeSkill = await fs.readFile(
      path.join(testDir, '.sdd', 'skills', 'curated', 'source-intake-sdd', 'SKILL.md'),
      'utf-8'
    );
    expect(intakeSkill).toContain('.sdd/deposito/');
  });
});
