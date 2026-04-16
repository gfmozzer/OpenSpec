# Arquitetura

Documento gerado a partir de `.sdd/state/architecture.yaml`.

| ID | Nome | Tipo | Descricao | Paths | Depends On |
| --- | --- | --- | --- | --- | --- |
| arch-gfmozzer-opensdd | @gfmozzer/opensdd | service | Servico inicial detectado no bootstrap de contexto | src | - |
| FEAT-0002 | Impacto de renomear RADAR para EPIC | feature | - | - | - |
| FEAT-0003 | EPIC com IDs SDD em quatro dígitos | feature | - | - | - |
| FEAT-0004 | Guardrails de estrutura, diretórios e qualidade do SDD | feature | - | - | - |
| FEAT-0005 | Validar coerencia entre estado logico e localizacao fisica dos artefatos SDD | feature | Implementar verificacao sistematica entre backlog/discovery e a localizacao fisica em .sdd/active e .sdd/archived para impedir divergencias historicas como features DONE ainda abertas em active. | - | - |
| FEAT-0007 | Completar transicao documentada para IDs SDD canonicos de quatro digitos | feature | Padronizar a experiencia humana do SDD para IDs no formato #### em docs, mensagens, exemplos e orientacoes operacionais, mantendo suporte legada apenas como compatibilidade. | - | - |
| FEAT-0008 | Concluir normalizacao de EPIC como termo canonico nas interfaces e docs SDD | feature | Fechar a migracao semantica de RAD/RADAR para EPIC em documentacao, exemplos, help de comandos e mensagens humanas, preservando apenas compatibilidade retroativa onde estritamente necessario. | - | - |
| FEAT-0009 | Gate mandatória de migração SDD | feature | - | - | - |
| FEAT-001 | Onboard sugere próximos passos quando backlog vazio | feature | - | - | - |
| FEAT-0010 | Debate: Elevar a qualidade automatizada do projeto com foco em cobertura unitária máxima viável, definição de cobertura | feature | - | - | - |
| FEAT-0011 | Ampliar cobertura automatizada nos comandos com lógica real e branches relevantes | feature | Criar testes unitários para validate.ts, spec.ts, change.ts, completion.ts e match.ts, atacando branches com lógica real de negócio conforme decisão DEB-0007 Opção B. | - | - |
| FEAT-0012 | Enriquecer prompts e templates com critérios de qualidade mínima por artefato | feature | Adicionar instruções de geração, critérios de qualidade mínima e frases proibidas (placeholders) a cada template e lente do SDD. Garantir que artefatos gerados por LLM não possam ser archivados com campos Objetivo/Resumo contendo texto de placeholder. | - | - |
| FEAT-0013 | Lentes estruturais como bloqueadores reais de transição no TransitionEngine | feature | Vincular a aprovação de transição de estado à validação obrigatória da lente do artefato. Nenhuma transição FEAT→IN_PROGRESS, FEAT→DONE ou FEAT→ARCHIVED ocorre sem conformidade 100% da lente. Adicionar flag forced_transition rastreável para casos de bypass explícito. | - | FEAT-0012 |
| FEAT-0014 | Roteamento semântico de skills por domínio da feature | feature | Substituir a lista genérica de skills (architecture, concise-planning, context-window-management) por roteamento baseado no domínio declarado na FEAT (backend/frontend/infra/testing/architecture/data/full-stack). Criar skill-routing.yaml editável e gerar recomendações dinamicamente no 2-plan.md. | - | - |
| FEAT-0015 | ADR mandatório automático para features com impacto arquitetural declarado | feature | Quando o campo Impacto Arquitetural da FEAT declarar requires_adr:true, o comando start cria automaticamente o template ADR-FEAT-####.md em .sdd/core/adrs/. O finalize bloqueia se o ADR existir mas contiver placeholders. A seção Refs da spec inclui link ao ADR automaticamente. | - | - |
| FEAT-0016 | Protocolo de meta-evolução do SDD e comando sdd audit | feature | Implementar ciclo semestral de auditoria do próprio SDD via campo meta_evolution em config.yaml e novo subcomando opensdd sdd audit. O comando exibe métricas de saúde do ciclo (% artefatos sem placeholder, % debates com deliberação real, % ADRs gerados vs esperados, FEATs com forced_transition). Não cria INS automaticamente — apenas exibe relatório e sugere criação. | - | FEAT-0012, FEAT-0013, FEAT-0014, FEAT-0015 |
| FEAT-0018 | Adotar DevTrack Foundation API como backend padrão do OpenSDD | documentation | - | - | - |
