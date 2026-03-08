---
name: repo-context-bootstrap
description: Inspeciona um repositorio existente para preencher contexto inicial do SDD com evidencia, evitando inferencias frageis.
---

# Repo Context Bootstrap

Use esta skill quando o projeto ja existe e voce precisa criar contexto inicial confiavel para o SDD.

## Objetivo

Mapear e documentar, com base em evidencias do repositorio:
- stack tecnologica;
- catalogo de servicos;
- arquitetura inicial;
- integracoes/contratos;
- mapa de diretorios relevantes.

## Fluxo obrigatorio

1. Execute `opensdd sdd init --frontend` se a estrutura SDD ainda nao existir.
2. Execute `opensdd sdd init-context --mode merge`.
3. Leia os arquivos gerados:
   - `.sdd/core/spec-tecnologica.md`
   - `.sdd/core/servicos.md`
   - `.sdd/core/arquitetura.md`
   - `.sdd/core/repo-map.md`
4. Valide com `opensdd sdd check --render`.
5. Registre qualquer duvida ou baixa confianca como item de revisao em `.sdd/pendencias/tech-debt.md`.

## Regras de qualidade

- Nao invente servicos que nao aparecem em diretorios ou manifests.
- Nao invente integracoes sem sinal concreto em dependencias ou configs.
- Priorize evidencias em:
  - `package.json`, `pnpm-workspace.yaml`, `docker-compose.yml`;
  - diretorios `apps/`, `services/`, `packages/`, `src/`;
  - arquivos de configuracao de framework.
- Quando houver incerteza, registre como "precisa revisao humana".

## Resultado esperado

Apos a execucao, o projeto deve ter contexto inicial util o suficiente para um agente novo continuar sem inspecao ampla de codigo.
