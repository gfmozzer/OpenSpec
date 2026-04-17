# Tasks FEAT-0020

1. Entender contexto com `opensdd sdd context FEAT-0020`.
2. Confirmar plano e tarefas técnicas.
3. Implementar com rastreabilidade no changelog.
4. Declarar impacto de frontend (obrigatorio) com `opensdd sdd frontend-impact FEAT-0020 ...`.
5. Se frontend_impact_status=required, abrir/atualizar FGAP antes do finalize.
6. Atualizar, se houve impacto, a documentação operacional e canônica:
   - `README.md`
   - `.sdd/AGENT.md`
   - `AGENTS.md`
   - `AGENT.md`
   - `.sdd/core/arquitetura.md`
   - `.sdd/core/servicos.md`
   - `.sdd/core/spec-tecnologica.md`
   - `.sdd/core/repo-map.md`
   - `.sdd/core/frontend-decisions.md` (quando aplicável)
7. Validar e preparar finalize.

## Dependências
- blocked_by: -

## Definição de pronto
- A feature não está pronta enquanto as mudanças de documentação e handoff não estiverem refletidas.

## Checklist DOD
- [DOC] Atualizar documentacao central e de handoff
- [UI] Declarar impacto frontend e registrar lacunas/decisoes quando aplicavel
- [ARQ] Arquivar a mudanca tecnica no OpenSpec
- [MEM] Consolidar memoria com `opensdd sdd finalize --ref FEAT-0020`

## Checklist de Execução
- [x] 1.1 Adicionar `TransitionLogEventSchema` e tipos de estado relacionados em `src/core/sdd/types.ts`.
- [x] 1.2 Registrar `.sdd/state/transition-log.yaml` em `src/core/sdd/state.ts`, incluindo load/save e bootstrap.
- [x] 2.1 Tornar `TransitionEngine` a única autoridade de append no transition log via `applyTransition(...)`.
- [x] 2.2 Remover o rollback estrutural `ARCHIVED -> DONE` do grafo de FEAT.
- [x] 3.1 Refatorar `start`, `decide`, `breakdown` e `finalize` para usar a transição unificada em vez de `assertValid + status = ...`.
- [x] 4.1 Cobrir o motor e o fluxo com testes de regressão para transição inválida e persistência do log append-only.
- [x] 4.2 Validar a integração com `pnpm test test/core/sdd/transition-engine.test.ts test/core/sdd-operations.test.ts`.
