# Changelog FEAT-0018

## Entradas
- 2026-04-14T02:27:19.262Z - Workspace criado automaticamente para execução da feature.
- 2026-04-14T02:28:00Z - `opensdd sdd context FEAT-0018` executado para confirmar status `IN_PROGRESS` e fluxo rigoroso.
- 2026-04-14T02:35:00Z - Mapeado o bootstrap atual do OpenSDD em `src/core/sdd/state.ts`, `src/core/sdd/init.ts`, `src/core/sdd/default-skills.ts`, `src/core/sdd/operations.ts`, `src/core/init.ts` e `src/core/profiles.ts`.
- 2026-04-14T02:42:00Z - Mapeados os ativos canonicos da Foundation API: skills `foundation-*`, bundle `foundation-documentation`, contrato arquitetural backend e bootstrap modular.

## Mudanças
- Documentada a separacao canonica entre `devtrack-foundation-api` (arquitetura/starter/backend contract) e `devtrack-tools-opensdd` (distribuicao/bootstrap/profile/template).
- Registrada a decisao arquitetural de adotar profile backend orientado pela Foundation antes de qualquer starter backend real copiado/materializado.
- Proposto o profile `foundation-backend` como nome de referencia para a fase de implementacao.
- Atualizado o contexto operacional do OpenSDD para refletir que a Foundation deve ser tratada como fonte de leitura/canon e nao como area de implementacao neste repositorio.
