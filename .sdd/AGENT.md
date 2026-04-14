# Guia do Agente SDD

Este projeto usa SDD como memória operacional.

<!-- SDD:GUIA:START -->
# Guia Operacional SDD

Trilha oficial:
1. Rode `opensdd sdd onboard system`.
2. Use `opensdd sdd next` para escolher trabalho pronto.
3. Use `opensdd sdd start FEAT-0001` para abrir execução.
4. Use `opensdd sdd context FEAT-0001` antes de codar.
5. Declare impacto de frontend com `opensdd sdd frontend-impact FEAT-0001 ...`.
6. Após archive, rode `opensdd sdd finalize --ref FEAT-0001`.

Fontes canônicas:
- Estados: `.sdd/state/*.yaml`
- Views: `.sdd/core/*.md` e `.sdd/pendencias/*.md`
- Workspace ativo por feature: `.sdd/active/FEAT-0001/`
- Deposito bruto: `.sdd/deposito/` (PRDs, RFCs, wireframes e referencias)
- Prompts recomendados: `.sdd/prompts/`
<!-- SDD:GUIA:END -->

## Regras práticas

1. Não pule o funil de decisão: `insight -> debate -> decide`.
2. Não implemente FEAT bloqueada sem `--force` explícito.
3. Sempre mantenha rastreabilidade por ID (`INS/DEB/EPIC/FEAT/FGAP/TD`), aceitando `RAD` apenas como legado.
4. Finalize sempre com `opensdd sdd finalize` para consolidar memória.
5. Mantenha coerência estrutural entre `start`, `check`, `archive` e `finalize`: transições passam pelo `TransitionEngine` e o fechamento valida as lentes estruturais do workspace ativo.

## Fronteira canônica de backend

1. A `devtrack-foundation-api` deve ser tratada como fonte canonica de arquitetura e bootstrap backend.
2. O `devtrack-tools-opensdd` deve materializar distribuicao, profiles, templates e seed documental, sem reescrever localmente o canonico da Foundation sem uma politica explicita de sincronizacao.
3. Sempre que houver trabalho relacionado ao backend padrao, leia a Foundation como referencia e implemente somente neste repositorio o que pertence a distribuicao/bootstrap do OpenSDD.
