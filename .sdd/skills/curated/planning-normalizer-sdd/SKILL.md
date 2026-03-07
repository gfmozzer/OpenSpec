---
name: planning-normalizer-sdd
description: Converte o material extraído das fontes em backlog operacional do SDD, priorizando contexto, RADs e FEATs.
---

# Planning Normalizer SDD

Use esta skill depois de inventariar as fontes e extrair negocio/frontend.

## Missao

Transformar conhecimento consolidado em artefatos operacionais do SDD.

## Ordem de normalizacao

1. contexto canônico
2. RADs
3. FEATs
4. INSIGHTs apenas para excecoes

## Regras

- Nao passe por debate quando a fonte ja for consolidada e inequívoca.
- Use debate apenas para incerteza, conflito, ambiguidade ou opcao arquitetural aberta.
- Conecte FEATs com `blocked_by`, `lock_domains`, `produces` e `consumes` quando houver evidência suficiente.
- Registre em `.sdd/state/source-index.yaml` quais fontes geraram cada RAD/FEAT.

## Resultado minimo

Ao final, o agente deve conseguir responder:
- o que e contexto do sistema;
- o que ja esta aprovado para planejamento;
- o que ja pode entrar em execucao.
