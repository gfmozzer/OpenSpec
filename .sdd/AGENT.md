# Guia do Agente SDD

Este projeto usa SDD como memória operacional.

<!-- SDD:GUIA:START -->
# Guia Operacional SDD

Trilha oficial:
1. Rode `opensdd sdd onboard system`.
2. Use `opensdd sdd next` para escolher trabalho pronto.
3. Use `opensdd sdd start FEAT-###` para abrir execução.
4. Use `opensdd sdd context FEAT-###` antes de codar.
5. Após archive, rode `opensdd sdd finalize --ref FEAT-###`.

Fontes canônicas:
- Estados: `.sdd/state/*.yaml`
- Views: `.sdd/core/*.md` e `.sdd/pendencias/*.md`
- Workspace ativo por feature: `.sdd/active/FEAT-###/`
- Deposito bruto: `.sdd/deposito/` (PRDs, RFCs, wireframes e referencias)
<!-- SDD:GUIA:END -->

## Regras práticas

1. Não pule o funil de decisão: `insight -> debate -> decide`.
2. Não implemente FEAT bloqueada sem `--force` explícito.
3. Sempre mantenha rastreabilidade por ID (`INS/DEB/RAD/FEAT/FGAP/TD`).
4. Finalize sempre com `opensdd sdd finalize` para consolidar memória.
