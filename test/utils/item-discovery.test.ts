import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  getActiveChangeIds,
  getArchivedChangeIds,
  getSpecIds,
} from '../../src/utils/item-discovery.js';

describe('item-discovery', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'opensdd-item-discovery-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('lista apenas changes ativos com proposal.md, ignorando hidden e archive', async () => {
    const changesDir = path.join(tempRoot, 'openspec', 'changes');
    await fs.mkdir(path.join(changesDir, 'b-change'), { recursive: true });
    await fs.mkdir(path.join(changesDir, 'a-change'), { recursive: true });
    await fs.mkdir(path.join(changesDir, 'draft-without-proposal'), { recursive: true });
    await fs.mkdir(path.join(changesDir, '.hidden-change'), { recursive: true });
    await fs.mkdir(path.join(changesDir, 'archive', 'old-change'), { recursive: true });

    await fs.writeFile(path.join(changesDir, 'b-change', 'proposal.md'), '# B');
    await fs.writeFile(path.join(changesDir, 'a-change', 'proposal.md'), '# A');
    await fs.writeFile(path.join(changesDir, '.hidden-change', 'proposal.md'), '# hidden');
    await fs.writeFile(path.join(changesDir, 'archive', 'old-change', 'proposal.md'), '# old');

    await expect(getActiveChangeIds(tempRoot)).resolves.toEqual(['a-change', 'b-change']);
  });

  it('retorna lista vazia quando a pasta de changes nao existe', async () => {
    await expect(getActiveChangeIds(tempRoot)).resolves.toEqual([]);
  });

  it('lista apenas specs com spec.md e ordena alfabeticamente', async () => {
    const specsDir = path.join(tempRoot, 'openspec', 'specs');
    await fs.mkdir(path.join(specsDir, 'zeta'), { recursive: true });
    await fs.mkdir(path.join(specsDir, 'alpha'), { recursive: true });
    await fs.mkdir(path.join(specsDir, 'incomplete'), { recursive: true });
    await fs.mkdir(path.join(specsDir, '.internal'), { recursive: true });

    await fs.writeFile(path.join(specsDir, 'zeta', 'spec.md'), '# Zeta');
    await fs.writeFile(path.join(specsDir, 'alpha', 'spec.md'), '# Alpha');
    await fs.writeFile(path.join(specsDir, '.internal', 'spec.md'), '# Hidden');

    await expect(getSpecIds(tempRoot)).resolves.toEqual(['alpha', 'zeta']);
  });

  it('retorna lista vazia quando a pasta de specs nao existe', async () => {
    await expect(getSpecIds(tempRoot)).resolves.toEqual([]);
  });

  it('lista apenas changes arquivados com proposal.md', async () => {
    const archiveDir = path.join(tempRoot, 'openspec', 'changes', 'archive');
    await fs.mkdir(path.join(archiveDir, 'archived-b'), { recursive: true });
    await fs.mkdir(path.join(archiveDir, 'archived-a'), { recursive: true });
    await fs.mkdir(path.join(archiveDir, 'missing-proposal'), { recursive: true });
    await fs.mkdir(path.join(archiveDir, '.hidden-archived'), { recursive: true });

    await fs.writeFile(path.join(archiveDir, 'archived-b', 'proposal.md'), '# archived b');
    await fs.writeFile(path.join(archiveDir, 'archived-a', 'proposal.md'), '# archived a');
    await fs.writeFile(path.join(archiveDir, '.hidden-archived', 'proposal.md'), '# hidden');

    await expect(getArchivedChangeIds(tempRoot)).resolves.toEqual(['archived-a', 'archived-b']);
  });

  it('retorna lista vazia quando a pasta de archive nao existe', async () => {
    await expect(getArchivedChangeIds(tempRoot)).resolves.toEqual([]);
  });
});
