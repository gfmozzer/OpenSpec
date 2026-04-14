# Tasks FEAT-0016

> **Pré-requisitos**: FEAT-0012, FEAT-0013, FEAT-0014 e FEAT-0015 concluídas.

1. Entender contexto com `opensdd sdd context FEAT-0016`.
2. Verificar que FEAT-0012, FEAT-0013, FEAT-0014 e FEAT-0015 estão DONE; se não, bloquear e aguardar.
3. Adicionar tipo `MetaEvolutionConfig` e campo `meta_evolution?: MetaEvolutionConfig` ao `SddConfig` em `src/core/sdd/types.ts`.
4. Atualizar `.sdd/config.yaml` do projeto com bloco `meta_evolution` defaults (cycle_days: 30).
5. Criar `src/core/sdd/audit.ts` com:
   - Interface `AuditMetric` e `AuditReport`
   - `computeAuditMetrics(sddRootPath)` calculando as 5 métricas
   - `formatAuditReport(report)` gerando output formatado para terminal (tabela ou lista com indicadores OK/ATENÇÃO/CRÍTICO)
   - Degradação graciosa para campos ausentes
6. Criar handler do subcomando `opensdd sdd audit`:
   - Chamar `computeAuditMetrics`
   - Exibir relatório
   - Atualizar `config.yaml` com `last_run_at`
7. Registrar o subcomando no CLI (onde outros subcomandos de `sdd` são registrados).
8. Escrever testes unitários para `computeAuditMetrics`:
   - Estado limpo (sem violations) → métricas OK
   - FEATs com `forced_transition` → métrica reflete
   - Campos ausentes → métrica exibe "não disponível"
9. Declarar impacto frontend com `opensdd sdd frontend-impact FEAT-0016 --status none --reason "Comando de auditoria é CLI interno do SDD sem superfície de produto."`.
10. Atualizar documentação operacional e canônica.
11. Validar e preparar finalize com `opensdd sdd finalize --ref FEAT-0016`.

## Dependências
- blocked_by: FEAT-0012, FEAT-0013, FEAT-0014, FEAT-0015

## Definição de Pronto
- `opensdd sdd audit` exibe relatório com as 5 métricas.
- `config.yaml` é atualizado com `last_run_at` após execução.
- Métricas indisponíveis exibem aviso, não falham.
- Testes unitários passando.

## Checklist DOD
- [DOC] Atualizar documentação central e de handoff
- [UI] Declarar impacto frontend (`opensdd sdd frontend-impact FEAT-0016 --status none ...`)
- [ARQ] Arquivar a mudança técnica no OpenSDD
- [MEM] Consolidar memória com `opensdd sdd finalize --ref FEAT-0016`
