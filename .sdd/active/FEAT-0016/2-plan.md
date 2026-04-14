# Plano FEAT-0016

## Abordagem Técnica

1. **`config.yaml` schema** — Adicionar campo `meta_evolution` ao schema de configuração em `src/core/sdd/types.ts`:
   ```typescript
   meta_evolution?: {
     cycle_days: number;       // padrão: 30
     last_run_at?: string;     // ISO date da última auditoria
     responsible?: string;     // opcional: nome do responsável
   }
   ```
   Atualizar o `config.yaml` do projeto com o campo defaults.

2. **`src/core/sdd/audit.ts`** — Novo módulo com a lógica de métricas:
   - `computeAuditMetrics(sddRootPath: string): Promise<AuditReport>` — lê todos os estados e calcula:
     - `placeholderRate`: % FEATs arquivadas com violations de lente
     - `debateQualityRate`: % debates com Decisão real (sem frases proibidas)
     - `adrCoverageRate`: % FEATs com `requires_adr` que têm ADR preenchido
     - `forcedTransitionRate`: % FEATs com `forced_transition: true`
     - `longBlockedFeats`: lista de FEATs BLOCKED há mais de `cycle_days` dias
   - `formatAuditReport(report: AuditReport): string` — renderiza relatório legível para terminal

3. **Novo subcomando `opensdd sdd audit`** — Handler que:
   - Chama `computeAuditMetrics`
   - Exibe relatório formatado
   - Atualiza `meta_evolution.last_run_at` no `config.yaml`

4. **Degradação graciosa** — Métricas que dependem de campos não presentes (FEAT-0013 não concluída → `forced_transition` inexistente) exibem `"não disponível"` em vez de falhar.

## Impacto Arquitetural
- Serviços afetados: novo módulo `src/core/sdd/audit.ts`, novo handler de subcomando `audit`, `config.yaml` schema
- Contratos afetados: `SddConfig` em `types.ts` ganha campo `meta_evolution`
- Dados afetados: `config.yaml` — campo `meta_evolution.last_run_at` atualizado a cada execução

## Impacto no Frontend
- Rotas afetadas: nenhuma
- Gaps criados ou resolvidos: nenhum
- Declaração obrigatória: `opensdd sdd frontend-impact FEAT-0016 --status none --reason "Comando de auditoria é CLI interno do SDD sem superfície de produto."`

## Skills e Bundles
- Skills consultadas: `architecture`, `observability-engineer`, `backend-dev-guidelines`
- Bundles sugeridos: `architecture-backend`, `essentials-core`

## Regra de Intersecção
- Dívidas técnicas relacionadas: nenhuma bloqueante além das dependências explícitas
- Frontend gaps relacionados: nenhum
- Documentação que precisa mudar:
  - `src/core/sdd/types.ts` — campo `meta_evolution` no config
  - `src/core/sdd/audit.ts` — novo módulo (criar)
  - Handler de subcomando `audit` (criar)
  - `.sdd/config.yaml` — adicionar bloco `meta_evolution`
  - `README.md` — documentar `opensdd sdd audit`
