# Tasks FEAT-0015

1. Entender contexto com `opensdd sdd context FEAT-0015`.
2. Adicionar `requires_adr?: boolean` ao tipo `BacklogItem` em `src/core/sdd/types.ts`.
3. Criar `src/core/sdd/adr.ts` com função `generateAdrTemplate(feature: BacklogItem): string`:
   - Título com ID e nome da feature
   - Data de criação (hoje)
   - Seções `## Contexto`, `## Decisão`, `## Consequências` com texto orientativo
   - Referências à FEAT e EPIC de origem
4. Localizar handler do comando `opensdd sdd start`.
5. Integrar no start:
   - Check `feature.requires_adr === true`
   - Criar `ADR-FEAT-####.md` em `.sdd/core/adrs/` se não existir
   - Atualizar seção `## Referências` do `1-spec.md` com link ao ADR
6. Localizar handler do comando `opensdd sdd finalize`.
7. Integrar no finalize:
   - Se `requires_adr`, verificar existência do ADR
   - Executar `validateDocumentAgainstLens(content, LENSES.adr)`
   - Bloquear se violação (exceto `--force`)
8. Escrever testes unitários:
   - Start com `requires_adr: true` cria ADR
   - Start com `requires_adr: false` não cria ADR
   - Start não sobrescreve ADR existente
   - Finalize bloqueia se ADR tem placeholder
   - Finalize passa se ADR está preenchido
9. Declarar impacto frontend com `opensdd sdd frontend-impact FEAT-0015 --status none --reason "Geração de ADR é operação interna do SDD sem superfície de produto."`.
10. Atualizar documentação operacional e canônica.
11. Validar e preparar finalize com `opensdd sdd finalize --ref FEAT-0015`.

## Dependências
- blocked_by: —

## Definição de Pronto
- `BacklogItem` possui campo `requires_adr`.
- Start cria ADR automaticamente quando `requires_adr: true`.
- Finalize bloqueia se ADR existir e tiver placeholders.
- Testes unitários passando.

## Checklist DOD
- [DOC] Atualizar documentação central e de handoff
- [UI] Declarar impacto frontend (`opensdd sdd frontend-impact FEAT-0015 --status none ...`)
- [ARQ] Arquivar a mudança técnica no OpenSDD
- [MEM] Consolidar memória com `opensdd sdd finalize --ref FEAT-0015`
