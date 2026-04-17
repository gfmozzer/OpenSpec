export interface SimilarityCandidate {
  id: string;
  title: string;
  score: number;
}

export interface WarnAndLinkResult {
  severity: 'none' | 'warning';
  candidates: SimilarityCandidate[];
  warningLinks: string[];
}

export interface WarnAndLinkOptions {
  maxCandidates?: number;
  minScore?: number;
}

const DEFAULT_THRESHOLDS: Record<string, number> = {
  INS: 0.58,
  DEB: 0.62,
  FEAT: 0.6,
};

export function normalizeSemanticText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractNGrams(value: string, size: number): Set<string> {
  const normalized = normalizeSemanticText(value).replace(/\s/g, '');
  if (!normalized) return new Set();
  if (normalized.length <= size) return new Set([normalized]);

  const grams = new Set<string>();
  for (let index = 0; index <= normalized.length - size; index += 1) {
    grams.add(normalized.slice(index, index + size));
  }
  return grams;
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function semanticSimilarity(a: string, b: string): number {
  const normalizedA = normalizeSemanticText(a);
  const normalizedB = normalizeSemanticText(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;

  const bigrams = jaccardSimilarity(extractNGrams(normalizedA, 2), extractNGrams(normalizedB, 2));
  const trigrams = jaccardSimilarity(extractNGrams(normalizedA, 3), extractNGrams(normalizedB, 3));
  return Number((bigrams * 0.45 + trigrams * 0.55).toFixed(4));
}

export function warnAndLink(
  entityType: string,
  title: string,
  candidates: Array<{ id: string; title: string }>,
  options?: WarnAndLinkOptions
): WarnAndLinkResult {
  const threshold = options?.minScore ?? DEFAULT_THRESHOLDS[entityType] ?? 0.65;
  const ranked = candidates
    .map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      score: semanticSimilarity(title, candidate.title),
    }))
    .filter((candidate) => candidate.score >= threshold)
    .sort((left, right) => right.score - left.score)
    .slice(0, options?.maxCandidates ?? 3);

  return {
    severity: ranked.length > 0 ? 'warning' : 'none',
    candidates: ranked,
    warningLinks: ranked.map((candidate) => candidate.id),
  };
}
