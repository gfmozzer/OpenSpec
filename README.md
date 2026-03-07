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
- `RADAR`: ideia aprovada para futuro planejamento
- `DISCARDED`: ideia rejeitada com motivo registrado

2. Planejamento
- `RAD` pode ser quebrado em `FEATs`
- `FEAT` vira unidade executavel
- o backlog registra dependencias, bloqueios e paralelizacao

3. Execucao
- cada `FEAT` ganha um workspace proprio em `.sdd/active/FEAT-###/`
- esse workspace tem `spec`, `plan`, `tasks` e `changelog`

4. Memoria operacional
- `.sdd/state/*.yaml` e a fonte canonica
- `.sdd/core/*.md` sao views operacionais geradas a partir do estado
- `README.md`, `AGENTS.md`, `AGENT.md` e `.sdd/AGENT.md` orientam humanos e agentes

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
- `.sdd/skills/curated/`
- `.sdd/deposito/`
- `openspec/changes/`

Dentro de `.sdd/` ficam:

- memoria operacional do projeto
- backlog executavel
- debates e radar
- gaps e decisoes de frontend
- skills curadas
- documentacao viva do sistema

## Instalacao global

Requer:

- Node.js `20.19.0` ou superior
- `npm`

Instalacao global a partir do repositorio publico:

```bash
npm install -g github:gfmozzer/OpenSpec
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

## Como iniciar em um projeto novo

Entre no repositorio onde voce quer usar o sistema e rode:

```bash
opensdd install --tools none
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
- templates
- estados YAML canonicos
- documentos iniciais do projeto

Se voce nao quiser habilitar frontend no bootstrap:

```bash
opensdd install --tools none --no-frontend
```

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

2. Ver o que pode comecar agora

```bash
opensdd sdd next
```

3. Iniciar uma feature

```bash
opensdd sdd start FEAT-001
```

4. Ler o contexto da feature

```bash
opensdd sdd context FEAT-001
```

5. Implementar

6. Consolidar memoria ao final

```bash
opensdd sdd finalize --ref FEAT-001
```

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
opensdd sdd debate INS-001
opensdd sdd decide DEB-001 --outcome radar
opensdd sdd breakdown RAD-001 --mode graph --incremental
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

Depois disso, o sistema usa o indice de fontes e as skills curadas para transformar esse material em:

- contexto canonico
- radar
- features
- gaps e decisoes de frontend
- insights apenas quando houver ambiguidade real

## Skills incluidas no bootstrap

O bootstrap do SDD instala curadoria local em:

```text
.sdd/skills/curated/
```

Entre elas:

- `repo-context-bootstrap`
- `source-intake-sdd`
- `business-extractor-sdd`
- `frontend-extractor-sdd`
- `planning-normalizer-sdd`

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

Onboarding e operacao:

- `opensdd sdd onboard system`
- `opensdd sdd next`
- `opensdd sdd start FEAT-###`
- `opensdd sdd context FEAT-###`
- `opensdd sdd finalize --ref FEAT-###`

Descoberta:

- `opensdd sdd insight "..."`
- `opensdd sdd debate INS-###`
- `opensdd sdd decide DEB-### --outcome radar|discard`
- `opensdd sdd breakdown RAD-### --mode graph --incremental`

## Documentacao

Guia detalhado em portugues:

- [Manual SDD PT-BR](docs/sdd-manual-pt-br.md)

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

O caminho de distribuicao suportado por este repositorio e instalacao global a partir do GitHub do fork ou por pacote empacotado.

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
9. `.sdd/core/frontend-decisions.md` (quando frontend estiver ativado)

Comandos essenciais:
- `opensdd sdd onboard system`
- `opensdd sdd next`
- `opensdd sdd context FEAT-###`
- `opensdd sdd finalize --ref FEAT-###`
<!-- SDD:ONBOARDING:END -->
