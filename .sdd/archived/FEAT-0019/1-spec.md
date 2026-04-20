# Spec FEAT-0019

## Resumo da Entrega
- Titulo: Integridade referencial cross-entity no check com severidade graduada
- Origem: epic (EPIC-0010)
- Tipo: feature
- Modo: local_plan
- Fluxo: padrao
- Etapa atual: execucao

## Gates
- Proposta: aprovado
- Planejamento: aprovado
- Tarefas: aprovado

## Objetivo
Implementar infraestrutura de check-up rigoroso (*Integridade Referencial Cross-Entity*) nos motores de diagnóstico estático do OpenSDD. 
Garantir que as identificações e apontamentos de entidades que conectam o sistema (ex: origin_ref, related_ids e dependências) sigam caminhos reais e existam fisicamente e logicamente no repositório.

- **Impacto**: Anulação imediata de links rotos nas entidades do Memory Root. Proteger o SDD de referenciar épicos ou insights mortos, falhos ou renomeados.
- **Dores Atendidas:** (V5 do DEB-0011) - check não valida de forma simétrica ou coesa as refs nas entidades gerando poluição ou orfanato de estados no JSON/YAML.

## Critérios de Aceite
- `types.ts`: Deve validar a entrada cruzada (`origin_ref` tem de bater as origens corretas com RegExp estritas, os status devem refletir os grafos permitidos).
- `check.ts/SddCheckCommand`: O comando deve percorrer dependências (os `related_ids` das origens de *discovery*, origin_refs do *backlog* e *feature_ids* no *finalizeQueue*/events).
- **Tratamento Híbrido**: Respeitar projetos em produção/legado através de classificação `warning` ou `legacy` com falhas parciais (ex: origin_ref de RAD que já foi renomeada para FEAT), mas falhando com `error` limpo quando a flag `--strict` for repassada.

## Referencias
- Feature: FEAT-0019
- Acceptance refs: EPIC-0010, DEB-0011, INS-0011
- ADR: A definir (caso mutações profundas ocorram)
