# Debate DEB-0005

## 1) Pergunta de decisao (obrigatorio)
Decidir migracao automatica mandatória com preflight bloqueante em vez de migracao manual opcional para resolver a convergencia definitiva do SDD ao modelo canonico atual (`EPIC`, IDs com quatro digitos e historico integralmente compatibilizado).

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega
- Preservacao do historico
- Confiabilidade do fluxo

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
  Introduzir um preflight de versao/estado SDD em todos os comandos operacionais (`start`, `context`, `next`, `onboard`, `check`, `breakdown`, `finalize` e equivalentes). Se o projeto estiver em formato legado, a CLI deve detectar, pedir confirmacao para migrar imediatamente e bloquear o fluxo ate a migracao concluir com sucesso. Em modo nao interativo, a migracao deve ser obrigatoria via flag explicita ou falhar com instrucao objetiva.
- Pras:
  - Garante convergencia total para o modelo canonico.
  - Elimina dependencia de operacao manual solta.
  - Preserva consistencia do historico antes de qualquer novo comando mutar o estado.
  - Atende diretamente a missao de estrutura solida para os proximos ciclos.
- Contras:
  - Exige introduzir versionamento de estado SDD.
  - Exige ampliar bastante o escopo do migrador atual.
  - Aumenta o rigor do bootstrap e da compatibilidade.

### Opcao B
- Proposta:
  Manter o modelo atual, com comando explicito `opensdd sdd migrate --rad-to-epic`, e apenas melhorar docs/mensagens para o usuario lembrar de migrar antes de operar.
- Pras:
  - Menor esforco imediato.
  - Quase nenhum risco de regressao estrutural no curto prazo.
  - Reaproveita a implementacao existente.
- Contras:
  - Continua dependente de disciplina manual.
  - Nao cumpre o requisito de migracao obrigatoria no primeiro comando.
  - Permite que o projeto siga operando em estado misto.
  - Nao garante migracao integral do historico e dos planos.

### Opcao C (opcional)
- Proposta:
  Manter compatibilidade dual indefinidamente, aceitando legado em leitura/escrita e promovendo `EPIC`/`####` apenas como preferencia de interface.
- Pras:
  - Menor atrito de rollout.
  - Compatibilidade maxima com repositórios antigos.
- Contras:
  - Congela a transicao.
  - Aumenta custo cognitivo e tecnico permanentemente.
  - Contraria a ideia de modelo canonico unico.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
  O repositório ainda mostra convivencia real entre estado canonico e legado. Sem migracao automatica e mandatória, o SDD permanece estruturalmente incompleto para o proximo ciclo de execucao.
- Evidencias:
  - Existe `RAD-001` ainda persistido em `.sdd/state/discovery-index.yaml`.
  - Ainda existe diretório legado `.sdd/discovery/3-radar/`.
  - O backlog preserva `origin_type: epic` em `.sdd/state/backlog.yaml`.
  - O progresso ainda renderiza `RAD-001` em `.sdd/pendencias/progress.md`.
  - O migrador atual em `src/core/sdd/migrate.ts` cobre basicamente `RAD-* -> EPIC-*` e atualizacoes de refs relacionadas, mas nao implementa um protocolo de versao nem um gate operacional global.
  - O comando exposto em `src/commands/sdd.ts` depende de execucao manual: `opensdd sdd migrate --rad-to-epic`.
  - O fluxo automatico existente em `src/core/init.ts` e `src/core/update.ts` usa `migrateIfNeeded`, mas isso se refere a migracao do sistema de profiles/comandos, nao ao estado SDD.

### Agente B (defende B)
- Argumento:
  O projeto ja avancou bastante: aliases legados funcionam, `EPIC-####` existe como canonico, e um migrador parcial pode ser suficiente se a equipe operar com disciplina.
- Evidencias:
  - O codigo ja aceita `RAD` e `EPIC` em varios pontos de `src/core/sdd/operations.ts`, `src/core/sdd/check.ts` e `src/core/sdd/types.ts`.
  - O comando `sdd migrate` ja existe e realiza conversoes sobre discovery, backlog, tech debt e arquivos markdown.
  - A base passou por consolidacao recente e os checks atuais estao saudaveis.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Compatibilidade sem enforcement vira zona cinzenta permanente.
  - O usuario pode continuar trabalhando sobre estado parcialmente legado sem perceber.
  - Mudancas novas podem nascer em cima de um historico nao totalmente normalizado.
  - A missao nova exige explicitamente migracao sem operacao manual e bloqueio do fluxo quando necessario.

### B critica A
- Riscos concretos:
  - Um gate mandatória mal desenhado pode travar repositórios antigos sem rota clara de recuperacao.
  - Migracao total de historico pode tocar arquivos derivados, YAML, markdowns e possivelmente artefatos archived com alto volume.
  - O rollout precisa ser idempotente, auditavel e reversivel para nao comprometer confianca.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 | 5 | 2 | 2 |
| Complexidade de implementacao | 2 | 3 | 5 | 5 |
| Risco tecnico | 3 | 4 | 2 | 1 |
| Custo operacional | 2 | 4 | 2 | 1 |
| Tempo de entrega | 2 | 3 | 5 | 5 |
| Preservacao do historico | 3 | 5 | 2 | 1 |
| Confiabilidade do fluxo | 3 | 5 | 2 | 1 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): A
- Justificativa: O estado atual mostra maturidade parcial, mas nao completude. O repositório ja possui base para a transicao semantica (`EPIC`, quatro digitos, aliases, checks e migrador inicial), porem ainda nao possui o mecanismo mandatário de migracao no primeiro comando nem um protocolo de bloqueio do fluxo diante de legado pendente. Para cumprir a missao, a maturidade desejada nao e "suporta migrar", e sim "obriga migrar antes de seguir". Isso pede preflight global, versionamento de estado, idempotencia, auditoria e cobertura do historico inteiro.
- Riscos aceitos:
  - A implementacao vai exigir um ciclo adicional de hardening.
  - Pode haver impacto em testes, views derivadas, arquivos archived e docs sincronizadas.
  - Vai ser necessario definir UX para modo interativo e nao interativo.
- Condicoes de reversao:
  - Se o migrador completo nao conseguir garantir idempotencia e preservacao integral do historico, o gate nao deve entrar em modo obrigatorio.
  - Se houver risco de corromper repositorios existentes, manter a migracao em modo assistido apenas ate cobrir rollback/auditoria.

## 8) Saida
- APPROVED -> abrir um novo EPIC focado em `migracao mandatória de estado SDD`, cobrindo:
  - versionamento explicito do estado;
  - detector de formato legado;
  - migrador integral de historico e planos;
  - rename estrutural para `EPIC`;
  - enforcement de bloqueio no primeiro comando;
  - UX de confirmacao interativa e falha segura em modo nao interativo;
  - testes de migracao end-to-end e idempotencia.
- Estado de maturidade atual concluido neste debate:
  - Semantica canonica: parcial a alta.
  - Compatibilidade: alta.
  - Migracao automatica integral: baixa.
  - Enforcement mandatário: inexistente.
  - Completude frente a nova missao: insuficiente.

## Metadados
- Insight de origem: INS-0005
- Titulo do insight: Maturidade da migração mandatória do SDD
- Criado em: 2026-04-13T02:02:52.654Z
- Debate aberto em: 2026-04-13T02:03:05.282Z
