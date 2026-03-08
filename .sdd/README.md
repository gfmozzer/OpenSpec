# SDD README

Este diretorio guarda a memoria operacional do projeto.

## O que ler primeiro
1. `README.md`
2. `.sdd/AGENT.md`
3. `.sdd/core/index.md`
4. `.sdd/core/arquitetura.md`
5. `.sdd/core/servicos.md`
6. `.sdd/core/spec-tecnologica.md`
7. `.sdd/core/repo-map.md`
8. `.sdd/core/fontes.md`
9. `.sdd/core/frontend-sitemap.md` (quando frontend estiver ativado)
10. `.sdd/core/frontend-decisions.md` (quando frontend estiver ativado)

## Como operar
1. Rode `opensdd sdd onboard system` para entender o estado atual.
2. Rode `opensdd sdd next` para ver o que pode comecar agora.
3. Rode `opensdd sdd start FEAT-###` para abrir a execucao.
4. Rode `opensdd sdd context FEAT-###` antes de implementar.
5. Declare impacto de frontend com `opensdd sdd frontend-impact FEAT-### --status required|none --reason "..."`.
6. Rode `opensdd sdd finalize --ref FEAT-###` ao consolidar a feature.

## Pastas principais
- `core/`: visao macro atual do sistema.
- `discovery/`: insights, debates, radar e descartes.
- `pendencias/`: backlog, progresso, gaps e fila de finalize.
- `pendencias/frontend-auditoria.md`: auditoria de cobertura frontend por FEAT.
- `state/`: fonte canonica em YAML.
- `skills/`: curadoria local e bundles.
- `templates/`: modelos base de spec, plano, tasks e changelog.
- `prompts/`: prompts recomendados para workflows comuns.
- `active/`: workspaces ativos por FEAT.
- `deposito/`: documentos brutos, PRDs, wireframes e referencias externas.

## Regra operacional
Toda feature concluida deve atualizar a documentacao relevante antes do `finalize`.
