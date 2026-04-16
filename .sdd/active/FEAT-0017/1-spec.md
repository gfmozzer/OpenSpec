# Spec FEAT-0017

## Resumo da Entrega
- Titulo: Sanitização semântica de títulos na propagação INS → DEB → EPIC → FEAT
- Origem: epic (EPIC-0008)
- Tipo: feature
- Modo: local_plan
- Fluxo: padrao
- Etapa atual: execucao

## Gates
- Proposta: rascunho
- Planejamento: rascunho
- Tarefas: rascunho

## Objetivo
- Introduzir `title_canonical` nos registros de discovery (`INS` e `DEB`) com limite de 60 caracteres e sem prefixos funcionais como `Debate:`/`Insight:`.
- Garantir que a transição `DEB -> EPIC` use `title_canonical` como fonte do título do `EPIC`, removendo propagação de títulos legados com prefixos semânticos.
- Endurecer o `sdd check` para rejeitar `EPIC` e `FEAT` com títulos que contenham tokens proibidos (`Debate:`, `Insight:`, `(preencher`, `(placeholder`), evitando regressão de qualidade de nomenclatura.
- Reconciliar dados legados necessários no estado atual para manter o projeto consistente após o novo guardrail.

## Referencias
- Feature: FEAT-0017
- Acceptance refs: EPIC-0008
- ADR: -
