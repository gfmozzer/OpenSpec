import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { ShowCommand } from '../../src/commands/show.js';
import { SpecCommand } from '../../src/commands/spec.js';
import { ValidateCommand } from '../../src/commands/validate.js';
import { ChangeCommand } from '../../src/commands/change.js';
import { Validator } from '../../src/core/validation/validator.js';
import * as matchUtils from '../../src/utils/match.js';

describe('source command coverage', () => {
  let tempRoot: string;
  let originalCwd: string;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'opensdd-source-commands-'));
    originalCwd = process.cwd();
    process.chdir(tempRoot);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempRoot, { recursive: true, force: true });
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('ShowCommand imprime hint em modo não interativo sem item', async () => {
    const command = new ShowCommand();

    await command.execute(undefined, { noInteractive: true });

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Nothing to show. Try one of:');
  });

  it('ShowCommand detecta ambiguidade entre change e spec e sugere --type', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'changes', 'shared'), { recursive: true });
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'shared'), { recursive: true });
    await fs.writeFile(path.join(tempRoot, 'openspec', 'changes', 'shared', 'proposal.md'), '# Shared');
    await fs.writeFile(path.join(tempRoot, 'openspec', 'specs', 'shared', 'spec.md'), '## Purpose\nLong enough purpose section.\n\n## Requirements\n\n### Requirement: Foo SHALL exist\nThe system SHALL do foo.\n\n#### Scenario: Foo\nGiven x\nWhen y\nThen z');

    const command = new ShowCommand();
    await command.execute('shared', { noInteractive: true });

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Ambiguous item'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--type change|spec'));
  });

  it('ShowCommand encaminha para ChangeCommand e avisa sobre flags irrelevantes', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'changes', 'demo'), { recursive: true });
    await fs.writeFile(path.join(tempRoot, 'openspec', 'changes', 'demo', 'proposal.md'), '# Demo');
    const changeShowSpy = vi.spyOn(ChangeCommand.prototype, 'show').mockResolvedValue(undefined);

    const command = new ShowCommand();
    await command.execute('demo', { type: 'change', requirements: true, noInteractive: true });

    expect(changeShowSpy).toHaveBeenCalledWith('demo', expect.objectContaining({ requirements: true }));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Warning: Ignoring flags not applicable to change: requirements'
    );
  });

  it('SpecCommand mostra JSON filtrado por requirement e sem cenários', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'specs', 'auth', 'spec.md'),
      `## Purpose
This purpose is intentionally long enough to avoid validation brevity warnings.

## Requirements

### Requirement: User Authentication
The system SHALL authenticate users securely.

#### Scenario: Successful login
Given valid credentials
When the login is submitted
Then access is granted

### Requirement: Password Reset
The system SHALL support password reset.

#### Scenario: Reset email
Given a registered email
When reset is requested
Then a reset link is sent`
    );

    const command = new SpecCommand();
    await command.show('auth', { json: true, requirement: '2', scenarios: false });

    const output = consoleLogSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.requirementCount).toBe(1);
    expect(parsed.requirements[0].text).toContain('password reset');
    expect(parsed.requirements[0].scenarios).toEqual([]);
  });

  it('SpecCommand em modo texto faz passthrough do markdown bruto', async () => {
    const rawSpec = `## Purpose
Texto cru para validar passthrough.

## Requirements

### Requirement: Raw output
The system SHALL keep formatting.

#### Scenario: Keep markdown
Given markdown
When the command runs
Then the raw file is printed`;

    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'raw'), { recursive: true });
    await fs.writeFile(path.join(tempRoot, 'openspec', 'specs', 'raw', 'spec.md'), rawSpec);

    const command = new SpecCommand();
    await command.show('raw', {});

    expect(consoleLogSpy).toHaveBeenCalledWith(rawSpec);
  });

  it('SpecCommand falha quando --requirements e --requirement são usados juntos', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'specs', 'auth', 'spec.md'),
      `## Purpose
This purpose is intentionally long enough to avoid validation brevity warnings.

## Requirements

### Requirement: User Authentication
The system SHALL authenticate users securely.

#### Scenario: Successful login
Given valid credentials
When the login is submitted
Then access is granted`
    );

    const command = new SpecCommand();

    await expect(
      command.show('auth', { json: true, requirements: true, requirement: '1' })
    ).rejects.toThrow('Options --requirements and --requirement cannot be used together');
  });

  it('SpecCommand falha com índice de requirement inválido', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'specs', 'auth', 'spec.md'),
      `## Purpose
This purpose is intentionally long enough to avoid validation brevity warnings.

## Requirements

### Requirement: User Authentication
The system SHALL authenticate users securely.

#### Scenario: Successful login
Given valid credentials
When the login is submitted
Then access is granted`
    );

    const command = new SpecCommand();

    await expect(command.show('auth', { json: true, requirement: '9' })).rejects.toThrow(
      'Requirement 9 not found'
    );
  });

  it('SpecCommand falha quando o spec não existe', async () => {
    const command = new SpecCommand();

    await expect(command.show('missing-spec', { json: true })).rejects.toThrow(
      "Spec 'missing-spec' not found at openspec/specs/missing-spec/spec.md"
    );
  });

  it('ValidateCommand imprime hint sem item nem flags em modo não interativo', async () => {
    const command = new ValidateCommand();

    await command.execute(undefined, { noInteractive: true });

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Nothing to validate. Try one of:');
  });

  it('ValidateCommand sugere correspondências para item desconhecido', async () => {
    const command = new ValidateCommand();
    vi.spyOn(matchUtils, 'nearestMatches').mockReturnValue(['auth']);
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(path.join(tempRoot, 'openspec', 'specs', 'auth', 'spec.md'), '## Purpose\nA long enough purpose section for parsing.\n\n## Requirements\n\n### Requirement: Auth SHALL exist\nThe system SHALL exist.\n\n#### Scenario: Test\nGiven x\nWhen y\nThen z');

    await command.execute('auh', { noInteractive: true });

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Unknown item 'auh'");
    expect(consoleErrorSpy).toHaveBeenCalledWith('Did you mean: auth?');
  });

  it('ValidateCommand valida um spec e retorna saída JSON estruturada', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'specs', 'auth', 'spec.md'),
      `## Purpose
This purpose is intentionally long enough to avoid validation brevity warnings.

## Requirements

### Requirement: User Authentication
The system SHALL authenticate users securely.

#### Scenario: Successful login
Given valid credentials
When the login is submitted
Then access is granted`
    );

    const command = new ValidateCommand();
    await command.execute('auth', { type: 'spec', json: true, noInteractive: true });

    const output = consoleLogSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].type).toBe('spec');
    expect(parsed.items[0].valid).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it('ValidateCommand detecta ambiguidade entre change e spec sem --type', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'changes', 'shared'), { recursive: true });
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'shared'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'changes', 'shared', 'proposal.md'),
      '# Change: Shared'
    );
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'specs', 'shared', 'spec.md'),
      `## Purpose
This purpose is intentionally long enough to avoid validation brevity warnings.

## Requirements

### Requirement: Shared
The system SHALL support shared ids.

#### Scenario: Shared path
Given a duplicated id
When validation runs
Then ambiguity is reported`
    );

    const command = new ValidateCommand();
    await command.execute('shared', { noInteractive: true });

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Ambiguous item 'shared' matches both a change and a spec."
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Pass --type change|spec')
    );
  });

  it('ValidateCommand retorna resumo vazio em bulk JSON quando não há itens', async () => {
    const command = new ValidateCommand();

    await command.execute(undefined, { specs: true, json: true, noInteractive: true });

    const output = consoleLogSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.items).toEqual([]);
    expect(parsed.summary.totals).toEqual({ items: 0, passed: 0, failed: 0 });
    expect(parsed.summary.byType.spec).toEqual({ items: 0, passed: 0, failed: 0 });
    expect(process.exitCode).toBe(0);
  });

  it('ValidateCommand executa bulk misto e consolida totais por tipo', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'changes', 'chg-1'), { recursive: true });
    await fs.mkdir(path.join(tempRoot, 'openspec', 'specs', 'spec-1'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'changes', 'chg-1', 'proposal.md'),
      '# Change: Bulk'
    );
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'specs', 'spec-1', 'spec.md'),
      `## Purpose
This purpose is intentionally long enough to avoid validation brevity warnings.

## Requirements

### Requirement: Bulk
The system SHALL validate in bulk.

#### Scenario: Bulk path
Given a spec
When bulk validation runs
Then totals are consolidated`
    );

    vi.spyOn(Validator.prototype, 'validateChangeDeltaSpecs').mockResolvedValue({
      valid: false,
      issues: [{ level: 'ERROR', path: 'proposal.md', message: 'invalid change' }],
    } as any);
    vi.spyOn(Validator.prototype, 'validateSpec').mockResolvedValue({
      valid: true,
      issues: [],
    } as any);

    const command = new ValidateCommand();
    await command.execute(undefined, { all: true, json: true, noInteractive: true, concurrency: '1' });

    const output = consoleLogSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.summary.totals).toEqual({ items: 2, passed: 1, failed: 1 });
    expect(parsed.summary.byType.change).toEqual({ items: 1, passed: 0, failed: 1 });
    expect(parsed.summary.byType.spec).toEqual({ items: 1, passed: 1, failed: 0 });
    expect(process.exitCode).toBe(1);
  });

  it('ChangeCommand list informa ausência de itens', async () => {
    const command = new ChangeCommand();

    await command.list({});

    expect(consoleLogSpy).toHaveBeenCalledWith('No items found');
  });

  it('ChangeCommand validate imprime next steps ao encontrar problemas', async () => {
    await fs.mkdir(path.join(tempRoot, 'openspec', 'changes', 'broken'), { recursive: true });
    await fs.writeFile(
      path.join(tempRoot, 'openspec', 'changes', 'broken', 'proposal.md'),
      '# Change: Broken'
    );

    vi.spyOn(Validator.prototype, 'validateChangeDeltaSpecs').mockResolvedValue({
      valid: false,
      issues: [{ level: 'ERROR', path: 'proposal.md', message: 'missing delta' }],
    } as any);

    const command = new ChangeCommand();
    await command.validate('broken', {});

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Change "broken" has issues');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Next steps:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Each requirement MUST include at least one #### Scenario: block')
    );
  });
});
