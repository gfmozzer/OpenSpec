# Changelog FEAT-0019

## Entradas
- 2026-04-17T01:28:30.430Z - Workspace criado automaticamente para execução da feature.

## Mudanças
- Implementada validação de integridade referencial cross-entity em `SddCheckCommand`, cobrindo `origin_ref`, `related_ids`, `finalizeQueue` e `unblockEvents`.
- O modo padrão preserva compatibilidade com projetos legados emitindo avisos `[LEGACY]`; o modo estrito promove essas violações para erros.
- O comando `opensdd sdd check` passou a aceitar `--strict` e repassar a flag ao validador.
- Adicionada cobertura em `test/core/sdd-check.test.ts` para avisos default e falhas em modo estrito.
- Adicionado teste de registro do CLI em `test/commands/sdd-command.test.ts`.
- Declarado impacto frontend como `none`, pois a entrega altera validação/CLI sem rotas ou interface visual.
