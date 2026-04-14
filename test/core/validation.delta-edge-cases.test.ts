import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Validator } from '../../src/core/validation/validator.js';

describe('Validator edge cases', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'opensdd-validator-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('validateSpecContent falha em strict mode quando ha warning', async () => {
    const validator = new Validator(true);
    const content = `# Test Spec

## Purpose
Curto

## Requirements

### Requirement: Foo SHALL exist
The system SHALL do something.

#### Scenario: Works
Given a precondition
When an action happens
Then a result is shown`;

    const report = await validator.validateSpecContent('test-spec', content);

    expect(report.valid).toBe(false);
    expect(report.summary.errors).toBe(0);
    expect(report.summary.warnings).toBeGreaterThan(0);
  });

  it('enriquece erro de topo para change sem secoes obrigatorias', async () => {
    const changePath = path.join(tempRoot, 'openspec', 'changes', 'missing-sections', 'proposal.md');
    await fs.mkdir(path.dirname(changePath), { recursive: true });
    await fs.writeFile(changePath, '# Change: Missing Sections\n');

    const validator = new Validator();
    const report = await validator.validateChange(changePath);

    expect(report.valid).toBe(false);
    const message = report.issues.map(issue => issue.message).join('\n');
    expect(message).toContain('Change must have a Why section');
    expect(message).toContain('Expected headers: "## Why" and "## What Changes"');
  });

  it('detecta secoes delta vazias sem requirements parseadas', async () => {
    const changeDir = path.join(tempRoot, 'openspec', 'changes', 'empty-deltas');
    const specDir = path.join(changeDir, 'specs', 'auth');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `# Auth Spec

## ADDED Requirements

## REMOVED Requirements
`
    );

    const validator = new Validator(true);
    const report = await validator.validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    expect(report.issues.some(issue => issue.message.includes('were found, but no requirement entries parsed'))).toBe(true);
    expect(report.issues.some(issue => issue.message.includes('No delta sections found'))).toBe(false);
  });

  it('detecta ausencia total de secoes delta', async () => {
    const changeDir = path.join(tempRoot, 'openspec', 'changes', 'missing-delta-sections');
    const specDir = path.join(changeDir, 'specs', 'billing');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `# Billing Spec

Notas soltas sem cabeçalhos delta.
`
    );

    const validator = new Validator(true);
    const report = await validator.validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    expect(report.issues.some(issue => issue.message.includes('No delta sections found.'))).toBe(true);
    expect(report.issues.some(issue => issue.message.includes('Ensure your change has a specs/ directory'))).toBe(true);
  });

  it('detecta conflitos entre secoes e renomeacoes invalidas', async () => {
    const changeDir = path.join(tempRoot, 'openspec', 'changes', 'conflicts');
    const specDir = path.join(changeDir, 'specs', 'orders');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `# Orders Spec

## ADDED Requirements

### Requirement: New Name
The system SHALL add a renamed requirement target.

#### Scenario: Added target
Given a request
When it runs
Then it succeeds

## MODIFIED Requirements

### Requirement: Old Name
The system SHALL modify an old requirement.

#### Scenario: Modified source
Given a request
When it changes
Then it is persisted

## RENAMED Requirements

- FROM: \`### Requirement: Old Name\`
- TO: \`### Requirement: New Name\`
`
    );

    const validator = new Validator(true);
    const report = await validator.validateChangeDeltaSpecs(changeDir);

    expect(report.valid).toBe(false);
    expect(report.issues.some(issue => issue.message.includes('MODIFIED references old name from RENAMED'))).toBe(true);
    expect(report.issues.some(issue => issue.message.includes('RENAMED TO collides with ADDED'))).toBe(true);
  });
});
