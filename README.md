# OpenSDD

OpenSDD e uma evolucao do OpenSpec focada em memoria operacional, planejamento rastreavel e handoff entre agentes.

O objetivo nao e apenas criar specs. O objetivo e permitir que um projeto grande continue compreensivel ao longo do tempo, mesmo quando:
- novas ideias aparecem no meio da implementacao;
- existem varios agentes trabalhando em paralelo;
- o frontend fica defasado em relacao ao backend;
- um agente novo entra no repositorio sem contexto previo;
- o sistema ja existe e precisa ser absorvido sem reler todo o codigo.

## O que o OpenSDD faz

O OpenSDD organiza o desenvolvimento em 4 camadas:

1. Descoberta
- `INSIGHT`: ideia bruta
- `DEBATE`: discussao estruturada
- `EPIC`: ideia aprovada para futuro planejamento
- `DISCARDED`: ideia rejeitada com motivo registrado

2. Planejamento
- `EPIC` pode ser quebrado em `FEATs` (`RAD` segue como alias legado)
- `FEAT` vira unidade executavel
- o backlog registra dependencias, bloqueios e paralelizacao

3. Execucao
- cada `FEAT` ganha um workspace proprio em `.sdd/active/FEAT-0001/`
- esse workspace tem `spec`, `plan`, `tasks` e `changelog`

4. Memoria operacional
- `.sdd/state/*.yaml` e a fonte canonica
- `.sdd/core/*.md` sao views operacionais geradas a partir do estado
- `README.md`, `AGENTS.md`, `AGENT.md` e `.sdd/AGENT.md` orientam humanos e agentes

## Fronteira com a DevTrack Foundation API

Para o backend padrao oficial, o OpenSDD deve operar com uma fronteira clara:

- `devtrack-foundation-api` e a fonte canonica de arquitetura backend, bundles/skills `foundation-*` e eventual starter backend.
- `devtrack-tools-opensdd` e a camada de distribuicao que instala runtime SDD, perfis, templates e materializacao controlada dessa referencia em projetos derivados.
- Este repositorio nao deve passar a manter um backend canonico paralelo; quando houver adocao da Foundation, ela deve acontecer por profile/bootstrap/distribuicao.

## O que fica instalado no projeto

Depois do bootstrap, o projeto passa a ter:

- `README.md`
- `AGENTS.md`
- `AGENT.md`
- `.sdd/`
- `.sdd/state/`
- `.sdd/core/`
- `.sdd/discovery/`
- `.sdd/pendencias/`
- `.sdd/active/`
- `.sdd/templates/`
- `.sdd/skills/curated/` (layout legacy) ou `.sdd/habilidades/skills/` (layout pt-BR)
- `.sdd/deposito/`
- `.sdd/prompts/`
- `openspec/changes/`

Dentro de `.sdd/` ficam:

- memoria operacional do projeto
- backlog executavel
- debates e epics
- gaps e decisoes de frontend
- skills curadas
- documentacao viva do sistema

## Instalacao global

Requer:

- Node.js `20.19.0` ou superior
- `npm`

Instalacao global oficial via npm:

```bash
npm install -g @gfmozzer/opensdd
```

Depois confira:

```bash
opensdd --version
```

Se voce estiver desenvolvendo este fork localmente:

```bash
pnpm install
pnpm run build
npm install -g .
```

Atalhos uteis de manutencao local:

```bash
pnpm run cleanup
pnpm run cleanup:install
```

- `cleanup`: remove artefatos de build e cache local, como `dist/`, `coverage/`, `.cache/`, `.vite/`, `.vitest/`, `*.tsbuildinfo` e logs de falha de compilacao/execucao.
- `cleanup:install`: faz a limpeza acima e tambem remove `node_modules/` e lockfiles locais (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock*`) para recomeçar uma instalacao do zero.

## Como iniciar em um projeto novo

Entre no repositorio onde voce quer usar o sistema e rode:

```bash
opensdd install --tools none
```

Para ja nascer com nomenclatura mais intuitiva em portugues nas pastas do SDD:

```bash
opensdd install --tools none --lang pt-BR --layout pt-BR
```

Se quiser integrar ferramentas suportadas no bootstrap:

```bash
opensdd install --tools all
```

Ou somente algumas:

```bash
opensdd install --tools codex,cursor,claude
```

Esse comando instala de uma vez:

- a base do runtime
- `openspec/config.yaml`
- `.sdd/`
- skills curadas
- prompts recomendados por workflow
- templates
- estados YAML canonicos
- documentos iniciais do projeto

Se voce nao quiser habilitar frontend no bootstrap:

```bash
opensdd install --tools none --no-frontend
```

Atalhos em portugues no CLI:

- `opensdd instalar` (alias de `opensdd install`)
- `opensdd sdd iniciar` (alias de `opensdd sdd init`)
- `opensdd sdd iniciar-contexto` (alias de `opensdd sdd init-context`)
- `opensdd sdd ideia`, `debater`, `decidir`, `desdobrar`, `iniciar-execucao`, `aprovar`, `contexto`, `orientar`, `consolidar`, `proximo`, `checar`, `ingestao-deposito`
- `opensdd arquivar` (alias em portugues para `opensdd archive`)

## Como absorver um projeto que ja existe

Se o projeto ja esta em andamento, o primeiro passo depois do `install` e inicializar o contexto:

```bash
opensdd sdd init-context
opensdd sdd check --render
opensdd sdd onboard system
```

O `init-context` serve para:

- inspecionar a base existente
- preencher contexto inicial de arquitetura, stack, servicos e mapa do repositorio
- gerar a memoria inicial do sistema
- preparar onboarding para agentes novos

Em projetos grandes, esse bootstrap inicial nao substitui consolidacao progressiva. Ele cria uma base inicial para que o processo passe a evoluir de forma rastreavel.

## Como usar no dia a dia

Fluxo principal:

1. Ver o sistema como um todo

```bash
opensdd sdd onboard system
```

Antes de executar comandos operacionais do SDD, a CLI verifica se existe estado legado em `.sdd/state/`.
Quando detecta migracao pendente, ela executa a conversao mandatória para o formato canonico atual antes de seguir.
Isso normaliza principalmente IDs antigos (`RAD-*`, `FEAT-*` sem padding) e persiste `state_version: 2` em `.sdd/config.yaml`.

Se nao houver FEAT pronta, o onboarding agora retorna passos guiados (ex.: criar insight, abrir debate, decidir e quebrar RAD) em vez de deixar `proximos_passos` vazio.

2. Ver o que pode comecar agora

```bash
opensdd sdd next
```

Auditar a saude de evolucao do proprio processo SDD (ciclo recomendado: semestral):

```bash
opensdd sdd audit
```

3. Iniciar uma feature

```bash
opensdd sdd start FEAT-0001 --fluxo padrao
```

Se a `FEAT` no backlog tiver `requires_adr: true`, o `start` cria automaticamente
`.sdd/core/adrs/ADR-FEAT-####.md` (sem sobrescrever ADR já existente) e injeta a
referência no `1-spec.md` da workspace ativa.

4. Ler o contexto da feature

```bash
opensdd sdd context FEAT-0001
```

5. Implementar

6. Consolidar memoria ao final

```bash
opensdd sdd finalize --ref FEAT-0001
```

Quando `requires_adr: true`, o `finalize` exige ADR existente e válido pela lente
`adr` (seções `Contexto`, `Decisão`, `Consequências` e sem frase proibida de
placeholder). Em caso de violação, o fluxo é bloqueado.

Regra operacional central:

uma feature so esta realmente concluida quando a documentacao afetada foi atualizada antes do `finalize`.

Isso inclui, quando houver impacto:

- `README.md`
- `AGENTS.md`
- `AGENT.md`
- `.sdd/README.md`
- `.sdd/AGENT.md`
- `.sdd/core/*.md`
- gaps e decisoes de frontend

## Como lidar com ideias novas durante a implementacao

Quando surgir uma ideia no meio do desenvolvimento:

```bash
opensdd sdd insight "descricao da ideia"
opensdd sdd debate INS-0001
opensdd sdd decide DEB-0001 --outcome epic
opensdd sdd breakdown EPIC-0001 --mode graph --incremental
```

Esse fluxo serve para nao enfiar no backlog algo que ainda nao foi pensado.

## Como lidar com PRD, wireframe, HTML e material bruto

O OpenSDD separa descoberta de ingestao de documentos consolidados.

Se voce ja possui:

- PRD
- RFC
- historias do usuario
- wireframes
- imagens
- html mockado
- referencias visuais

esses materiais devem ir para:

```text
.sdd/deposito/
```

Estrutura:

```text
.sdd/deposito/
├── prds/
├── rfcs/
├── historias/
├── wireframes/
├── html-mocks/
├── referencias-visuais/
├── entrevistas/
├── anexos/
└── legado/
```

Depois disso, rode:

```bash
opensdd sdd ingest-deposito --title "Planejamento inicial do sistema"
```

Esse comando varre o deposito, indexa fontes, cria/reaproveita RAD, desdobra FEATs e tenta iniciar a primeira FEAT pronta.

Depois disso, o sistema usa o indice de fontes e as skills curadas para transformar esse material em:

- contexto canonico
- radar
- features
- gaps pendentes e resolvidos de frontend
- sitemap frontend consolidado
- insights apenas quando houver ambiguidade real

## Skills incluidas no bootstrap

O bootstrap do SDD instala curadoria local em:

```text
.sdd/skills/curated/ (layout legacy)
.sdd/habilidades/skills/ (layout pt-BR)
```

Entre elas:

- `repo-context-bootstrap`
- `source-intake-sdd`
- `business-extractor-sdd`
- `frontend-extractor-sdd`
- `planning-normalizer-sdd`

Prompts recomendados tambem sao instalados em:

```text
.sdd/prompts/
```

Tambem sao instaladas skills curadas de apoio para execucao e planejamento.

## Arquivos importantes para onboarding

Um agente novo deve seguir esta ordem:

1. `README.md`
2. `.sdd/AGENT.md`
3. `.sdd/core/index.md`
4. `.sdd/core/arquitetura.md`
5. `.sdd/core/servicos.md`
6. `.sdd/core/spec-tecnologica.md`
7. `.sdd/core/repo-map.md`
8. `.sdd/core/fontes.md`
9. `.sdd/core/frontend-decisions.md`

## Comandos principais

Bootstrap:

- `opensdd install --tools none`
- `opensdd install --tools all`
- `opensdd sdd init-context`
- `opensdd sdd check --render`
- `opensdd sdd audit`
- `opensdd sdd ingest-deposito`

Onboarding e operacao:

- `opensdd sdd onboard system`
- `opensdd sdd orientar system`
- `opensdd sdd next`
- `opensdd sdd start FEAT-0001 --fluxo direto|padrao|rigoroso`
- `opensdd sdd aprovar FEAT-0001 --etapa proposta|planejamento|tarefas`
- `opensdd sdd context FEAT-0001`
- `opensdd sdd audit`
- `opensdd sdd finalize --ref FEAT-0001`

Descoberta:

- `opensdd sdd insight "..."`
- `opensdd sdd debate INS-0001`
- `opensdd sdd decide DEB-0001 --outcome epic|discard`
- `opensdd sdd desdobrar EPIC-0001 --mode graph --incremental`

## Documentacao

Guia detalhado em portugues:

- [Manual SDD PT-BR](docs/sdd-manual-pt-br.md)
- [Historia da Marina (uso pratico)](docs/historia-marina-uso-pratico.md)
- [Release e Rollback](docs/release.md)
- [Kit estatico do SDD](kits/opensdd-static-kit/README.md)

Guia interno do sistema:

- [.sdd/README.md](.sdd/README.md)
- [.sdd/AGENT.md](.sdd/AGENT.md)

## Desenvolvimento local

```bash
pnpm install
pnpm run build
pnpm test
```

Loop local do CLI:

```bash
pnpm run dev:cli
```

## Estado atual da distribuicao

O comando global oficial deste fork e:

```bash
opensdd
```

O caminho de distribuicao oficial deste repositorio e npm:

```bash
npm install -g @gfmozzer/opensdd
```

Fallback suportado:
- instalacao por tarball (`npm pack` + `npm install -g ./gfmozzer-opensdd-<versao>.tgz`)

## Licenca

MIT

<!-- SDD:ONBOARDING:START -->
## Onboarding SDD

Ordem de leitura para qualquer agente novo:
1. `README.md` (este bloco)
2. `.sdd/AGENT.md`
3. `.sdd/core/index.md`
4. `.sdd/core/arquitetura.md`
5. `.sdd/core/servicos.md`
6. `.sdd/core/spec-tecnologica.md`
7. `.sdd/core/repo-map.md`
8. `.sdd/core/fontes.md`
9. `.sdd/core/frontend-sitemap.md` (quando frontend estiver ativado)
10. `.sdd/core/frontend-decisions.md` (quando frontend estiver ativado)

Comandos essenciais:
- `opensdd sdd onboard system`
- `opensdd sdd next`
- `opensdd sdd context FEAT-0001`
- `opensdd sdd frontend-impact FEAT-0001 --status required|none --reason "..."`
- `opensdd sdd finalize --ref FEAT-0001`
<!-- SDD:ONBOARDING:END -->
