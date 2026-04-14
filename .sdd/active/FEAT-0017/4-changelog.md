# Changelog de Arquitetura: FEAT-0017

## Novas Entidades / Modelos
- Campo `title_canonical?: string` adicionado aos tipos `InsightItem` e `DebateItem` em `src/core/sdd/types.ts`
- Função utilitária `sanitizeTitle` e `validateTitleCanonical`

## Novas Rotas / Endpoints / Eventos
- Nenhum endpoint externo novo

## Cobertura Frontend
- Impacto declarado (`opensdd sdd frontend-impact`): none
- FGAPs criados/atualizados: nenhum

## Mudanças Estruturais
- `src/core/sdd/types.ts`: campo `title_canonical` em `InsightItem` e `DebateItem`
- `src/core/sdd/lenses.ts`:
  - `LENSES.epic.forbidden_phrases` enriquecida com: `"Debate:"`, `"Insight:"`, `"(preencher"`, `"(placeholder"`
  - `LENSES.feature_spec.forbidden_phrases` enriquecida com os mesmos padrões
- Handler DEB→EPIC: usa `title_canonical` na propagação de título
- Handler `check`: verifica `validateTitleCanonical` para todos os EPICs e FEATs

## Documentos que Precisam Ser Atualizados
- `.sdd/core/spec-tecnologica.md` — documentar campo `title_canonical` e política de títulos limpos
- `README.md` — mencionar validação de títulos no check
- `.sdd/AGENT.md` — orientar sobre preenchimento de `title_canonical` ao criar debates e insights
