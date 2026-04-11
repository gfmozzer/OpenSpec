# Debate DEB-002

## 1) Pergunta de decisao (obrigatorio)
Decidir `EPIC/EPIC-###` em vez de `RADAR/RAD-###` para representar a iniciativa aprovada no funil de discovery e planejamento do SDD.

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
  Tornar `EPIC/EPIC-###` o nome canonico da entidade hoje chamada `RADAR/RAD-###`, com compatibilidade retroativa para comandos e estados legados.
- Pras:
  - Nome mais reconhecivel para times de produto e engenharia.
  - Melhora a comunicacao com ferramentas e praticas modernas de desenvolvimento.
  - Alinha melhor o papel da entidade com backlog de medio prazo.
  - Permite simplificar onboarding futuro.
- Contras:
  - Exige migracao em codigo, testes, docs, YAML e views geradas.
  - Introduz custo de retrocompatibilidade.
  - Risco de mistura entre `RAD-*` legado e `EPIC-*` novo durante a transicao.

### Opcao B
- Proposta:
  Manter `RADAR/RAD-###` como canonico e apenas mudar a linguagem exibida para "Epic" em algumas views e docs.
- Pras:
  - Menor custo de implementacao.
  - Quase zero impacto em compatibilidade.
  - Nao exige migracao de estado existente.
- Contras:
  - Mantem divergencia entre conceito exibido e identificador real.
  - Cria ambiguidade em comandos, docs e onboarding.
  - Preserva um nome menos intuitivo para novos usuarios.

### Opcao C (opcional)
- Proposta:
  Suportar modelo dual por um periodo: `EPIC/EPIC-###` passa a ser canonico para novos registros, mas `RADAR/RAD-###` continua aceito como alias de leitura e comando.
- Pras:
  - Equilibra clareza futura com transicao segura.
  - Permite migrar docs, views e comandos sem quebrar projetos existentes.
  - Facilita rollout incremental.
- Contras:
  - Aumenta complexidade temporaria.
  - Exige regras claras de serializacao e renderizacao.
  - Pode prolongar a coexistencia de dois vocabulos.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
  O papel atual de `RADAR` no projeto ja e de iniciativa aprovada que gera FEATs, acompanha progresso e serve de referencia de origem. Isso e semanticamente mais proximo de `EPIC` do que de um simples "radar".
- Evidencias:
  - `opensdd sdd breakdown RAD-###` transforma a entidade em FEATs executaveis.
  - `backlog.yaml` guarda `origin_type: radar` e `origin_ref: RAD-###`.
  - `check.ts`, `views.ts` e `operations.ts` calculam progresso agregado por `RAD`.
  - `onboard`, `context` e `start` aceitam `RAD-###` como referencia operacional.
  - A documentacao ja descreve esse item como iniciativa aprovada de planejamento.

### Agente B (defende B)
- Argumento:
  A troca de nome afeta o nucleo do SDD e pode gerar custo alto para um ganho principalmente semantico. Se o problema for entendimento, docs e aliases podem resolver sem migracao estrutural.
- Evidencias:
  - O identificador `RAD-###` esta espalhado por comandos, regex, templates, YAML, docs e testes.
  - Existe estado real persistido em `.sdd/state/discovery-index.yaml` e `.sdd/state/backlog.yaml`.
  - Ha references em `.sdd/active`, `.sdd/core/adrs`, `.sdd/pendencias` e varios testes de integracao.
  - Mudar identificadores persistentes requer estrategia de migracao e compatibilidade.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Resolver apenas na camada textual cria vocabulario duplo permanente.
  - Usuario aprende "Epic", mas precisa operar `RAD-###`, o que aumenta friccao.
  - Onboarding, documentacao e CLI passam a divergir do modelo mental.

### B critica A
- Riscos concretos:
  - Renomeacao canonica sem alias quebra comandos existentes como `sdd breakdown RAD-###`.
  - Mudanca direta em IDs pode invalidar backlog, acceptance refs e origem de FEATs.
  - Views e arquivos historicos poderiam ficar inconsistentes durante a migracao.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 | 5 | 2 | 4 |
| Complexidade de implementacao | 2 | 2 | 5 | 3 |
| Risco tecnico | 3 | 2 | 5 | 4 |
| Custo operacional | 2 | 2 | 5 | 3 |
| Tempo de entrega | 2 | 2 | 5 | 3 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): C
- Justificativa: O projeto deve convergir para `EPIC/EPIC-###` como linguagem canonica de produto e planejamento, mas com migracao segura. O impacto encontrado e amplo demais para uma troca abrupta. A melhor estrategia e adotar `EPIC` como destino, mantendo compatibilidade de leitura, comando e serializacao de legado por uma fase de transicao.
- Riscos aceitos:
  - Complexidade temporaria por suportar dois nomes.
  - Necessidade de mapear claramente canonico novo versus alias legado.
  - Aumento pontual de manutencao em testes e docs durante a transicao.
- Condicoes de reversao:
  - Se o custo de compatibilidade se mostrar alto demais, o projeto pode recuar para a Opcao B.
  - Se a migracao comprometer integridade do estado `.sdd`, manter `RAD` como persistencia legada e limitar `EPIC` a alias de interface.

## 8) Saida
- APPROVED -> entidade sucessora da iniciativa aprovada hoje modelada como `RAD-###`
- DISCARDED -> Registro em discarded

## 9) Areas impactadas identificadas

- CLI:
  `src/commands/sdd.ts` usa `radar`, `RAD-###`, `--radar`, `--outcome radar`, `breakdown <radarId>`, `onboard RAD-###`.
- Regras e tipos:
  `src/core/sdd/types.ts` contem regex, enums e labels do tipo `radar`.
- Operacoes:
  `src/core/sdd/operations.ts` aloca IDs `RAD`, gera arquivos `3-radar`, templates Markdown, status, onboarding e resolucao de refs.
- Validacao e views:
  `src/core/sdd/check.ts`, `src/core/sdd/views.ts`, `.sdd/pendencias/*`.
- Estado persistido:
  `.sdd/state/discovery-index.yaml`, `.sdd/state/backlog.yaml`, refs de origem e grupos paralelos como `radar-rad-001`.
- Documentacao:
  `README.md`, `AGENTS.md`, `docs/sdd-manual-pt-br.md`, `.sdd/README.md`, artefatos ativos e ADRs.
- Testes:
  `test/core/sdd-operations.test.ts` e demais testes com expectativas em `RAD-###`.

## 10) Requisitos adicionais para uma futura implementacao

- Aceitar leitura de `RAD-###` e `EPIC-###` durante a transicao.
- Definir se o estado canonico persistido muda imediatamente ou em migracao versionada.
- Garantir migracao dos diretórios `3-radar` e arquivos associados.
- Preservar `origin_ref`, `acceptance_refs`, `parallel_group` e onboarding historico.
- Atualizar aliases em pt-BR e ingles sem quebrar comandos existentes.
- Especificar claramente a politica de backward compatibility para repositorios ja inicializados.

## Metadados
- Insight de origem: INS-002
- Titulo do insight: RADAR deve virar EPIC
- Criado em: 2026-04-09T20:27:06.277Z
- Debate aberto em: 2026-04-09T20:27:16.297Z
