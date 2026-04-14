import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand } from '../../src/core/sdd/init.js';
import { runCLI } from '../helpers/run-cli.js';

describe('sdd migration gate', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-sdd-gate-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
    await new SddInitCommand().execute(testDir, { render: false });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('autoaplica migracao mandatória em modo nao interativo antes do check', async () => {
    const configPath = path.join(testDir, '.sdd', 'config.yaml');
    const discoveryPath = path.join(testDir, '.sdd', 'state', 'discovery-index.yaml');
    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');

    const config = parseYaml(await fs.readFile(configPath, 'utf-8')) as Record<string, any>;
    delete config.state_version;
    await fs.writeFile(configPath, stringifyYaml(config), 'utf-8');

    const discovery = parseYaml(await fs.readFile(discoveryPath, 'utf-8')) as Record<string, any>;
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
        recommended_skills: [],
        frontend_gap_refs: [],
        spec_refs: [],
      },
    ];
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const result = await runCLI(['sdd', 'check'], { cwd: testDir, timeoutMs: 60000 });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('[sdd:migrate]');
    expect(result.stdout).toContain('Valido: sim');

    const migratedConfig = parseYaml(await fs.readFile(configPath, 'utf-8')) as Record<string, any>;
    expect(migratedConfig.state_version).toBe(2);

    const migratedBacklog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    expect(migratedBacklog.items[0].id).toBe('FEAT-0001');
    expect(migratedBacklog.items[0].origin_type).toBe('epic');
    expect(migratedBacklog.items[0].origin_ref).toBe('EPIC-0001');
  });
});
