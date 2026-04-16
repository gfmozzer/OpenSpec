# Debate DEB-0009

## 1) Pergunta de decisao (obrigatorio)
Decidir uma politica de numeracao por projeto em vez de uma migracao forcada unica para resolver a divergencia entre repositorios iniciados com IDs de 3 digitos e repositorios iniciados com IDs de 4 digitos em todos os artefatos SDD com sequenciador.

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
  Forcar que todo projeto converja para 4 digitos em todos os artefatos sequenciais, independentemente da origem historica do repositorio.
- Pras:
  - Modelo unico e simples de explicar.
  - Reduz variedade de exemplos e mensagens no medio prazo.
  - Facilita validacoes e documentacao futuras se a migracao for completa.
- Contras:
  - Reabre o problema que motivou este debate: projetos legados passam a sofrer conversao forcada.
  - Aumenta risco em historico, automacoes externas, links internos e ADRs/artefatos derivados ja materializados.
  - Contraria a necessidade explicita de convivencia por projeto.

### Opcao B
- Proposta:
  Manter a convivencia apenas para os artefatos centrais (`INS`, `DEB`, `EPIC`, `FEAT`) e deixar artefatos secundarios/derivados seguirem regras avulsas ou continuarem mistos.
- Pras:
  - Menor esforco imediato.
  - Ataca a dor principal percebida pelos usuarios no funil central.
  - Exige menos mudancas de curto prazo em docs/testes.
- Contras:
  - Mantem inconsistencias reais em `FGAP`, `TD`, `ADR` e `SRC`.
  - Faz o projeto continuar ensinando uma regra parcial, dificil de operacionalizar.
  - Cria bugs de rastreabilidade entre artefatos relacionados.

### Opcao C (opcional)
- Proposta:
  Tornar a largura numerica um contrato de projeto, aplicado a qualquer artefato com sequenciador. Projetos legados permanecem em 3 digitos; projetos novos permanecem em 4 digitos. Artefatos derivados seguem a largura do projeto ou do artefato-pai quando aplicavel.
- Pras:
  - Resolve a convivencia sem destruir historico.
  - Cria uma regra uniforme para todo o ecossistema SDD, nao so para `INS/DEB/EPIC/FEAT`.
  - Permite migracao explicita e opt-in por projeto, em vez de migracao compulsoria.
  - Evita drift entre artefatos primarios e secundarios.
- Contras:
  - Exige mapear e ajustar mais superfícies do que o debate anterior tratou.
  - Obriga a revisar docs, mensagens, exemplos, testes e renderizacao de historico.
  - Introduz uma dimensao nova de configuracao/estado: largura canônica do projeto.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
  A padronizacao total em 4 digitos ainda seria a solucao estruturalmente mais limpa, porque o runtime atual ja emite IDs novos com padding de 4 digitos para os contadores principais do SDD.
- Evidencias:
  - `src/core/sdd/state.ts` centraliza a emissao de IDs com `formatCounterId(...)` e usa `padStart(4, '0')` para `INS`, `DEB`, `RAD`, `EPIC`, `FEAT`, `FGAP` e `TD`.
  - Os patterns centrais em `src/core/sdd/types.ts` aceitam `\d{3,}`, entao o parser ja tolera larguras maiores sem restringir a leitura.
  - O repositorio ja opera com estado canonico de 4 digitos em features e epics atuais (`FEAT-0015`, `EPIC-0008`, etc.), mostrando que o modelo novo ja esta em uso.

### Agente B (defende B)
- Argumento:
  O problema nao esta restrito aos artefatos centrais. Se a convivencia for parcial, o sistema continua incoerente porque artefatos ligados entre si ainda ficam com larguras diferentes, mensagens diferentes e exemplos conflitantes.
- Evidencias:
  - `FGAP` e `TD` sao artefatos reais do sistema:
    - `src/core/sdd/types.ts` define `frontendGap` e `techDebt`.
    - `src/core/sdd/operations.ts` reconhece `FGAP` e `TD` em `inferOriginType(...)` e `detectContextType(...)`.
    - `src/core/sdd/check.ts` ainda comunica `TD-###` na mensagem de validacao.
  - `ADR` nao tem contador proprio, mas deriva diretamente da `FEAT`:
    - `src/core/sdd/operations.ts` gera nome e conteudo a partir de `feature.id`.
    - O path do ADR e `ADR-${feature.id}.md`, entao a largura do ADR depende da largura da `FEAT`.
    - Existe historico legado visivel em `.sdd/core/adrs/ADR-FEAT-0001.md`, cujo conteudo ainda traz `# ADR FEAT-001`.
  - Existem artefatos sequenciais fora do nucleo discovery/backlog:
    - `src/core/sdd/operations.ts` ainda gera `SRC-${String(max + 1).padStart(3, '0')}` para fontes/indexacao (`SRC`).
    - `test/core/sdd-operations.test.ts` ainda usa `SRC-001`, confirmando que essa familia continua em 3 digitos no comportamento esperado.
  - A documentacao ainda propaga exemplos de 3 digitos:
    - `AGENTS.md` usa `FEAT-###`, `INS-###`, `DEB-###`, `RAD-###`.
    - `docs/sdd-manual-pt-br.md` ainda usa `FGAP-###`, `RAD-###` e exemplo real `FGAP-001`.
    - `.sdd/templates/template-1-spec.md`, `template-2-plan.md` e `template-3-tasks.md` ainda usam `FEAT-###`.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Expandir o escopo para todo artefato sequencial aumenta o tamanho da mudanca.
  - A regra "por projeto" exige um lugar canonico para persistir essa decisao e uma estrategia clara para repositorios hibridos.
  - Ajustar historico e renderizacao pode gerar discussao sobre o que e "fato historico" versus "normalizacao de exibicao".

### B critica A
- Riscos concretos:
  - Tratar so o funil principal deixa `FGAP`, `TD`, `ADR` e `SRC` fora da politica e perpetua divergencia.
  - Migracao compulsoria ignora que alguns repositorios ja nasceram e operam com 3 digitos sem querer convergir agora.
  - O sistema continuaria com mensagens/docs dizendo `###` em umas partes e emitindo `####` em outras.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 | 2 | 3 | 5 |
| Complexidade de implementacao | 2 | 3 | 4 | 3 |
| Risco tecnico | 3 | 1 | 2 | 4 |
| Custo operacional | 2 | 2 | 4 | 3 |
| Tempo de entrega | 2 | 3 | 4 | 3 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): C
- Justificativa: A necessidade real do projeto nao e mais "migrar tudo para 4 digitos", e sim estabilizar uma regra de convivencia por repositorio. Essa regra precisa valer para qualquer artefato com sequenciador, inclusive artefatos derivados e auxiliares, porque a divergencia hoje nao esta so em `INS/DEB/EPIC/FEAT`. O debate deve assumir explicitamente que `FGAP`, `TD`, `ADR` derivado de `FEAT` e `SRC` entram no escopo da politica.
- Riscos aceitos:
  - O projeto passara a ter uma dimensao de configuracao ou heuristica de "largura canonica do projeto".
  - Havera trabalho de saneamento em documentacao, templates e suites de teste.
  - Pode ser necessario distinguir entre compatibilidade de leitura, emissao nova e renderizacao de historico.
- Condicoes de reversao:
  - Se a configuracao por projeto se mostrar custosa demais, iniciar com heuristica de autodeteccao baseada no estado existente e adiar a configuracao explicita.
  - Se reescrever historico for arriscado, preservar arquivos antigos como fato historico e aplicar a politica apenas a emissao futura e a views renderizadas.

## 8) Saida
- APPROVED -> EPIC futura para politizar numeracao por projeto em todos os artefatos sequenciais
- DISCARDED -> Registro em discarded

## 9) Artefatos impactados mapeados

- Artefatos centrais com sequenciador:
  - `INS`
  - `DEB`
  - `RAD` legado / `EPIC`
  - `FEAT`
- Artefatos secundarios que tambem precisam entrar na politica:
  - `FGAP`
  - `TD`
  - `SRC`
- Artefatos derivados que nao tem contador proprio, mas herdam a largura:
  - `ADR-FEAT-####` ou `ADR-FEAT-###`, conforme a largura da `FEAT`

## 10) Achados concretos deste repositorio

- `DT` nao apareceu como artefato canonico no codigo ou no estado. O nome real da familia de divida tecnica hoje e `TD`.
- `FGAP` e `TD` ja compartilham o emissor de 4 digitos em `src/core/sdd/state.ts`, mas ainda aparecem com comunicacao/documentacao em `###`.
- `SRC` ainda nasce em 3 digitos em `src/core/sdd/operations.ts`, entao e o caso mais claro de familia sequencial ainda fora da regra de 4 digitos.
- Ha historico legado real de 3 digitos em artefatos arquivados e de discovery, por exemplo:
  - `.sdd/archived/FEAT-0001/*` com referencias textuais a `FEAT-001` e `RAD-001`
  - `.sdd/core/adrs/ADR-FEAT-0001.md` com titulo `# ADR FEAT-001`
  - `.sdd/discovery/3-radar/EPIC-0001-...md` com heading `# Radar RAD-001`
- O projeto tambem tem superficies textuais e templates que ainda ensinam a regra antiga:
  - `AGENTS.md`
  - `docs/sdd-manual-pt-br.md`
  - `.sdd/templates/*.md`
  - mensagens de erro/ajuda em `src/commands/sdd.ts` e `src/core/sdd/check.ts`

## 11) Requisitos adicionais para implementacao futura

- Definir explicitamente onde vive a largura canonica do projeto:
  - config persistida em `.sdd/config.yaml`, ou
  - autodeteccao baseada no primeiro estado encontrado, com persistencia posterior.
- Aplicar a politica a toda familia sequencial relevante:
  - `INS`, `DEB`, `RAD/EPIC`, `FEAT`, `FGAP`, `TD`, `SRC`
  - `ADR` deve seguir a largura da `FEAT` associada.
- Decidir como tratar historico:
  - manter arquivos historicos antigos como fatos do passado, ou
  - reescrever nomes/renderizacao ao migrar o projeto.
- Atualizar docs, templates e mensagens para nao assumir implicitamente `###`.
- Revisar testes e fixtures que ainda assertam `FGAP-001`, `RAD-001`, `FEAT-001`, `SRC-001`.
- Definir regra de compatibilidade para repositorios mistos:
  - leitura ampla de `\d{3,}`
  - emissao nova obedecendo a largura do projeto
  - renderizacao consistente nas views e comandos.

## Metadados
- Insight de origem: INS-0009
- Titulo do insight: Convivência entre IDs de 3 e 4 dígitos por projeto
- Criado em: 2026-04-15T14:38:42.071Z
- Debate aberto em: 2026-04-15T14:38:49.567Z
