# Debate DEB-004

## 1) Pergunta de decisao (obrigatorio)
Decidir a melhor estrategia para endurecer o SDD com guardrails estruturais: evitar IDs repetidos, impor protocolo fixo de diretórios por estado do artefato, separar FEATs ativas de FEATs concluídas em um espaço próprio de arquivo, adicionar lentes/validators por tipo de artefato e impedir qualquer avanço de estado sem 100% de validação obrigatória.

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
  Endurecer o fluxo atual apenas com mais validações no `check`, mantendo diretórios e geração de artefatos praticamente como estão hoje.
- Pras:
  - Menor esforço inicial.
  - Reaproveita boa parte do modelo atual.
  - Baixo impacto na experiência existente.
- Contras:
  - Não resolve o problema de ciclo de vida físico do workspace.
  - Continua dependente de disciplina operacional fora do código.
  - As validações ficam concentradas no final, em vez de proteger cada transição.

### Opcao B
- Proposta:
  Introduzir um protocolo completo e rígido: reserva atômica de IDs, diretórios por estado (`active`, `archived`), lentes estruturais por artefato e bloqueio determinístico de qualquer transição sem validação total.
- Pras:
  - Cria um modelo operacional forte e auditável.
  - Reduz ambiguidade da LLM na criação de artefatos.
  - Alinha estado lógico, estado físico e qualidade documental.
  - Facilita auditoria, troubleshooting e evolução futura.
- Contras:
  - Maior esforço de implementação.
  - Exige mudança coordenada em operações, validações, docs e testes.
  - Pode exigir migração de workspaces já existentes.

### Opcao C (opcional)
- Proposta:
  Implantar por fases: primeiro reserva/checagem forte de IDs e validadores de transição; depois protocolo de diretórios; por fim lentes estruturais por artefato e bloqueio fino de avanço.
- Pras:
  - Equilibra robustez com rollout seguro.
  - Permite aprender com a adoção sem travar tudo de uma vez.
  - Reduz risco de regressão operacional.
- Contras:
  - Mantém inconsistências temporárias entre partes do sistema.
  - Exige disciplina para não parar no meio do caminho.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
  O projeto já possui algumas proteções úteis. Antes de redesenhar a mecânica inteira, seria melhor ampliar o que já existe e observar o ganho real. Talvez o problema principal seja enforcement tardio, não a estrutura em si.
- Evidencias:
  - `src/core/sdd/check.ts` já detecta IDs duplicados no estado carregado.
  - `finalize` já bloqueia conclusão por guardrails de frontend e por gates rígidos em `flow_mode=rigoroso`.
  - O sistema já cria `active_path` para FEAT em execução e mantém estados `READY`, `BLOCKED`, `IN_PROGRESS`, `DONE`, `ARCHIVED`.
  - Há templates em `.sdd/templates/` e prompts bootstrap que já padronizam parte da estrutura.

### Agente B (defende B)
- Argumento:
  O sistema precisa sair de validação “best effort” para governança estrutural. Hoje existe validação de estado, mas não há um protocolo completo que una emissão de ID, localização física do artefato, contrato estrutural do documento e transição de estado protegida por regras determinísticas.
- Evidencias:
  - `checkUniqueIds` em `src/core/sdd/check.ts` detecta duplicidade depois do fato; não representa reserva atômica nem prevenção antes de gravar.
  - `src/core/sdd/operations.ts` cria workspace em `.sdd/active/FEAT-*`, mas o `finalize` não move esse workspace para uma área de arquivo da própria SDD.
  - O código já usa `openspec/changes/archive/` como evidência de consolidação, mas não existe equivalente explícito para os artefatos vivos da FEAT em `.sdd/`.
  - Templates ajudam, mas não existe uma camada formal de “lente” por artefato para validar se a saída da LLM respeitou exatamente seções, campos, formato e conteúdo exigidos.
  - O avanço de estado ainda depende de checagens específicas por comando; falta um motor unificado de “transition policy”.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Um redesenho completo pode burocratizar demais o fluxo.
  - Se o sistema travar fácil demais, a equipe passa a buscar bypass e perde confiança.
  - “Lentes” mal definidas podem virar validador frágil ou excessivamente rígido.

### B critica A
- Riscos concretos:
  - Melhorar apenas o `check` mantém a maior parte dos problemas estruturais.
  - Sem protocolo físico de diretórios, o estado “DONE” continua sem um reflexo claro na árvore `.sdd/`.
  - Sem validação por artefato antes da transição, a LLM pode gerar documento incompleto e ainda assim deixar o fluxo seguir parcialmente.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 | 2 | 5 | 4 |
| Complexidade de implementacao | 2 | 5 | 2 | 4 |
| Risco tecnico | 3 | 3 | 4 | 5 |
| Custo operacional | 2 | 5 | 2 | 4 |
| Tempo de entrega | 2 | 5 | 2 | 4 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): B, com rollout interno em fases
- Justificativa: A melhor solução proposta para as questões levantadas é adotar o modelo estrutural completo como alvo arquitetural, mesmo que a execução seja planejada em etapas. O sistema precisa de quatro pilares integrados:
  1. reserva e unicidade forte de IDs antes de persistir;
  2. protocolo fixo de diretórios por estado do artefato;
  3. lentes estruturais por tipo de artefato, usadas na geração e na validação;
  4. motor rigoroso de transição que bloqueia avanço sem 100% de conformidade.

  Apenas reforçar o `check` não é suficiente. O gap principal é de governança de fluxo, não só de validação tardia.
- Riscos aceitos:
  - Aumento da complexidade de implementação.
  - Necessidade de migrar workspaces e docs existentes.
  - Curva de aprendizado inicial para entender as lentes e as políticas de transição.
- Condicoes de reversao:
  - Se a camada de lentes se mostrar pesada demais, manter a estrutura de diretórios e a política rígida de transição, simplificando temporariamente os validadores por artefato.
  - Se a migração física de workspaces causar instabilidade, preservar o estado lógico novo e adiar apenas a movimentação automática de diretórios.

## 8) Saida
- APPROVED -> conjunto de guardrails estruturais para endurecer o ciclo de vida dos artefatos SDD
- DISCARDED -> Registro em discarded

## 9) Proposta recomendada

- IDs:
  criar um mecanismo de reserva antes da escrita do artefato, verificando:
  - contador canônico;
  - existência do ID no estado YAML;
  - existência do ID em diretórios/arquivos esperados;
  - inexistência de colisão entre legado e novo formato.

- Diretórios por estado:
  usar:
  - `.sdd/active/<ARTEFATO-ID>/` para artefatos em trabalho;
  - `.sdd/archived/<ARTEFATO-ID>/` para artefatos concluídos e congelados.

  Recomendação de nome:
  `archived`

  Justificativa:
  - alinha com `openspec/changes/archive/`;
  - comunica claramente estado final e histórico;
  - evita ambiguidade com `done`, que é mais status lógico do que localização física.

- Lentes estruturais:
  cada tipo de artefato deve ter uma “lente” ou contrato estrutural próprio, com:
  - seções obrigatórias;
  - ordem esperada;
  - campos obrigatórios;
  - formatos aceitos;
  - regras semânticas mínimas.

  Exemplos:
  - `insight lens`
  - `debate lens`
  - `epic lens`
  - `feature spec lens`
  - `feature plan lens`
  - `feature tasks lens`
  - `adr lens`

  Essas lentes devem servir em dois pontos:
  - na instrução dada à LLM para gerar o artefato;
  - na validação automática antes de aprovar ou avançar estado.

- Qualidade rígida de transição:
  nenhuma transição de estado deve ocorrer sem passar por um validador determinístico central.

  Exemplos:
  - `INS -> DEBATED` só se debate existir e estiver estruturalmente válido.
  - `DEB -> APPROVED` só se decisão estiver completa e consistente.
  - `EPIC -> PLANNED` só se breakdown e refs estiverem válidos.
  - `FEAT -> IN_PROGRESS` só se spec/plan/tasks mínimos existirem conforme a lente.
  - `FEAT -> DONE` ou `ARCHIVED` só se todos os gates, validações e guardrails obrigatórios estiverem 100% ok.

## 10) Areas impactadas identificadas

- Unicidade/checagem de IDs:
  [src/core/sdd/check.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/check.ts)
  [src/core/sdd/state.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/state.ts)
- Start/finalize/workspaces:
  [src/core/sdd/operations.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/operations.ts)
- CLI e mensagens:
  [src/commands/sdd.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/commands/sdd.ts)
- Templates e bootstrap:
  `.sdd/templates/`
  [src/core/sdd/default-bootstrap-files.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/default-bootstrap-files.ts)
- Documentação:
  [docs/sdd-manual-pt-br.md](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/docs/sdd-manual-pt-br.md)
  [.sdd/README.md](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/.sdd/README.md)
  [AGENTS.md](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/AGENTS.md)

## 11) Requisitos adicionais para implementacao futura

- O `check` deve validar não só estado YAML, mas também aderência entre estado lógico e localização física do artefato.
- O `finalize` deve mover ou congelar workspace da FEAT para `.sdd/archived/FEAT-*`.
- O `start` deve recusar ativação se o protocolo mínimo do artefato não estiver presente.
- Deve existir um catálogo declarativo de lentes por artefato, preferencialmente fora do código hardcoded quando possível.
- A LLM deve receber instrução derivada da lente, e a saída gerada deve ser revalidada automaticamente contra a mesma lente.
- Deve existir um “transition policy engine” central para evitar lógica dispersa de bloqueio em cada comando.
- Bypass, quando existir, deve ser explícito, auditável e raro.

## Metadados
- Insight de origem: INS-004
- Titulo do insight: Guardrails estruturais e qualidade rígida do SDD
- Criado em: 2026-04-09T20:43:11.299Z
- Debate aberto em: 2026-04-09T20:43:25.835Z
