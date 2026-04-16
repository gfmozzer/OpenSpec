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
  SddFrontendImpactCommand,
  SddFrontendGapCommand,
  SddIngestDepositoCommand,
  SddInsightCommand,
  SddNextCommand,
  SddOnboardCommand,
  SddApproveCommand,
  SddSkillsInvokeCommand,
  SddSkillsSyncCommand,
  SddStartCommand,
} from '../../src/core/sdd/operations.js';
import * as lensesModule from '../../src/core/sdd/lenses.js';

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
    
    // We mock validateDocumentAgainstLens so our minimal template artifacts pass the new strict structural lenses.
    vi.spyOn(lensesModule, 'validateDocumentAgainstLens').mockReturnValue([]);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('executes discovery flow and creates backlog from radar', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Nova estrategia de autorizacao');
    expect(insight.id).toBe('INS-0001');

    const debate = await new SddDebateCommand().execute(testDir, insight.id, { agent: 'agente-a' });
    expect(debate.id).toBe('DEB-0001');
    const discoveryBeforeDecision = await readYamlFile<Record<string, any>>(
      path.join(testDir, '.sdd', 'state', 'discovery-index.yaml')
    );
    const debateRecord = discoveryBeforeDecision.records.find((record: any) => record.id === 'DEB-0001');
    expect(debateRecord.title).toMatch(/^Debate:/);
    expect(debateRecord.title_canonical).toBe('Nova estrategia de autorizacao');
    await completeDebateTemplate(testDir, debate.id);

    const decision = await new SddDecideCommand().execute(testDir, debate.id, 'radar', {
      rationale: 'Aprovado para planejamento',
    });
    expect(decision.radarId).toBe('EPIC-0001');
    const discoveryAfterDecision = await readYamlFile<Record<string, any>>(
      path.join(testDir, '.sdd', 'state', 'discovery-index.yaml')
    );
    const epicRecord = discoveryAfterDecision.records.find((record: any) => record.id === 'EPIC-0001');
    expect(epicRecord.title).toBe('Nova estrategia de autorizacao');

    const breakdown = await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      titles: ['API de autorizacao', 'Politicas por workspace'],
      mode: 'graph',
    });
    expect(breakdown.created).toEqual(['FEAT-0001', 'FEAT-0002']);

    const backlogRaw = parseYaml(
      await fs.readFile(path.join(testDir, '.sdd', 'state', 'backlog.yaml'), 'utf-8')
    ) as Record<string, any>;
    const feat2 = backlogRaw.items.find((item: any) => item.id === 'FEAT-0002');
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

    await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      mode: 'graph',
      titles: ['Modelo de permissao', 'API de autorizacao', 'Tela de permissoes'],
    });

    const next = await new SddNextCommand().execute(testDir);
    expect(next.ready.some((item) => item.id === 'FEAT-0001')).toBe(true);
    expect(next.blocked.some((item) => item.id === 'FEAT-0003')).toBe(true);
  });

  it('starts feature execution, creates change and finalizes', async () => {
    const start = await new SddStartCommand().execute(testDir, 'Implementar endpoint de auditoria');
    expect(start.featureId).toBe('FEAT-0001');
    expect(start.changeName.length).toBeGreaterThan(0);
    expect(start.active_path).toContain('.sdd/active/FEAT-0001');
    expect(start.generated_docs).toHaveLength(4);
    const tasksPath = path.join(testDir, '.sdd', 'active', 'FEAT-0001', '3-tasks.md');
    const tasksContent = await fs.readFile(tasksPath, 'utf-8');
    expect(tasksContent).toContain('AGENTS.md');
    expect(tasksContent).toContain('README.md');

    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', start.changeName);
    await fs.mkdir(archiveDir, { recursive: true });
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.frontend_impact_status = 'none';
    feat1.frontend_impact_reason = 'Mudanca interna sem impacto de interface para o usuario final.';
    await writeYamlFile(backlogPath, backlog);

    const finalize = await new SddFinalizeCommand().execute(testDir, { allReady: true });
    expect(finalize.finalized).toContain('FEAT-0001');

    const context = await new SddContextCommand().execute(testDir, 'FEAT-0001');
    expect(context.target_type).toBe('FEAT');
  });

  it('supports flow mode rigoroso with explicit gate approvals', async () => {
    const startCmd = new SddStartCommand();
    const approveCmd = new SddApproveCommand();
    const finalizeCmd = new SddFinalizeCommand();

    const started = await startCmd.execute(testDir, 'Entrega critica de permissao', {
      flowMode: 'rigoroso',
    });
    expect(started.flow_mode).toBe('rigoroso');

    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', started.changeName);
    await fs.mkdir(archiveDir, { recursive: true });

    const blockedFinalize = await finalizeCmd.execute(testDir, { allReady: true });
    expect(blockedFinalize.finalized).toHaveLength(0);
    expect(blockedFinalize.doc_warnings.some((warning) => warning.includes('modo rigoroso'))).toBe(true);

    await approveCmd.execute(testDir, 'FEAT-0001', 'proposta', { by: 'marina' });
    await approveCmd.execute(testDir, 'FEAT-0001', 'planejamento', { by: 'marina' });
    await approveCmd.execute(testDir, 'FEAT-0001', 'tarefas', { by: 'marina' });
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.frontend_impact_status = 'none';
    feat1.frontend_impact_reason = 'Entrega sem impacto visual no frontend, somente regra interna.';
    await writeYamlFile(backlogPath, backlog);

    const finalized = await finalizeCmd.execute(testDir, { allReady: true });
    expect(finalized.finalized).toContain('FEAT-0001');

    const context = await new SddContextCommand().execute(testDir, 'FEAT-0001');
    expect((context as any).flow_mode).toBe('rigoroso');
    expect((context as any).gates.proposta.status).toBe('aprovada');
  });

  it('creates active workspace docs with portuguese names in pt-BR layout', async () => {
    await new SddInitCommand().execute(testDir, { layout: 'pt-BR', render: false });
    const start = await new SddStartCommand().execute(testDir, 'Tela de atendimento');
    expect(start.generated_docs.some((doc) => doc.endsWith('1-especificacao.md'))).toBe(true);
    expect(start.generated_docs.some((doc) => doc.endsWith('2-planejamento.md'))).toBe(true);
    expect(start.generated_docs.some((doc) => doc.endsWith('3-tarefas.md'))).toBe(true);
    expect(start.generated_docs.some((doc) => doc.endsWith('4-historico.md'))).toBe(true);
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
      originFeature: 'FEAT-0777',
    });
    expect(created.id).toBe('FGAP-0001');

    const resolved = await gapCommand.resolve(testDir, 'FGAP-0001', {
      feature: 'FEAT-0002',
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
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-0002');
    feat1.status = 'READY';
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-0001'];
    await writeYamlFile(backlogPath, backlog);

    await expect(startCmd.execute(testDir, 'FEAT-0002')).rejects.toThrow(/blocked_by pendente/i);

    const forced = await startCmd.execute(testDir, 'FEAT-0002', { force: true });
    expect(forced.start_guardrails.forced).toBe(true);
    expect(forced.start_guardrails.blocked_check.ok).toBe(false);
    expect(forced.start_guardrails.blocked_check.unresolved).toContain('FEAT-0001');
  });

  it('enforces start guardrails for lock conflicts and supports --force', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Auth policy principal');

    await expect(startCmd.execute(testDir, 'Auth policy secundario')).rejects.toThrow(/lock conflict/i);

    const forced = await startCmd.execute(testDir, 'Auth policy fallback', { force: true });
    expect(forced.start_guardrails.forced).toBe(true);
    expect(forced.start_guardrails.lock_check.ok).toBe(false);
    expect(forced.start_guardrails.lock_check.conflicts).toContain('FEAT-0001');
  });

  it('returns context payload with graph constraints and readiness', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Base de dominio');
    await startCmd.execute(testDir, 'API dependente');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-0002');
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-0001'];
    feat2.parallel_group = 'radar-rad-001';
    feat2.planning_mode = 'direct_tasks';
    feat2.execution_kind = 'feature';
    feat2.lock_domains = ['auth-rules'];
    feat2.produces = ['capacidade-de-negocio'];
    feat2.consumes = ['modelo-de-dominio'];
    await writeYamlFile(backlogPath, backlog);

    const context = await new SddContextCommand().execute(testDir, 'FEAT-0002');
    expect((context as any).context_pack_version).toBe(1);
    expect((context as any).blocked_by).toEqual(['FEAT-0001']);
    expect((context as any).lock_domains).toEqual(['auth-rules']);
    expect((context as any).parallel_group).toBe('radar-rad-001');
    expect((context as any).planning_mode).toBe('direct_tasks');
    expect((context as any).execution_kind).toBe('feature');
    expect((context as any).readiness).toBe('BLOCKED');
    expect(Array.isArray((context as any).read_order)).toBe(true);
    expect((context as any).relevant_services).toBeDefined();
    expect((context as any).relevant_contracts).toBeDefined();
  });

  it('blocks finalize when frontend impact declaration is missing', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    const start = await new SddStartCommand().execute(testDir, 'Criar API de pedidos');
    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', start.changeName);
    await fs.mkdir(archiveDir, { recursive: true });

    const result = await new SddFinalizeCommand().execute(testDir, { ref: 'FEAT-0001' });
    expect(result.finalized).toHaveLength(0);
    expect(result.frontend_guardrails[0].blocked).toBe(true);
    expect(result.frontend_guardrails[0].declared_status).toBe('unknown');
  });

  it('blocks finalize when frontend_impact=none has invalid justification', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    const start = await new SddStartCommand().execute(testDir, 'Criar API de pedidos');
    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', start.changeName);
    await fs.mkdir(archiveDir, { recursive: true });

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.frontend_impact_status = 'none';
    feat1.frontend_impact_reason = 'curta';
    await writeYamlFile(backlogPath, backlog);

    const result = await new SddFinalizeCommand().execute(testDir, { ref: 'FEAT-0001' });
    expect(result.finalized).toHaveLength(0);
    expect(result.frontend_guardrails[0].reasons.some((reason: string) => reason.includes('justificativa'))).toBe(true);
  });

  it('blocks finalize when frontend_impact=none conflicts with metadata evidence', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    const start = await new SddStartCommand().execute(testDir, 'Criar API de pedidos');
    await new SddFrontendImpactCommand().execute(testDir, 'FEAT-0001', {
      status: 'none',
      reason: 'Mudanca puramente interna sem alteracao de interface para usuarios.',
    });
    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', start.changeName);
    await fs.mkdir(archiveDir, { recursive: true });

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.produces = ['route:/pedidos'];
    await writeYamlFile(backlogPath, backlog);

    const result = await new SddFinalizeCommand().execute(testDir, { ref: 'FEAT-0001' });
    expect(result.finalized).toHaveLength(0);
    expect(result.frontend_guardrails[0].reasons.some((reason: string) => reason.includes('contradiz'))).toBe(true);
  });

  it('allows finalize with --force-frontend and records audit warning', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    const start = await new SddStartCommand().execute(testDir, 'Criar API de pedidos');
    await new SddFrontendImpactCommand().execute(testDir, 'FEAT-0001', {
      status: 'none',
      reason: 'Mudanca puramente interna sem alteracao de interface para usuarios.',
    });
    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', start.changeName);
    await fs.mkdir(archiveDir, { recursive: true });

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.produces = ['route:/pedidos'];
    await writeYamlFile(backlogPath, backlog);

    const result = await new SddFinalizeCommand().execute(testDir, {
      ref: 'FEAT-0001',
      forceFrontend: true,
    });
    expect(result.finalized).toContain('FEAT-0001');
    expect(result.frontend_guardrails[0].forced).toBe(true);
  });

  it('blocks finalize when structural lens fails and allows with --force-transition', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    const start = await new SddStartCommand().execute(testDir, 'Criar API de testes transicionais');
    
    // Inject a fake lens validation error for this test
    vi.spyOn(lensesModule, 'validateDocumentAgainstLens').mockReturnValue(['Erro de estrutura fake introduzido']);

    const archiveDir = path.join(testDir, 'openspec', 'changes', 'archive', start.changeName);
    await fs.mkdir(archiveDir, { recursive: true });

    // Ensure frontend coverage doesn't block since we are testing lens block
    await new SddFrontendImpactCommand().execute(testDir, 'FEAT-0001', {
      status: 'none',
      reason: 'Sem frontend impact para teste.',
    });

    const resultBlocked = await new SddFinalizeCommand().execute(testDir, {
      ref: 'FEAT-0001'
    });
    expect(resultBlocked.finalized).not.toContain('FEAT-0001');
    expect(resultBlocked.doc_warnings.some((w: string) => w.includes('Transição de estado negada'))).toBe(true);
    expect(resultBlocked.doc_warnings.some((w: string) => w.includes('Erro de estrutura fake introduzido'))).toBe(true);

    const resultAllowed = await new SddFinalizeCommand().execute(testDir, {
      ref: 'FEAT-0001',
      forceTransition: true
    });
    expect(resultAllowed.finalized).toContain('FEAT-0001');
  });

  it('persists frontend-impact command and exposes fields in context', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    await new SddStartCommand().execute(testDir, 'Criar API de pedidos');
    const command = new SddFrontendImpactCommand();
    const updated = await command.execute(testDir, 'FEAT-0001', {
      status: 'required',
      reason: 'Entrega adiciona novas superficies de atendimento no frontend.',
      routes: ['/pedidos'],
      surfaces: ['menu:pedidos'],
    });
    expect(updated.frontend_impact_status).toBe('required');
    expect(updated.frontend_surface_tokens).toContain('route:/pedidos');
    expect(updated.frontend_surface_tokens).toContain('menu:pedidos');

    const context = await new SddContextCommand().execute(testDir, 'FEAT-0001');
    expect((context as any).frontend_impact_status).toBe('required');
    expect((context as any).frontend_surface_tokens).toContain('route:/pedidos');
  });

  it('supports breakdown incremental with rewire and cross-RAD dependency linking', async () => {
    await new SddStartCommand().execute(testDir, 'API de estoque');
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const seed = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    seed.status = 'READY';
    seed.produces = ['api-ou-contrato'];
    seed.origin_type = 'radar';
    seed.origin_ref = 'EPIC-0000';
    await writeYamlFile(backlogPath, backlog);

    const insight = await new SddInsightCommand().execute(testDir, 'Novo frontend de estoque');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await completeDebateTemplate(testDir, debate.id);
    await new SddDecideCommand().execute(testDir, debate.id, 'radar');

    const result = await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      mode: 'graph',
      incremental: true,
      dedupe: 'normal',
      titles: ['Tela de estoque'],
    });

    expect(result.created).toContain('FEAT-0002');
    expect(result.rewired_dependencies.some((entry) => entry.feature_id === 'FEAT-0002')).toBe(true);

    const updatedBacklog = await readYamlFile<Record<string, any>>(backlogPath);
    const created = updatedBacklog.items.find((item: any) => item.id === 'FEAT-0002');
    expect(created.blocked_by).toContain('FEAT-0001');
  });

  it('deduplicates breakdown by strict/normal and allows duplicates with off', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Projeto de usuarios');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await completeDebateTemplate(testDir, debate.id);
    await new SddDecideCommand().execute(testDir, debate.id, 'radar');

    const first = await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      mode: 'flat',
      dedupe: 'strict',
      titles: ['API de usuarios'],
    });
    expect(first.created).toEqual(['FEAT-0001']);

    const strictDuplicate = await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      mode: 'flat',
      dedupe: 'strict',
      titles: ['API de usuarios'],
    });
    expect(strictDuplicate.created).toHaveLength(0);
    expect(strictDuplicate.linked_existing).toContain('FEAT-0001');

    const normalDuplicate = await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      mode: 'flat',
      dedupe: 'normal',
      titles: ['Api usuarios'],
    });
    expect(normalDuplicate.created).toHaveLength(0);
    expect(normalDuplicate.linked_existing).toContain('FEAT-0001');

    const offDuplicate = await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      mode: 'flat',
      dedupe: 'off',
      titles: ['API de usuarios'],
    });
    expect(offDuplicate.created).toContain('FEAT-0002');
  });

  it('ranks next features by impact using dependent graph', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Tarefa base de schema');
    await startCmd.execute(testDir, 'Tarefa intermediaria');
    await startCmd.execute(testDir, 'Tarefa final');
    await startCmd.execute(testDir, 'Tarefa isolada');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);

    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-0002');
    const feat3 = backlog.items.find((item: any) => item.id === 'FEAT-0003');
    const feat4 = backlog.items.find((item: any) => item.id === 'FEAT-0004');
    feat1.status = 'READY';
    feat1.lock_domains = ['schema-change'];
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-0001'];
    feat3.status = 'BLOCKED';
    feat3.blocked_by = ['FEAT-0002'];
    feat4.status = 'READY';
    feat4.lock_domains = [];
    await writeYamlFile(backlogPath, backlog);

    const next = await new SddNextCommand().execute(testDir, { rank: 'impact', limit: 2 });
    expect(next.rank).toBe('impact');
    expect(next.ready[0].id).toBe('FEAT-0001');
    expect(next.ready[0].score).toBeGreaterThan(next.ready[1].score);
  });

  it('computes check progress global/by RAD and generates progress.md', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Entrega inicial');
    const debate = await new SddDebateCommand().execute(testDir, insight.id);
    await completeDebateTemplate(testDir, debate.id);
    await new SddDecideCommand().execute(testDir, debate.id, 'radar');
    await new SddBreakdownCommand().execute(testDir, 'EPIC-0001', {
      mode: 'flat',
      titles: ['API principal', 'Tela principal'],
    });

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.status = 'DONE';
    await writeYamlFile(backlogPath, backlog);

    const report = await new SddCheckCommand().execute(testDir, { render: true });
    expect(report.summary.progress_global.percent).toBe(50);
    expect(report.summary.progress_by_radar[0]).toMatchObject({
      radar_id: 'EPIC-0001',
      done: 1,
      total: 2,
      percent: 50,
    });

    const progressPath = path.join(testDir, '.sdd', 'pendencias', 'progress.md');
    const progressContent = await fs.readFile(progressPath, 'utf-8');
    expect(progressContent).toContain('EPIC-0001');
  });

  it('finalize generates ADR, unlock events and unblocked view', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Feature base');
    await startCmd.execute(testDir, 'Feature dependente');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    const feat2 = backlog.items.find((item: any) => item.id === 'FEAT-0002');
    feat1.status = 'IN_PROGRESS';
    feat2.status = 'BLOCKED';
    feat2.blocked_by = ['FEAT-0001'];
    feat1.frontend_impact_status = 'none';
    feat1.frontend_impact_reason = 'Entrega interna no backend sem alteracao de interface visual.';
    await writeYamlFile(backlogPath, backlog);

    const result = await new SddFinalizeCommand().execute(testDir, { ref: 'FEAT-0001' });
    expect(result.finalized).toContain('FEAT-0001');
    expect(result.unblocked).toContain('FEAT-0002');
    expect(Array.isArray(result.updated_core_docs)).toBe(true);

    const adrPath = path.join(testDir, '.sdd', 'core', 'adrs', 'ADR-FEAT-0001.md');
    const adrContent = await fs.readFile(adrPath, 'utf-8');
    expect(adrContent).toContain('Dependentes liberados');

    const unblockPath = path.join(testDir, '.sdd', 'state', 'unblock-events.yaml');
    const unblock = await readYamlFile<Record<string, any>>(unblockPath);
    expect(unblock.events.some((event: any) => event.feature_id === 'FEAT-0002')).toBe(true);

    const updatedBacklog = await readYamlFile<Record<string, any>>(backlogPath);
    const unlocked = updatedBacklog.items.find((item: any) => item.id === 'FEAT-0002');
    expect(unlocked.status).toBe('READY');

    const unblockedViewPath = path.join(testDir, '.sdd', 'pendencias', 'unblocked.md');
    const unblockedView = await fs.readFile(unblockedViewPath, 'utf-8');
    expect(unblockedView).toContain('FEAT-0002');
  });

  it('creates required ADR on start and does not overwrite existing ADR', async () => {
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Feature com ADR obrigatorio');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.status = 'READY';
    feat1.requires_adr = true;
    await writeYamlFile(backlogPath, backlog);

    await startCmd.execute(testDir, 'FEAT-0001');
    const adrPath = path.join(testDir, '.sdd', 'core', 'adrs', 'ADR-FEAT-0001.md');
    const adrContent = await fs.readFile(adrPath, 'utf-8');
    expect(adrContent).toContain('## Contexto');
    expect(adrContent).toContain('## Decisão');
    expect(adrContent).toContain('## Consequências');

    const specPath = path.join(testDir, '.sdd', 'active', 'FEAT-0001', '1-spec.md');
    const specContent = await fs.readFile(specPath, 'utf-8');
    expect(specContent).toContain('- ADR: .sdd/core/adrs/ADR-FEAT-0001.md');

    await fs.writeFile(adrPath, '# ADR FEAT-0001\n\nconteudo manual preservado', 'utf-8');
    const refreshed = await readYamlFile<Record<string, any>>(backlogPath);
    const refreshedFeat1 = refreshed.items.find((item: any) => item.id === 'FEAT-0001');
    refreshedFeat1.status = 'READY';
    refreshedFeat1.requires_adr = true;
    await writeYamlFile(backlogPath, refreshed);

    await startCmd.execute(testDir, 'FEAT-0001');
    const preserved = await fs.readFile(adrPath, 'utf-8');
    expect(preserved).toContain('conteudo manual preservado');
  });

  it('blocks finalize when required ADR has lens violations', async () => {
    vi.restoreAllMocks();
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Feature com enforce de ADR');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.status = 'READY';
    feat1.requires_adr = true;
    feat1.frontend_impact_status = 'none';
    feat1.frontend_impact_reason = 'Mudanca de backend sem superficie de frontend.';
    await writeYamlFile(backlogPath, backlog);

    await startCmd.execute(testDir, 'FEAT-0001');
    const adrPath = path.join(testDir, '.sdd', 'core', 'adrs', 'ADR-FEAT-0001.md');
    await fs.writeFile(
      adrPath,
      '# ADR FEAT-0001\n\n## Contexto\n(preencher contexto)\n\n## Decisão\n-\n\n## Consequências\n-',
      'utf-8'
    );

    const result = await new SddFinalizeCommand().execute(testDir, { ref: 'FEAT-0001' });
    expect(result.finalized).toHaveLength(0);
    expect(result.doc_warnings.some((warning) => warning.includes('ADR obrigatório inválido'))).toBe(true);
  });

  it('finalize auto-creates frontend gap for backend change without explicit coverage', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    const startCmd = new SddStartCommand();
    await startCmd.execute(testDir, 'Criar API de clientes');
    await new SddFrontendImpactCommand().execute(testDir, 'FEAT-0001', {
      status: 'required',
      reason: 'Nova rota de clientes exige cobertura de frontend posterior.',
      routes: ['/clientes'],
    });

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.produces = ['route:/clientes'];
    await writeYamlFile(backlogPath, backlog);

    const result = await new SddFinalizeCommand().execute(testDir, { ref: 'FEAT-0001', render: true });
    expect(result.finalized).toHaveLength(0);
    expect(Array.isArray(result.auto_frontend_gaps)).toBe(true);
    expect(result.auto_frontend_gaps.length).toBe(1);
    expect(result.frontend_guardrails[0].blocked).toBe(true);

    const frontendGapsPath = path.join(testDir, '.sdd', 'state', 'frontend-gaps.yaml');
    const frontendGaps = await readYamlFile<Record<string, any>>(frontendGapsPath);
    const createdGap = frontendGaps.items.find((item: any) => item.id === result.auto_frontend_gaps[0]);
    expect(createdGap).toBeDefined();
    expect(createdGap.origin_feature).toBe('FEAT-0001');
    expect(createdGap.route_targets).toContain('/clientes');
    expect(createdGap.origin_kind).toBe('automatic');

    const updatedBacklog = await readYamlFile<Record<string, any>>(backlogPath);
    const finalizedFeat = updatedBacklog.items.find((item: any) => item.id === 'FEAT-0001');
    expect(finalizedFeat.frontend_gap_refs).toContain(result.auto_frontend_gaps[0]);

    const sitemapPath = path.join(testDir, '.sdd', 'core', 'frontend-sitemap.md');
    const sitemap = await fs.readFile(sitemapPath, 'utf-8');
    expect(sitemap).toContain('/clientes');

    const resolvedViewPath = path.join(testDir, '.sdd', 'pendencias', 'frontend-gaps-resolvidos.md');
    const resolvedView = await fs.readFile(resolvedViewPath, 'utf-8');
    expect(resolvedView).toContain('Sem gaps resolvidos');
  });

  it('provides onboarding payload for system and feature', async () => {
    const start = await new SddStartCommand().execute(testDir, 'Implementar dashboard');
    const onboard = new SddOnboardCommand();

    const system = await onboard.execute(testDir, 'system');
    expect(system.target).toBe('system');
    expect(Array.isArray(system.read_order)).toBe(true);
    expect(Array.isArray(system.proximos_passos)).toBe(true);
    expect((system.proximos_passos as string[]).length).toBeGreaterThan(0);
    expect((system.proximos_passos as string[])[0]).toContain('sdd');

    const feature = await onboard.execute(testDir, start.featureId);
    expect(feature.target).toBe(start.featureId);
    expect(Array.isArray(feature.proximos_passos)).toBe(true);
  });

  it('onboard system suggests a new discovery cycle when backlog is done and no active radar exists', async () => {
    const discoveryPath = path.join(testDir, '.sdd', 'state', 'discovery-index.yaml');
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');

    const discovery = await readYamlFile<Record<string, any>>(discoveryPath);
    discovery.records = [
      {
        id: 'INS-0001',
        type: 'INS',
        title: 'Insight antigo',
        status: 'DEBATED',
        origin_prompt: '...',
        related_ids: ['DEB-0001'],
        created_at: '2026-03-08T00:00:00.000Z',
        updated_at: '2026-03-08T00:00:00.000Z',
      },
      {
        id: 'DEB-0001',
        type: 'DEB',
        title: 'Debate antigo',
        status: 'APPROVED',
        origin_prompt: '...',
        related_ids: ['INS-0001', 'EPIC-0001'],
        created_at: '2026-03-08T00:00:00.000Z',
        updated_at: '2026-03-08T00:00:00.000Z',
      },
      {
        id: 'EPIC-0001',
        type: 'RAD',
        title: 'Radar antigo',
        status: 'DONE',
        origin_prompt: '...',
        related_ids: ['DEB-0001'],
        created_at: '2026-03-08T00:00:00.000Z',
        updated_at: '2026-03-08T00:00:00.000Z',
      },
    ];
    await writeYamlFile(discoveryPath, discovery);

    const backlog = await readYamlFile<Record<string, any>>(backlogPath);
    backlog.items = [
      {
        id: 'FEAT-0001',
        title: 'Feature antiga',
        status: 'DONE',
        origin_type: 'radar',
        origin_ref: 'EPIC-0001',
        scale: 'STANDARD',
        summary: '',
        blocked_by: [],
        touches: [],
        lock_domains: [],
        parallel_group: '',
        execution_kind: 'feature',
        planning_mode: 'local_plan',
        acceptance_refs: [],
        produces: [],
        consumes: [],
        priority_score: 0,
        dependency_count: 0,
        agent_role: '',
        recommended_skills: [],
        change_name: '',
        branch_name: '',
        worktree_path: '',
        frontend_gap_refs: [],
        spec_refs: [],
        last_sync_at: '2026-03-08T00:00:00.000Z',
        archived_at: '',
        done_at: '2026-03-08T00:00:00.000Z',
        unblocked_at: '',
      },
    ];
    await writeYamlFile(backlogPath, backlog);

    const onboard = new SddOnboardCommand();
    const system = await onboard.execute(testDir, 'system');
    expect(Array.isArray(system.proximos_passos)).toBe(true);
    const steps = system.proximos_passos as string[];
    expect(steps[0]).toContain('sdd insight "Novo ciclo de melhoria');
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
      used_by: ['EPIC-0001'],
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

  it('ingests deposito sources and creates initial executable trail', async () => {
    await fs.writeFile(
      path.join(testDir, '.sdd', 'deposito', 'prds', 'PRD-inicial.md'),
      '# PRD Inicial\n\nSistema de agendamento para petshop com painel admin.',
      'utf-8'
    );
    await fs.writeFile(
      path.join(testDir, '.sdd', 'deposito', 'historias', 'jornadas.md'),
      'Como atendente, quero aprovar agendamento por loja.',
      'utf-8'
    );

    const result = await new SddIngestDepositoCommand().execute(testDir, {
      title: 'Planejamento inicial petshop',
      start: true,
      render: true,
    });

    expect(result.scanned_files).toBeGreaterThanOrEqual(2);
    expect(result.radar_id).toMatch(/^(?:EPIC|RAD)-\d{4,}$/);
    expect(result.created_features.length).toBeGreaterThan(0);
    expect(result.recommended_prompt).toContain('.sdd/prompts/01-ingestao-deposito.md');

    const sourceIndex = await readYamlFile<Record<string, any>>(
      path.join(testDir, '.sdd', 'state', 'source-index.yaml')
    );
    expect(sourceIndex.sources.length).toBeGreaterThanOrEqual(2);
    expect(sourceIndex.sources.some((source: any) => source.status === 'PLANNED')).toBe(true);

    const backlog = await readYamlFile<Record<string, any>>(
      path.join(testDir, '.sdd', 'state', 'backlog.yaml')
    );
    expect(backlog.items.length).toBeGreaterThan(0);

    if (result.started_feature_id) {
      expect(result.active_path).toContain('.sdd/active/');
      expect(result.generated_docs.length).toBeGreaterThan(0);
    }
  });

  it('builds a ready-to-use invocation prompt for selected skills', async () => {
    const result = await new SddSkillsInvokeCommand().execute(testDir, {
      ids: ['source-intake-sdd', 'planning-normalizer-sdd'],
      objective: 'Transformar documentos brutos em backlog executavel',
      ref: 'EPIC-0001',
    });

    expect(result.selected_skills).toHaveLength(2);
    expect(result.selected_skills[0].path).toContain('.sdd/skills');
    expect(result.prompt).toContain('Use as skills abaixo nesta ordem');
    expect(result.prompt).toContain('Transformar documentos brutos em backlog executavel');
    expect(result.prompt).toContain('EPIC-0001');
  });

  it('routes skills semantically using skill-routing.yaml based on feature touches', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    
    // Inject a custom routing config
    const routingPath = path.join(testDir, '.sdd', 'state', 'skill-routing.yaml');
    await fs.writeFile(routingPath, `version: 1
default_skills:
  - general-planning
routes:
  - domain: backend
    skills:
      - custom-backend-expert
      - nestjs-pro
  - domain: frontend
    skills:
      - custom-frontend-expert
`, 'utf-8');

    // Create a feature touching 'backend'
    const breakdown = new SddBreakdownCommand();
    const mockRadarId = 'EPIC-0009'; // Create a radar first
    const catalogPath = path.join(testDir, '.sdd', 'state', 'discovery-index.yaml');
    const discoveryObj = await readYamlFile<any>(catalogPath);
    discoveryObj.records.push({
      id: mockRadarId,
      type: 'EPIC',
      title: 'Backend Epic',
      status: 'READY'
    });
    await fs.writeFile(catalogPath, JSON.stringify(discoveryObj), 'utf-8');

    await breakdown.execute(testDir, mockRadarId, {
      titles: ['Implementar backend de autenticacao']
    });

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlogObj = await readYamlFile<any>(backlogPath);
    const backendFeat = backlogObj.items[backlogObj.items.length - 1];

    expect(backendFeat.touches).toContain('backend');
    expect(backendFeat.recommended_skills).toContain('custom-backend-expert');
    expect(backendFeat.recommended_skills).toContain('nestjs-pro');
    expect(backendFeat.recommended_skills).not.toContain('general-planning');
  });
});
