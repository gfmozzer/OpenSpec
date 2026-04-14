import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand } from '../../src/core/sdd/init.js';
import { assessSddMigration, CURRENT_SDD_STATE_VERSION, SddMigrateCommand } from '../../src/core/sdd/migrate.js';

describe('SddMigrateCommand', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-sdd-migrate-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
    await new SddInitCommand().execute(testDir, { render: false });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('detecta estado legado e converte IDs, referencias e arquivos para o formato canonico', async () => {
    const configPath = path.join(testDir, '.sdd', 'config.yaml');
    const discoveryPath = path.join(testDir, '.sdd', 'state', 'discovery-index.yaml');
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');

    const config = parseYaml(await fs.readFile(configPath, 'utf-8')) as Record<string, any>;
    delete config.state_version;
    await fs.writeFile(configPath, stringifyYaml(config), 'utf-8');

    const discovery = parseYaml(await fs.readFile(discoveryPath, 'utf-8')) as Record<string, any>;
    discovery.counters = {
      ...discovery.counters,
      RAD: 1,
      EPIC: 0,
      FEAT: 1,
    };
    discovery.records = [
      {
        id: 'RAD-001',
        type: 'RAD',
        title: 'Epic legado',
        status: 'APPROVED',
        related_ids: ['FEAT-001'],
      },
    ];
    await fs.writeFile(discoveryPath, stringifyYaml(discovery), 'utf-8');

    const backlog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    backlog.items = [
      {
        id: 'FEAT-001',
        title: 'Feature legado',
        status: 'READY',
        origin_type: 'radar',
        origin_ref: 'RAD-001',
        blocked_by: [],
        touches: [],
        lock_domains: [],
        recommended_skills: ['repo-context-bootstrap'],
        frontend_gap_refs: [],
        spec_refs: [],
      },
    ];
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const legacyWorkspace = path.join(testDir, '.sdd', 'active', 'FEAT-001');
    await fs.mkdir(legacyWorkspace, { recursive: true });
    await fs.writeFile(
      path.join(legacyWorkspace, 'contexto.md'),
      'Feature FEAT-001 originada de RAD-001',
      'utf-8'
    );

    const assessment = await assessSddMigration(testDir);
    expect(assessment.needsMigration).toBe(true);
    expect(assessment.legacyRecords).toContain('RAD-001');
    expect(assessment.conversions).toEqual(
      expect.arrayContaining([
        { from: 'RAD-001', to: 'EPIC-0001' },
        { from: 'FEAT-001', to: 'FEAT-0001' },
      ])
    );

    const result = await new SddMigrateCommand().execute(testDir, { radToEpic: true });
    expect(result.converted).toBeGreaterThanOrEqual(2);
    expect(result.assessment.currentVersion).toBe(CURRENT_SDD_STATE_VERSION);
    expect(result.assessment.needsMigration).toBe(false);

    const migratedConfig = parseYaml(await fs.readFile(configPath, 'utf-8')) as Record<string, any>;
    expect(migratedConfig.state_version).toBe(CURRENT_SDD_STATE_VERSION);
    expect(typeof migratedConfig.last_migrated_at).toBe('string');

    const migratedDiscovery = parseYaml(await fs.readFile(discoveryPath, 'utf-8')) as Record<string, any>;
    expect(migratedDiscovery.records[0].id).toBe('EPIC-0001');
    expect(migratedDiscovery.records[0].type).toBe('EPIC');
    expect(migratedDiscovery.records[0].related_ids).toContain('FEAT-0001');
    expect(migratedDiscovery.counters.RAD).toBe(0);
    expect(migratedDiscovery.counters.EPIC).toBeGreaterThanOrEqual(1);

    const migratedBacklog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    expect(migratedBacklog.items[0].id).toBe('FEAT-0001');
    expect(migratedBacklog.items[0].origin_type).toBe('epic');
    expect(migratedBacklog.items[0].origin_ref).toBe('EPIC-0001');

    await expect(fs.access(path.join(testDir, '.sdd', 'active', 'FEAT-0001', 'contexto.md'))).resolves.toBeUndefined();
    await expect(fs.access(legacyWorkspace)).rejects.toBeTruthy();

    const migratedWorkspaceContent = await fs.readFile(
      path.join(testDir, '.sdd', 'active', 'FEAT-0001', 'contexto.md'),
      'utf-8'
    );
    expect(migratedWorkspaceContent).toContain('FEAT-0001');
    expect(migratedWorkspaceContent).toContain('EPIC-0001');
  });
});
