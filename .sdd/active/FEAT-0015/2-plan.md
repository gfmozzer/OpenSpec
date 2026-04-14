# Plano FEAT-0015

## Abordagem Técnica

1. **`src/core/sdd/types.ts`** — Adicionar `requires_adr?: boolean` ao tipo `BacklogItem`.

2. **Template de ADR** — Criar função `generateAdrTemplate(feature: BacklogItem): string` em `src/core/sdd/adr.ts` (novo módulo) que retorna o conteúdo do ADR com:
   - `# ADR FEAT-####: <título>`
   - Data de criação
   - `## Contexto` com placeholder descritivo (não o placeholder proibido `"(preencher contexto)"` — usar texto orientativo como `"Descreva o contexto que motivou esta decisão..."`)
   - `## Decisão` e `## Consequências` com orientações mínimas
   - Referências à FEAT e à EPIC de origem

3. **Handler do comando `start`** — Após criar workspace ativo:
   - Verificar se `feature.requires_adr === true`
   - Se sim, verificar se `.sdd/core/adrs/ADR-FEAT-####.md` já existe (não sobrescrever)
   - Se não existir, criar com `generateAdrTemplate(feature)`
   - Atualizar a seção `## Referências` do `1-spec.md` gerado para incluir o ADR

4. **Handler do comando `finalize`** — Antes de transitar status:
   - Se `feature.requires_adr === true`, verificar se o ADR existe
   - Se existir, ler e executar `validateDocumentAgainstLens(content, LENSES.adr)`
   - Se violar, bloquear (a menos que `--force`)

## Impacto Arquitetural
- Serviços afetados: `src/core/sdd/types.ts`, handler `start`, handler `finalize`, novo módulo `src/core/sdd/adr.ts`
- Contratos afetados: `BacklogItem` ganha campo `requires_adr`
- Dados afetados: `.sdd/core/adrs/` — arquivos ADR criados automaticamente; `backlog.yaml` — novo campo `requires_adr`

## Impacto no Frontend
- Rotas afetadas: nenhuma
- Gaps criados ou resolvidos: nenhum
- Declaração obrigatória: `opensdd sdd frontend-impact FEAT-0015 --status none --reason "Geração de ADR é operação interna do SDD sem superfície de produto."`

## Skills e Bundles
- Skills consultadas: `architecture-decision-records`, `architecture`, `backend-dev-guidelines`
- Bundles sugeridos: `architecture-backend`, `essentials-core`

## Regra de Intersecção
- Dívidas técnicas relacionadas: ADRs existentes em `.sdd/core/adrs/` criados manualmente (compatíveis, sem migração necessária)
- Frontend gaps relacionados: nenhum
- Documentação que precisa mudar:
  - `src/core/sdd/types.ts` — campo `requires_adr`
  - `src/core/sdd/adr.ts` — novo módulo
  - Handler de `start` e `finalize`
  - `.sdd/core/spec-tecnologica.md` — documentar campo `requires_adr`
