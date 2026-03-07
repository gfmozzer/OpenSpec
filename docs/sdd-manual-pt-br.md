# Manual SDD (PT-BR) - Guia Rapido de Uso

Este guia foi escrito para uso pratico. A ideia e: voce rodar poucos comandos e conseguir trabalhar sem duvida.

## Em 1 minuto: o que e SDD aqui?
- `openspec/changes/` = onde a implementacao da feature acontece.
- `.sdd/state/*.yaml` = estado oficial (fonte da verdade).
- `.sdd/core/*.md` e `.sdd/pendencias/*.md` = visoes geradas para leitura humana.

Regra principal:
- Edite estado em YAML.
- Rode `openspec sdd check --render` para validar e atualizar os Markdown.

---

## Passo a passo (primeiro uso)

### 1) Inicializar
```bash
openspec sdd init
```

Se seu projeto tem frontend e voce quer rastrear gaps/rotas de UI:
```bash
openspec sdd init --frontend
```

---

### 2) Validar e gerar visoes
```bash
openspec sdd check --render
```

Se quiser o relatorio cru em JSON:
```bash
openspec sdd check --json
```

---

### 3) Consultar curadoria de skills
Listar bundles:
```bash
openspec sdd skills bundles
```

Sugerir skills para uma tarefa:
```bash
openspec sdd skills suggest --phase plan --domains backend,security --bundles architecture-backend,security-quality --max 5
```

Mesma sugestao em JSON:
```bash
openspec sdd skills suggest --phase execute --domains frontend --max 3 --json
```

---

## Comandos disponiveis agora (V1)

### `openspec sdd init [path]`
Cria/atualiza a base `.sdd/` e o bloco `sdd` em `openspec/config.yaml`.

Opcoes:
- `--frontend`: ativa arquivos de frontend (`frontend-gaps` e `frontend-map`).
- `--no-render`: nao gera visoes Markdown no final.

### `openspec sdd check [path]`
Valida os YAMLs de estado, IDs, referencias basicas e pode gerar visoes.

Opcoes:
- `--render`: gera/atualiza os Markdown.
- `--json`: imprime relatorio de validacao em JSON.

### `openspec sdd skills bundles [path]`
Lista os bundles de skills cadastrados no catalogo.

### `openspec sdd skills suggest [path]`
Sugere skills por contexto.

Opcoes:
- `--phase <fase>`: `discover|plan|execute|verify|finalize`
- `--domains <lista>`: lista separada por virgula
- `--bundles <lista>`: lista separada por virgula
- `--max <n>`: quantidade de sugestoes
- `--json`: retorno estruturado

---

## Onde voce mexe no dia a dia

### Estado oficial
- `.sdd/state/discovery-index.yaml`
- `.sdd/state/backlog.yaml`
- `.sdd/state/tech-debt.yaml`
- `.sdd/state/finalize-queue.yaml`
- `.sdd/state/skill-catalog.yaml`
- `.sdd/state/frontend-gaps.yaml` (se frontend ativo)
- `.sdd/state/frontend-map.yaml` (se frontend ativo)

### Visoes (geradas)
- `.sdd/core/index.md`
- `.sdd/core/frontend-map.md` (se frontend ativo)
- `.sdd/pendencias/backlog-features.md`
- `.sdd/pendencias/tech-debt.md`
- `.sdd/pendencias/frontend-gaps.md` (se frontend ativo)

---

## Curadoria de 60 skills
- Catalogo oficial: `.sdd/state/skill-catalog.yaml`
- Guia humano da curadoria: `.sdd/skills/bundles/curadoria-pt-br.md`

---

## Erros comuns (e correcao)

### "Arquivo de estado obrigatorio ausente"
Rode novamente:
```bash
openspec sdd init
```

### "Schema de estado invalido"
Revise o YAML citado no erro e rode:
```bash
openspec sdd check --render
```

### "Nao sei quais skills usar"
Comece com:
```bash
openspec sdd skills suggest --phase plan --max 5
```

---

## Roteiro minimo recomendado (operacional)
1. `openspec sdd init`
2. Atualizar `.sdd/state/*.yaml` conforme a tarefa
3. `openspec sdd check --render`
4. `openspec sdd skills suggest ...` para escolher skills da execucao
