# Inspiração do "ai-coders-context" para o Framework SDD

Após uma análise profunda da estrutura e código-fonte do repositório `vinilana/ai-coders-context`, capturei 4 ideias conceituais muito fortes sobre gestão de Workflows que resolvem falhas na orquestração de Agentes.

Se estamos falando de ter 4 ou 5 agentes paralelos, o modelo de `ai-coders-context` tem padrões maduros que o nosso `.sdd/` pode (e deve) assimilar:

## 1. Roteamento Adaptativo por Escala (Scale-Adaptive Routing)

Uma das críticas que você e o outro agente fizeram ao SDD anterior é que a "Tríade" (Spec -> Plan -> Tasks) fica **burocrática demais** para mudanças simples.
No `ai-coders-context`, eles usam a metodologia PREVC (Plan, Review, Execution, Validation, Confirmation), mas **a escala do projeto pula fases**:

- **Escala QUICK:** Pula `P` e `R`, indo direto de `Execution -> Validation` (Apenas fixar o bug / `tasks.md` direto).
- **Escala MEDIUM/LARGE:** Exige `Plan -> Review -> Execution -> Validation`.

**Como usar no SDD:**
A CLI (`sdd start RAD-001 --scale quick`) pode injetar apenas a pasta e um `tasks.md` resumido, pulando o Spec e o Plan. O tamanho do workflow se adapta ao tamanho do problema, matando a burocracia para as tasks pequenas de paralelismo rápido.

## 2. Especialização de Papéis e Handoffs de Agentes

No código analisado (em `src/workflow/orchestrator.ts`), a inteligência não é jogar um prompt num único "Super Agente", mas mapear sub-tarefas por especialidade. Ele faz _Handoffs_ literais:

- O agente `feature-developer` conclui o _Execution_.
- A automação transfere os arquivos de output e chama o `test-writer` apontando para o _Validation_.

**Como usar no SDD Paralelo:**
Quando uma feature quebra no `backlog-features.md`, nós adicionariamos a coluna `Agent Role` (e.g. `frontend-specialist`, `backend-specialist`, `qa-agent`). Assim, se temos 5 tasks em paralelo, nós engatamos 5 papéis independentes, que no fechamento passam bastão uns para os outros sem misturar contextos mentais.

## 3. Workflow Gates (Bloqueios Rígidos por Regras)

Para evitar que Agentes engulam etapas ou façam Merges que apaguem trabalho no cenário paralelo, o conceito de **Gates** lá exige um `checkpoint`. O Agente não avança de "Execução" para "Validação" caso as amarras daquele Gate (ex: passar pelo Linters e aprovação humana explícita) não sejam atendidas.
Isso bate com a nossa necessidade de um `sdd check` e `sdd sync` rígidos entre branches.

## 4. Auditoria de Execução (Breadcrumb Trail)

Eles implementaram um sistema onde todo movimento que um agente faz grava um "state log" (`.context/workflow/actions.jsonl` ou `status.yaml`).
Isso é vital em execuções paralelas longas! Se o script falhar ou o Agente deslogar, outro Agente ao retomar a branch lê esse LOG curtinho de estado (`status.yaml`) em vez de ter que re-analisar tudo que o colega passado fez. Evita a amnésia ou duplicidade no trabalho.

## Síntese para a nossa V1

As ideias do repositório provam que **apenas prompts em Markdown não seguram automação paralela real**. Precisaremos de Status Dinâmico e Controle Escalar.
A fusão principal pro nosso SDD seria acoplar a ideia de **Escala** (`QUICK` = Rápido; `LARGE` = Tríade inteira) e os Logs compactos de finalização para os _Worktrees_ paralelos do Git sincronizarem em paz.

---

## Avaliação Crítica e Refinamento para o SDD (Por Terceiro Agente)

A paralelização segura **não se sustenta só com Markdown e boa vontade do agente**. Concordo fortemente com a **Escala adaptativa**, os **Workflow gates**, e o **Breadcrumb trail / state log**. No entanto, a ideia de _Papéis e Handoffs_ deve ser tratada como **sugestão operacional** no SDD, não como um acoplamento obrigatório que trava o sistema.

O que vamos adotar na V1:

### 1. Escala Adaptativa (Scale)

A escala deve virar parâmetro obrigatório no `sdd start` para ditar o nível de cerimônia, **mas sem perder a rastreabilidade**:

- **`QUICK`**: Cria sandbox enxuta. Pula `1-spec.md` e `2-plan.md` completos, mas **gera um `status.yaml` e/ou um `1-task.md` curto** com os motivos e áreas afetadas. Senão, perdemos a motivação da mudança.
- **`STANDARD`**: Sandbox completa com a Tríade (`spec` + `plan` + `tasks` + `verify`).
- **`LARGE`**: Sandbox completa com gates mais rígidos e `sync` humano/revisor obrigatório antes do archive.

### 2. State Log (`status.yaml`)

Todo _Worktree_ correspondente a uma Feature no `active/` deve ter este log stateful para retomada. Exemplo base:

```yaml
feat_id: FEAT-011
rad_id: RAD-042
scale: QUICK
agent_role: backend-specialist # Metadado, não rigidez
branch: sdd/FEAT-011
worktree: active/FEAT-011
blocked_by: [FEAT-010]
lock_domains: [auth, users]
current_stage: execution
last_sync_at: 2026-02-28T10:00:00Z
checks_passed: false
pending_handoff: false
outputs: []
```

### 3. Workflow Gates (Travas Operacionais na CLI)

Em vez de dependermos da IA ser "boazinha", a CLI força os **4 Gates Core**:

1. **START GATE** (`sdd start`): Verifica se os bloquedores em `backlog-features.md` estão resolvidos (DONE) e se não há _locks_ conflitantes.
2. **SYNC GATE** (`sdd sync`): Garante que a branch do Worktree baixe atualizações do Epic, validando fingerprints. Trava se houver divergência absurda.
3. **VERIFY GATE** (`sdd check/verify`): Valida se as tasks acabaram, run de testes ou linters básicos antes do archive.
4. **ARCHIVE GATE** (`sdd archive`): Só executa se o `verify` passar. Automaticamente consolida as documentações no `core/`, atualiza `frontend-gaps`/`tech-debt` no `pendencias/`, comita tudo pro Git, e move o status da tarefa pra `DONE` no Backlog global, libertando dependentes.

### Considerações Finais sobre a Matriz Operacional

O `backlog-features.md` passa a não ser mais uma mera lista de TODO, tornando-se o **Orquestrador de Grafo**:
`ID | Task | Status | Blocked By | Scale | Recommended Role | Touches | Lock Domains | Branch | Last Sync`

---

## Retoque Final de Arquitetura (V1.1 Consolidada)

A aprovação do sistema de Escala, Gates e Logs foi um sucesso, mas a paralelização traz um risco letal: **Colisão Semântica de Estado Compartilhado**. Se duas Features arquivam e consolidam a base juntas, a "Fonte da Verdade" (ex: `core/`, `frontend-map`, `tech-debt`) é sobrescrita silenciosamente.

Portanto, aplicamos **4 ajustes finais vitais** na arquitetura da V1:

### 1. Separação Estrita entre `Archive` (Feature) e `Finalize` (Epic)

- **`sdd archive FEAT-011`**: Apenas valida os gates, finaliza o worktree, mergeia o código da feature no branch do épico, marca `DONE` e libera a fila para outras features atuarem. **Não toca no `core/`**.
- **`sdd finalize RAD-042`**: É rodado _apenas_ quando o Épico inteiro termina (ou num checkpoint agendado). Ele pega todas as changes consolidadas das features e faz a atualização atômica do `core/`, de `frontend-map.md`, preenche `frontend-gaps`/`tech-debt` e emite o commit documental.

### 2. Controle de Divergência Baseado em Fingerprints

Quando a Feature nasce, ela salva o `fingerprint` (hash) dos arquivos do `core/` ou pendências que ela planeja afetar. O **SYNC GATE** (`sdd sync`) compara o hash base da Feature com o hash atual do Epic. Se divergir semânticamente, bloqueia a execução avisando a IA que a base mudou embaixo dela.

### 3. Matriz Operacional como View (`.sdd/state/backlog.yaml`)

Concorrência em Markdown é frágil. O `backlog-features.md` deve ser gerado e atualizado como uma visão (View Human-Readable). A fonte real orquestrada pelos IAs em paralelo deve ser um arquivo estruturado serializável: `.sdd/state/backlog.yaml`.

### 4. Taxonomia de Locks

`Lock Domains` passam a exigir nomenclatura rígida para o Gate não perder valor:

- Código/Domínio: `code:auth`, `code:billing`
- Documento Core: `doc:core/frontend-map`
- Estado de Orquestração: `state:backlog/RAD-042`
  Isso garante que Agente A batendo em `code:auth` não concorra com o Agente B tocando na mesma pasta no mesmo momento.

---

## Avaliação Final: O V1 Oficial (Aprovado)

Com as 4 correções acima, o modelo foi considerado 100% preparado para ser a fundação do **Framework SDD V1**. Para não deixar pontas soltas na transição, 7 acordos estritos fecham a V1:

1. **Topologia de Branches:** Fica cravado a hierarquia Git `main -> epic/RAD-XXX -> feat/FEAT-YYY`. Toda feature nasce do Épico.
2. **Escopo dos Fingerprints:** O rastreio de divergência monitorará restritamente arquivos de estado compartilhado: `core/*`, `frontend-map.md`, `frontend-gaps.md`, `tech-debt.md` e `.sdd/state/backlog.yaml`.
3. **Ponte Archive -> Finalize:** Como o `sdd archive` não escreve na "Fonte da Verdade", o agente responsável pela execução deve obrigatoriamente gerar o arquivo `active/FEAT-YYY/finalize-notes.md` propondo os _diffs_ que o `sdd finalize` aplicará no `core/` futuramente.
4. **Visão Não-Editável:** `backlog-features.md` é estritamente um arquivo **gerado** do `.sdd/state/backlog.yaml`. Edições manuais não são permitidas para evitar divergências.
5. **Grafo Restritivo de Status:** Os únicos status válidos no Backlog Matrix são: `READY`, `BLOCKED`, `IN_PROGRESS`, `SYNC_REQUIRED`, `VERIFY_FAILED`, `DONE`.
6. **Descolamento de Commits e Changelogs:** Foi abolida a extração de changelogs de commits parciais. O changelog é de responsabilidade da consolidação documental do `sdd finalize`.
7. **Templates Catalogados:** `.sdd/.templates/` exigirá templates distintos bem delineados (ex: `1-spec`, `2-plan`, `3-tasks`, `4-verify`, `insight`, `debate`, `radar`, `finalize-notes`, `status`).
