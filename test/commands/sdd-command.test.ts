import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { registerSddCommand } from '../../src/commands/sdd.js';

describe('sdd command registration', () => {
  it('exposes strict mode for sdd check', () => {
    const program = new Command();
    registerSddCommand(program);

    const sddCommand = program.commands.find((command) => command.name() === 'sdd');
    const checkCommand = sddCommand?.commands.find((command) => command.name() === 'check');

    expect(checkCommand?.options.some((option) => option.long === '--strict')).toBe(true);
  });
});
