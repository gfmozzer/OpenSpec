import { describe, expect, it } from 'vitest';
import { levenshtein, nearestMatches } from '../../src/utils/match.js';

describe('match utils', () => {
  it('calcula distância de levenshtein para casos básicos', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('auth', 'auth')).toBe(0);
    expect(levenshtein('auth', 'auto')).toBe(1);
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });

  it('ordena nearestMatches pela menor distância e respeita o limite máximo', () => {
    const matches = nearestMatches('aut', ['payment', 'auth', 'audit', 'authorization'], 2);

    expect(matches).toEqual(['auth', 'audit']);
  });
});
