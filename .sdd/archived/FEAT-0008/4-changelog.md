# Changelog FEAT-0008

## Entradas
- 2026-04-12T08:09:37.027Z - Workspace criado automaticamente para execução da feature.

## Mudanças
- A nomenclatura humana principal do SDD foi consolidada para `EPIC` nas superfícies operacionais:
  - `README.md`
  - `AGENTS.md`
  - `AGENT.md`
  - `.sdd/AGENT.md`
  - `docs/sdd-manual-pt-br.md`
  - `docs/historia-marina-uso-pratico.md`
  - `.sdd/prompts/00-comece-por-aqui.md`
- O `start` passou a reaproveitar `openspec/changes/<change-name>` já existente quando ele ainda representa um change válido não arquivado, removendo o bloqueio operacional da `FEAT-0008`.
