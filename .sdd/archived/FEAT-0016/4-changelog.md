# Changelog FEAT-0016

## Entradas
- 2026-04-16T14:48:49.494Z - Workspace criado automaticamente para execução da feature.
- 2026-04-16T15:02:00.000Z - Implementado comando `opensdd sdd audit` com métricas de meta-evolução.
- 2026-04-16T15:02:00.000Z - Adicionado suporte ao bloco `meta_evolution` em `.sdd/config.yaml`.
- 2026-04-16T15:02:00.000Z - Incluídos testes dedicados para auditoria SDD.

## Mudanças
- `src/core/sdd/operations.ts`
  - Novo `SddAuditCommand` com score de saúde e recomendação operacional.
  - Métricas implementadas: placeholders, deliberação em debates, ADRs esperados/gerados e transições forçadas.
- `src/commands/sdd.ts`
  - Novo subcomando `sdd audit` com saída textual e JSON.
- `src/core/sdd/state.ts`
  - Bootstrap de `meta_evolution` padrão em `.sdd/config.yaml`.
- `test/core/sdd-audit.test.ts`
  - Cobertura dos cenários saudável e degradado da auditoria.
- `README.md`
  - Documentação de uso do novo comando `opensdd sdd audit`.
