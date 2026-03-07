---
name: repo-context-bootstrap
description: Inspeciona um repositório existente para preencher contexto inicial do SDD com evidência, evitando inferências frágeis.
---

# Repo Context Bootstrap

Use esta skill quando o projeto já existe e você precisa criar contexto inicial confiável para o SDD.

## Objetivo

Mapear e documentar, com base em evidências do repositório:
- stack tecnológica;
- catálogo de serviços;
- arquitetura inicial;
- integrações/contratos;
- mapa de diretórios relevantes.

## Fluxo obrigatório

1. Execute `opensdd sdd init --frontend` se a estrutura SDD ainda não existir.
2. Execute `opensdd sdd init-context --mode merge`.
3. Leia os arquivos gerados:
   - `.sdd/core/spec-tecnologica.md`
   - `.sdd/core/servicos.md`
   - `.sdd/core/arquitetura.md`
   - `.sdd/core/repo-map.md`
4. Valide com `opensdd sdd check --render`.
5. Registre qualquer dúvida ou baixa confiança como item de revisão em `.sdd/pendencias/tech-debt.md`.

## Regras de qualidade

- Não invente serviços que não aparecem em diretórios ou manifests.
- Não invente integrações sem sinal concreto em dependências ou configs.
- Priorize evidências em:
  - `package.json`, `pnpm-workspace.yaml`, `docker-compose.yml`;
  - diretórios `apps/`, `services/`, `packages/`, `src/`;
  - arquivos de configuração de framework.
- Quando houver incerteza, registre como "precisa revisão humana".

## Resultado esperado

Após a execução, o projeto deve ter contexto inicial útil o suficiente para um agente novo continuar sem inspeção ampla de código.
