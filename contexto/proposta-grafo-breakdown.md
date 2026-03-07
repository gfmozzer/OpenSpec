# Proposta: Grafo de Quebra Completa para Features Grandes

## Objetivo

Definir a forma correta de implementar a quebra de uma iniciativa grande em um grafo operacional de trabalho, para que:

1. uma iniciativa aprovada no `RADAR` nao vire uma lista confusa de tasks
2. o sistema consiga separar o que pode rodar em paralelo do que depende de outra coisa
3. agentes diferentes possam assumir partes isoladas sem disputar o mesmo contexto
4. o planejamento respeite arquitetura, frontend gaps e consolidacao documental

## Diagnostico

Hoje o sistema ja consegue:

1. registrar `INS -> DEB -> RAD`
2. criar `FEAT-*`
3. iniciar execucao com `start`

Mas ainda falta o miolo mais importante para iniciativa grande:

1. quebrar um `RAD` em partes planejaveis de verdade
2. distinguir dependencias duras de acoplamentos leves
3. impedir que um agente transforme um epico grande em uma unica lista enorme de tasks
4. criar um grafo operacional que permita concorrencia segura

## Minha opiniao objetiva

A forma certa nao e:

1. pegar um `RAD` grande e gerar `tasks` direto
2. tratar tudo como uma unica `FEAT`
3. deixar o agente decidir na hora, sem estrutura

A forma certa e:

1. `RAD` representa a iniciativa aprovada
2. o `breakdown` primeiro gera um **grafo de FEATs**
3. cada `FEAT` so depois vira `plan/tasks`
4. `tasks` sao sempre locais da `FEAT`, nunca do epico inteiro

Ou seja:

```text
RAD grande
-> grafo de FEATs
-> cada FEAT recebe plano proprio
-> cada FEAT recebe tasks proprias
```

Esse modelo evita o principal problema que voce descreveu: quando a coisa e grande demais, o sistema quebra porque tenta planejar tudo no mesmo nivel.

## Regra central

Para escopo grande, o `breakdown` **nunca** deve gerar tasks diretamente.

Ele deve gerar:

1. unidades executaveis
2. dependencias entre unidades
3. conflitos de dominio
4. oportunidade de paralelizacao
5. impactos de frontend e consolidacao

So depois disso cada unidade vira um planejamento local.

## Modelo mental correto

### Nivel 1: descoberta e aprovacao

- `INS-*`
- `DEB-*`
- `RAD-*`

### Nivel 2: orquestracao

- `FEAT-*`
- dependencias
- locks
- paralelizacao

### Nivel 3: execucao local

- `spec`
- `plan`
- `tasks`
- `verify`
- `archive`
- `finalize`

Entao o sistema nao deve ir de `RAD -> tasks`.
Ele deve ir de `RAD -> FEAT graph -> local execution`.

## Estrutura do grafo

Minha recomendacao e que o grafo seja construido em cima do `backlog.yaml`.

Cada `FEAT` precisa ter estes campos obrigatorios:

```yaml
- id: FEAT-001
  title: API de autorizacao por workspace
  status: READY
  origin_type: radar
  origin_ref: RAD-001
  scale: STANDARD
  summary: >
    Implementar a camada de autorizacao para recursos por workspace.
  blocked_by: []
  touches:
    - auth-service
    - workspace-domain
    - permissions-model
  lock_domains:
    - auth-rules
    - workspace-permissions
  parallel_group: auth-rollout
  execution_kind: feature
  planning_mode: local_plan
  agent_role: backend-architect
  recommended_skills:
    - api-design
    - architecture-core
  frontend_gap_refs:
    - FGAP-001
  spec_refs: []
  change_name: ""
  branch_name: ""
  worktree_path: ""
  last_sync_at: ""
  archived_at: ""
  done_at: ""
```

## Campos novos que eu incluiria

Hoje eu incluiria estes campos novos no `backlog.yaml`:

1. `parallel_group`
2. `execution_kind`
3. `planning_mode`
4. `acceptance_refs`
5. `produces`
6. `consumes`

### Significado

- `parallel_group`
  - agrupa features que pertencem ao mesmo stream de entrega
- `execution_kind`
  - `feature | infra | migration | frontend_coverage | documentation`
- `planning_mode`
  - `local_plan | direct_tasks`
- `acceptance_refs`
  - referencia regras ou criterios herdados do `RAD`
- `produces`
  - artefatos que a feature entrega
- `consumes`
  - artefatos ou precondicoes que a feature precisa

Esses campos tornam o grafo mais explicito e menos dependente de interpretacao humana.

## Como eu implementaria o breakdown

## Etapa 1: classificar o RAD

O `breakdown` precisa primeiro classificar o `RAD`:

1. `QUICK`
2. `STANDARD`
3. `LARGE`

Se for `QUICK`, pode gerar uma `FEAT` unica.
Se for `STANDARD`, pode gerar 1 a 3 `FEATs`.
Se for `LARGE`, ele deve obrigatoriamente gerar um grafo.

### Heuristicas de `LARGE`

Eu trataria como `LARGE` quando houver pelo menos um destes sinais:

1. toca backend e frontend
2. toca mais de um servico ou integracao
3. exige migracao de dados
4. envolve permissao, autenticacao ou contrato externo
5. exige rollout incremental
6. tem mais de um fluxo de usuario

## Etapa 2: identificar streams independentes

Antes de pensar em tasks, o algoritmo precisa identificar streams.

Eu quebraria o `RAD` nestes eixos:

1. modelo de dominio
2. contrato/API
3. execucao backend
4. migracao ou seed
5. observabilidade/seguranca
6. frontend
7. consolidacao/documentacao

Nem todo `RAD` vai gerar todos esses streams.
Mas essa analise deve ser obrigatoria.

Exemplo:

```text
RAD: permissao por workspace

Streams candidatos:
1. modelo de permissao
2. middleware de autorizacao
3. endpoints de administracao
4. migracao de permissoes existentes
5. tela de gestao de permissoes
6. telemetria e auditoria
```

## Etapa 3: transformar streams em FEATs

Cada stream vira uma `FEAT` quando:

1. pode ser descrita com objetivo unico
2. pode ser validada isoladamente
3. pode ser atribuida a um agente sem confundir contexto
4. tem fronteira de codigo suficientemente clara

Nao vira `FEAT` quando:

1. e pequena demais e so faz sentido junto de outra
2. nao tem entrega verificavel isolada
3. e apenas uma task mecanica de outra `FEAT`

## Etapa 4: montar dependencias

Eu separaria dependencias em dois tipos:

1. `blocked_by`
2. `lock_domains`

### `blocked_by`

Usar apenas para dependencia dura.

Exemplos:

1. frontend depende do endpoint existir
2. migracao depende do modelo final
3. rollout depende da auditoria pronta

### `lock_domains`

Usar para conflito semantico, nao para ordem.

Exemplos:

1. duas features mexendo na mesma regra de autorizacao
2. duas features editando a mesma migracao
3. duas features alterando o mesmo contrato publico

Isso permite paralelizar sem corromper o sistema.

## Etapa 5: decidir se cada FEAT gera plano local ou tasks diretas

Essa e a regra mais importante.

Cada `FEAT` recebe um `planning_mode`:

1. `local_plan`
2. `direct_tasks`

### `local_plan`

Usar quando a `FEAT` ainda e complexa e merece:

1. spec propria
2. plano proprio
3. tasks proprias

### `direct_tasks`

Usar apenas quando a `FEAT` ja e pequena e mecanica.

Exemplos:

1. ajuste localizado de documentacao
2. gap pequeno de frontend
3. refactor curto e isolado

Minha recomendacao: para o seu caso, o default deve ser `local_plan`.
`direct_tasks` deve ser excecao.

## Fluxo ideal do comando

Eu implementaria assim:

```text
openspec sdd breakdown RAD-001 --mode graph
```

Saida:

1. cria `FEAT-*` no `backlog.yaml`
2. preenche `blocked_by`
3. preenche `lock_domains`
4. sugere `parallel_group`
5. define `planning_mode`
6. marca o `RAD` como `SPLIT`
7. gera uma view visual do grafo em Markdown

## Artefato novo que eu criaria

Eu criaria:

```text
.sdd/pendencias/backlog-graph.md
```

Esse arquivo seria gerado automaticamente com algo assim:

```text
RAD-001
├── FEAT-001 modelo de permissao
├── FEAT-002 middleware de autorizacao
│   └── blocked_by: FEAT-001
├── FEAT-003 endpoints de administracao
│   └── blocked_by: FEAT-001
├── FEAT-004 tela de gestao
│   └── blocked_by: FEAT-002, FEAT-003
└── FEAT-005 auditoria
    └── lock_domains: auth-rules
```

Isso ajuda o humano e o agente a enxergar o que pode andar junto.

## Como evitar quebrar errado

O maior risco e quebrar por camada tecnica em vez de entrega real.

Ruim:

1. controller
2. service
3. repository
4. frontend

Isso gera dependencias artificiais.

Melhor:

1. modelo de permissao
2. decisao de autorizacao
3. administracao de permissoes
4. cobertura de frontend

Ou seja: quebrar por capacidade entregue, nao por pasta de codigo.

## Como eu decidiria o que pode rodar em paralelo

Regra:

Uma `FEAT` pode rodar em paralelo quando:

1. nao esta bloqueada por outra
2. nao compartilha `lock_domain`
3. nao depende do mesmo artefato mutavel
4. nao exige contexto arquitetural ainda indefinido

Entao o `check` ideal deve responder:

1. prontas para iniciar
2. bloqueadas
3. em conflito
4. paralelizaveis agora

## O que eu nao faria

Eu nao faria:

1. grafo baseado em arquivos tocados apenas
2. quebra automatica direto em tasks
3. dependencia inferida so por heuristica de pastas
4. paralelizacao sem lock semantico

Essas abordagens parecem simples, mas quebram em projeto vivo.

## O que eu faria agora no proximo passo

Se eu fosse implementar isso no sistema, eu faria nesta ordem:

1. expandir `BacklogItem` com `parallel_group`, `execution_kind`, `planning_mode`, `produces`, `consumes`
2. criar `openspec sdd breakdown --mode graph`
3. gerar `backlog-graph.md`
4. melhorar `openspec sdd check` para:
   - detectar bloqueios
   - detectar conflito por `lock_domain`
   - listar `ready_for_parallel`
5. criar um comando novo:

```text
openspec sdd next
```

Ele responderia:

1. quais `FEATs` podem iniciar agora
2. quais agentes cabem em cada uma
3. quais skills usar

## Minha conclusao

A melhor forma de fazer nao e "quebrar em tarefas menores".
A melhor forma e:

1. transformar um `RAD` grande em um **grafo de FEATs**
2. fazer cada `FEAT` carregar seu proprio planejamento local
3. usar `blocked_by` para ordem
4. usar `lock_domains` para conflito
5. usar `planning_mode` para impedir que o sistema tente mastigar um epico inteiro como uma unica lista de tasks

Em resumo:

```text
epico grande -> grafo de FEATs -> planos locais -> tasks locais
```

Essa e, hoje, a implementacao que eu considero mais correta, mais robusta e mais alinhada ao problema real que voce quer resolver.
