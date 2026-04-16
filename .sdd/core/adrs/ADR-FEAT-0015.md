# ADR FEAT-0015

## Contexto
- Feature: FEAT-0015 - ADR mandatório automático para features com impacto arquitetural declarado
- Origem: epic (EPIC-0008)
- Finalizado em: 2026-04-16T14:36:46.551Z

## Decisao
Consolidar a implementacao da feature FEAT-0015 e oficializar o resultado na memoria SDD.

## Mudancas
- Change associado: feat-0015-adr-mandatorio-automatico-impacto-arquitetural
- Tipo de execucao: feature
- Modo de planejamento: local_plan
- Lock domains: -

## Riscos
- Risco residual documentado em resumo da feature: Quando o campo Impacto Arquitetural da FEAT declarar requires_adr:true, o comando start cria automaticamente o template ADR-FEAT-####.md em .sdd/core/adrs/. O finalize bloqueia se o ADR existir mas contiver placeholders. A seção Refs da spec inclui link ao ADR automaticamente.

## Dependentes liberados
- FEAT-0016

## Referencias
- FEAT-0015, EPIC-0008
