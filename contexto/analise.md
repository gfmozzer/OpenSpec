# Análise e Propostas de Melhoria: Framework SDD Automadesk

## 1. O "Insight-Mãe" (A Tese Central)

O verdadeiro problema a ser resolvido não é a falta de especificações completas, e sim a **amnésia de contexto e o acúmulo de lixo cognitivo (context bloat)**. O "insight-mãe" extraído do debate é: **O repositório deve ser tratado como um sistema autônomo de memória (Passado, Presente, Futuro) com ritos de transição rígidos, onde o trabalho de código (`active/`) só ocorre em micro-contextos isolados, preservando e limpando o contexto global (`core/`) apenas no momento do arquivamento.**

## 2. A Avaliação Crítica: O Racional do Debate Resolve os Problemas?

O modelo híbrido estruturado no debate (Funil Discovery + Ampulheta Active + Fonte de Verdade Core) é impecável na teoria, mas na prática, corre alguns riscos pontuais que podem reverter o sistema para o caos original:

- **Risco de Fricção e Fadiga de Agente (Burocracia):** A "Tríade de Execução" atual obriga o agente a preencher e rastrear `1-spec.md`, `2-plan.md`, `3-tasks.md` e `4-changelog.md` até mesmo para features de escopo médio-pequeno. Essa "dança" entre os arquivos consome limite de tokens do agente atoa antes dele realizar a tarefa final de programar.
- **Risco de Falha no Roteamento ("O Porteiro"):** Quando dependemos de um prompt global no `.sdd/agente.md` para classificar intenções humanas (Insights, Dívida ou Execução), qualquer LLM menos capaz ou confuso pode jogar algo urgente em um limbo de debate no radar.
- **Saturação do Core:** A instrução de sempre ler o `core/arquitetura.md` e o `core/dicionario-dados.md` falhará no longo prazo se o projeto escalar. Em 6 meses, um arquivo de dicionário de dados central pode ter milhares de linhas, voltando ao problema inicial de estourar o limite de tokens.

## 3. Minhas Formas de Melhorar (Perspectiva Antigravity)

Para evitar que a solução vire burocracia, sugiro as seguintes camadas de adaptação imediata:

1. **Boot Sequence Direcionado (Lazy Context Loading):** O "Porteiro" não pode mandar o agente carregar _tudo_ do Core toda vez. Ele deve apenas mapear o "sumário" da arquitetura. Se a task for do frontend, o agente carrega apenas `frontend-map.md`. Se for infra, carrega o `arquitetura.md`.
2. **Compactação da Tríade de Execução:** Transformar a Tríade em um documento unificado para o trabalho fluído: `plan.md` (que condensa "O que" e "Como") e `tasks.md` (o check-list da execução cruzado com o Tech-Debt do momento). Menos I/O no disco e mais foco;
3. **Mecanismos de Integração Real (Git-Hooks):** O comando final `/sdd.archive` ser amarrado num simples shell script na pasta (ex: `npm run sdd:archive`), para evitar que a IA alucine esquecendo de atualizar um Documento Core e fechando a feature sem fazer a limpeza final;
4. **Resolução Rápida (SLA de Debates):** Limitar os "Debates" entre os agentes IDE vs Agente CLI ao essencial, adicionando um "Juiz de Debates" que finaliza conversas maiores que 3 a 5 inputs para otimizar os tokens das IAs.

## 4. Templates Mínimos Propostos

### Template: `1-insights/id-000-novo-insight.md`

```markdown
# [ID] Título Contextual

- **Contexto original:** O que deu origem a ideia.
- **Problema/Oportunidade:** Um parágrafo objetivo.
- **Decisão Esperada:** Mudar p/ /sdd.debate; /sdd.fast-track ou ignorar?
```

### Template: `2-debates/id-000-debate.md`

```markdown
# [ID] Fórum de Debate: Título da Funcionalidade

> Origem: `1-insights/[id]`

## Argumentações Assíncronas

- **[Agente/Autor A]:** Sugestão para aplicar...
- **[Agente/Autor B]:** Crítica (ex. gargalos no PostgreSQL, acoplamento).

## Consenso & Próximo Passo

- **Status:** [Ex: Radarzado / Icompatível]
```

### Template: `3-radar/id-000-epic.md`

```markdown
# [ID] Épico: Título Aprovado

> Decisão de Origem: `2-debates/[id].md`

- **História Resumo:** O que precisa ser feito do ponto de vista do Domínio de negócio.
- **Restrição Crucial (Do Debate):** Nao permitir acesso X, precisa de RabbitMq em Y.
- **Micro-tasks derivadas p/ Backlog:** [ Lista das IDs quebradas pro backlog-features ]
```

## 5. A Diferença: Decisão vs. Ambição

- **Aspiracional (Ambição):** O sistema consegue interligar 100% todos os gaps dinamicamente por Prompt base, interceptando débitos técnicos, auto-atualizando documentações da fonte de verdade (`core/`) simpesmente lendo as "ordens" em Markdown.
- **Decisão e Realidade Operacional (O Gap):** Agentes de IA ainda falham ao fechar fluxos longos se não tiverem "barreiras/rails" limitadores. Se deixarmos o processo e as passagens de bastões soltos dependentes apenas de Prompts (como o uso das "barras de comando" puras na CLI), haverá deslizes na "Consolidação e Fechamento". Para fechar a realidade pragmática, o SDD precisará estar atrelado em um workflow de automação menor (via package npm ou CLI simples) que força o humano e o Agente a não desviarem da via pavimentada sem burocratizar demais na IDE.

## 6. Minhas Considerações Sobre a Proposta

A síntese acima está forte naquilo que realmente importa: ela separa bem a **tese central** do framework, os **riscos operacionais** e as **adaptações pragmáticas**. O acerto principal é reconhecer que o problema real não é "falta de documentação", e sim **degradação de memória operacional** em projetos vivos.

Concordo integralmente com estes pontos:

- O repositório precisa funcionar como um sistema de memória com **Passado, Presente e Futuro**.
- O `core/` não pode ser reescrito no meio da execução; ele deve ser atualizado apenas no fechamento.
- O `active/` precisa permanecer como sandbox isolado para reduzir ruído e evitar context bloat.
- O fluxo não pode depender só de disciplina humana; ele precisa de **rails operacionais** mínimos.
- O carregamento de contexto deve ser **direcionado**, e não "leia tudo sempre".

Os pontos em que eu ajustaria a proposta são estes:

### 6.1. Eu não fundiria `spec` e `plan`

A proposta de compactar a Tríade para `plan.md` + `tasks.md` reduz I/O, mas sacrifica a melhor parte herdada do Spec-Kit: a separação entre:

- **O quê / por quê** (`spec`)
- **Como** (`plan`)

Misturar esses dois níveis parece mais simples no curto prazo, mas costuma piorar a manutenção depois. Quando a regra de negócio muda, você quer revisar o `spec` sem misturar isso com endpoint, fila, migration, estado global ou rollback.

**Melhoria proposta:** manter `1-spec.md` e `2-plan.md`, mas obrigar ambos a serem curtos e objetivos.

### 6.2. Eu trocaria git-hooks por uma CLI explícita

Git hooks podem ajudar, mas têm dois problemas:

- são invisíveis para o humano;
- são fáceis de burlar ou falhar silenciosamente.

**Melhoria proposta:** criar uma CLI simples e explícita, por exemplo:

- `sdd insight`
- `sdd debate`
- `sdd decide`
- `sdd breakdown`
- `sdd start`
- `sdd check`
- `sdd archive`

Comando explícito é mais auditável, mais previsível e mais fácil de ensinar para humanos e agentes.

### 6.3. Eu não criaria agora um "Juiz de Debates"

O problema de debates longos é real, mas um terceiro agente para arbitrar isso agora aumenta o custo cognitivo antes de estabilizarmos o fluxo básico.

**Melhoria proposta:** resolver isso primeiro por template e regra:

- no máximo 2 ou 3 posições;
- 1 seção curta de síntese;
- 1 decisão final com status.

Se ainda houver fadiga depois, aí sim faz sentido automatizar arbitragem.

### 6.4. O `core/` precisa virar índice + documentos por domínio

A crítica sobre saturação do `core/` está correta. O erro seria tentar resolver isso eliminando o core; o certo é **fragmentar o core sem perder a ideia de fonte da verdade**.

**Melhoria proposta:**

- `core/index.md` com mapa curto do sistema;
- `core/arquitetura.md` para visão macro;
- `core/frontend-map.md` para rotas, telas e estados;
- `core/dados/` para domínio e entidades;
- `core/integracoes/` para eventos, filas, APIs externas;
- `core/adrs/` para decisões estruturais.

Assim o boot sequence carrega primeiro o índice e só depois aprofunda no domínio relevante.

## 7. Como Eu Implementaria na Prática

### 7.1. Estrutura final recomendada

```text
.sdd/
├── agente.md
├── core/
│   ├── index.md
│   ├── arquitetura.md
│   ├── frontend-map.md
│   ├── dados/
│   ├── integracoes/
│   └── adrs/
├── discovery/
│   ├── index-ideias.md
│   ├── 1-insights/
│   ├── 2-debates/
│   ├── 3-radar/
│   └── 4-incompativeis/
├── pendencias/
│   ├── tech-debt.md
│   ├── frontend-gaps.md
│   └── backlog-features.md
├── active/
├── archive/
├── .templates/
└── skills/
```

### 7.2. Boot Sequence enxuto

Em vez de sempre ler `arquitetura.md` + `dicionario-dados.md` completos, eu faria o seguinte:

1. Ler `core/index.md`
2. Identificar a natureza da task
3. Carregar apenas os arquivos relevantes

Exemplos:

- Task de frontend: `core/index.md` + `core/frontend-map.md`
- Task de backend com regra de domínio: `core/index.md` + `core/dados/<dominio>.md`
- Task de integração: `core/index.md` + `core/integracoes/<sistema>.md`
- Só em mudança estrutural: `core/arquitetura.md` + ADRs relevantes

### 7.3. Artefatos de execução que eu manteria

Eu manteria:

- `1-spec.md`
- `2-plan.md`
- `3-tasks.md`
- `4-verify.md`

E mudaria o changelog para uma destas opções:

- ou ele vira `5-changelog.md`;
- ou ele deixa de ser template fixo e passa a ser gerado no momento do archive.

Hoje ele fica numa posição ambígua e compete com o `4-verify.md`.

### 7.4. Estados e IDs obrigatórios

Para o sistema não virar interpretação livre, eu padronizaria IDs e status.

IDs:

- `INS-001`
- `DEB-001`
- `RAD-001`
- `FGAP-001`
- `TD-001`
- `FEAT-001`

Status:

- Insight: `NEW`, `DEBATED`, `PROMOTED`, `DROPPED`
- Debate: `OPEN`, `APPROVED`, `DISCARDED`, `SUPERSEDED`
- Radar: `READY`, `SCHEDULED`, `IN_PROGRESS`, `DONE`, `CANCELLED`
- Frontend gap: `OPEN`, `PLANNED`, `RESOLVED`
- Frontend map: `OK`, `PARTIAL`, `GAP`

### 7.5. Comandos mínimos da trilha pavimentada

Se fosse para formalizar o sistema sem exagero, eu deixaria apenas estes comandos:

- `/sdd.insight [titulo]`
- `/sdd.debate [INS-ID]`
- `/sdd.decide [DEB-ID] [radar|reject]`
- `/sdd.breakdown [RAD-ID]`
- `/sdd.start [RAD-ID|BACKLOG-ID|ordem-direta]`
- `/sdd.check`
- `/sdd.archive [FEAT-ID]`

O papel de cada um:

- `insight`: registra ideia sem pressionar execução;
- `debate`: transforma ideia em discussão estruturada;
- `decide`: promove para radar ou descarta;
- `breakdown`: quebra um épico em microtarefas;
- `start`: cria a sandbox de execução;
- `check`: valida consistência documental;
- `archive`: fecha, consolida e limpa.

### 7.6. O comando mais importante: `sdd check`

Se eu tivesse que automatizar só uma coisa no começo, seria essa.

O `sdd check` deveria validar:

- pastas obrigatórias existentes;
- links quebrados entre insight, debate e radar;
- status inválidos;
- placeholders não preenchidos em templates;
- `active/` sem `verify`;
- feature arquivada sem atualização no `core`;
- gap de frontend aberto sem reflexo no `frontend-map`;
- backlog apontando skill inexistente.

Esse comando entrega muito valor com pouca complexidade.

## 8. Modelo Consolidado que Eu Aprovaria como V1

Se eu fosse consolidar o framework em uma versão operacional inicial, ela seria assim:

1. **Discovery separado da execução**
   Insight não é tarefa. Debate não é execução. Radar não é backlog.

2. **Sandbox obrigatória para implementação**
   Todo código relevante nasce em `active/<feature>/`.

3. **Core pequeno, modular e carregado sob demanda**
   O agente nunca deve ler "o universo" por padrão.

4. **Separação preservada entre negócio e técnico**
   `spec` e `plan` continuam separados, porém curtos.

5. **Fechamento guiado por comando**
   O archive não depende só de memória do agente.

6. **Frontend tratado como memória operacional real**
   `frontend-gaps.md` responde o que falta;
   `frontend-map.md` responde o que existe.

7. **Automação mínima, mas estratégica**
   Em vez de automação total com múltiplos agentes, começar com `sdd check` e `sdd archive`.

## 9. Conclusão

A proposta do outro agente está conceitualmente certa e pragmaticamente melhor que o estado atual do repositório. O principal mérito dela é reconhecer que um SDD útil não pode ser apenas um conjunto de prompts e templates; ele precisa de trilhas operacionais que reduzam desvio.

Minha melhoria central sobre essa proposta é simples:

- **não simplificar misturando camadas**;
- **simplificar reduzindo leitura, reduzindo escrita e automatizando o fechamento**.

Se esse princípio for mantido, o framework continua fiel ao manifesto original sem escorregar para burocracia, e também sem cair na armadilha oposta de virar um sistema solto demais para ser confiável.

## 10. O Desafio Final: Workflows Paralelos (Multi-Agent)

A pergunta sobre como gerenciar **4-5 agents paralelizados trabalhando em tarefas dependentes** toca no cálice sagrado da orquestração de IAs. O modelo V1 (descrito acima) mapeia bem o fluxo single-agent ou sequencial. Para abraçar o paralelismo _sem corrupção de estado ou código sobrescrito_, o SDD precisa evoluir de um modelo de "Fila Simples" para um "Grafo de Dependências Isolado".

Como o SDD abordaria isso na prática:

### 10.1. O Estado do Workflow (`backlog-features.md`)

O arquivo `.sdd/pendencias/backlog-features.md` se torna o **Cérebro Orquestrador**. Quando o `/sdd.breakdown` quebra o Épico (Radar), ele não gera uma simples lista, ele gera uma matriz de dependências.

```markdown
| ID       | Task                     | Status      | Bloqueado Por      |
| -------- | ------------------------ | ----------- | ------------------ |
| FEAT-010 | Criar Tabela Usuários    | DONE        | -                  |
| FEAT-011 | API de Login (Backend)   | IN_PROGRESS | FEAT-010           |
| FEAT-012 | Tela de Login (Frontend) | READY       | FEAT-010           |
| FEAT-013 | Integração Tela+API      | BLOCKED     | FEAT-011, FEAT-012 |
```

- O agente que vai iniciar uma tarefa roda a CLI (ex: `sdd start FEAT-013`). A CLI nega o início se os bloqueadores não estiverem `DONE`.
- **FEAT-011** e **FEAT-012** podem rodar em paralelo, pois ambos só dependiam de 010 (que já acabou).

### 10.2. Isolamento de Código: Branches e Git Worktrees

Se o Agente A e o Agente B trabalharem paralelamente no mesmo repositório na branch `main`, eles vão gerar conflitos na hora de salvar arquivos em comum.
A única solução segura é o **isolamento via Git**.

- O SDD deve forçar que a pasta `active/FEAT-011/` corresponda a uma _Feature Branch_ (ou Git Worktree) chamada `sdd/FEAT-011`.
- O agente programa e commita apenas no isolamento da sua branch.

### 10.3. A Sincronização e Bloqueios (`sdd sync`)

Quando o Agente do **FEAT-011** termina, o comando `/sdd.archive FEAT-011` não vai jogar o código direto na main. Ele:

1. Faz merge da branch `sdd/FEAT-011` contra a branch de integração do Épico.
2. Atualiza o status do `FEAT-011` para `DONE` no `backlog-features.md`.
3. Isso **libera** automaticamente a tarefa `FEAT-013` (que passa de `BLOCKED` para `READY` se a 012 também terminou).

**Resumo:** O nosso SDD suporta paralelismo na sua arquitetura documental através das tabelas Markdown com a coluna "Bloqueado Por" (formando um DAG - Grafo Acíclico Direcionado). Contudo, a execução física paralela de IAs exigirá o uso intenso de ramos Git (Branches/Worktrees) na Sandbox `active/` para impedir que elas sobrescrevam o código uma da outra concorrentemente.
