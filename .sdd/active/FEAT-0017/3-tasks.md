# Tasks FEAT-0017

1. Entender contexto com `opensdd sdd context FEAT-0017`.
2. Adicionar `title_canonical?: string` aos tipos `InsightItem` e `DebateItem` em `src/core/sdd/types.ts`.
3. Criar função utilitária `sanitizeTitle(raw: string): string` (remove prefixos funcionais, trunca a 60 chars) — pode ir em `src/core/sdd/utils.ts` ou no próprio módulo de types.
4. Criar `validateTitleCanonical(title: string): string[]` que verifica prefixos proibidos e comprimento máximo.
5. Enriquecer `LENSES.epic.forbidden_phrases` em `src/core/sdd/lenses.ts` com: `"Debate:"`, `"Insight:"`, `"(preencher"`, `"(placeholder"`.
6. Enriquecer `LENSES.feature_spec.forbidden_phrases` com os mesmos padrões.
7. Localizar o handler que executa a transição DEB → EPIC (criar EPIC a partir de debate).
8. Substituir uso de `deb.title` por `deb.title_canonical ?? sanitizeTitle(deb.title)` na criação da EPIC.
9. Localizar handler do `opensdd sdd check`.
10. Integrar verificação de `validateTitleCanonical` no check para todos os items EPIC e FEAT.
11. Escrever testes unitários:
    - `sanitizeTitle("Debate: Foo")` → `"Foo"`
    - `validateTitleCanonical("Debate: ...")` → lista com violação
    - `validateTitleCanonical("Título limpo")` → lista vazia
    - Título com 65 chars → violação de comprimento
    - Transição DEB→EPIC com `title_canonical` usa o campo correto
12. Declarar impacto frontend com `opensdd sdd frontend-impact FEAT-0017 --status none --reason "Sanitização de títulos é operação interna do SDD sem superfície de produto."`.
13. Atualizar documentação operacional e canônica.
14. Validar e preparar finalize com `opensdd sdd finalize --ref FEAT-0017`.

## Dependências
- blocked_by: —

## Definição de Pronto
- `title_canonical` existe nos tipos INS e DEB.
- Transição DEB→EPIC usa `title_canonical` quando disponível.
- `check` detecta e exibe avisos para títulos com prefixos proibidos.
- Lentes `epic` e `feature_spec` possuem `forbidden_phrases` para os prefixos.
- Testes unitários passando.

## Checklist DOD
- [DOC] Atualizar documentação central e de handoff
- [UI] Declarar impacto frontend (`opensdd sdd frontend-impact FEAT-0017 --status none ...`)
- [ARQ] Arquivar a mudança técnica no OpenSDD
- [MEM] Consolidar memória com `opensdd sdd finalize --ref FEAT-0017`
