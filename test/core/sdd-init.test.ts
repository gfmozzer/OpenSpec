import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand } from '../../src/core/sdd/init.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe('SddInitCommand', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-sdd-init-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('creates .sdd baseline files and updates openspec/config.yaml', async () => {
    const command = new SddInitCommand();
    await command.execute(testDir);

    expect(await exists(path.join(testDir, '.sdd'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'discovery-index.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'backlog.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'tech-debt.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'finalize-queue.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'skill-catalog.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'index.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'pendencias', 'backlog-features.md'))).toBe(true);

    const projectConfig = await fs.readFile(path.join(testDir, 'openspec', 'config.yaml'), 'utf-8');
    const parsed = parseYaml(projectConfig) as Record<string, any>;
    expect(parsed.sdd).toBeDefined();
    expect(parsed.sdd.enabled).toBe(true);
    expect(parsed.sdd.memoryDir).toBe('.sdd');
    expect(parsed.sdd.frontend.enabled).toBe(false);

    // Frontend files should not exist by default
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-gaps.yaml'))).toBe(false);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-map.yaml'))).toBe(false);
  });

  it('creates frontend state files when frontend module is enabled', async () => {
    const command = new SddInitCommand();
    const result = await command.execute(testDir, { frontendEnabled: true });

    expect(result.frontendEnabled).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-gaps.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'state', 'frontend-map.yaml'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'core', 'frontend-map.md'))).toBe(true);
    expect(await exists(path.join(testDir, '.sdd', 'pendencias', 'frontend-gaps.md'))).toBe(true);
  });

  it('is idempotent and does not overwrite existing state files', async () => {
    const command = new SddInitCommand();
    await command.execute(testDir);

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlogRaw = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    backlogRaw.items = [
      {
        id: 'FEAT-001',
        title: 'Existing item',
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
    await fs.writeFile(backlogPath, stringifyYaml(backlogRaw), 'utf-8');

    await command.execute(testDir);
    const updated = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].id).toBe('FEAT-001');
  });
});
