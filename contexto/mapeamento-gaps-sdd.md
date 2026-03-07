# Mapeamento: História de Uso × Capacidades do SDD

Auditoria completa comparando cada fase da história de uso da Marina contra a implementação real do OpenSpec SDD.

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Implementado e funcional |
| ⚠️ | Parcialmente implementado — funciona mas com limitações |
| ❌ | Não implementado — gap real |

---

## Fase 1: Inicialização (`sdd init`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Criar estrutura `.sdd/` | ✅ | `sdd init` cria todos os diretórios e arquivos YAML |
| Gerar `index.md` e `arquitetura.md` | ✅ | Templates criados automaticamente |
| Suporte a `--frontend` | ✅ | Flag `--frontend` ativa módulo de frontend-gaps e frontend-map |
| Configuração `sdd-config.yaml` | ✅ | Criado com `project_name`, `frontend.enabled`, `domain_locks`, etc. |

**Veredicto: ✅ Totalmente coberto**

---

## Fase 2: Captura de Insights (`sdd insight`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Criar INS-001, INS-002, etc. | ✅ | `SddInsightCommand.execute` aloca IDs sequenciais |
| Salvar em `discovery-index.yaml` | ✅ | `saveDiscoveryIndexState()` persiste |
| Gerar arquivo `.sdd/pendencias/INS-00X.md` | ✅ | Template Markdown criado com frontmatter |
| Status inicial `OPEN` | ✅ | Hardcoded no construtor |

**Veredicto: ✅ Totalmente coberto**

---

## Fase 3: Debate Estruturado (`sdd debate`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Criar DEB a partir de INS | ✅ | [SddDebateCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#274-316) vincula via `related_ids` |
| Validar que INS existe e está OPEN | ✅ | Validação explícita com throw |
| Atualizar status do INS para DEBATING | ✅ | `record.status = 'DEBATING'` |
| Gerar template de debate com prós/contras | ✅ | Template MD com seções estruturadas |

**Veredicto: ✅ Totalmente coberto**

---

## Fase 4: Decisão (`sdd decide`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Validar conteúdo do DEB antes de decidir | ✅ | `validateDebateContent()` — checa seções obrigatórias |
| Outcome `radar` → cria RAD | ✅ | [SddDecideCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#317-383) com lógica completa |
| Outcome `discard` → marca como descartado | ✅ | Cria record tipo `DISCARDED` |
| Atualizar `related_ids` em cascata | ✅ | INS ↔ DEB ↔ RAD linkados |

**Veredicto: ✅ Totalmente coberto**

---

## Fase 5: Breakdown em Grafo (`sdd breakdown --mode graph`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Criar FEATs a partir de RADs | ✅ | [SddBreakdownCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#517-610) itera features e constrói [BacklogItem](file:///home/gfmozzer/projects/openspec/src/core/sdd/types.ts#248-249) |
| Inferir `execution_kind` por título | ✅ | [classifyFeatureShape()](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#450-516) — heurística por keywords |
| Inferir `lock_domains` por título | ✅ | Idem — extraído automaticamente |
| Inferir `planning_mode` | ✅ | Default `local_plan`, ajustado por shape |
| Atribuir `parallel_group` por RAD | ✅ | `parallelGroup: radar.id` no mode graph |
| Gerar `blocked_by` por dependência de tipo | ✅ | `infra` → bloqueia `backend` → bloqueia `integration` |
| Gerar `backlog-graph.md` visualização | ✅ | `renderBacklogGraphView()` em [views.ts](file:///home/gfmozzer/projects/openspec/src/core/sdd/views.ts) |
| Deduplicação de FEATs existentes | ⚠️ | Lógica de `skipExisting` existe mas **não impede criação de duplicatas** se títulos mudarem |
| Inserção de FEATs em backlog já poblado | ⚠️ | Funciona, mas **não re-calcula dependências** de FEATs existentes |
| Ajuste de `blocked_by` quando novo RAD surge | ❌ | **Não há lógica de re-wire.** Novo breakdown cria FEATs novos mas não atualiza `blocked_by` de FEATs antigos |

**Veredicto: ⚠️ Funcional para caso base, gaps em cenários de re-planning**

---

## Fase 6: Iniciar Execução (`sdd start`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Iniciar FEAT por referência | ✅ | `SddStartCommand.execute()` busca por ID |
| Criar FEAT inline via `--title` se não existe | ✅ | Lógica de criação inline com `allocateEntityId` |
| Setar status `IN_PROGRESS` | ✅ | `item.status = 'IN_PROGRESS'` |
| Gerar `change_name` para `openspec/changes/` | ✅ | `change-FEAT-00X` criado automaticamente |
| Atualizar `last_sync_at` | ✅ | Timestamp atualizado |
| Sugerir skills via `suggestSkills()` | ✅ | Cruza `lock_domains` e `touches` com catálogo |
| Verificar se FEAT está bloqueada antes de start | ❌ | **Não valida `blocked_by`** — permite iniciar FEAT bloqueada |
| Alertar sobre `lock_domains` em conflito | ❌ | **Não verifica locks** — permite início com conflito ativo |

**Veredicto: ⚠️ Funcional no happy path, falta validação de segurança**

---

## Fase 7: Insight Emergente durante Execução

| Requisito da História | Status | Evidência |
|---|---|---|
| Capturar novo insight a qualquer momento | ✅ | `sdd insight` funciona independente do estado |
| Pipeline INS → DEB → RAD completo | ✅ | Fluxo funciona mesmo com FEATs em progresso |
| Novo `breakdown` para gerar FEATs do novo RAD | ✅ | Pode rodar breakdown novamente |
| Integração com FEATs existentes | ⚠️ | FEATs novas são criadas mas dependências com existentes são **manuais** |
| Re-cálculo automático de dependências | ❌ | **Não existe.** O agente teria que manualmente adicionar `blocked_by` |
| Atualizar grafo existente com novas FEATs | ❌ | `backlog-graph.md` é **re-renderizado** mas não mostra relações cross-RAD automaticamente |

**Veredicto: ⚠️ Pipeline funciona, integração cross-RAD é manual**

---

## Fase 8: Handoff entre Agentes (`sdd context`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Gerar contexto por FEAT, RAD, FGAP ou TD | ✅ | [SddContextCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#827-904) suporta os 4 tipos |
| Incluir summary, origin, related_discovery | ✅ | Retorna objeto estruturado completo |
| Listar `recommended_skills` | ✅ | Incluído no output de FEAT |
| Incluir `core_docs` paths | ✅ | `.sdd/core/index.md`, `arquitetura.md`, `frontend-map.md` |
| Incluir `change_name` da FEAT | ✅ | Retornado no contexto |
| Incluir `related_gaps` | ✅ | `frontend_gap_refs` do item |
| Incluir info de `blocked_by` e `lock_domains` | ❌ | **Não incluído no output** — agente perde visibilidade de constraints |

**Veredicto: ⚠️ Funcional, falta informação de grafo no contexto**

---

## Fase 9: Frontend Gaps (`sdd fgap add/done`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Adicionar FGAP com título, routes, menu | ✅ | `SddFrontendGapCommand.add()` completo |
| Vincular a feature de origem | ✅ | `origin_feature` salvo |
| Atualizar `frontend-map.yaml` com rotas | ✅ | Cria/atualiza entries no mapa de rotas |
| Resolver FGAP com `done` | ✅ | [resolve()](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#1126-1179) marca como DONE, atualiza rotas para OK |
| Associar arquivos implementados | ✅ | `implemented_files` persistido |

**Veredicto: ✅ Totalmente coberto**

---

## Fase 10: Finalização (`sdd finalize`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Marcar FEAT como DONE | ✅ | [SddFinalizeCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#740-816) via finalize queue |
| Verificar se change foi arquivado no OpenSpec | ✅ | Checa `changes/` por `change_name` + `.archived.md` |
| Atualizar `done_at` e `last_sync_at` | ✅ | Timestamps atualizados |
| Atualizar status do RAD pai se todos filhos DONE | ✅ | Lógica de `allSiblingsDone` implementada |
| Gerar ADR ou resumo automático | ❌ | **Não implementado** — finalize apenas atualiza status |
| Desbloquear dependentes automaticamente | ⚠️ | Status muda para DONE mas **não notifica** FEATs dependentes |

**Veredicto: ⚠️ Core funciona, falta automação pós-finalização**

---

## Fase 11: Monitoramento (`sdd check` / `sdd next`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Validar estado YAML (IDs únicos, refs válidas) | ✅ | [SddCheckCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/check.ts#188-304) com 6+ validações |
| Calcular `readyForParallel`, `blocked`, `lockConflicts` | ✅ | [computeReadyFeatures()](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#905-967) em operations.ts |
| Renderizar views opcionalmente | ✅ | `--render` flag persiste MDs atualizados |
| `sdd next` listar prontas, bloqueadas, conflitantes | ✅ | [SddNextCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#968-997) retorna 3 arrays estruturados |
| Sugerir *qual* FEAT priorizar | ❌ | **Apenas lista** — não ranqueia ou recomenda ordem |
| Mostrar percentual de progresso | ❌ | **Não calculado** — seria DONE/total |
| Timeline estimada | ❌ | **Não existe** — sem estimativa de duração |

**Veredicto: ⚠️ Validação forte, falta intelligence de priorização**

---

## Fase 12: Skills e Bundles (`sdd skills`)

| Requisito da História | Status | Evidência |
|---|---|---|
| Sincronizar skills curadas para ferramentas AI | ✅ | [SddSkillsSyncCommand](file:///home/gfmozzer/projects/openspec/src/core/sdd/operations.ts#1017-1061) escreve SKILL.md por tool |
| Filtrar por bundles | ✅ | `bundleFilter` implementado |
| Sugerir skills por contexto | ✅ | `suggestSkills()` cruza domínios |

**Veredicto: ✅ Totalmente coberto**

---

## Resumo Consolidado

### O que o SDD já entrega (✅ 100%)

1. **Pipeline de discovery completo**: INS → DEB → RAD funciona integralmente
2. **Breakdown com grafo**: FEATs criadas com `blocked_by`, `lock_domains`, `parallel_group`
3. **Execução estruturada**: `start` cria changes no OpenSpec
4. **Handoff entre agentes**: `context` fornece pacote estruturado
5. **Frontend gaps**: Ciclo completo add → resolve
6. **Finalização**: Queue-based com verificação de change arquivado
7. **Validação de estado**: [check](file:///home/gfmozzer/projects/openspec/src/core/sdd/check.ts#37-50) com 6+ validações de integridade
8. **Skills**: Sync, suggest, e curação via catálogo

### Gaps Críticos (❌ impedem a história)

| # | Gap | Impacto | Fase |
|---|-----|---------|------|
| G1 | `start` não valida `blocked_by` nem `lock_domains` | Permite iniciar FEAT que deveria estar bloqueada | 6 |
| G2 | `breakdown` não re-calcula dependências cross-RAD | Insight emergente não integra com grafo existente | 5, 7 |
| G3 | `context` não inclui `blocked_by`/`lock_domains` | Agente perde constraints no handoff | 8 |

### Gaps de Qualidade (⚠️ funciona mas deveria ser melhor)

| # | Gap | Impacto | Fase |
|---|-----|---------|------|
| G4 | `finalize` não desbloqueia dependentes proativamente | Agente não sabe automaticamente que X foi liberada | 10 |
| G5 | `next` não prioriza/ranqueia FEATs | Lista mas não guia decisão | 11 |
| G6 | Sem percentual de progresso em [check](file:///home/gfmozzer/projects/openspec/src/core/sdd/check.ts#37-50) | Falta visibilidade de "quanto falta" | 11 |
| G7 | `breakdown` em backlog existente pode criar duplicatas | Risco baixo mas existe | 5 |
| G8 | Sem geração de ADR/resumo automático no `finalize` | Memória do projeto não consolida automaticamente | 10 |

### Gaps de Evolução (não bloqueia hoje)

| # | Gap | Impacto |
|---|-----|---------|
| G9 | Sem timeline/estimativas | Não é crítico para V1 |
| G10 | `produces`/`consumes` existem no schema mas não são enforced | Dados decorativos por enquanto |
| G11 | `acceptance_refs` populado mas nunca consumido | Campo inerte |

---

## Priorização Recomendada

### Sprint 1 — Segurança do Grafo (G1, G3)

> **Impacto**: Impede erros silenciosos na execução

- `start`: Validar `blocked_by` + alertar `lock_domains` em conflito
- `context`: Incluir `blocked_by`, `lock_domains`, `parallel_group` no output

### Sprint 2 — Re-planning (G2)

> **Impacto**: Habilita emergência de insights mid-execution

- `breakdown`: Modo `--incremental` que re-calcula dependências com FEATs existentes
- Lógica cross-RAD: novo FEAT que toca domínio X automaticamente herda dependência de existente que tem `lock_domains: [X]`

### Sprint 3 — Intelligence (G4, G5, G6)

> **Impacto**: Experiência premium para usuário leigo

- `finalize`: Notificar FEATs dependentes quando bloqueio é resolvido
- `next`: Ranquear por número de dependentes (mais impacto primeiro)
- [check](file:///home/gfmozzer/projects/openspec/src/core/sdd/check.ts#37-50): Calcular e exibir `progress: 12/19 FEATs DONE (63%)`

### Sprint 4 — Consolidação (G7, G8)

> **Impacto**: Robustez e memória de projeto

- `breakdown`: Detecção de duplicatas por similaridade de título
- `finalize`: Gerar resumo consolidado dos FEATs finalizados
