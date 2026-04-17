import { describe, expect, it } from 'vitest';
import {
  extractNGrams,
  jaccardSimilarity,
  normalizeSemanticText,
  semanticSimilarity,
  warnAndLink,
} from '../../../src/core/sdd/dedup.js';

describe('sdd dedup', () => {
  it('normaliza texto com acentos, caixa e pontuacao', () => {
    expect(normalizeSemanticText('  API de Usuários!  ')).toBe('api de usuarios');
  });

  it('extrai n-grams determinísticos', () => {
    expect(Array.from(extractNGrams('usuarios', 2))).toEqual([
      'us',
      'su',
      'ua',
      'ar',
      'ri',
      'io',
      'os',
    ]);
  });

  it('calcula Jaccard entre conjuntos de n-grams', () => {
    const score = jaccardSimilarity(new Set(['ap', 'pi']), new Set(['ap', 'pi', 'ix']));
    expect(score).toBeCloseTo(2 / 3, 5);
  });

  it('gera score alto para textos semanticamente próximos', () => {
    expect(semanticSimilarity('API de usuarios', 'Api usuarios')).toBeGreaterThan(0.6);
  });

  it('gera warn-and-link com candidatos ordenados por score', () => {
    const result = warnAndLink('FEAT', 'Tela de usuarios', [
      { id: 'FEAT-0001', title: 'Tela de usuário' },
      { id: 'FEAT-0002', title: 'Pipeline de billing' },
    ]);

    expect(result.severity).toBe('warning');
    expect(result.warningLinks).toEqual(['FEAT-0001']);
    expect(result.candidates[0].id).toBe('FEAT-0001');
    expect(result.candidates[0].score).toBeGreaterThan(0.6);
  });
});
