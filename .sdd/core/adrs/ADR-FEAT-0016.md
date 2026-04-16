# ADR FEAT-0016

## Contexto
- Feature: FEAT-0016 - Protocolo de meta-evolução do SDD e comando sdd audit
- Origem: epic (EPIC-0008)
- Finalizado em: 2026-04-16T18:04:59.970Z

## Decisao
Consolidar a implementacao da feature FEAT-0016 e oficializar o resultado na memoria SDD.

## Mudancas
- Change associado: feat-0016-protocolo-meta-evolucao-sdd-audit
- Tipo de execucao: feature
- Modo de planejamento: local_plan
- Lock domains: -

## Riscos
- Risco residual documentado em resumo da feature: Implementar ciclo semestral de auditoria do próprio SDD via campo meta_evolution em config.yaml e novo subcomando opensdd sdd audit. O comando exibe métricas de saúde do ciclo (% artefatos sem placeholder, % debates com deliberação real, % ADRs gerados vs esperados, FEATs com forced_transition). Não cria INS automaticamente — apenas exibe relatório e sugere criação.

## Dependentes liberados
- Nenhum

## Referencias
- FEAT-0016, EPIC-0008
