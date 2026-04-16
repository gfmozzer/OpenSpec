# Changelog FEAT-0017

## Entradas
- 2026-04-16T18:39:58.341Z - Workspace criado automaticamente para execução da feature.
- 2026-04-16T18:44:00.000Z - Contexto SDD revisado e artefatos ativos ajustados para execução sem placeholders.
- 2026-04-16T18:46:00.000Z - Implementação aplicada para `title_canonical`, validações semânticas em `sdd check` e reconciliação de títulos legados.

## Mudanças
- `src/core/sdd/types.ts`
  - Campo opcional `title_canonical` adicionado ao `DiscoveryRecordSchema` (máximo 60 chars).
- `src/core/sdd/operations.ts`
  - Normalização de título canônico para `INS` e `DEB`.
  - Promoção `DEB -> EPIC` agora usa `title_canonical` por padrão.
- `src/core/sdd/check.ts`
  - Novo guardrail para rejeitar títulos de `EPIC`/`FEAT` com tokens proibidos (`Debate:`, `Insight:`, `(preencher`, `(placeholder`).
- `test/core/sdd-operations.test.ts`
  - Cobertura de propagação correta do `title_canonical` em `DEB` e no título final de `EPIC`.
- `test/core/sdd-check.test.ts`
  - Cenário novo validando reprovação de `EPIC` e `FEAT` com título semanticamente inválido.
- `.sdd/state/discovery-index.yaml`, `.sdd/state/backlog.yaml`
  - Ajuste de dados legados para compatibilidade com os novos guardrails semânticos.
