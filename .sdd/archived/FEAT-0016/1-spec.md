# Spec FEAT-0016

## Resumo da Entrega
- Titulo: Protocolo de meta-evolução do SDD e comando sdd audit
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
- Implementar um protocolo operacional de meta-evolução do SDD para auditoria periódica da qualidade do próprio processo.
- Disponibilizar `opensdd sdd audit` com métricas objetivas de saúde do ciclo:
  - percentual de artefatos sem placeholders;
  - percentual de debates com deliberação real registrada;
  - cobertura de ADRs gerados versus ADRs esperados (`requires_adr=true`);
  - evidências de uso de transição forçada (`--force-transition`) em changelogs.
- Garantir saída estruturada em JSON e saída textual amigável para operação manual.
- Não abrir INS automaticamente: apenas recomendar criação de insight quando score ficar abaixo do limiar configurado.
- Permitir configuração por `.sdd/config.yaml` via bloco `meta_evolution`.

## Referencias
- Feature: FEAT-0016
- Acceptance refs: EPIC-0008
- ADR: -
