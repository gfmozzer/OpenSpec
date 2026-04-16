# Changelog FEAT-0015

## Entradas
- 2026-04-16T14:31:15.867Z - Workspace criado automaticamente para execução da feature.

## Mudanças
- Adicionado campo `requires_adr` ao schema `BacklogItem` (`src/core/sdd/types.ts`).
- Criado módulo `src/core/sdd/adr.ts` com geração de template ADR e convenção de nome.
- `SddStartCommand` agora cria ADR automaticamente quando `requires_adr=true`, sem sobrescrever ADR existente.
- `buildActiveSpecDoc` passou a injetar referência de ADR na seção `## Referencias`.
- `SddFinalizeCommand` agora valida ADR obrigatório (existência + lente `adr`) e bloqueia finalize em caso de violação.
- Incluídos testes de regressão em `test/core/sdd-operations.test.ts` para criação/não sobrescrita e bloqueio por ADR inválido.
- README atualizado com a regra operacional de ADR obrigatório no `start/finalize`.
