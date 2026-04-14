import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { collectCleanupTargets, runCleanup } from '../../scripts/cleanup.mjs';

async function exists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

describe('cleanup script', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opensdd-cleanup-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('remove apenas artefatos de build no modo padrao', async () => {
    await fs.mkdir(path.join(testDir, 'dist'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'coverage'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'pnpm-lock.yaml'), 'lock', 'utf-8');
    await fs.writeFile(path.join(testDir, 'cli.tsbuildinfo'), 'tsbuild', 'utf-8');
    await fs.writeFile(path.join(testDir, '.eslintcache'), 'cache', 'utf-8');
    await fs.writeFile(path.join(testDir, 'pnpm-debug.log'), 'debug', 'utf-8');

    const targets = await collectCleanupTargets(testDir, 'build');
    expect(targets).toContain('dist');
    expect(targets).toContain('coverage');
    expect(targets).toContain('cli.tsbuildinfo');
    expect(targets).toContain('.eslintcache');
    expect(targets).toContain('pnpm-debug.log');
    expect(targets).not.toContain('node_modules');
    expect(targets).not.toContain('pnpm-lock.yaml');

    const result = await runCleanup(testDir, 'build');
    expect(result.mode).toBe('build');
    expect(await exists(path.join(testDir, 'dist'))).toBe(false);
    expect(await exists(path.join(testDir, 'coverage'))).toBe(false);
    expect(await exists(path.join(testDir, 'cli.tsbuildinfo'))).toBe(false);
    expect(await exists(path.join(testDir, '.eslintcache'))).toBe(false);
    expect(await exists(path.join(testDir, 'pnpm-debug.log'))).toBe(false);
    expect(await exists(path.join(testDir, 'node_modules'))).toBe(true);
    expect(await exists(path.join(testDir, 'pnpm-lock.yaml'))).toBe(true);
  });

  it('remove dependencias e lockfiles no modo install', async () => {
    await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.vite'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'pnpm-lock.yaml'), 'lock', 'utf-8');
    await fs.writeFile(path.join(testDir, 'package-lock.json'), '{}', 'utf-8');
    await fs.writeFile(path.join(testDir, 'bun.lockb'), 'bun', 'utf-8');

    const result = await runCleanup(testDir, 'install');
    expect(result.mode).toBe('install');
    expect(result.removed).toEqual(
      expect.arrayContaining(['node_modules', '.vite', 'pnpm-lock.yaml', 'package-lock.json', 'bun.lockb'])
    );

    expect(await exists(path.join(testDir, 'node_modules'))).toBe(false);
    expect(await exists(path.join(testDir, '.vite'))).toBe(false);
    expect(await exists(path.join(testDir, 'pnpm-lock.yaml'))).toBe(false);
    expect(await exists(path.join(testDir, 'package-lock.json'))).toBe(false);
    expect(await exists(path.join(testDir, 'bun.lockb'))).toBe(false);
  });
});
