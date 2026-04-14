# Changelog FEAT-0007

## Entradas
- 2026-04-12T08:00:36.144Z - Workspace criado automaticamente para execução da feature.

## Mudanças
- Superfícies humanas principais foram revisadas para usar IDs canônicos de quatro dígitos em exemplos e fluxos:
  - `.sdd/prompts/00-comece-por-aqui.md`
  - `docs/historia-marina-uso-pratico.md`
- O template ativo de tarefas foi corrigido para usar `opensdd sdd finalize --ref FEAT-####` no checklist final.
- Foram adicionados testes para cenários de restart/start que preservam o fluxo SDD com IDs e changes consistentes.
