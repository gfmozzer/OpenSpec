import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand } from '../../src/core/sdd/init.js';
import { SddCheckCommand } from '../../src/core/sdd/check.js';

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
});
