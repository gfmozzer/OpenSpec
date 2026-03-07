import { describe, it, expect } from 'vitest';
import { suggestSkills, listBundles } from '../../src/core/sdd/skills.js';
import type { SkillCatalogState } from '../../src/core/sdd/types.js';

const catalogFixture: SkillCatalogState = {
  version: 1,
  skills: [
    {
      id: 'skill-a',
      source_repo: undefined,
      source_path: undefined,
      title: 'Skill A',
      description: 'A',
      phases: ['plan'],
      domains: ['backend', 'api'],
      tools: ['codex'],
      bundle_ids: ['core'],
      priority: 5,
    },
    {
      id: 'skill-b',
      source_repo: undefined,
      source_path: undefined,
      title: 'Skill B',
      description: 'B',
      phases: ['execute'],
      domains: ['frontend'],
      tools: ['codex'],
      bundle_ids: ['ui'],
      priority: 9,
    },
    {
      id: 'skill-c',
      source_repo: undefined,
      source_path: undefined,
      title: 'Skill C',
      description: 'C',
      phases: ['plan', 'verify'],
      domains: ['backend', 'security'],
      tools: ['codex'],
      bundle_ids: ['core', 'sec'],
      priority: 7,
    },
  ],
  bundles: [
    { id: 'core', title: 'Core', skill_ids: ['skill-a', 'skill-c'] },
    { id: 'ui', title: 'UI', skill_ids: ['skill-b'] },
    { id: 'sec', title: 'Security', skill_ids: ['skill-c'] },
  ],
};

describe('sdd skills recommender', () => {
  it('lists bundles sorted by id', () => {
    const bundles = listBundles(catalogFixture);
    expect(bundles.map((b) => b.id)).toEqual(['core', 'sec', 'ui']);
  });

  it('ranks by phase + domain + bundle + priority', () => {
    const ranked = suggestSkills(catalogFixture, {
      phase: 'plan',
      domains: ['backend'],
      bundles: ['core'],
      max: 3,
    });

    expect(ranked).toHaveLength(3);
    expect(ranked[0].skill.id).toBe('skill-c');
    expect(ranked[1].skill.id).toBe('skill-a');
  });

  it('respects max cap', () => {
    const ranked = suggestSkills(catalogFixture, { max: 1 });
    expect(ranked).toHaveLength(1);
  });
});
