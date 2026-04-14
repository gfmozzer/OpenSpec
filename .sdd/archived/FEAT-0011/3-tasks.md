# Tasks FEAT-0011

1. Entender contexto com `opensdd sdd context FEAT-0011`.
2. Ler `src/utils/match.ts` e mapear todos os branches existentes.
3. Criar `test/core/utils/match.test.ts` cobrindo: correspondência exata, parcial, sem match, string vazia, case-insensitive — meta: ≥ 50% statements.
4. Ler `src/commands/validate.ts` e identificar branches descobertos (arquivo inexistente, schema inválido, --bulk, format JSON/text, erros de parsing).
5. Criar `test/commands/validate.test.ts` com casos para cada branch relevante — meta: ≥ 60% branches.
6. Ler `src/commands/spec.ts` e identificar branches descobertos (spec inexistente, filtros, ordenação, saída vazia).
7. Criar `test/commands/spec.test.ts` — meta: ≥ 60% branches.
8. Analisar `src/commands/change.ts` para identificar os branches ainda descobertos (além dos já cobertos em `change-parser.test.ts`).
9. Complementar cobertura de `change.ts` sem regredir.
10. Analisar `src/commands/completion.ts` para branches de statements descobertos.
11. Criar ou complementar `test/commands/completion.test.ts`.
12. Rodar `pnpm test:coverage` (ou `npm run test:coverage`) e verificar que as metas foram atingidas.
13. Garantir que toda a suite passa sem erros.
14. Declarar impacto frontend: `opensdd sdd frontend-impact FEAT-0011 --status none --reason "Testes automatizados de camadas de lógica interna da CLI não geram nem alteram superfície de produto."`.
15. Verificar condição de reversão do DEB-0007: se as metas não forem atingidas, registrar no changelog e avaliar frente de smoke coverage para wrappers.
16. Atualizar documentação operacional (apenas o que for impactado):
    - `README.md` — se métricas de cobertura forem mencionadas
17. Validar e preparar finalize com `opensdd sdd finalize --ref FEAT-0011`.

## Dependências
- blocked_by: —

## Definição de Pronto
- Arquivos `match.ts`, `validate.ts`, `spec.ts` atingem as metas de cobertura definidas nos cenários de aceite.
- Nenhum teste existente regride.
- `frontend_impact_status` declarado como `none`.
- Suite completa passa.

## Checklist DOD
- [DOC] Atualizar documentação central e de handoff (apenas se cobertura for mencionada no README)
- [UI] Declarar impacto frontend (`opensdd sdd frontend-impact FEAT-0011 --status none ...`)
- [ARQ] Arquivar a mudança técnica no OpenSDD
- [MEM] Consolidar memória com `opensdd sdd finalize --ref FEAT-0011`
