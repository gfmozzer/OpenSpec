# Spec FEAT-0011

## Resumo
- Titulo: Ampliar cobertura automatizada nos comandos com lógica real e branches relevantes
- Origem: epic (EPIC-0007)
- Tipo: feature
- Modo: local_plan
- Fluxo: padrao
- Etapa atual: execucao

## Gates
- Proposta: rascunho
- Planejamento: rascunho
- Tarefas: rascunho

## Objetivo

Elevar a confiança da suite de testes da ferramenta atacando sistematicamente os arquivos com maior densidade de lógica real e ramos pouco exercitados, conforme decisão do DEB-0007 (Opção B).

Arquivos prioritários identificados no debate:
- `src/commands/validate.ts` — 25.94% statements / 46.43% branches
- `src/commands/spec.ts` — 29.38% statements / 44.44% branches
- `src/commands/change.ts` — 67.62% statements / 54.76% branches
- `src/commands/completion.ts` — 55.21% statements / 80.43% branches
- `src/utils/match.ts` — 8.7% statements (helper central de sugestões da CLI)

Wrappers em 0% (`src/cli/index.ts`, `src/commands/schema.ts`, `src/commands/sdd.ts`, módulos `workflow/`) ficam como frente secundária com smoke coverage quando o mapa de ROI encolher.

## Histórias do Usuário
- Como mantenedor da CLI, quero que `validate`, `spec`, `change` e `completion` tenham cobertura de branches ≥ 70%, para ter confiança ao refatorar esses caminhos críticos.
- Como desenvolvedor, quero que `src/utils/match.ts` tenha testes cobrindo seus ramos de correspondência exata, parcial e nenhuma, para evitar regressões nas sugestões automáticas da CLI.

## Regras de Negócio
- [ ] Priorizar testes que exercitem branches de erro, validação, saída JSON/texto e filtros — não testes de smoke de wiring.
- [ ] Para cada arquivo prioritário, mapear os branches descobertos e criar ao menos um caso de teste por ramo relevante.
- [ ] Wrappers puros em 0% entram como frente secundária; smoke coverage apenas se o custo for baixo.
- [ ] Condição de reversão (conforme DEB-0007): se a nova rodada não mover de forma perceptível validate/spec/change/match/completion, reavaliar e abrir frente específica de smoke coverage para wrappers.

## Cenários de Aceite
- `src/commands/validate.ts` atinge ≥ 60% de branches cobertas.
- `src/commands/spec.ts` atinge ≥ 60% de branches cobertas.
- `src/utils/match.ts` atinge ≥ 50% de statements cobertas.
- `src/commands/change.ts` e `src/commands/completion.ts` não regridem da cobertura atual.
- Suite completa passa sem erros após os novos testes.

## Declaração de Impacto Frontend
- Status: none
- Justificativa: Testes automatizados de camadas de lógica interna da CLI não geram nem alteram superfície de produto.
- Comando: `opensdd sdd frontend-impact FEAT-0011 --status none --reason "Testes automatizados de camadas de lógica interna da CLI não geram nem alteram superfície de produto."`

## Refs
- FEAT: FEAT-0011
- EPIC: EPIC-0007
- DEB: DEB-0007
- INS: INS-0007
- FGAP: —
- ADR: —
