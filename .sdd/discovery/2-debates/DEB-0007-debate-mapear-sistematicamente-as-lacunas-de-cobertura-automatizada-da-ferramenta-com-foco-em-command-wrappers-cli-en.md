# Debate DEB-0007

## 1) Pergunta de decisao (obrigatorio)
Decidir priorizar expansao de testes em caminhos com logica observavel e ramos reais de negocio em vez de perseguir primeiro os arquivos com `0%` cosmetico para resolver a baixa confianca residual da suite e elevar a cobertura da ferramenta com melhor ROI tecnico.

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega
- Ganho real de confianca por teste adicionado

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta: atacar primeiro todos os arquivos listados com `0%`, incluindo wrappers, reexports, registradores de comando e entrypoints.
- Pras:
  - melhora rapidamente a aparencia do relatorio global.
  - reduz a lista de hotspots numericamente.
- Contras:
  - parte relevante desse `0%` nao representa logica de negocio significativa.
  - tende a gerar testes frágeis acoplados a wiring/registro.
  - pode consumir tempo sem elevar proporcionalmente a confianca funcional.

### Opcao B
- Proposta: priorizar arquivos com baixa cobertura e logica real (`validate`, `spec`, `change`, `completion`, `match`) e tratar wrappers puros apenas com smoke coverage quando houver ROI claro.
- Pras:
  - maximiza ganho de confianca por caso de teste.
  - cobre branches e mensagens de erro que impactam a experiencia real da CLI.
  - reduz risco de regressao em fluxos mais usados da ferramenta.
- Contras:
  - o percentual global pode subir menos no curto prazo do que uma ofensiva focada em wrappers.
  - exige leitura mais criteriosa dos caminhos internos.

### Opcao C (opcional)
- Proposta: investir primeiro em testes end-to-end amplos via `bin/opensdd.js` para simular jornadas completas, deixando baixo nivel/source tests em segundo plano.
- Pras:
  - valida integracao ponta a ponta.
  - protege wiring real da CLI.
- Contras:
  - maior custo por cenario.
  - debug mais lento e menor granularidade para localizar falhas.
  - nao fecha bem branches internos e edge cases pequenos.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento: arquivos com `0%` sao o maior passivo visivel e devem ser tratados primeiro para destravar o indicador global.
- Evidencias:
  - relatorio atual lista `src/cli/index.ts`, `src/commands/schema.ts`, `src/commands/sdd.ts` e modulos de `workflow` em `0%`.
  - atacar esses pontos tende a mover rapidamente o heatmap mais gritante.

### Agente B (defende B)
- Argumento: o passivo mais perigoso nao e o `0%` nominal, mas os comandos com logica parcial ainda pouco exercitada, onde existem ramos de erro, filtros, selecao e saidas condicionais.
- Evidencias:
  - `src/commands/validate.ts`: `25.94%` statements / `46.43%` branches.
  - `src/commands/spec.ts`: `29.38%` statements / `44.44%` branches.
  - `src/commands/change.ts`: `67.62%` statements / `54.76%` branches.
  - `src/commands/completion.ts`: `55.21%` statements / `80.43%` branches.
  - `src/utils/match.ts`: `8.7%` statements apesar de ser helper central para sugestoes da CLI.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - a leitura do dashboard continua mostrando muitos arquivos em `0%`.
  - parte do tempo sera gasta em casos menos “visiveis” para a metrica agregada.

### B critica A
- Riscos concretos:
  - risco de otimizar para a metrica e nao para a confianca.
  - wrappers de registro e reexport podem quebrar com pequenas refatoracoes, gerando testes custosos e frágeis.
  - baixa chance de capturar erros reais de validacao, filtragem e output.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 | 2 | 5 | 4 |
| Complexidade de implementacao | 2 | 3 | 4 | 2 |
| Risco tecnico | 3 | 2 | 5 | 4 |
| Custo operacional | 2 | 2 | 4 | 2 |
| Tempo de entrega | 2 | 3 | 4 | 2 |
| Ganho real de confianca por teste | 3 | 2 | 5 | 4 |

Pontuacao ponderada:
- A = 27
- B = 55
- C = 40

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): B
- Justificativa: a proxima iteracao deve atacar as lacunas com maior densidade de logica e branches relevantes, especialmente nos comandos-fonte que ainda possuem caminhos de filtro, saida JSON/texto, erros de argumento, validacao bulk/direta e sugestoes por proximidade. Os wrappers em `0%` continuam no radar, mas entram como frente secundaria ou smoke coverage quando o mapa de ROI encolher.
- Riscos aceitos:
  - o percentual global pode subir menos do que uma ofensiva orientada por arquivos `0%`.
  - alguns hotspots cosmeticos continuarao aparecendo no relatorio.
- Condicoes de reversao:
  - se a nova rodada nao mover de forma perceptivel `validate/spec/change/match/completion`, reavaliar e abrir uma frente especifica de smoke coverage para wrappers e entrypoints.

## 8) Saida
- APPROVED -> EPIC-0007
- DISCARDED -> Registro em discarded

## Metadados
- Insight de origem: INS-0007
- Titulo do insight: Mapear sistematicamente as lacunas de cobertura automatizada da ferramenta, com foco em command wrappers, CLI entrypoint
- Criado em: 2026-04-13T04:32:35.796Z
- Debate aberto em: 2026-04-13T04:32:44.473Z
