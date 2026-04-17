import { describe, expect, it } from 'vitest';
import {
  mergeRepoMapRecord,
  mergeServiceRecord,
  mergeTechStackRecord,
  stableUniqueStrings,
} from '../../../src/core/sdd/merge-catalog.js';

describe('sdd merge catalog', () => {
  it('faz união estável de arrays sem duplicatas', () => {
    expect(stableUniqueStrings(['a', 'b', 'a', '', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('mergeia serviço sem sobrescrever campos já preenchidos', () => {
    const merged = mergeServiceRecord(
      {
        id: 'backend',
        name: 'backend',
        responsibility: 'Responsabilidade existente',
        owner_refs: ['FEAT-0001'],
        repo_paths: ['packages/api'],
        contracts: ['auth'],
        external_dependencies: [],
      },
      {
        id: 'backend',
        name: 'backend',
        responsibility: 'Consolidado por FEAT-0002',
        owner_refs: ['FEAT-0002'],
        repo_paths: ['packages/api'],
        contracts: ['billing'],
        external_dependencies: ['postgres'],
      }
    );

    expect(merged.responsibility).toBe('Responsabilidade existente');
    expect(merged.owner_refs).toEqual(['FEAT-0001', 'FEAT-0002']);
    expect(merged.contracts).toEqual(['auth', 'billing']);
    expect(merged.external_dependencies).toEqual(['postgres']);
  });

  it('mergeia tech stack e repo-map de forma idempotente', () => {
    const stack = mergeTechStackRecord(
      {
        layer: 'backend',
        technology: 'backend',
        version: '',
        purpose: '',
        constraints: ['schema-change'],
      },
      {
        layer: 'backend',
        technology: 'backend',
        version: '',
        purpose: 'Area impactada por FEAT-0001',
        constraints: ['schema-change', 'auth-rules'],
      }
    );
    expect(stack.constraints).toEqual(['schema-change', 'auth-rules']);
    expect(stack.purpose).toBe('Area impactada por FEAT-0001');

    const repo = mergeRepoMapRecord(
      {
        path: 'openspec/changes/archive/feat-1',
        kind: 'change-archive',
        service_ref: 'backend',
        notes: 'Resumo existente',
      },
      {
        path: 'openspec/changes/archive/feat-1',
        kind: 'change-archive',
        service_ref: 'backend',
        notes: 'Finalize FEAT-0001',
      }
    );
    expect(repo.notes).toBe('Resumo existente');
  });
});
