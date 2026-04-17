# Debate DEB-0011

## 1) Pergunta de decisao (obrigatorio)
Decidir quais vetores de robustez estrutural implementar e em qual ordem, em vez de manter a ferramenta sem barreiras contra duplicidade, perda de contexto e degradacao de estado, para resolver a repetibilidade de IDs, fuga de contexto entre projetos e ruptura de fluxo de desenvolvimento.

## 2) Criterios de decisao (obrigatorio)
- Impacto na prevencao de duplicatas e contexto cruzado
- Complexidade de implementacao
- Retrocompatibilidade com projetos existentes
- Beneficio para a experiencia do agente AI
- Risco de regressao

## 3) Opcoes consideradas (minimo 2)
### Opcao A — Implementacao Completa (6 vetores)
- Proposta: Implementar todos os 6 vetores (A-F) em 3 fases (P0, P1, P2)
- Pras: Cobertura maxima, resolve todas as dores de uma vez
- Contras: Alto esforco, risco de regressao em cadeia

### Opcao B — Implementacao Seletiva (4 vetores prioritarios)
- Proposta: Implementar A (dedup), C (integridade referencial), D (consolidacao) e E (auditoria). Postergar B (isolamento) e F (state validators) para ciclo futuro
- Pras: Foco nas dores imediatas, menor risco
- Contras: Deixa lacunas em isolamento e cobertura de validadores

### Opcao C — Implementacao Minima + Fundamentos
- Proposta: Implementar C (integridade referencial) e E (auditoria) como fundamentos, abrindo caminho para os demais
- Pras: Base solida para evolucoes futuras, baixo risco
- Contras: Nao resolve a dor principal de duplicidade imediatamente

## 4) Rodada de argumentos com evidencia
### Agente Gemini (defende A com priorizacao)
- Argumento: Todas as 8 vulnerabilidades (V1-V8) sao reais e confirmadas por inspecao direta do codigo. V1 e V5 sao as mais criticas para a dor do usuario
- Evidencias: operations.ts L781-816 (insight sem dedup), L819-865 (debate sem dedup), L868-933 (decide sem dedup), check.ts L61-73 (apenas unicidade de ID, sem cross-entity)

### Agente Codex/GPT-5.4 (ajusta e refina)
- Argumento: Concordo com A, C e E integralmente. B, D e F precisam reformulacao arquitetural. O maior ponto: D nao e "sobrescrever arquivo" — ja faz upsert. O problema real e merge semantico raso no registro individual + heuristica ruim de serviceId
- Evidencias: operations.ts L2309-2320 (upsert por feature.id no architecture), L2324-2336 (upsert no serviceCatalog com serviceId = touches[0] || execution_kind), bootstrap.ts L445-449 (mergeByKey existe no bootstrap mas nao no finalize)

## 5) Rodada de critica cruzada
### Gemini critica Codex
- Riscos concretos: Codex minimiza V2 (isolamento). Embora o isolamento fisico por projectRoot funcione para uso local, o risco real surge quando agentes operam em multiplos projetos simultaneamente e confundem contextos — cenario ja observado pelo usuario

### Codex critica Gemini
- Riscos concretos: Gemini classificou V6 incorretamente como "sobrescrever o arquivo inteiro" quando na verdade e upsert. A formulacao imprecisa pode levar a solucao errada. Alem disso, Gemini propoe "lentes para YAML" (vetor F) quando integridade de estado deve ser uma camada separada de validadores, nao uma extensao do sistema de lentes documentais

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto na prevencao de duplicatas | 5 | 5 | 4 | 2 |
| Complexidade de implementacao | 3 | 2 | 3 | 4 |
| Retrocompatibilidade | 4 | 3 | 4 | 5 |
| Beneficio para agente AI | 4 | 5 | 4 | 3 |
| Risco de regressao | 3 | 2 | 3 | 4 |
| **Total ponderado** | | **68** | **70** | **65** |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): B — Implementacao Seletiva com reformulacao
- Justificativa: O Codex demonstrou que D precisa de reformulacao (heuristica de serviceId antes de sofisticar merge) e F deve gerar uma camada separada (state validators, nao lentes). A opcao B incorpora estas correcoes e foca nas dores imediatas
- Riscos aceitos: Isolamento entre projetos (B) e state validators (F) ficam para ciclo futuro. O risco de confusao cross-project persiste ate a implementacao de B
- Condicoes de reversao: Se a implementacao de A+C+D+E nao reduzir duplicatas em 80% nos proximos 2 ciclos de feature, reavaliar a abordagem de dedup

## 8) Saida
- APPROVED -> EPIC-0011

## Implementacao Priorizada

### P0 — Fundamentos (C + E)
- **C**: Integridade referencial no check com severidade graduada
- **E**: transition-log.yaml append-only, remover ARCHIVED→DONE, forceTransition exigir reason

### P1 — Dores Imediatas (A + D)
- **A**: Dedup cross-entity em insight/debate/decide com warn-and-link, similarity() com bigrams
- **D**: Corrigir heuristica serviceId + merge field-wise no finalize

### P2 — Evolucao Futura (B + F)
- **B**: project_id estavel em config.yaml sem prefixar IDs funcionais
- **F**: State validators como camada separada de lentes

## Metadados
- Insight de origem: INS-0011
- Titulo do insight: Robustez estrutural do OpenSDD: dedup, isolamento, integridade e auditoria
- Criado em: 2026-04-17T01:01:34.321Z
- Debate aberto em: 2026-04-17T01:01:41.756Z
- Agentes participantes: Gemini (Claude Opus 4.6 Thinking), Codex (GPT-5.4)
- Debate concluido em: 2026-04-17T01:02:00.000Z
