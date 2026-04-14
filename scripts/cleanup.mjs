#!/usr/bin/env node

import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';

const CLEANUP_MODES = {
  build: {
    description: 'artefatos de build, caches locais e rastros de compilacao',
    patterns: [
      'dist',
      'coverage',
      '.turbo',
      '.cache',
      '.vite',
      '.vitest',
      '.eslintcache',
      '*.tsbuildinfo',
      '**/*.tsbuildinfo',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      '.pnpm-debug.log*',
    ],
  },
  install: {
    description: 'artefatos de build + dependencias, locks e rastros de instalacao',
    patterns: [
      'dist',
      'coverage',
      '.turbo',
      '.cache',
      '.vite',
      '.vitest',
      '.eslintcache',
      'node_modules',
      '*.tsbuildinfo',
      '**/*.tsbuildinfo',
      'pnpm-lock.yaml',
      'package-lock.json',
      'npm-shrinkwrap.json',
      'yarn.lock',
      'bun.lock',
      'bun.lockb',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      '.pnpm-debug.log*',
    ],
  },
};

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export async function collectCleanupTargets(cwd, mode = 'build') {
  const config = CLEANUP_MODES[mode];
  if (!config) {
    throw new Error(`Modo invalido: ${mode}. Use "build" ou "install".`);
  }

  const matches = await fg(config.patterns, {
    cwd,
    dot: true,
    onlyFiles: false,
    unique: true,
    ignore: ['.git/**'],
  });

  return uniqueSorted(matches);
}

export async function runCleanup(cwd, mode = 'build') {
  const config = CLEANUP_MODES[mode];
  if (!config) {
    throw new Error(`Modo invalido: ${mode}. Use "build" ou "install".`);
  }

  const targets = await collectCleanupTargets(cwd, mode);
  const removed = [];

  for (const target of targets) {
    await rm(path.resolve(cwd, target), {
      recursive: true,
      force: true,
      maxRetries: 2,
    });
    removed.push(target);
  }

  return {
    mode,
    description: config.description,
    removed,
  };
}

async function main() {
  const modeArg = process.argv[2];
  const mode = modeArg === 'install' ? 'install' : 'build';
  const result = await runCleanup(process.cwd(), mode);

  console.log(`Cleanup (${result.mode}) concluido.`);
  console.log(`Escopo: ${result.description}.`);

  if (result.removed.length === 0) {
    console.log('Nada para remover.');
    return;
  }

  console.log('Itens removidos:');
  for (const item of result.removed) {
    console.log(`- ${item}`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  main().catch(error => {
    console.error(`Falha no cleanup: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
