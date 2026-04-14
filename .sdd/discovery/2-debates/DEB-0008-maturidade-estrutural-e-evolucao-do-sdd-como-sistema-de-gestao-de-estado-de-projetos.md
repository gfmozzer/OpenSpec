# Debate DEB-0008

## 1) Pergunta de decisão (obrigatorio)
O OpenSDD, em sua arquitetura atual de fluxo (INS → DEB → EPIC → FEAT → archive + finalize), com seus templates, lentes estruturais, motor de transição e skills catalog, representa a melhor forma possível de gerir o estado de projetos de software vivos — ou existem lacunas estruturais, falhas de design de prompt e deficiências nos mecanismos de qualidade que devem ser corrigidas antes de uma adoção mais ampla?

---

## 2) Criterios de decisão (obrigatorio)
- **Qualidade semântica dos artefatos**: os artefatos gerados têm riqueza real de conteúdo ou são estruturas ocas com placeholders?
- **Integridade do funil de decisão**: a transição INS → DEB → EPIC → FEAT é suficientemente rigorosa para evitar decisões rápidas sem deliberação?
- **Eficácia das lentes estruturais**: as lentes realmente bloqueiam artefatos incompletos ou são validações simbólicas?
- **Relevância das skills recomendadas**: o catálogo de skills está sendo usado de forma contextual ou genérica?
- **Rastreabilidade e sanitização semântica**: os títulos, IDs e metadados se propagam corretamente entre artefatos sem poluição?
- **Cobertura de ADRs**: decisões arquiteturais relevantes são sistematicamente documentadas?
- **Capacidade de auto-evolução**: o SDD tem mecanismo formal para auditar sua própria eficácia e evoluir?
- **Escalabilidade multi-projeto**: o modelo funciona igualmente bem quando aplicado a projetos diferentes com contextos distintos?

---

## 3) Opcoes consideradas (minimo 2)

### Opcao A — Manutenção conservadora: ajustes pontuais sem redesenho
- **Proposta:**
  Corrigir os problemas observados pontualmente: sanitizar títulos na propagação, melhorar mensagens de erro nas lentes, refinar templates com campos mais descritivos. Não tocar na arquitetura de fluxo nem no modelo de transição.
- **Pras:**
  - Menor impacto em projetos já inicializados.
  - Baixa curva de adaptação.
  - Menor risco de regressão em funcionalidades testadas.
  - Rápido de entregar.
- **Contras:**
  - Não resolve os problemas de design estrutural (funil muito rápido, lentes simbólicas, skills genéricas).
  - Melhoria cosmética: artefatos ainda podem ser ocos, debates ainda podem ser instantâneos.
  - O sistema não ganha capacidade de auto-avaliação.
  - Acúmulo de patches sem coerência arquitetural.

### Opcao B — Redesenho profundo: hardening completo de todos os fluxos
- **Proposta:**
  Redesenhar os cinco eixos críticos identificados:
  1. **Qualidade de prompt por artefato**: enriquecer cada template com instruções de geração, critérios de aceitação e exemplos positivos/negativos embutidos.
  2. **Gates humanos obrigatórios**: introduzir checkpoints onde nenhuma transição pode ocorrer sem confirmação explícita (modo `rigoroso` como padrão, não exceção).
  3. **Lentes como bloqueadores reais**: vincular aprovação de estado diretamente à validação de lente; sem 100% de conformidade, transição recusada automaticamente.
  4. **Roteamento semântico de skills**: cada FEAT recebe recomendação de skills baseada em tipo (backend/frontend/infra/arquitetura/teste), não uma lista estática.
  5. **Protocolo de ADR mandatório**: qualquer FEAT com impacto arquitetural (campo `Impacto Arquitetural` preenchido com domínio não-trivial) gera automaticamente um template de ADR vinculado.
- **Pras:**
  - Resolve estruturalmente todos os pontos de fraqueza identificados.
  - Artefatos passam a ter conteúdo real obrigatório antes de avançar.
  - Skills deixam de ser decorativas e passam a ser operacionalmente relevantes.
  - ADRs se tornam parte do fluxo, não apêndice.
- **Contras:**
  - Alto esforço de implementação (5 eixos independentes).
  - Pode aumentar fricção para projetos pequenos ou experimentos rápidos.
  - Requer migração e retrocompatibilidade cuidadosa.
  - Risco de over-engineering se aplicado sem modo de escape (fast-track).

### Opcao C — Hardening seletivo com modo dual: rigoroso + rápido
- **Proposta:**
  Implementar os cinco eixos do Redesenho Profundo (Opção B), mas com um sistema de dois modos operacionais:
  - **Modo `rigoroso`**: todos os gates, lentes e bloqueios ativos. Para projetos de produção.
  - **Modo `express`**: funil fast-track com lentes mínimas, sem gates humanos obrigatórios, para experimentos, protótipos e trabalho solo de baixo risco.
  
  Além disso, adicionar um **protocolo de meta-evolução semestral**: ciclo formal de auditoria do próprio SDD com INS+DEB dedicados a melhorias do sistema.
- **Pras:**
  - Herda todos os benefícios do redesenho profundo.
  - Preserva agilidade para cenários onde rigor completo é custo sem benefício.
  - O modo express não é bypass silencioso: é declarado explicitamente com rastreabilidade.
  - Meta-evolução internaliza a melhoria contínua no próprio protocolo.
  - Escalável para multi-projeto sem impor overhead uniforme.
- **Contras:**
  - Maior complexidade de implementação e documentação.
  - Dois modos precisam ser mantidos, testados e evoluídos em paralelo.
  - Risco de modo `express` virar padrão de fato por conveniência, esvaziando o `rigoroso`.

---

## 4) Rodada de argumentos com evidência

### Agente A (defende A — conservador)
- **Argumento:**
  O sistema já entregou valor real: 7 EPICs, 10 FEATs, cobertura de testes de 72%, migração de estado auditável. Os problemas identificados são irritantes, não bloqueadores. Corrigir pontualmente é mais seguro do que redesenhar.
- **Evidências:**
  - `progress.md`: 91% global de DONE — prova de entrega funcional.
  - `backlog.yaml`: todas as FEATs têm origem rastreável até INS/DEB/EPIC — rastreabilidade real.
  - `DEB-0004` (guardails) já resolveu a maioria dos problemas estruturais de diretório e transição.
  - Adicionar gates obrigatórios pode travar fluxo em projetos com dev solo onde o "humano" e o "agente" são a mesma pessoa.

### Agente B (defende B — redesenho profundo)
- **Argumento:**
  O sistema funciona mas com artefatos ocos. FEAT-0004 e FEAT-0009 estão archivadas com `Objetivo: Descrever o resultado esperado...` — ainda o placeholder do template. Gates marcados como rascunho em artefatos DONE. Isso não é entrega de qualidade, é rastreabilidade formal sem substância.
- **Evidências:**
  - `.sdd/archived/FEAT-0004/1-spec.md` linha 17: `Objetivo: Descrever o resultado esperado desta feature com criterios de aceite objetivos.` — placeholder intacto.
  - `.sdd/archived/FEAT-0009/1-spec.md` idêntico: placeholder não preenchido, gates como `rascunho`.
  - `DEB-0006` e `DEB-0007` têm "Debate:" como prefixo no título — propagação não-sanitizada no discovery-index.
  - Skills em `2-plan.md` de toda FEAT são `architecture, concise-planning, context-window-management` — lista hardcoded indiferente ao domínio.
  - INS-0005 → DEB-0005 → EPIC-0004 → FEAT-0009 foi gerado e aprovado no mesmo dia (2026-04-13T02:02 a 02:32) — 30 minutos do insight ao EPIC sem deliberação real.

### Agente C (defende C — dual mode)
- **Argumento:**
  Tanto A quanto B erram na calibração. A nega problemas reais. B resolve com overhead fixo que pode ser contraproducente. O SDD serve múltiplos contextos: projeto de produção em equipe vs. experimento solo de 2 horas. Um único modo não serve a todos. A solução certa é rigor onde rigor tem valor, e expressividade onde agilidade é o bem maior.
- **Evidências:**
  - O próprio `config.yaml` já tem `flow_mode` com opções (`direto`, `padrao`, `rigoroso`) — a infraestrutura dual já existe, falta ser explorada.
  - `.sdd/prompts/00-comece-por-aqui.md` mostra que o sistema já foi desenhado pensando em "Marina" (usuária leiga). Adicionar gates mandatórios sem modo express prejudica esse caso de uso.
  - A meta-evolução é o mais importante: sem protocolo formal de auditoria do próprio SDD, qualquer melhoria depende de o usuário perceber o problema — o que não escalou em 7 EPICs e só foi percebido agora via análise humana explícita.

---

## 5) Rodada de crítica cruzada

### A critica B
- Gates obrigatórios em modo solo são fricção pura. Se o usuário é o agente e o humano ao mesmo tempo, exigir confirmação humana para transição é cerimonial.
- Redesenho de 5 eixos em paralelo tem alto risco de inconsistência entre eles durante a implementação.
- "Lentes como bloqueadores reais" pode tornar o sistema intransponível quando um artefato legítimo não se encaixa no template exato (edge cases reais).

### A critica C
- Dois modos são dois sistemas. Documentação, testes, evolução e suporte se duplicam.
- O modo `express` vai virar padrão porque reduz fricção. Na prática, o rigoroso será evitado.
- Meta-evolução semestral é boa ideia mas é processo organizacional, não técnico. Pode ser resolvido com uma nota no AGENT.md.

### B critica A
- Patches pontuais não resolvem o problema de design: lentes simbólicas continuam simbólicas, skills genéricas continuam genéricas.
- Artefatos ocos archivados são dívida cognitiva: quando um agente novo onboardar, vai ler FEATs com placeholders e não vai entender o que foi feito.
- A qualidade dos artefatos é o produto central do SDD. Se artefatos são ocos, o produto não funciona.

### B critica C
- Dois modos aumentam superfície de bugs e inconsistência de estado (qual lente se aplica em qual modo?).
- O modo express pode gerar artefatos que não passam nas lentes do modo rigoroso, criando projetos híbridos incoerenetes.

### C critica A
- Manutenção conservadora é adiamento de dívida técnica de design. Já foi adiada 7 EPICs.
- Sem meta-evolução formal, o SDD vai continuar precisando de análises humanas ad hoc como essa para evoluir.

### C critica B
- O redesenho profundo sem modo escape vai criar resistência de adoção nos exatos casos de uso onde o SDD tem mais potencial (projetos novos, experimentos).
- O risco real do redesenho profundo não é técnico — é cultural: gates obrigatórios criam percepção de burocracia.

---

## 6) Matriz de pontuação (0-5)

| Critério                          | Peso | A | B | C |
|-----------------------------------|------|---|---|---|
| Qualidade semântica dos artefatos  | 4    | 1 | 5 | 5 |
| Integridade do funil de decisão    | 4    | 2 | 5 | 5 |
| Eficácia das lentes estruturais    | 3    | 2 | 5 | 5 |
| Relevância de skills recomendadas  | 2    | 1 | 4 | 4 |
| Sanitização semântica de títulos   | 2    | 3 | 5 | 5 |
| Cobertura mandatória de ADRs       | 3    | 1 | 5 | 5 |
| Capacidade de auto-evolução        | 4    | 1 | 3 | 5 |
| Escalabilidade multi-projeto       | 3    | 3 | 2 | 5 |
| Custo de implementação             | 2    | 5 | 1 | 3 |
| Risco de regressão                 | 2    | 4 | 2 | 3 |

**Scores ponderados:**
- A: (1×4)+(2×4)+(2×3)+(1×2)+(3×2)+(1×3)+(1×4)+(3×3)+(5×2)+(4×2) = 4+8+6+2+6+3+4+9+10+8 = **60**
- B: (5×4)+(5×4)+(5×3)+(4×2)+(5×2)+(5×3)+(3×4)+(2×3)+(1×2)+(2×2) = 20+20+15+8+10+15+12+6+2+4 = **112**
- C: (5×4)+(5×4)+(5×3)+(4×2)+(5×2)+(5×3)+(5×4)+(5×3)+(3×2)+(3×2) = 20+20+15+8+10+15+20+15+6+6 = **135**

---

## 7) Decisão do mediador (obrigatorio)

- **Escolha (A/B/C):** C — Hardening seletivo com modo dual + protocolo de meta-evolução
- **Justificativa:**
  O OpenSDD está operacionalmente funcional mas estruturalmente imaturo em aspectos críticos de qualidade. A Opção A perpetua dívida de design que já foi observada em 7 ciclos consecutivos. A Opção B resolve o problema mas cria rigidez inadequada para o caso de uso de projeto solo/experimento que é justamente onde o SDD tem maior adoção atual.

  A Opção C é superior porque:
  1. **Resolve todos os problemas estruturais reais** identificados na análise — artefatos ocos, lentes simbólicas, skills genéricas, ADRs opcionais, títulos poluídos.
  2. **Preserva agilidade contextual** ao declarar explicitamente dois modos operacionais, evitando que o rigor seja percebido como burocracia.
  3. **Internaliza a evolução do próprio sistema** via protocolo de meta-evolução, fechando o loop de melhoria contínua que hoje depende de análise humana ad hoc.
  4. **É implementável incrementalmente** — os cinco eixos podem ser entregues como FEATs independentes dentro de uma EPIC.

- **Riscos aceitos:**
  - O modo `express` pode ser mal-utilizado. Mitigação: declaração explícita no artefato quando usado, rastreável no state.
  - Dois modos aumentam superfície de testes. Mitigação: testes paramétricos que cubram ambos os modos em uma só suite.
  - Implementação dos 5 eixos em paralelo requer disciplina de sequenciamento. Mitigação: EPIC única com FEATs ordenadas por dependência.

- **Condições de reversão:**
  - Se o modo `rigoroso` causar abandono sistemático pelo modo `express`, rever a definição dos gates obrigatórios — podem ser muito granulares.
  - Se a meta-evolução semestral gerar mais overhead do que insights, simplificar para um INS único anual com debate opcional.

---

## 8) Saída
- **APPROVED** → Criar EPIC-0008 "Hardening estrutural do SDD: modo dual, lentes reais e meta-evolução" para desdobrar os cinco eixos em FEATs independentes.
- **DISCARDED** → Registrar em discarded com justificativa.

---

## 9) Proposta recomendada: os cinco eixos de evolução

### Eixo 1 — Enriquecimento de prompts por artefato
**Problema:** Templates são skeletons estruturais sem instruções de qualidade. Agentes preenchem com placeholders.
**Solução:**
- Cada template passa a ter uma seção `## Instruções de geração` (removida antes de salvar) com:
  - O que esta seção deve conter (exemplos positivos).
  - O que é proibido (placeholders, frases genéricas, cópias do título).
  - Critério de qualidade mínima (≥ 2 sentenças substanciais para campos Objetivo/Resumo).
- `insight_lens` passa a ter `min_length: 100` para o campo Descrição.
- `debate_lens` passa a ter `forbidden_phrases: ["(preencher", "Descrever o resultado", "Descreva o que"]`.
- `feat_spec_lens` valida que `## Objetivo` tem ≥ 3 linhas não-placeholder.

### Eixo 2 — Lentes como bloqueadores reais de transição
**Problema:** Lentes existem mas transições não dependem de conformidade comprovada.
**Solução:**
- `TransitionEngine` passa a chamar `validateLens(artifact, lens)` antes de qualquer transição.
- Retorno `false` de qualquer lens bloqueia a transição com mensagem específica indicando qual campo falhou.
- Exceção: `--force` ainda existe mas gera entry em `finalize-queue.yaml` com flag `forced_transition: true` para auditoria posterior.
- Modo `express` relaxa as lentes para validação mínima (apenas seções obrigatórias presentes, sem validação de conteúdo).

### Eixo 3 — Roteamento semântico de skills
**Problema:** Toda FEAT recebe as mesmas 3 skills independente do domínio.
**Solução:**
- `backlog.yaml` passa a ter campo `domain: [backend|frontend|infra|architecture|testing|data|full-stack]`.
- Skill recommendations são derivadas de uma tabela de mapeamento `domain → skills[]` em `skill-routing.yaml`.
- Template `2-plan.md` é gerado com skills específicas do domínio, não hardcoded.
- Bundle recommendations seguem o mesmo princípio.
- Exemplo de mapeamento:
  ```yaml
  backend: [backend-dev-guidelines, api-design-principles, database-design]
  frontend: [frontend-dev-guidelines, react-patterns, ui-ux-pro-max]
  testing: [tdd-workflows-tdd-cycle, python-testing-patterns, e2e-testing]
  architecture: [architecture, senior-architect, architecture-decision-records]
  ```

### Eixo 4 — ADR mandatório para impacto arquitetural
**Problema:** ADRs são opcionais, raramente criados, desconectados do fluxo de FEAT.
**Solução:**
- Campo `Impacto Arquitetural` em `2-plan.md` recebe campo booleano `requires_adr: true|false`.
- Se `requires_adr: true`, `opensdd sdd start FEAT-####` cria automaticamente `.sdd/core/adrs/ADR-FEAT-####.md` com template pré-preenchido (contexto da FEAT, decisão em aberto, consequências a preencher).
- `finalize` bloqueia se `requires_adr: true` e `ADR-FEAT-####.md` não existir ou contiver placeholders.
- A seção `## Refs` da spec passa a incluir `- ADR: ADR-FEAT-####` quando aplicável.

### Eixo 5 — Protocolo de meta-evolução do SDD
**Problema:** O SDD não tem mecanismo formal para auditar sua própria eficácia e evoluir.
**Solução:**
- Introduzir ciclo `SDD-AUDIT` semestral declarado em `config.yaml`:
  ```yaml
  meta_evolution:
    enabled: true
    cycle: 6months
    last_audit: null
    next_audit: null
  ```
- O comando `opensdd sdd audit` exibe métricas de qualidade do ciclo atual:
  - % de FEATs com Objetivo preenchido (não-placeholder)
  - % de debates com deliberação real (tempo entre INS e APPROVED > threshold)
  - % de ADRs gerados vs esperados
  - Skills mais utilizadas vs catálogo disponível
  - FEATs com `forced_transition` registrado
- Resultado do audit gera automaticamente um INS com o relatório para iniciar novo ciclo de melhoria.

### Eixo transversal — Sanitização semântica de propagação de títulos
**Problema:** Títulos de INS/DEB são copiados para EPIC/FEAT sem sanitização, gerando prefixos como "Debate:" nos títulos de EPICs.
**Solução:**
- `sdd insight` e `sdd debate` passam a ter campo `title_canonical` (max 60 chars, sem prefixos funcionais).
- Na transição DEB → EPIC, o título da EPIC é derivado de `title_canonical`, não do título do debate.
- Validação no `check`: nenhum EPIC ou FEAT pode ter título contendo as strings `"Debate:"`, `"Insight:"`, `"(preencher"`, `"(placeholder"`.

---

## 10) Áreas impactadas

- **Templates e lentes:** `.sdd/templates/`, `src/core/sdd/lenses.ts` (ou equivalente)
- **Motor de transição:** `src/core/sdd/transition-engine.ts`
- **Operações SDD:** `src/core/sdd/operations.ts` (start, archive, finalize)
- **Geração de plano:** `src/core/sdd/default-bootstrap-files.ts`
- **Skill routing:** novo arquivo `src/core/sdd/skill-routing.ts` + `.sdd/state/skill-routing.yaml`
- **Check e validação:** `src/core/sdd/check.ts`, `src/core/sdd/validate.ts`
- **Config:** `src/core/sdd/config.ts`, `.sdd/config.yaml`
- **CLI commands:** `src/commands/sdd.ts` (novo subcomando `audit`)
- **Documentação:** `docs/sdd-manual-pt-br.md`, `.sdd/AGENT.md`, `.sdd/prompts/`

---

## 11) Requisitos adicionais para implementação

- Os dois modos (`rigoroso` e `express`) devem ser testados na mesma suite de testes com parametrização.
- `forced_transition` deve ser rastreado em `finalize-queue.yaml` com campo `override_reason`.
- `skill-routing.yaml` deve ser editável sem recompilação (config, não código).
- O comando `audit` deve ser não-destrutivo e idempotente.
- `title_canonical` deve ter validação de comprimento e conteúdo no momento da criação do artefato.
- A meta-evolução não deve criar INS automaticamente sem revisão humana — deve apenas exibir o relatório e sugerir a criação.

---

## Metadados
- Insight de origem: INS-0008
- Titulo do insight: Análise meta-crítica do SDD como sistema de gestão de estado de projetos
- Criado em: 2026-04-13
- Debate aberto em: 2026-04-13
- Mediador: análise humana assistida por Claude (claude-sonnet-4-6)
