# Tasks FEAT-0018

1. Confirmar contexto e status da feature com `opensdd sdd context FEAT-0018`.
2. Mapear o estado atual do OpenSDD:
   - `src/core/sdd/state.ts`
   - `src/core/sdd/init.ts`
   - `src/core/sdd/default-skills.ts`
   - `src/core/sdd/operations.ts`
   - `src/core/init.ts`
   - `src/core/profiles.ts`
   - `src/core/global-config.ts`
3. Mapear a Foundation API como fonte canonica de backend:
   - skills locais `foundation-*`
   - bundles correlatos
   - contrato arquitetural
   - bootstrap modular
   - starter backend potencial
4. Registrar no spec:
   - estado atual;
   - fronteira entre repositorios;
   - opcoes consideradas;
   - decisao arquitetural;
   - profile proposto;
   - lista de arquivos da fase de implementacao.
5. Registrar no plano:
   - etapas de adocao de baixo risco;
   - protecao de retrocompatibilidade;
   - dependencias conceituais da fase de implementacao.
6. Registrar nas tasks/changelog a rastreabilidade completa da analise.
7. Atualizar o contexto canônico do OpenSDD sem introduzir drift:
   - `README.md`
   - `.sdd/AGENT.md`
   - `AGENTS.md`
   - `AGENT.md`
   - `.sdd/state/architecture.yaml`
   - `.sdd/state/repo-map.yaml`
   - renderizar `.sdd/core/*.md`
8. Declarar impacto de frontend com `opensdd sdd frontend-impact FEAT-0018 --status none --reason "..."`
9. Rodar `opensdd sdd finalize --ref FEAT-0018`.

## Dependências
- blocked_by: -

## Definição de pronto
- A feature nao esta pronta enquanto o SDD nao deixar explicito:
  - o que e canonico na Foundation;
  - o que e distribuicao no OpenSDD;
  - qual o profile backend recomendado;
  - quais arquivos mudam na fase de implementacao;
  - quais riscos permanecem em aberto.

## Checklist DOD
- [DOC] Atualizar documentacao central e de handoff
- [UI] Declarar impacto frontend e registrar ausencia de impacto quando aplicavel
- [ARQ] Registrar decisao arquitetural explicita sobre modelo de adocao Foundation -> OpenSDD
- [MEM] Consolidar memoria com `opensdd sdd finalize --ref FEAT-0018`
