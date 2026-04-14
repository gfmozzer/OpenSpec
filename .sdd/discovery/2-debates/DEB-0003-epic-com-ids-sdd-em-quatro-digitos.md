# Debate DEB-003

## 1) Pergunta de decisao (obrigatorio)
Decidir a evolucao combinada do modelo SDD para usar `EPIC/EPIC-####` no lugar de `RADAR/RAD-###` e padronizar os IDs centrais em quatro digitos no formato `[INS,DEB,EPIC,FEAT]-####`.

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
  Fazer a migracao estrutural completa em uma unica virada: `RAD` passa a `EPIC`, novos e antigos IDs passam a quatro digitos, e o estado persistido e migrado imediatamente.
- Pras:
  - Resultado final coerente e limpo.
  - Elimina rapidamente vocabulos duplicados.
  - Gera modelo mental unico para times novos.
- Contras:
  - Alto risco de quebra em repositorios existentes.
  - Exige migracao sincronizada de codigo, YAML, docs, templates e historico.
  - Pode invalidar referencias persistidas e automacoes externas.

### Opcao B
- Proposta:
  Manter `RAD/RAD-###` como modelo real e aplicar apenas ajustes superficiais, sem mudar prefixos nem largura oficial dos IDs.
- Pras:
  - Menor custo de curto prazo.
  - Quase nenhum risco de compatibilidade.
  - Evita migracao de estado.
- Contras:
  - Nao resolve a ambiguidade semantica do nome `RADAR`.
  - Mantem IDs menos expressivos e inconsistentes com a nova direcao desejada.
  - Adia um problema estrutural para depois.

### Opcao C (opcional)
- Proposta:
  Adotar transicao versionada: `EPIC` vira linguagem e identificador canonico de futuro, IDs centrais passam a `####`, mas o sistema aceita e interpreta legado (`RAD-*`, IDs de 3 digitos) durante uma fase de compatibilidade.
- Pras:
  - Permite rollout incremental e seguro.
  - Preserva repositorios ja inicializados.
  - Separa claramente estado legado de formato novo.
  - Facilita atualizar CLI, docs, templates e validadores por etapas.
- Contras:
  - Adiciona complexidade temporaria.
  - Exige regras explicitas de normalizacao e renderizacao.
  - Amplia a superficie de testes durante a transicao.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
  Se a organizacao quer que a entidade se comporte como `EPIC` e quer IDs mais robustos (`####`), a melhor experiencia final so vem com uma migracao completa. O sistema ja centraliza a emissao de IDs, o que torna a virada tecnicamente viavel.
- Evidencias:
  - `src/core/sdd/state.ts` concentra a emissao via `formatCounterId(...)`.
  - O modelo atual ja aceita regex com `\d{3,}` em `src/core/sdd/types.ts`, o que reduz restricao de leitura.
  - O papel atual de `RAD` ja e de agrupador/planejador para `FEAT`, semanticamente proximo de `EPIC`.
  - O usuario final tende a compreender melhor `EPIC-0001` do que `RAD-001`.

### Agente B (defende B)
- Argumento:
  A mudanca combinada mexe em duas dimensoes ao mesmo tempo: significado da entidade e formato dos IDs. Isso aumenta muito o risco, porque o impacto sai da camada de UX e entra no nucleo do estado persistido e da compatibilidade historica.
- Evidencias:
  - `src/core/sdd/check.ts` ainda comunica formatos como `INS-###`, `DEB-###`, `RAD-###`.
  - `src/core/sdd/types.ts` ainda define `DiscoveryTypeSchema` com `RAD`, nao `EPIC`.
  - `src/commands/sdd.ts` expoe `--radar`, mensagens `Use RAD-###` e descricoes de onboarding com `RAD-###`.
  - `README.md`, `AGENTS.md`, `docs/sdd-manual-pt-br.md`, `.sdd/README.md` e templates internos repetem a convencao atual.
  - O estado real em `.sdd/state/discovery-index.yaml` e `.sdd/state/backlog.yaml` referencia `RAD-001`, `origin_type: epic` e `origin_ref: RAD-001`.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Manter tudo como esta preserva friccao para novos usuarios.
  - A cada novo artefato, o custo futuro da migracao aumenta.
  - O sistema continuaria ensinando um conceito (`radar`) diferente do que o usuario quer operar (`epic`).

### B critica A
- Riscos concretos:
  - Migracao atomica pode quebrar comandos existentes, arquivos historicos e automacoes.
  - Renomear prefixo e largura de ID ao mesmo tempo dificulta rollback e troubleshooting.
  - Repositorios parcialmente migrados poderiam ficar com estado hibrido dificil de validar.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 | 5 | 2 | 4 |
| Complexidade de implementacao | 2 | 1 | 5 | 3 |
| Risco tecnico | 3 | 1 | 5 | 4 |
| Custo operacional | 2 | 1 | 5 | 3 |
| Tempo de entrega | 2 | 1 | 5 | 3 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): C
- Justificativa: A combinacao `EPIC` + IDs de quatro digitos e desejavel, mas deve ser tratada como migracao versionada. O projeto precisa de um caminho seguro que mantenha leitura de legado, preserve estados existentes e permita que a mudanca seja implantada por camadas: validacao, emissao, CLI, views, docs, persistencia e migracao de repositorios.
- Riscos aceitos:
  - Complexidade temporaria de suportar prefixos e larguras antigas e novas.
  - Duplicidade transitória em mensagens, aliases e testes.
  - Necessidade de uma rotina clara de migracao para projetos existentes.
- Condicoes de reversao:
  - Se a migracao de estado se provar cara demais, manter persistencia legada e expor `EPIC` apenas como alias de interface numa primeira fase.
  - Se houver inconsistencias em refs historicas, congelar a emissao nova e voltar a aceitar apenas formato legado ate estabilizar a estrategia de conversao.

## 8) Saida
- APPROVED -> iniciativa aprovada equivalente ao papel atual de `RAD`, com destino planejado para `EPIC-####`
- DISCARDED -> Registro em discarded

## 9) Areas impactadas identificadas

- Emissao de IDs:
  `src/core/sdd/state.ts` usa `padStart(3, '0')` e e o ponto canonico de geracao.
- Regras de validacao:
  `src/core/sdd/types.ts` e `src/core/sdd/check.ts`.
- Modelo semantico:
  `DiscoveryTypeSchema`, labels, enums e mensagens que hoje usam `RAD`.
- CLI:
  `src/commands/sdd.ts` com `--radar`, descricoes, help text, erros e comandos que aceitam `RAD-###`.
- Operacoes SDD:
  `src/core/sdd/operations.ts` cria `RAD`, faz `breakdown`, popula `origin_ref`, nomes de diretórios e prompts.
- Estado persistido:
  `.sdd/state/discovery-index.yaml`, `.sdd/state/backlog.yaml`, refs em `.sdd/active`, `.sdd/discovery`, `.sdd/pendencias` e grupos como `radar-rad-001`.
- Documentacao e bootstrap:
  `README.md`, `AGENTS.md`, `.sdd/README.md`, `docs/sdd-manual-pt-br.md`, `src/core/sdd/default-bootstrap-files.ts`, `src/core/sdd/docs-sync.ts`.
- Testes:
  `test/core/sdd-operations.test.ts` e expectativas em mensagens `RAD-###`, `FEAT-###`.

## 10) Requisitos adicionais para implementacao futura

- Aceitar leitura simultanea de `RAD-###`, `EPIC-###`, `INS-###`, `INS-####`, `DEB-###`, `DEB-####`, `FEAT-###` e `FEAT-####` durante a transicao.
- Definir se o contador canonico continua numerico simples com mudanca apenas de renderizacao, ou se havera migracao material dos IDs persistidos.
- Definir estrategia de migracao de `RAD` para `EPIC` no estado:
  talvez `type: RAD` legado com exibicao `EPIC`, ou mudanca efetiva para `type: EPIC` com migrador versionado.
- Atualizar aliases de CLI para `--epic`, `EPIC-####` e possivel preservacao de `--radar`.
- Garantir preservacao de `origin_ref`, `origin_type`, `acceptance_refs`, `parallel_group` e historico de arquivos ja criados.
- Revisar se `FGAP` e `TD` tambem devem migrar para quatro digitos por consistencia, mesmo que o pedido atual destaque `[INS,DEB,EPIC,FEAT]`.
- Documentar uma politica explicita de compatibilidade para repositorios existentes e para novos repositorios inicializados apos a mudanca.

## Metadados
- Insight de origem: INS-003
- Titulo do insight: EPIC e IDs SDD com quatro dígitos
- Criado em: 2026-04-09T20:31:18.659Z
- Debate aberto em: 2026-04-09T20:31:34.182Z
