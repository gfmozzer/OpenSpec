# AI Context

## Estado ativo
- Data: 2026-04-12
- Objetivo: auditar profundamente os quatro debates SDD, concluir as features derivadas e reconciliar o estado persistido para deixar o repositório pronto para o próximo ciclo.
- Status: concluido

## Decisoes persistidas
- A auditoria confirmou que `DEB-001` foi implementado de forma substancial, mas com incoerencia historica no workspace: `FEAT-001` estava `DONE` no backlog e ainda permanecia em `.sdd/active/`. Isso foi corrigido para `.sdd/archived/FEAT-001`, com ajuste do backlog para refletir consolidacao.
- `DEB-002`, `DEB-003` e `DEB-004` nao estavam totalmente implementados, apesar de o estado anterior sugerir encerramento.
- O estado correto ficou:
  - `EPIC-0001` em `SPLIT`, com `FEAT-0002` concluida e `FEAT-0008` criada para concluir a normalizacao de `EPIC` como termo canonico em interfaces e documentacao do SDD.
  - `EPIC-0002` em `SPLIT`, com `FEAT-0003` concluida e `FEAT-0007` criada para concluir a transicao documentada para IDs SDD canonicos de quatro digitos.
  - `EPIC-0003` em `SPLIT`, com `FEAT-0004` concluida e `FEAT-0005`/`FEAT-0006` criadas para cobrir coerencia entre estado logico/fisico e centralizacao das lentes/transicoes.
- `FEAT-0002`, `FEAT-0003` e `FEAT-0004` continuam validas como entregas parciais, mas nao mais representam sozinhas o fechamento integral de seus debates de origem.
- As `FEAT-0005`, `FEAT-0006`, `FEAT-0007` e `FEAT-0008` foram executadas, arquivadas e reconciliadas no estado YAML.
- Houve uma corrida de persistencia ao finalizar features em paralelo: `FEAT-0006` e `FEAT-0008` ficaram com workspace arquivado, mas ainda marcadas como `IN_PROGRESS` no backlog. O estado foi corrigido serialmente para `DONE`, com `finalize-queue` alinhada.
- O `sdd check --render --json` final ficou sem avisos, com progresso global `8/8` features concluidas e nenhuma pendencia pronta, bloqueada ou em conflito em `sdd next --json`.
- Foram adicionados guardrails reais no codigo para evitar reincidencia: reutilizacao segura de `change_name`, sanitizacao de nomes truncados, validacao de coerencia entre backlog e workspaces ativos/arquivados e transicoes centrais mais consistentes.

## Observacoes operacionais
- A base ja suporta `EPIC-####`, alias legados e padding de quatro digitos, mas ainda havia lacunas reais em documentacao, exemplos, mensagens e enforcement estrutural.
- O `sdd check --render --json` passou apos a regularizacao e as visoes derivadas foram renderizadas de novo com o estado auditado.
- As `FEAT-0005`, `FEAT-0006`, `FEAT-0007` e `FEAT-0008` foram arquivadas com seus artefatos historicos preservados em `.sdd/archived/`.
- Erros de telemetria/PostHog observados durante a execucao foram apenas falhas de rede do ambiente e nao afetaram o estado YAML local.
- O repositório ficou operacionalmente limpo do ponto de vista SDD: sem backlog executavel, sem inconsistencias estruturais e com as views derivadas renderizadas novamente.
- No fechamento tecnico do ciclo, o `init` passou a paralelizar a geracao de skills/comandos com `Promise.all`, reduzindo tempo de execucao sem alterar o comportamento funcional.
- O instalador zsh deixou de confiar cegamente em `process.env.ZSH`: agora ele so considera Oh My Zsh instalado quando o caminho bate com `homeDir/.oh-my-zsh`, evitando falso-positivo em ambientes de teste.
- A telemetry foi blindada para testes: subprocessos Vitest agora desabilitam analytics por padrao e o helper `runCLI` tambem injeta `OPENSPEC_TELEMETRY=0`, evitando timeouts de CLI causados por flush de PostHog.
- O `shutdown()` de telemetry ganhou timeout curto para nao bloquear encerramento da CLI quando houver rede indisponivel.

## Atualizacao 2026-04-12/13
- Foi aberto o ciclo de discovery `INS-0005` -> `DEB-0005` para avaliar a maturidade e a completude da migracao mandatória do SDD.
- Conclusao provisoria registrada no debate: o repositório ja possui base forte de compatibilidade e normalizacao (`EPIC`, aliases, quatro digitos e migrador parcial), mas ainda nao implementa o requisito novo de migracao automatica obrigatoria no primeiro comando com bloqueio do fluxo quando houver estado legado.
- O mecanismo atual de `src/core/sdd/migrate.ts` e util, mas parcial: cobre sobretudo `RAD-* -> EPIC-*` e refs correlatas, sem versionamento formal do estado SDD nem enforcement global em `start/context/onboard/next/check`.
- Consolidacao operacional da `FEAT-0009` concluida: a gate mandatória de migracao SDD foi implementada nos fluxos operacionais, o bootstrap passou a nascer com `state_version: 2`, a suite de migracao/gate foi adicionada, e o repositório passou em `node dist/cli/index.js sdd check --render --json` com `valid: true`, sem erros/warnings, `documentation_sync: true`, `core_views_stale: false` e nenhuma pendencia de frontend.

## Proximo ponto de atencao
- Se houver novo trabalho, iniciar a partir de novas descobertas/backlog; nao restaram features pendentes abertas no ciclo atual.

## Atualizacao 2026-04-13
- Foi aberto o ciclo `INS-0006` -> `DEB-0006` -> `EPIC-0006` -> `FEAT-0010` com foco explicito em elevar o nivel de qualidade automatizada e maximizar a cobertura viavel sem criar uma meta artificial desconectada do ROI tecnico.
- A decisao operacional adotada foi priorizar testes de alto valor sobre caminhos hoje subcobertos, especialmente em validacao SDD e comandos CLI, em vez de perseguir 95%+ globais a qualquer custo com cenarios de baixo retorno.
- Foi adicionada a dependencia de cobertura `@vitest/coverage-v8` para estabilizar a execucao de `pnpm run test:coverage` no workspace atual.
- Foram adicionados testes direcionados para `src/core/sdd/transition-engine.ts`, `src/utils/item-discovery.ts`, casos de borda de `src/core/validation/validator.ts` e cobertura direta dos comandos-fonte em `src/commands/show.ts`, `src/commands/spec.ts` e `src/commands/validate.ts`.
- Evidencia final desta rodada: `pnpm run test:coverage` aprovado com 78 arquivos / 1419 testes passando e cobertura global em `72.21%` statements, `72.21%` lines, `80.57%` branches e `95.35%` functions; `pnpm run lint` e `pnpm run build` tambem passaram.
- Gap residual honesto: ainda existem wrappers/entrypoints CLI com baixa cobertura (`src/commands/schema.ts`, `src/commands/sdd.ts`, `src/cli/index.ts` e modulos de workflow), mas a proxima iteracao nesses pontos tende a ter custo bem maior e menor retorno imediato do que os incrementos entregues nesta feature.

## Atualizacao 2026-04-13/2
- Foi aberto o ciclo de discovery `INS-0007` -> `DEB-0007` -> `EPIC-0007` para mapear sistematicamente as lacunas restantes de cobertura e transformar o proximo incremento em um plano guiado por risco comportamental e ROI de instrumentacao.
- A matriz derivada do debate consolidou como hotspots reais, nesta ordem, `src/commands/validate.ts`, `src/commands/spec.ts`, `src/commands/change.ts` e `src/utils/match.ts`; wrappers com `0%` nominal so entram depois, porque hoje oferecem menos retorno tecnico por teste escrito.
- Foram adicionados testes diretos em `test/commands/source-commands.test.ts` cobrindo cenarios de erro, ambiguidade, bulk validation e ramos adicionais de `SpecCommand`, `ValidateCommand` e `ChangeCommand`, alem de uma nova suite `test/utils/match.test.ts` para `levenshtein` e `nearestMatches`.
- Os testes novos passaram isoladamente com `pnpm test test/commands/source-commands.test.ts` e `pnpm test test/utils/match.test.ts`, confirmando ganho funcional sem regressao imediata nas areas atacadas.
- A tentativa de rerodar `pnpm run test:coverage` na suite completa mostrou um segundo problema operacional alem da lacuna de testes: sob instrumentacao, alguns testes lentos precisam `testTimeout` maior e o run completo ainda pode ficar preso no teardown/finalizacao mesmo quando os blocos pesados concluem.
- Decisao persistida: a proxima iteracao deve combinar duas frentes explicitas, sem misturar objetivos. Frente 1: ampliar cobertura dirigida dos hotspots de maior ROI. Frente 2: endurecer a rotina de coverage completa para virar uma metrica confiavel de CI/local, ajustando timeout/teardown antes de usar o percentual global como sinal principal de progresso.

## Atualizacao 2026-04-13/3
- Foi corrigida uma regressao de bootstrap do SDD em projetos novos: o `sdd init` ainda materializava a pasta legada `3-radar` ao mesmo tempo em que criava a pasta canônica `3-epic`.
- A causa raiz estava em `src/core/sdd/state.ts`: `resolveSddPaths()` ainda resolvia `discoveryRadarDir` para um caminho físico distinto (`3-radar`) e `ensureBaseStructure()` criava ambas as pastas.
- Decisao aplicada: `discoveryRadarDir` passa a ser apenas alias interno para `discoveryEpicDir`, preservando compatibilidade de código sem continuar propagando a estrutura legada em novos projetos.
- Foram adicionadas assercoes em `test/core/sdd-init.test.ts` para garantir explicitamente que `3-epic` exista e `3-radar` nao seja criado, tanto no layout `legacy` quanto no `pt-BR`.
- Evidencia de validacao desta correção:
  - `pnpm test test/core/sdd-init.test.ts` aprovado.
  - `pnpm run build` aprovado.
  - verificacao manual via `node dist/cli/index.js sdd init --no-render` em diretório temporário confirmou que um projeto novo gera apenas `.sdd/discovery/3-epic`.

## Atualizacao 2026-04-13/4
- Foram adicionados dois scripts de manutencao local ao `package.json`: `cleanup` e `cleanup:install`.
- A implementacao central ficou em `scripts/cleanup.mjs`, com dois modos:
  - `build`: remove sobras locais de compilacao/teste (`dist/`, `coverage/`, `.cache/`, `.vite/`, `.vitest/`, `.eslintcache`, `*.tsbuildinfo` e logs de falha como `pnpm-debug.log`).
  - `install`: executa a limpeza acima e tambem remove `node_modules/` e lockfiles locais (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock*`, `npm-shrinkwrap.json`) para recomeçar uma instalacao limpa.
- Foi adicionada cobertura focada em `test/scripts/cleanup.test.ts` para garantir que o modo padrao nao apague `node_modules`/locks indevidamente e que o modo `install` remova os alvos agressivos esperados.
- A documentacao principal (`README.md`) passou a expor os novos atalhos como parte do fluxo de desenvolvimento local.
- Evidencia desta rodada:
  - `pnpm test test/scripts/cleanup.test.ts` aprovado.
  - `pnpm run build` aprovado.

## Atualizacao 2026-04-13/5
- Foi executada uma rodada de refresh de dependencias guiada por `pnpm outdated` e validada com consulta pontual ao Context7 para reduzir risco em upgrades sensiveis (`vitest`, `typescript-eslint` e `@inquirer/prompts`).
- A maior parte das libs foi atualizada para a versao relevante mais atual compativel com o projeto, incluindo `typescript@6`, `typescript-eslint@8.58.2`, `@inquirer/core@11`, `@inquirer/prompts@8`, `chalk@5.6.2`, `commander@14.0.3`, `ora@9.3.0`, `posthog-node@5.29.2`, `yaml@2.8.3` e `zod@4.3.6`.
- O upgrade de `@inquirer/prompts` exigiu um ajuste real de API: a opcao `instructions` deixou de ser aceita no `checkbox`, entao a instrucao foi embutida diretamente na `message` em `src/commands/config.ts`, com teste atualizado para refletir o comportamento novo.
- `Vitest` chegou a ser avaliado em `v4`, mas a rodada foi deliberadamente recuada para `v3.2.4` porque a execucao local passou a falhar antes mesmo dos testes do projeto com erro de resolucao interna (`ERR_MODULE_NOT_FOUND` envolvendo `@vitest/utils/helpers`), caracterizando risco de toolchain maior do que o beneficio imediato.
- Decisao persistida: manter `Vitest` na major estavel ja validada pelo repositorio e absorver os demais upgrades de baixo risco agora; a migracao para `Vitest 4` deve voltar apenas quando o runtime estiver verificadamente estavel neste ambiente/ecossistema.
- Evidencia final desta rodada:
  - `pnpm install` aprovado.
  - `pnpm run build` aprovado.
  - `pnpm run lint` aprovado.
  - `pnpm test` aprovado com `80` arquivos / `1431` testes passando.

## Atualizacao 2026-04-13/6
- Foi aberta e organizada a `FEAT-0018` para mapear a adocao da `devtrack-foundation-api` como referencia oficial de backend do OpenSDD sem implementacao ad hoc no codigo.
- Decisao arquitetural persistida: a `devtrack-foundation-api` permanece fonte canonica de arquitetura, skills `foundation-*`, bundles, contratos operacionais e eventual starter backend; o `devtrack-tools-opensdd` passa a ser apenas a camada de distribuicao/bootstrap/profile/template que materializa essa referencia em projetos derivados.
- A adocao recomendada para a proxima fase ficou em tres etapas de baixo risco:
  - fase 1: seed documental e curadoria SDD orientada pela Foundation;
  - fase 2: profile de distribuicao `foundation-backend` no OpenSDD para materializar contratos, bundles e seletores de bootstrap;
  - fase 3: starter backend real derivado da Foundation apenas quando houver regra clara de sincronizacao e versionamento para evitar drift.
- Risco central registrado: copiar skills, bundles ou starter da Foundation para o OpenSDD antes de definir fronteira/versionamento criaria duplicacao canonica e drift entre repositorios.
- Outro risco relevante: o termo `profile` hoje no OpenSDD representa perfil de instalacao de workflows (`core`/`custom`) e nao perfil de backend; a implementacao futura deve separar claramente esses conceitos para nao quebrar UX nem configuracao existente.

## Atualizacao 2026-04-14
- Nova regra operacional definida pelo usuario para o proximo ciclo de execucao sequencial das features `FEAT-0012` a `FEAT-0017`.
- Antes de iniciar a proxima feature na fila, a feature corrente deve obrigatoriamente:
  - estar implementada;
  - ter todos os status SDD reconciliados (`backlog`, `active/archived`, `finalize-queue`, impacto frontend e memoria/finalize quando aplicavel);
  - ter cobertura de testes minima de `95%` nos artefatos tocados pela propria feature.
- Interpretacao adotada para compatibilizar com decisoes anteriores: a exigencia de `95%` vale por artefato/escopo da feature corrente, e nao como meta global do repositorio inteiro.
- Ordem sequencial preferencial mantida, agora sob gate de finalizacao + cobertura por feature: `FEAT-0012` -> `FEAT-0014` -> `FEAT-0015` -> `FEAT-0013` -> `FEAT-0016` -> `FEAT-0017`.

## Atualizacao 2026-04-14/2
- Foi endurecida a fronteira estrutural do OpenSDD para impedir desvios de diretório como `.sdd/backlog/features`.
- Decisao aplicada: `openspec/config.yaml` agora aceita apenas nomes de pasta canonicos por `layout` para `discovery`, `planning`, `skills`, `templates`, `deposito`, `active` e `archived`.
- Para `layout=legacy`, o diretório de planejamento permitido passa a ser somente `pendencias`; para `layout=pt-BR`, somente `planejamento`.
- O `sdd check` agora falha explicitamente quando encontra estruturas nao canonicas dentro de `.sdd`, incluindo `.sdd/backlog` e `.sdd/backlog/features`.
- Evidencia local desta rodada:
  - `pnpm test test/core/sdd-check.test.ts test/core/sdd-init.test.ts` aprovado.
  - `pnpm build` aprovado.
