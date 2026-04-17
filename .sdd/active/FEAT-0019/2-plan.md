# Plan FEAT-0019

## Abordagem de Implementacao
Nesta fase adaptaremos a API e os Core Validators (`src/core/sdd/types.ts` e `src/core/sdd/check.ts`). O motor de validação não sofrerá quebras agressivas em sistemas legados, visto que introduziremos a arquitetura de **Severity Logs** suportando a instrução explícita de `strict`.

## Arquitetura (Onde modificar)
- `src/core/sdd/types.ts`: Amplificar tipos origin_ref/related_ids por meio da Zod Refinement. 
- `src/core/sdd/check.ts`:  Este é o master module onde `checkUniqueIds` e `validateBacklog` operam. Criar uma função de check global: `validateReferentialIntegrity(snapshots)`.
  - Será necessário fazer um scan na Array de `backlog`, iterar seus `origin_refs` e checar em O(N) logico se existe em `discoveryIndex.records`.
  - O loop vai cruzar com os dados em `unblockEvents` e catalogar saídas num array de saídas formatado: `{ type: 'error' | 'warning' | 'legacy', message: string, entity_id_fail: string }`.

## Analise de Risco
Baixo. Todas as edições ocorrem em tempo estático do CLI e não causam efeito colateral persistente aos arquivos de projeto.

## Criterios de Resiliencia
- Adotar checagens em O(1) sempre que possível armazenando refs num `Set` em memória derivado do Memory Snapshot de entrada na hora do pipeline de *check*, de modo a não abrandar o CLI que precisa rodar a cada comando `check`.
