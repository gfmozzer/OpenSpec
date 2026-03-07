# Manual de Utilizacao SDD (PT-BR)

Este manual descreve como usar a camada SDD em portugues do Brasil dentro do OpenSpec.

## Objetivo
- Manter memoria operacional em `.sdd/`.
- Usar YAML como fonte canonica.
- Gerar visoes Markdown para leitura humana.
- Validar consistencia antes de evoluir o fluxo.

## Pre-requisitos
- Node.js `>= 20.19.0`
- OpenSpec instalado
- Repositorio inicializado com `openspec init` (recomendado)

## Comandos disponiveis na V1

### `openspec sdd init [path]`
Inicializa a estrutura SDD e os arquivos de estado base.

O que faz:
1. Garante `openspec/config.yaml` com bloco `sdd`.
2. Cria estrutura `.sdd/` (`core`, `discovery`, `pendencias`, `state`, `skills`, `templates`).
3. Cria YAMLs iniciais em `.sdd/state/`.
4. Gera views Markdown (a menos que `--no-render`).

Opcoes:
- `--frontend`: ativa modulo de frontend (`frontend-gaps` e `frontend-map`).
- `--no-render`: nao gera views Markdown ao final.

Exemplos:
```bash
openspec sdd init
openspec sdd init . --frontend
openspec sdd init /caminho/do/projeto --no-render
```

---

### `openspec sdd check [path]`
Valida os arquivos de estado SDD e opcionalmente regenera as views.

O que valida:
1. Presenca dos arquivos obrigatorios em `.sdd/state/`.
2. Estrutura dos YAMLs via schema.
3. IDs e coerencia minima (`FEAT-*`, `TD-*`, referencias de frontend etc.).

Opcoes:
- `--render`: gera views Markdown apos validacao bem-sucedida.
- `--json`: imprime relatorio em JSON.

Exemplos:
```bash
openspec sdd check
openspec sdd check --render
openspec sdd check --json
```

Comportamento de erro:
- Se houver erro, o comando retorna falha e lista os problemas.

## Estrutura gerada na V1

```text
.sdd/
├── config.yaml
├── core/
│   ├── arquitetura.md
│   └── index.md
├── discovery/
│   ├── 1-insights/
│   ├── 2-debates/
│   ├── 3-radar/
│   └── 4-discarded/
├── pendencias/
│   ├── backlog-features.md
│   ├── tech-debt.md
│   └── frontend-gaps.md          # quando frontend estiver ativo
├── state/
│   ├── discovery-index.yaml
│   ├── backlog.yaml
│   ├── tech-debt.yaml
│   ├── finalize-queue.yaml
│   ├── skill-catalog.yaml
│   ├── frontend-gaps.yaml        # quando frontend estiver ativo
│   └── frontend-map.yaml         # quando frontend estiver ativo
├── skills/
│   ├── curated/
│   └── bundles/
└── templates/
```

## Regra de ouro da V1
- Edite o estado em `.sdd/state/*.yaml`.
- Use `openspec sdd check --render` para atualizar as views Markdown.
- Nao trate os `.md` gerados como fonte canonica.

## Configuracao SDD no `openspec/config.yaml`

Exemplo:
```yaml
schema: spec-driven
sdd:
  enabled: true
  memoryDir: .sdd
  frontend:
    enabled: false
  views:
    autoRender: true
```

## Skill SDD em portugues (planejamento/arq)
- Skill: `openspec-sdd`
- Comando: `/opsx:sdd`
- Uso esperado: planejamento e arquitetura em pt-BR.

## Curadoria de skills (60 selecionadas)
- Catalogo canonico: `.sdd/state/skill-catalog.yaml`
- Guia humano da curadoria: `.sdd/skills/bundles/curadoria-pt-br.md`
- Quantidade atual: 60 skills em 6 bundles

## Comandos planejados (nao implementados ainda)
Estes comandos fazem parte do roadmap, mas ainda nao estao disponiveis na V1:

1. `openspec sdd insight "<texto>"`
2. `openspec sdd debate INS-###`
3. `openspec sdd decide DEB-### --outcome radar|discard`
4. `openspec sdd breakdown RAD-###`
5. `openspec sdd start <RAD-###|FEAT-###|FGAP-###|texto livre>`
6. `openspec sdd finalize [--ref <FEAT|RAD>|--all-ready]`
7. `openspec sdd context <FEAT|RAD|FGAP|TD>`
8. `openspec sdd skills sync [--bundle <id>|--all]`

## Fluxo recomendado hoje (V1)
1. `openspec sdd init`
2. Ajustar os YAMLs iniciais conforme o projeto.
3. `openspec sdd check --render`
4. Revisar as views em `.sdd/core/` e `.sdd/pendencias/`.

## Solucao de problemas rapida
- Erro de arquivo ausente: execute `openspec sdd init` novamente.
- Erro de schema: revisar YAML citado no relatorio do `sdd check`.
- Views desatualizadas: execute `openspec sdd check --render`.
