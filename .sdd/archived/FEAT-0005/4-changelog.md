# Changelog FEAT-0005

## Entradas
- 2026-04-12T08:12:31.670Z - Workspace criado automaticamente para execução da feature.

## Mudanças
- `SddCheckCommand` passou a detectar drift entre estado lógico e workspace físico:
  - `IN_PROGRESS` sem diretório correspondente em `.sdd/active`
  - `DONE/ARCHIVED` ainda presente em `.sdd/active`
  - `IN_PROGRESS` já materializada em `.sdd/archived`
- Foram adicionados testes cobrindo os cenários reais de incoerência entre YAML e filesystem.
- A geração automática de `change_name` foi endurecida para não produzir nomes inválidos quando a truncagem termina em hífen.
