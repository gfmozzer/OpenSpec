import type { BacklogItem } from './types.js';

export function adrFileName(featureId: string): string {
  return `ADR-${featureId}.md`;
}

export function generateAdrTemplate(feature: BacklogItem, createdAtIso: string): string {
  const refs = [feature.id, feature.origin_ref].filter(Boolean);
  const refsText = refs.length > 0 ? refs.join(', ') : '-';

  return `# ADR ${feature.id}: ${feature.title}

## Contexto
Descreva o contexto que motivou esta decisão arquitetural, incluindo limitações e trade-offs.

## Decisão
Documente a decisão tomada, escopo da mudança e alternativas descartadas.

## Consequências
Liste impactos positivos, riscos residuais e ações de mitigação.

## Metadados
- Feature: ${feature.id}
- Origem: ${feature.origin_type}${feature.origin_ref ? ` (${feature.origin_ref})` : ''}
- Criado em: ${createdAtIso}

## Referências
- ${refsText}
`;
}
