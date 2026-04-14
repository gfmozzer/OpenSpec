# Plano FEAT-0017

## Abordagem Técnica

1. **`src/core/sdd/types.ts`** — Adicionar `title_canonical?: string` aos tipos `InsightItem` e `DebateItem`. Criar função utilitária `sanitizeTitle(raw: string): string` que remove prefixos funcionais e trunca a 60 chars.

2. **Validação de `title_canonical`** — Criar `validateTitleCanonical(title: string): string[]` que retorna lista de violações:
   - Contém `"Debate:"`, `"Insight:"`, `"(preencher"`, `"(placeholder"` → erro
   - Length > 60 → erro

3. **`src/core/sdd/lenses.ts`** — Enriquecer `forbidden_phrases`:
   - `LENSES.epic.forbidden_phrases`: adicionar `"Debate:"`, `"Insight:"`, `"(preencher"`, `"(placeholder"`
   - `LENSES.feature_spec.forbidden_phrases`: adicionar os mesmos

4. **Transição DEB → EPIC** — Localizar o handler que cria EPICs a partir de DEBs (provavelmente um subcomando de `sdd decide` ou `sdd promote`). Substituir uso de `deb.title` por `deb.title_canonical ?? sanitizeTitle(deb.title)`.

5. **`opensdd sdd check`** — Integrar verificação de título em todos os itens EPIC e FEAT do `backlog.yaml`:
   - Para cada item, aplicar `validateTitleCanonical` no título
   - Exibir aviso agrupado por tipo de violação

## Impacto Arquitetural
- Serviços afetados: `src/core/sdd/types.ts`, `src/core/sdd/lenses.ts`, handler DEB→EPIC, handler `check`
- Contratos afetados: `InsightItem` e `DebateItem` ganham campo `title_canonical`
- Dados afetados: `discovery-index.yaml` — campo `title_canonical` nos itens de INS e DEB

## Impacto no Frontend
- Rotas afetadas: nenhuma
- Gaps criados ou resolvidos: nenhum
- Declaração obrigatória: `opensdd sdd frontend-impact FEAT-0017 --status none --reason "Sanitização de títulos é operação interna do SDD sem superfície de produto."`

## Skills e Bundles
- Skills consultadas: `backend-dev-guidelines`, `clean-code`, `concise-planning`
- Bundles sugeridos: `essentials-core`, `architecture-backend`

## Regra de Intersecção
- Dívidas técnicas relacionadas: títulos históricos de EPICs/FEATs com "Debate:" (ex: FEAT-0010, FEAT-0011) — não migrar retroativamente, apenas bloquear novos
- Frontend gaps relacionados: nenhum
- Documentação que precisa mudar:
  - `src/core/sdd/types.ts` — campo `title_canonical`
  - `src/core/sdd/lenses.ts` — forbidden_phrases enriquecidas
  - Handler DEB→EPIC
  - Handler `check`
  - `.sdd/core/spec-tecnologica.md` — documentar `title_canonical` e política de títulos
