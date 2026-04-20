import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand } from '../../src/core/sdd/init.js';
import { SddCheckCommand } from '../../src/core/sdd/check.js';
import { SddStartCommand } from '../../src/core/sdd/operations.js';

describe('SddCheckCommand', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `openspec-sdd-check-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
    await fs.mkdir(testDir, { recursive: true });
    await new SddInitCommand().execute(testDir, { render: false });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('passes validation for a fresh initialized structure', async () => {
    const report = await new SddCheckCommand().execute(testDir, { render: true });
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.summary.backlog).toBe(0);
    expect(report.summary.documentation_sync).toBe(true);
    expect(report.summary.core_views_stale).toBe(false);
  });

  it('warns when root agent documentation blocks are missing', async () => {
    await fs.writeFile(path.join(testDir, 'AGENTS.md'), '# AGENTS\n', 'utf-8');
    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.summary.documentation_sync).toBe(false);
    expect(report.warnings.some((warning) => warning.includes('AGENTS.md::SDD:ROOT-AGENTS'))).toBe(
      true
    );
  });

  it('fails when required state file is missing', async () => {
    await fs.rm(path.join(testDir, '.sdd', 'state', 'tech-debt.yaml'));
    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.includes('tech-debt.yaml'))).toBe(true);
  });

  it('fails when config uses a non-canonical planning folder', async () => {
    const configPath = path.join(testDir, 'openspec', 'config.yaml');
    const config = parseYaml(await fs.readFile(configPath, 'utf-8')) as Record<string, any>;
    config.sdd.folders.planning = 'backlog/features';
    await fs.writeFile(configPath, stringifyYaml(config), 'utf-8');

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.includes('folders fora do canonico'))).toBe(true);
    expect(report.errors.some((e) => e.includes('backlog/features'))).toBe(true);
  });

  it('fails when non-canonical backlog directories exist inside .sdd', async () => {
    await fs.mkdir(path.join(testDir, '.sdd', 'backlog', 'features'), { recursive: true });

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.includes('.sdd/backlog'))).toBe(true);
    expect(report.errors.some((e) => e.toLowerCase().includes('backlog de features deve existir apenas'))).toBe(
      true
    );
  });

  it('fails when backlog contains invalid FEAT id', async () => {
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    backlog.items = [
      {
        id: 'BAD-001',
        title: 'Invalid id',
        status: 'READY',
        origin_type: 'direct',
        blocked_by: [],
        touches: [],
        lock_domains: [],
        recommended_skills: [],
        frontend_gap_refs: [],
        spec_refs: [],
      },
    ];
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.includes('Schema de estado invalido'))).toBe(true);
  });

  it('reports frontend coverage sync gaps when declaration is missing', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    await new SddStartCommand().execute(testDir, 'Criar API de clientes');

    const report = await new SddCheckCommand().execute(testDir, { render: true });
    expect(report.summary.frontend_coverage_sync).toBe(false);
    expect(report.summary.features_missing_frontend_declaration).toContain('FEAT-0001');
  });

  it('does not flag frontend-decisions as missing when there is no evidencia de frontend', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.summary.missing_architecture_fields).not.toContain('frontend-decisions.items vazio');
  });

  it('flags frontend-decisions as missing when frontend evidence exists and no decision was registrada', async () => {
    await new SddInitCommand().execute(testDir, { frontendEnabled: true, render: false });
    await new SddStartCommand().execute(testDir, 'Criar experiencia de pedidos');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.produces = ['route:/pedidos'];
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.summary.missing_architecture_fields).toContain('frontend-decisions.items vazio');
  });

  it('warns when a feature is in progress without active workspace', async () => {
    await new SddStartCommand().execute(testDir, 'Entrega operacional');
    await fs.rm(path.join(testDir, '.sdd', 'active', 'FEAT-0001'), { recursive: true, force: true });

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.warnings.some((warning) => warning.includes('IN_PROGRESS sem workspace ativo'))).toBe(true);
  });

  it('warns when a done feature still remains in active workspace', async () => {
    await new SddStartCommand().execute(testDir, 'Entrega concluida');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    const feat1 = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat1.status = 'DONE';
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.warnings.some((warning) => warning.includes('concluida ainda presente em .sdd/active'))).toBe(true);
  });

  it('fails when EPIC or FEAT titles contain forbidden semantic prefixes/placeholders', async () => {
    const discoveryPath = path.join(testDir, '.sdd', 'state', 'discovery-index.yaml');
    const discovery = parseYaml(await fs.readFile(discoveryPath, 'utf-8')) as Record<string, any>;
    discovery.records = [
      {
        id: 'EPIC-0001',
        type: 'EPIC',
        title: 'Debate: titulo legado',
        status: 'READY',
        related_ids: [],
      },
    ];
    await fs.writeFile(discoveryPath, stringifyYaml(discovery), 'utf-8');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    backlog.items = [
      {
        id: 'FEAT-0001',
        title: 'Insight: titulo invalido',
        status: 'READY',
        origin_type: 'direct',
        blocked_by: [],
        touches: [],
        lock_domains: [],
        recommended_skills: [],
        frontend_gap_refs: [],
        spec_refs: [],
      },
    ];
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const report = await new SddCheckCommand().execute(testDir, { render: false });
    expect(report.valid).toBe(false);
    expect(report.errors.some((error) => error.includes('EPIC EPIC-0001 possui titulo invalido'))).toBe(true);
    expect(report.errors.some((error) => error.includes('FEAT FEAT-0001 possui titulo invalido'))).toBe(true);
  });

  it('warns on referential integrity issues by default and fails them in strict mode', async () => {
    const discoveryPath = path.join(testDir, '.sdd', 'state', 'discovery-index.yaml');
    const discovery = parseYaml(await fs.readFile(discoveryPath, 'utf-8')) as Record<string, any>;
    discovery.records = [
      {
        id: 'EPIC-0001',
        type: 'EPIC',
        title: 'Epic com referencia quebrada',
        status: 'READY',
        related_ids: ['FEAT-9999'],
      },
    ];
    await fs.writeFile(discoveryPath, stringifyYaml(discovery), 'utf-8');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    backlog.items = [
      {
        id: 'FEAT-0001',
        title: 'Feature com referencias cruzadas',
        status: 'READY',
        origin_type: 'epic',
        origin_ref: 'EPIC-9999',
        blocked_by: ['FEAT-9999'],
        touches: [],
        lock_domains: [],
        recommended_skills: [],
        frontend_gap_refs: [],
        spec_refs: [],
      },
    ];
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const finalizePath = path.join(testDir, '.sdd', 'state', 'finalize-queue.yaml');
    const finalizeQueue = parseYaml(await fs.readFile(finalizePath, 'utf-8')) as Record<string, any>;
    finalizeQueue.items = [
      {
        feature_id: 'FEAT-9999',
        status: 'DONE',
      },
    ];
    await fs.writeFile(finalizePath, stringifyYaml(finalizeQueue), 'utf-8');

    const unblockPath = path.join(testDir, '.sdd', 'state', 'unblock-events.yaml');
    const unblockEvents = parseYaml(await fs.readFile(unblockPath, 'utf-8')) as Record<string, any>;
    unblockEvents.events = [
      {
        feature_id: 'FEAT-0001',
        unblocked_by: 'FEAT-9999',
        status: 'NEW',
      },
    ];
    await fs.writeFile(unblockPath, stringifyYaml(unblockEvents), 'utf-8');

    const defaultReport = await new SddCheckCommand().execute(testDir, { render: false });
    expect(defaultReport.valid).toBe(true);
    expect(defaultReport.errors).toHaveLength(0);
    expect(
      defaultReport.warnings.some((warning) =>
        warning.includes('[LEGACY] FEAT FEAT-0001 aponta para origin_ref="EPIC-9999"')
      )
    ).toBe(true);
    expect(
      defaultReport.warnings.some((warning) =>
        warning.includes('[LEGACY] Discovery EPIC-0001 tem related_id="FEAT-9999"')
      )
    ).toBe(true);
    expect(
      defaultReport.warnings.some((warning) =>
        warning.includes('[LEGACY] Fila de Finalize possui entrada para feature_id="FEAT-9999"')
      )
    ).toBe(true);
    expect(
      defaultReport.warnings.some((warning) =>
        warning.includes('[LEGACY] Unblock event disparado por unblocked_by="FEAT-9999"')
      )
    ).toBe(true);

    const strictReport = await new SddCheckCommand().execute(testDir, {
      render: false,
      strict: true,
    });
    expect(strictReport.valid).toBe(false);
    expect(
      strictReport.errors.some((error) =>
        error.includes('FEAT FEAT-0001 aponta para origin_ref="EPIC-9999"')
      )
    ).toBe(true);
    expect(
      strictReport.errors.some((error) =>
        error.includes('Discovery EPIC-0001 tem related_id="FEAT-9999"')
      )
    ).toBe(true);
    expect(
      strictReport.errors.some((error) =>
        error.includes('Fila de Finalize possui entrada para feature_id="FEAT-9999"')
      )
    ).toBe(true);
    expect(
      strictReport.errors.some((error) =>
        error.includes('Unblock event disparado por unblocked_by="FEAT-9999"')
      )
    ).toBe(true);
  });
});
