# Epic EPIC-0010

## Origem
- **Debate Base:** DEB-0011
- **Insight de Origem:** INS-0011
- **Título Base:** Robustez estrutural do OpenSDD: dedup, integridade referencial, consolidação inteligente, e auditoria de transições.
- **Orquestradores do Design:** Gemini e Codex (GPT-5.4)
- **Data de Aprovação:** 2026-04-16

## Resumo aprovado
O `EPIC-0010` materializa a rodada arquitetural e de maturidade do ecossistema SDD. Após extensiva análise da codebase (`operations.ts`, `check.ts`, motor de transições e validações YAML), construímos um consenso que as operações cruzadas carecem de garantias de integridade.

Este **Epic** estabelece reforços de integridade e estabilidade cross-entity da especificação OpenSDD compreendendo verificações de similaridade de Insight a Decide (com `Warn-and-link`), rigor na validação estrutural no `check` com severidades escalonáveis (error, warning, legacy), uso de audit transition-logs com amarramento cronológico (e restrição a ciclos de vida inadequados), bem como corrigir o `finalize` em catálogos canônicos, consolidando a estabilidade e garantindo que o SDD atue de fato como a fonte de verdade auditável da aplicação.

## Planejamento e Desdobramento (Breakdown)
A execução aprovada contempla **4 Frentes (FEATs)** organizadas por prioridade técnica (impacto vs complexidade de implantação).

### P0 — Base de Integridade Referencial e Auditoria de Transição
A infraestrutura principal a ser solidificada imediatamente é garantir o controle do estado gerado nas execuções (Check e Tracking):

1. **FEAT-0019**: Integridade referencial cross-entity no `check` com severidade graduada
   - **Escopo**: Expandir explicitamente `SddCheckCommand`.
   - **Métricas:** `discovery.related_ids` devem apontar para registros presentes; `backlog.origin_ref` vinculados a documentações reais; `unblockEvents` conectados a entidades vivas; contagem unívoca `>= max(ids)`.
   - **Estratégia:** Flag `--strict` será criada ou severidades definidas para evitar ruptura retroativa do projeto em legados.
   - **Critérios de Aceite Arquitetural:** O `types.ts` deve validar a tipagem cruzada (não apenas string, mas aliases RAD/EPIC válidos). Todas as detecções devem ser determinísticas com saídas documentadas: `error`, `warning` ou `legacy`.

2. **FEAT-0020**: `Transition-log` append-only e remoção do ciclo ARCHIVED para DONE
   - **Escopo**: Fim do `state-rewriting` não mapeado em mudanças críticas ("In-Progress" -> "DONE" -> "ARCHIVED" -> "DONE").
   - **Métricas:** Proibir ciclo de reversão indiscriminado (ARCHIVED para DONE cortado no *TransitionEngine*), novo arquivo de histórico de auditoria `transition-log.yaml` (armazenando evento por entidade: from, to, actor, reason para `--force`).
   - **Critérios de Aceite Arquitetural:** O `TransitionEngine` deve virar o único ponto autorizado de mutação de status. Toda transição relevante passa por ele com operação atômica de validação somada de commit (`assert + append log`). A flag `--force-transition` deve exigir uma razão explicitada e vinculada no evento.

### P1 — Melhorias Operacionais (Duplicidade e Payload Semântico)
A infraestrutura focada na assertividade e eliminação progressiva da poluição de dependências:

3. **FEAT-0021**: Deduplicação cross-entity em insight, debate e decide (com *warn-and-link*)
   - **Escopo**: Modificação drástica no sistema de deduplicação limitando espelhamento ou desdobramentos iguais não mapeados em `insight|debate`.
   - **Métricas:** Incorporar algoritmos estocásticos ou Jaccard com `n-grams` (bigrams, penalização por variação curta). Inclusão do limiar configurável e introdução do conceito *Warn-And-Link* (oferecer mesclagem e avisar antes de travar ou prosseguir) para evitar falsos positivos intencionais pelas equipes.

4. **FEAT-0022**: Corrigir heurística `serviceId` e usar `merge` field-wise no finalize
   - **Escopo**: Melhoria e sanitização do *Consolidado*.
   - **Métricas:** Atualmente a consolidação de features sobrescreve com "Consolidado por..." anulando a granularidade histórica. Iremos aprimorar para uma lógica de *upsert* profundo de listas em Arrays e preservação de dados imutáveis (append de `owner_refs`). A identificação de `touches` do `serviceId` será reformulada para maior granularidade. 
   - **Critérios de Aceite Arquitetural:** Garantir **idempotência estrita** para proteger o Service Catalog (rodar o finalize 2x não duplica valores e produz o exato mesmo resultado da primeira vez). Campos vazios nunca sobrescrevem pré-existentes. Arrays como `owner_refs`, `repo_paths` e `contracts` devem fazer *union* estável no lugar de substituição semântica cega.

---

## Impacto Arquitetural e Considerações Gerais
Ao findar o desenvolvimento deste Epic, o *core* estático ganha características de persistência e orquestração de banco dados relacional: as YAMLs agora protegem o referencial cross-entity com a mesma robustez de chaves estrangeiras sem perder a simplicidade em disco.

**Itens Adiados (Para futuro roadmap):**
1. Isolamento inter-projetos (`project_id` em metadados) aguardará a integração nativa via configurações em API.
2. Camadas puramente reativas (uso dos *State Validators* para YAML como lentes obrigatórias de SDD) ficarão propostas no limite entre `check` e `lens`, prevalecendo o uso imperativo e de auditoria atual.

## Status
IN_PROGRESS
