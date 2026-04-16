# ADR FEAT-0017

## Contexto
- Feature: FEAT-0017 - Sanitização semântica de títulos na propagação INS → DEB → EPIC → FEAT
- Origem: epic (EPIC-0008)
- Finalizado em: 2026-04-16T18:48:43.312Z

## Decisao
Consolidar a implementacao da feature FEAT-0017 e oficializar o resultado na memoria SDD.

## Mudancas
- Change associado: feat-0017-sanitizacao-semantica-titulos-propagacao
- Tipo de execucao: feature
- Modo de planejamento: local_plan
- Lock domains: -

## Riscos
- Risco residual documentado em resumo da feature: Adicionar campo title_canonical (max 60 chars, sem prefixos funcionais) nos artefatos INS e DEB. Na transição DEB→EPIC, usar title_canonical em vez do título do debate. Adicionar validação no check que rejeita EPIC ou FEAT cujo título contenha "Debate:", "Insight:", "(preencher" ou "(placeholder".

## Dependentes liberados
- Nenhum

## Referencias
- FEAT-0017, EPIC-0008
