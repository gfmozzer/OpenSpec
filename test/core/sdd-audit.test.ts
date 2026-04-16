import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { SddInitCommand } from '../../src/core/sdd/init.js';
import {
  SddAuditCommand,
  SddDebateCommand,
  SddInsightCommand,
  SddStartCommand,
} from '../../src/core/sdd/operations.js';
import * as lensesModule from '../../src/core/sdd/lenses.js';

describe('sdd audit', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(
      os.tmpdir(),
      `openspec-sdd-audit-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
    await fs.mkdir(testDir, { recursive: true });
    await new SddInitCommand().execute(testDir, { render: false });
    vi.spyOn(lensesModule, 'validateDocumentAgainstLens').mockReturnValue([]);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('returns a healthy report when there is no evidence of quality drift', async () => {
    const result = await new SddAuditCommand().execute(testDir);

    expect(result.healthy).toBe(true);
    expect(result.should_open_insight).toBe(false);
    expect(result.metrics.artifacts_without_placeholder.percent).toBe(100);
    expect(result.metrics.debates_with_real_deliberation.percent).toBe(100);
    expect(result.metrics.adrs_generated_vs_expected.percent).toBe(100);
    expect(result.metrics.forced_transitions.total).toBe(0);
  });

  it('detects placeholders, weak deliberation, missing ADR and forced transitions', async () => {
    const insight = await new SddInsightCommand().execute(testDir, 'Debater hardening de qualidade');
    await new SddDebateCommand().execute(testDir, insight.id);
    await new SddStartCommand().execute(testDir, 'Implementar comando de auditoria');

    const changelogPath = path.join(testDir, '.sdd', 'active', 'FEAT-0001', '4-changelog.md');
    await fs.appendFile(changelogPath, '\n- Execucao com --force-transition em ambiente controlado.\n');

    const backlogPath = path.join(testDir, '.sdd', 'state', 'backlog.yaml');
    const backlog = parseYaml(await fs.readFile(backlogPath, 'utf-8')) as Record<string, any>;
    const feat = backlog.items.find((item: any) => item.id === 'FEAT-0001');
    feat.requires_adr = true;
    await fs.writeFile(backlogPath, stringifyYaml(backlog), 'utf-8');

    const result = await new SddAuditCommand().execute(testDir);

    expect(result.metrics.artifacts_without_placeholder.percent).toBeLessThan(100);
    expect(result.metrics.debates_with_real_deliberation.total).toBeGreaterThan(0);
    expect(result.metrics.debates_with_real_deliberation.ok).toBe(0);
    expect(result.metrics.adrs_generated_vs_expected.total).toBe(1);
    expect(result.metrics.adrs_generated_vs_expected.ok).toBe(0);
    expect(result.metrics.forced_transitions.total).toBeGreaterThanOrEqual(1);
    expect(result.metrics.forced_transitions.feature_refs).toContain('FEAT-0001');
    expect(result.score).toBeLessThan(100);
  });
});

