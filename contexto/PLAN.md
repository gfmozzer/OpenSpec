# Plano Revisado (Consenso): OpenSpec + SDD Memória Operacional

## Resumo
Este plano consolida o consenso: manter `openspec/changes/` como motor de execução e adicionar `.sdd/` como camada de memória operacional. A direção estratégica permanece ampla, mas a entrega da V1 foi reduzida para um núcleo implementável e verificável.

Objetivo da V1: criar fundação sólida (`.sdd/`, estado YAML, render de views Markdown, validação mínima e comando `openspec sdd init`) sem tentar entregar todo o sistema final de uma vez.

## Decisões travadas (consenso)
1. `openspec/changes/` continua como fonte da verdade da execução de features.
2. `.sdd/` vira a fonte da verdade da memória operacional do projeto.
3. `RADAR` não é a única origem de execução. Origens permitidas: `radar`, `direct`, `fast_track`, `tech_debt`, `frontend_gap`.
4. Estado canônico fica em YAML; Markdown é view gerada e não editada manualmente.
5. `archive` e `finalize` são operações distintas.
6. Camada de frontend (`frontend-map` e `frontend-gaps`) é **opt-in** na V1 via configuração.
7. Skills terão fonte única de verdade em `.sdd/` e serão sincronizadas para diretórios das ferramentas.
8. Não haverá download dinâmico de skills externas na V1; catálogo curado e versionado localmente.
9. O workflow `sdd` já existente (`openspec-sdd`) é base de transição e continua ativo.
10. Paths de skills nas ferramentas seguem o padrão atual do projeto (`.<tool>/skills/`).

## Escopo e não escopo da V1

### Escopo da V1 (obrigatório)
1. Comando `openspec sdd init`.
2. Estrutura base `.sdd/` com arquivos iniciais de estado.
3. Tipos e camada de leitura/escrita dos YAMLs de estado.
4. Render automático de views Markdown a partir do estado YAML.
5. Comando `openspec sdd check` mínimo para validação estrutural e consistência básica de IDs/status.

### Não escopo da V1
1. Pipeline completo de discovery (`insight/debate/decide`) já funcional.
2. Motor completo de paralelização com locks e grafo de execução.
3. Context pack completo com curadoria semântica avançada.
4. Finalize pipeline completo com consolidação documental automática total.
5. Sync completo de bundles de skills curadas.

## Arquitetura alvo (norte estratégico)

### Diretórios `.sdd/`
```text
.sdd/
├── config.yaml
├── core/
│   ├── index.md
│   ├── arquitetura.md
│   ├── frontend-map.md                # opcional (frontend enabled)
│   ├── dados/
│   ├── integracoes/
│   └── adrs/
├── discovery/
│   ├── 1-insights/
│   ├── 2-debates/
│   ├── 3-radar/
│   └── 4-discarded/
├── pendencias/
│   ├── backlog-features.md
│   ├── frontend-gaps.md               # opcional (frontend enabled)
│   └── tech-debt.md
├── state/
│   ├── discovery-index.yaml
│   ├── backlog.yaml
│   ├── tech-debt.yaml
│   ├── finalize-queue.yaml
│   ├── frontend-gaps.yaml             # opcional (frontend enabled)
│   ├── frontend-map.yaml              # opcional (frontend enabled)
│   └── skill-catalog.yaml
├── skills/
│   ├── curated/
│   └── bundles/
└── templates/
```

### Fontes de verdade por domínio
1. Execução: `openspec/changes/<change-name>/`.
2. Histórico de execução: `openspec/changes/archive/`.
3. Estado SDD: `.sdd/state/*.yaml`.
4. Views humanas: `.sdd/core/*.md` e `.sdd/pendencias/*.md` gerados a partir do estado.

## Entidades, IDs e estados (modelo alvo)

### IDs
1. `INS-###`: insight.
2. `DEB-###`: debate.
3. `RAD-###`: item de radar.
4. `FEAT-###`: item executável.
5. `FGAP-###`: gap de frontend.
6. `TD-###`: tech debt.

### Estados
1. Insight: `NEW`, `DEBATED`, `PROMOTED`, `DROPPED`.
2. Debate: `OPEN`, `APPROVED`, `DISCARDED`, `SUPERSEDED`.
3. Radar: `READY`, `PLANNED`, `SPLIT`, `IN_PROGRESS`, `DONE`, `CANCELLED`.
4. Feature: `READY`, `BLOCKED`, `IN_PROGRESS`, `SYNC_REQUIRED`, `VERIFY_FAILED`, `ARCHIVED`, `DONE`.
5. Frontend gap: `OPEN`, `PLANNED`, `IN_PROGRESS`, `DONE`, `SUPERSEDED`.
6. Frontend map route/menu: `OK`, `GAP`, `PLANNED`, `PARTIAL`, `DEPRECATED`.

## Interfaces públicas e contratos

### Configuração (`openspec/config.yaml`)
Adicionar bloco:
```yaml
sdd:
  enabled: true
  memoryDir: ".sdd"
  frontend:
    enabled: false
  views:
    autoRender: true
```

### Tipos públicos novos (mínimo inicial)
1. `SddConfig`.
2. `BacklogItem`.
3. `DiscoveryRecord`.
4. `TechDebtRecord`.
5. `FrontendGapRecord` e `FrontendRouteRecord` (somente quando `frontend.enabled=true`).
6. `SkillCatalogEntry`.

### Contrato de origem de execução
1. Toda execução mapeia para um `FEAT-*`.
2. `origin_type`: `radar | direct | fast_track | frontend_gap | tech_debt`.
3. `origin_ref` obrigatório quando aplicável.

## Estratégia de skills (fonte única)
1. Fonte canônica: `.sdd/state/skill-catalog.yaml` e `.sdd/skills/curated/`.
2. Distribuição: sync para `.<tool>/skills/` usando pipeline existente de geração/sync.
3. Pastas de ferramenta nunca são tratadas como fonte canônica.
4. Cada plano/contexto recomenda no máximo 3 skills por tarefa.

## Estratégia de frontend (opt-in)
1. Somente ativa quando `sdd.frontend.enabled=true`.
2. `frontend-map.yaml` representa estado atual da UI.
3. `frontend-gaps.yaml` representa ledger histórico e operacional de gaps.
4. Resolver gap nunca apaga registro; muda status para `DONE` e registra `implemented_files`.
5. `frontend-map.md` e `frontend-gaps.md` são views geradas.

## Plano de entrega por versão

### V1 (entrega imediata)
1. `openspec sdd init` cria estrutura `.sdd/`.
2. Criar e validar schemas de estado YAML iniciais.
3. Implementar camada `load/save` de estado.
4. Implementar renderer de views Markdown.
5. Implementar `openspec sdd check` mínimo.
6. Cobrir com testes unitários e integração CLI.

### V1.1
1. Comandos `insight`, `debate`, `decide`.
2. Geração de `discovery-index.yaml` e views de discovery.
3. `breakdown` e `start` iniciais para transformar `RAD` em `FEAT`.

### V1.2
1. Módulo frontend opt-in completo (`frontend-map` + `frontend-gaps`).
2. Fluxo de fechamento de gaps por `FEAT`.

### V1.3
1. `finalize-queue` e comando `finalize`.
2. `context` sob demanda para onboarding de novos agentes.

### V1.4
1. Catálogo curado de skills.
2. Bundles e comando `skills sync`.

### V1.5
1. Regras mais fortes de paralelização (`blocked_by`, `touches`, `lock_domains`).
2. Diagnósticos avançados do `sdd check`.

## Comandos por etapa

### V1
1. `openspec sdd init`
2. `openspec sdd check`

### V1.1+
1. `openspec sdd insight "<texto>"`
2. `openspec sdd debate INS-###`
3. `openspec sdd decide DEB-### --outcome radar|discard`
4. `openspec sdd breakdown RAD-###`
5. `openspec sdd start <RAD-###|FEAT-###|FGAP-###|texto livre>`
6. `openspec sdd finalize [--ref <FEAT|RAD>|--all-ready]`
7. `openspec sdd context <FEAT|RAD|FGAP|TD>`
8. `openspec sdd skills sync [--bundle <id>|--all]`

## Casos de teste (priorizados)

### V1 (obrigatórios)
1. `sdd init` cria estrutura e YAMLs válidos.
2. `sdd init` é idempotente.
3. `sdd check` detecta estado válido.
4. `sdd check` falha com mensagens claras para IDs inválidos e status inválidos.
5. Alteração em YAML reflete corretamente em views Markdown geradas.

### V1.1+ (subsequentes)
1. Insight promovido para debate e decisão com rastreabilidade.
2. Debate descartado com motivo preservado.
3. `FEAT` direto (`origin_type=direct`) sem passar por radar.
4. Gap de frontend criado por backend e resolvido por feature de frontend.
5. `context` retorna recorte suficiente sem inspeção completa de código.

## Critérios de aceitação por etapa

### V1 aceita quando
1. Estrutura `.sdd/` e estado inicial funcionam em projeto novo e existente.
2. Estado YAML e views Markdown permanecem consistentes.
3. `sdd check` bloqueia incoerências estruturais básicas.

### Objetivo estratégico (após V1.x)
1. Novo agente consegue iniciar por contexto direcionado sem varrer o código inteiro.
2. Descoberta e execução ficam separadas com rastreabilidade ponta-a-ponta.
3. Backlog paralelo torna explícito o que pode rodar em paralelo com segurança.
4. Gaps de frontend são controlados sem retrabalho e sem perda de histórico.

## Assunções e defaults
1. Coexistência entre OpenSpec atual e camada `.sdd/` sem migração destrutiva.
2. `spec-driven` segue como base para execução padrão; novos schemas entram por etapas.
3. `frontend.enabled=false` por padrão.
4. Não haverá automação de branch/worktree na V1.
5. Não haverá dupla fonte de verdade para skills.
