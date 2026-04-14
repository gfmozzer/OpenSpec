# Epic EPIC-0008

## Origem
- Debate: DEB-0008
- Titulo base: Maturidade estrutural e evolução do SDD como sistema de gestão de estado de projetos

## Resumo aprovado
Implementar os cinco eixos de hardening estrutural do SDD para elevar a qualidade real dos artefatos, tornar as lentes verdadeiros bloqueadores de transição, introduzir roteamento semântico de skills por domínio, tornar ADRs mandatórios em impactos arquiteturais relevantes, e estabelecer um protocolo formal de meta-evolução semestral do próprio sistema. A entrega inclui modo dual (rigoroso/express), sanitização semântica de títulos na propagação entre artefatos e o subcomando `opensdd sdd audit` para métricas de saúde do ciclo.

## Status
READY

## Features planejadas
- FEAT-0012: Enriquecimento de prompts e lentes com critérios de qualidade por artefato
- FEAT-0013: Lentes como bloqueadores reais de transição no TransitionEngine
- FEAT-0014: Roteamento semântico de skills por domínio (skill-routing.yaml)
- FEAT-0015: ADR mandatório automático para features com impacto arquitetural
- FEAT-0016: Protocolo de meta-evolução e comando `sdd audit`
- FEAT-0017: Sanitização semântica de títulos na propagação INS → DEB → EPIC → FEAT

## Critérios de aceite da EPIC
- [ ] Nenhuma FEAT pode ser archivada com placeholders nos campos Objetivo/Resumo
- [ ] Transições são bloqueadas se a lente do artefato não for aprovada
- [ ] Skills recomendadas variam por domínio declarado na FEAT
- [ ] FEAT com `requires_adr: true` sem ADR preenchido bloqueia o `finalize`
- [ ] `opensdd sdd audit` exibe relatório de saúde com métricas definidas
- [ ] Nenhum EPIC ou FEAT tem "Debate:" ou "Insight:" no título

## Contexto e motivação
Esta EPIC foi gerada a partir de análise meta-crítica do histórico completo do OpenSDD (março–abril 2026, 7 EPICs, 10 FEATs). Os problemas identificados não são bloqueadores do fluxo atual mas representam dívida de design que cresce com o tempo: artefatos ocos parecem completos na rastreabilidade mas são vazios semanticamente, debates instantâneos criam falsa sensação de deliberação, e o sistema não tem mecanismo para perceber esses problemas sem intervenção humana explícita.

## Metadados
- Criado em: 2026-04-13
- Debate de origem: DEB-0008
- Insight de origem: INS-0008
