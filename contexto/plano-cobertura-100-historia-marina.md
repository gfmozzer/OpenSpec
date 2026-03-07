# Plano de Cobertura de 100% da História da Marina

## Objetivo

Este documento consolida o estado atual do SDD, os gaps que ainda faltam e o plano de implementação para chegar ao cenário ideal da história da Marina:

1. Uma usuária leiga consegue transformar ideias em execução com rastreabilidade.
2. O sistema suporta replanejamento no meio da execução sem colapsar o backlog.
3. Um agente novo consegue entrar no repositório, ler `README.md`, `.sdd/agente.md` e os artefatos SDD, entender arquitetura, stack, contratos e decisões de frontend, e continuar sem inspecionar o código inteiro.

---

## Veredito Atual

O SDD atual já cobre o núcleo do fluxo:

- `init`, `insight`, `debate`, `decide`
- `breakdown` com grafo
- `start` com guardrails
- `context` com constraints
- `fgap add/done`
- `finalize` com ADR e desbloqueio
- `next` com ranking
- `check` com progresso

Isso significa que o sistema já cobre bem o fluxo operacional principal da Marina.

O que ainda não cobre 100% é a camada de:

- onboarding por documentação
- memória arquitetural consolidada e sempre sincronizada
- pacote de handoff realmente completo
- execução guiada por FEAT com artefatos locais
- governança de fontes de verdade para não confundir agentes novos

---

## Gaps Restantes

### M1. Onboarding documental ainda não é resolvido por `README.md` + `.sdd/agente.md`

**Status:** crítico

Hoje, um agente novo ainda não entra no repositório e entende o sistema apenas lendo:

- `README.md`
- `.sdd/agente.md`
- `.sdd/core/*`

Problemas atuais:

- `README.md` do projeto continua centrado no OpenSpec em si, não no estado arquitetural do sistema em desenvolvimento.
- `.sdd/agente.md` do repositório está preso a um modelo antigo de SDD e conflita com o SDD implementado no CLI.
- os docs em `.sdd/core/` ainda podem existir como placeholders, com conteúdo manual e não sincronizado.

**Impacto na história da Marina:**
O handoff “sem ler o repo inteiro” ainda não está garantido.

---

### M2. Não existe uma fonte canônica para arquitetura, stack, serviços, contratos e decisões de frontend

**Status:** crítico

Hoje existe documentação solta, mas não um modelo canônico e sincronizado para responder com precisão:

- qual é a arquitetura
- qual é a spec tecnológica
- quais são os serviços e seus limites
- quais integrações existem
- quais decisões de frontend foram tomadas

Problemas atuais:

- `.sdd/core/arquitetura.md`, `.sdd/core/stack-linguagem.md`, `.sdd/core/contratos-integracao.md` e `.sdd/core/frontend-map.md` podem ficar desatualizados.
- não existe `frontend-decisions.md`.
- não existe catálogo de serviços/microserviços versionado como estado.
- não existe `repo-map.md` ligando arquitetura a diretórios reais do repositório.

**Impacto na história da Marina:**
O agente novo até recebe contexto local de FEAT, mas não a visão macro e confiável do sistema inteiro.

---

### M3. `sdd start` ainda não materializa um pacote SDD de execução da FEAT

**Status:** crítico

Hoje `sdd start` cria o `change` do OpenSpec e muda o status da FEAT, mas não cria automaticamente um workspace SDD de execução da feature com:

- `1-spec.md`
- `2-plan.md`
- `3-tasks.md`
- `4-changelog.md`

**Impacto na história da Marina:**
Na história ideal, ao iniciar uma FEAT o agente já entra num ambiente de execução claro, isolado e rastreável. Hoje isso ainda depende de fluxo manual ou de convenção externa.

---

### M4. `sdd context` ainda é forte em constraints, mas fraco em contexto semântico de continuidade

**Status:** crítico

Hoje `context` já entrega:

- origem
- dependências
- locks
- readiness
- skills sugeridas

Mas ainda não entrega, de forma consolidada:

- o que os predecessores já entregaram
- contratos ou APIs relevantes já disponíveis
- quais ADRs impactam a FEAT
- quais arquivos, serviços e docs devem ser lidos primeiro
- um pacote de handoff priorizado para um agente novo

**Impacto na história da Marina:**
O agente novo recebe constraints, mas ainda não recebe um “manual de continuação” suficiente para eliminar leitura ampla do código.

---

### M5. O replanejamento incremental existe, mas ainda não é suficientemente automático e semântico

**Status:** alto

O `breakdown --incremental` já cobre boa parte do caso emergente, mas ainda há lacunas:

- ele depende de uso explícito do modo incremental
- a inferência de `produces` e `consumes` ainda é heurística
- o impacto por serviço, contrato ou bounded context ainda não é de primeira classe

**Impacto na história da Marina:**
O caso do “insight no meio da execução” funciona, mas ainda não com a robustez total que a história pressupõe.

---

### M6. `finalize` ainda não consolida completamente a memória macro do sistema

**Status:** crítico

Hoje `finalize` já:

- gera ADR
- marca DONE
- desbloqueia dependentes
- registra eventos

Mas ainda não faz, de forma confiável e completa:

- atualizar arquitetura macro
- atualizar spec tecnológica
- atualizar contratos de integração
- atualizar decisões de frontend
- atualizar README e `.sdd/agente.md`
- registrar “o que mudou no sistema” numa visão global

**Impacto na história da Marina:**
As features acabam, mas o sistema ainda não garante que a memória arquitetural global foi consolidada.

---

### M7. Frontend gaps existem, mas frontend decisions ainda não

**Status:** alto

Hoje já existe bem:

- rastreio de gaps
- mapa de rotas
- resolução de FGAP

Mas ainda não existe um ledger próprio para decisões de frontend, como:

- por que uma rota foi desenhada assim
- qual fluxo foi descartado
- quais padrões visuais/comportamentais foram escolhidos
- quais decisões ainda estão pendentes

**Impacto na história da Marina:**
O agente sabe o que falta implementar no frontend, mas não necessariamente entende as decisões já tomadas.

---

### M8. Skills ainda são sugeridas, mas não entram como parte do pacote operacional da FEAT

**Status:** alto

Hoje o sistema:

- sugere skills
- sincroniza skills

Mas ainda não:

- injeta bundles/skills automaticamente no `2-plan.md`
- fixa no handoff quais skills devem ser usadas
- registra quais skills orientaram o planejamento e a execução

**Impacto na história da Marina e nos requisitos gerais do projeto:**
As skills ajudam, mas ainda não viraram parte nativa e auditável do fluxo de execução.

---

### M9. Não existe um modo `onboard` específico do SDD para agente novo

**Status:** alto

Hoje há `context`, `check`, `next` e docs renderizadas, mas falta um comando explícito do tipo:

- `openspec sdd onboard`
- `openspec sdd onboard FEAT-002`
- `openspec sdd onboard system`

Esse modo deveria entregar:

- ordem de leitura
- resumo do sistema
- resumo do backlog
- decisões críticas
- arquitetura
- stack
- contratos
- decisões de frontend
- próximos passos

**Impacto na história da Marina:**
O onboarding ainda é possível, mas não é guiado nem padronizado.

---

### M10. Existe conflito entre SDD legado/manual e SDD implementado no CLI

**Status:** crítico

Hoje o repositório contém artefatos de um SDD anterior/manual que não refletem exatamente o SDD do CLI atual.

Exemplos:

- `.sdd/agente.md`
- `.sdd/README.md`
- `.sdd/core/*` legados

**Impacto:**
Um agente novo pode ler a fonte errada, confiar num fluxo antigo e operar fora do modelo correto.

---

## Critérios de Aceite para Dizer “100% da História da Marina”

Para considerar a história da Marina coberta de ponta a ponta, o sistema precisa garantir:

1. `README.md` e `.sdd/agente.md` apontam para a mesma verdade operacional.
2. Um agente novo consegue responder, sem ler o código inteiro:
   - qual é a arquitetura
   - qual é a stack e spec tecnológica
   - quais serviços existem
   - quais integrações existem
   - quais decisões de frontend já foram tomadas
   - o que falta fazer agora
3. `sdd start` cria um pacote de execução completo por FEAT.
4. `sdd context` ou `sdd onboard` entrega handoff de verdade, não só constraints.
5. `finalize` consolida a memória macro do sistema, não só o estado da FEAT.
6. Um insight novo no meio da execução reorganiza o backlog sem edição manual pesada.
7. A camada de frontend tem:
   - gaps pendentes
   - gaps resolvidos
   - mapa atual
   - decisões documentadas

---

## Plano de Implementação

## Fase 1. Governança Documental e Fonte de Verdade

**Objetivo:** eliminar conflito entre docs legadas, docs manuais e docs geradas.

### Entregas

- Definir novos estados canônicos em `.sdd/state/`:
  - `architecture.yaml`
  - `service-catalog.yaml`
  - `tech-stack.yaml`
  - `integration-contracts.yaml`
  - `frontend-decisions.yaml`
  - `repo-map.yaml`
- Definir quais documentos são gerados a partir desses estados.
- Tratar `.sdd/core/*` como views renderizadas e não como fonte primária.
- Reescrever `.sdd/agente.md` para o fluxo SDD real.
- Adicionar seção estável no `README.md` explicando:
  - como entrar no sistema
  - onde ler arquitetura
  - onde ler stack
  - onde ler decisões de frontend

### Critério de aceite

- Um agente novo não encontra duas versões conflitantes do sistema.
- `README.md` e `.sdd/agente.md` convergem para a mesma trilha de leitura.

---

## Fase 2. Núcleo de Arquitetura, Stack e Decisões de Frontend

**Objetivo:** transformar arquitetura e spec tecnológica em memória operacional canônica.

### Entregas

- Renderizar automaticamente:
  - `.sdd/core/arquitetura.md`
  - `.sdd/core/servicos.md`
  - `.sdd/core/spec-tecnologica.md`
  - `.sdd/core/contratos-integracao.md`
  - `.sdd/core/frontend-decisions.md`
  - `.sdd/core/repo-map.md`
- Mapear cada serviço para:
  - responsabilidade
  - diretórios do repo
  - tecnologias
  - contratos
  - dependências externas
- Mapear frontend para:
  - rotas
  - gaps
  - decisões
  - responsáveis
  - refs arquiteturais

### Critério de aceite

- Um agente consegue abrir só `.sdd/core/*` e montar a visão macro confiável do sistema.

---

## Fase 3. Pacote de Execução por FEAT

**Objetivo:** fazer `sdd start` realmente abrir uma unidade de trabalho completa.

### Entregas

- Ao rodar `openspec sdd start FEAT-###`, criar:
  - `.sdd/active/FEAT-###/1-spec.md`
  - `.sdd/active/FEAT-###/2-plan.md`
  - `.sdd/active/FEAT-###/3-tasks.md`
  - `.sdd/active/FEAT-###/4-changelog.md`
- Ligar essa pasta ao `change_name` do OpenSpec.
- Inserir no `2-plan.md`:
  - impacto arquitetural
  - impacto no frontend
  - contratos afetados
  - skills/bundles sugeridos
- Inserir no `3-tasks.md` tarefas iniciais mínimas derivadas da FEAT.

### Critério de aceite

- Marina inicia uma FEAT e o agente já encontra um pacote de execução claro, com rastreabilidade.

---

## Fase 4. Handoff Completo e Comando de Onboarding

**Objetivo:** permitir que um agente novo continue sem inspeção ampla de código.

### Entregas

- Evoluir `openspec sdd context` para `context pack` completo.
- Criar `openspec sdd onboard [system|RAD|FEAT]`.
- O pacote deve incluir:
  - resumo executivo
  - ordem de leitura
  - arquitetura relevante
  - stack relevante
  - serviços afetados
  - contratos afetados
  - ADRs relevantes
  - predecessores e o que já entregaram
  - gaps e decisões de frontend
  - skills/bundles recomendados
  - próximos passos

### Critério de aceite

- Um agente novo recebe um pacote e consegue continuar a FEAT sem “ler o repo inteiro”.

---

## Fase 5. Consolidação Macro no `finalize`

**Objetivo:** garantir que a memória global do sistema avance junto com a feature.

### Entregas

- Ao finalizar uma FEAT, atualizar automaticamente:
  - arquitetura
  - catálogo de serviços
  - spec tecnológica
  - contratos de integração
  - decisões de frontend
  - repo map
  - README
  - `.sdd/agente.md` quando necessário
- Criar política de merge entre:
  - dados inferidos
  - dados manuais aprovados
- Registrar no ADR:
  - contexto
  - decisão
  - impacto arquitetural
  - impacto no frontend
  - docs atualizadas

### Critério de aceite

- Após `finalize`, o sistema fica mais documentado globalmente, não apenas “mais concluído”.

---

## Fase 6. Replanejamento Semântico e Cross-RAD Forte

**Objetivo:** fechar o caso do insight emergente com o mínimo possível de intervenção manual.

### Entregas

- Fortalecer `produces` e `consumes` com tipos mais semânticos:
  - serviço
  - contrato
  - entidade de domínio
  - rota/frontend surface
- Tornar `breakdown` incremental o comportamento padrão quando backlog já existir, ou introduzir `sdd replan`.
- Recalcular:
  - dependências
  - cross-RAD links
  - lock conflicts
  - impactos em FEATs em progresso
- Exibir claramente “o que mudou no grafo” após o replanejamento.

### Critério de aceite

- Um insight novo no meio do desenvolvimento reorganiza o backlog de forma segura e legível.

---

## Fase 7. Frontend Decisions como Primeira Classe

**Objetivo:** sair de “só gaps” para “gaps + decisões + mapa atual”.

### Entregas

- Criar `frontend-decisions.yaml` e `frontend-decisions.md`.
- Permitir vincular decisão de frontend a:
  - RAD
  - FEAT
  - FGAP
  - ADR
- Separar claramente:
  - gaps pendentes
  - gaps resolvidos
  - decisões aprovadas
  - decisões descartadas

### Critério de aceite

- Um agente novo entende não só o que falta no frontend, mas por que o frontend está como está.

---

## Fase 8. Skills Operacionais e Auditáveis

**Objetivo:** transformar skills de “sugestão” em parte do fluxo rastreável.

### Entregas

- Registrar no plano da FEAT quais skills/bundles foram recomendados.
- Permitir que `start`, `context` e `onboard` tragam bundles relevantes automaticamente.
- Adicionar histórico de skills aplicadas por FEAT.

### Critério de aceite

- O uso de skills deixa de ser implícito e vira parte auditável do handoff e da execução.

---

## Ordem Recomendada de Implementação

1. Fase 1 — Governança documental e fonte de verdade
2. Fase 2 — Arquitetura, stack, serviços e frontend decisions
3. Fase 3 — Pacote de execução por FEAT
4. Fase 4 — Handoff completo e `sdd onboard`
5. Fase 5 — Consolidação macro no `finalize`
6. Fase 6 — Replanejamento semântico
7. Fase 7 — Frontend decisions
8. Fase 8 — Skills operacionais

---

## Testes Obrigatórios

1. Agente novo recebe `sdd onboard system` e identifica arquitetura, stack, serviços, contratos e frontend decisions sem ler código.
2. `README.md` e `.sdd/agente.md` não entram em contradição após `check --render` ou `finalize`.
3. `sdd start FEAT-###` cria pacote completo em `.sdd/active/`.
4. `sdd context FEAT-###` inclui predecessores, contratos, ADRs e ordem de leitura.
5. `finalize` atualiza pelo menos um documento macro além do backlog.
6. Novo insight com impacto em FEAT ativa recalcula grafo e mostra o delta.
7. Frontend decisions aparecem no pacote de onboarding.
8. Skills recomendadas aparecem no plano e no contexto da FEAT.

---

## Resultado Esperado

Ao final desse plano, o SDD não será apenas um gestor de backlog e discovery. Ele passará a ser:

- memória operacional do projeto
- mecanismo de onboarding de agentes
- mapa vivo da arquitetura
- spec tecnológica consolidada
- trilha de decisões de frontend
- sistema de execução e handoff com contexto suficiente para projetos grandes e fragmentados

Esse é o ponto em que a história da Marina deixa de ser “majoritariamente coberta” e passa a ser “coberta de ponta a ponta”.
