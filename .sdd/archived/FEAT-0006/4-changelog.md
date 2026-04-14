# Changelog FEAT-0006

## Entradas
- 2026-04-12T08:11:44.442Z - Workspace criado automaticamente para execução da feature.

## Mudanças
- O `TransitionEngine` foi ajustado para refletir cenários reais do fluxo:
  - `FEAT BLOCKED -> IN_PROGRESS` em execuções forçadas
  - `FEAT ARCHIVED -> DONE` no fechamento após `archive`
- O breakdown de `EPIC` passou a tratar `SPLIT` de forma idempotente, evitando falha em replanejamento incremental.
- O `start` agora consegue adotar um `change` já existente e válido, mantendo a transição centralizada no mesmo fluxo.
- O guia operacional do agente passou a explicitar que `start/check/archive/finalize` compartilham a mesma política estrutural com `TransitionEngine` e lentes.
