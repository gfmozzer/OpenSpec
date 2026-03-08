---
name: business-extractor-sdd
description: Extrai historias, regras de negocio, atores, integracoes e restricoes a partir das fontes do deposito.
---

# Business Extractor SDD

Use esta skill quando o repositorio ja possui PRDs, briefings, historias ou documentos consolidados.

## Saidas esperadas

- atualizacao de contexto canônico:
  - `.sdd/state/architecture.yaml`
  - `.sdd/state/service-catalog.yaml`
  - `.sdd/state/tech-stack.yaml`
  - `.sdd/state/integration-contracts.yaml`
- sugestoes de:
  - RADs
  - FEATs
  - INSIGHTs apenas quando houver ambiguidade real

## Como decidir o destino

- Se o trecho descreve estrutura do sistema, consolide em contexto.
- Se o trecho e uma decisao grande e aprovada, normalize em RAD.
- Se o trecho ja e claro e executavel, normalize em FEAT.
- Se o trecho estiver ambíguo, contraditório ou incompleto, normalize em INSIGHT.

## Nao faca

- Nao transforme PRD inteiro em task list direta.
- Nao invente detalhes tecnicos nao presentes na fonte.
