# Spec FEAT-0018

## Resumo
- Titulo: Adotar DevTrack Foundation API como backend padrão do OpenSDD
- Origem: direct
- Tipo: documentation
- Modo: direct_tasks
- Fluxo: rigoroso
- Etapa atual: execucao

## Gates
- Proposta: rascunho
- Planejamento: rascunho
- Tarefas: rascunho

## Objetivo
Mapear, documentar e organizar a adocao da `devtrack-foundation-api` como referencia oficial de backend para o OpenSDD, preparando uma implementacao futura limpa, incremental e sem drift entre repositorios.

## Contexto

Hoje o OpenSDD instala e materializa:
- estrutura base do runtime SDD;
- arquivos seed e prompts em `src/core/sdd/state.ts`;
- catalogo curado local em `src/core/sdd/default-skills.ts`;
- sincronizacao/materializacao de skills em `src/core/sdd/operations.ts`;
- bootstrap SDD em `src/core/sdd/init.ts`;
- bootstrap global `install/init` e perfis de workflow em `src/core/init.ts`, `src/core/profiles.ts` e `src/core/global-config.ts`.

Ao mesmo tempo, a `devtrack-foundation-api` ja concentra o contrato backend que queremos tornar padrao, incluindo:
- skills locais em `.sdd/skills/curated/`;
- catalogo canonico em `.sdd/state/skill-catalog.yaml`;
- contrato arquitetural em `AGENTS.md`, `AGENT.md` e `.sdd/core/*`;
- skill de bootstrap modular `foundation-project-bootstrap-sdd`;
- estrutura backend baseada em NestJS + TypeORM + camadas `domain/application/presentation/infrastructure/shared`.

O problema a resolver nao e "copiar um starter". O problema e definir uma fronteira sustentavel entre:
- canonico de backend: `devtrack-foundation-api`;
- distribuicao/bootstrap/profile/template: `devtrack-tools-opensdd`.

## Mapeamento do estado atual do OpenSDD

### Onde o kit padrao e definido
- `src/core/sdd/state.ts`
  - resolve paths, layout e arquivos seed;
  - cria estrutura `.sdd/*`;
  - grava templates/prompts/catalogos iniciais.
- `src/core/sdd/default-skills.ts`
  - define bundles curados default;
  - define skills locais nativas do bootstrap.

### Onde o bootstrap SDD e semeado
- `src/core/sdd/init.ts`
  - `ensureBaseStructure()`
  - `ensureBaseFiles()`
  - `bootstrapInitialContext()`
  - `SddSkillsSyncCommand().execute(..., { all: true })`

### Onde os profiles sao definidos hoje
- `src/core/profiles.ts`
  - perfis atuais: `core` e `custom`;
  - representam instalacao de workflows, nao perfis de backend.
- `src/core/global-config.ts`
  - persiste `profile` global do install.

### Onde a logica de `init/install` escolhe defaults
- `src/core/init.ts`
  - bootstrap global OpenSDD/OpenSpec;
  - selecao de workflows por profile;
  - migracao/cleanup e geracao de artefatos de tool integration.
- `src/core/sdd/init.ts`
  - defaults do runtime SDD propriamente dito.

### Onde skills e bundles padrao sao gerados/materializados
- `src/core/sdd/default-skills.ts`
  - definicao canônica do catalogo curado default do OpenSDD.
- `src/core/sdd/operations.ts`
  - sincroniza bundles e materializa skills locais em `.sdd/skills/curated/`.

## Mapeamento do que deve vir da Foundation API

### Deve permanecer canonico na Foundation
- skills `foundation-*` em `.sdd/skills/curated/`;
- bundles correlatos em `.sdd/state/skill-catalog.yaml`;
- contrato arquitetural backend (`AGENTS.md`, `AGENT.md`, `.sdd/core/*`);
- matriz de perfis e overlays do bootstrap modular;
- eventual starter backend real e scripts de scaffolding.

### Deve ser distribuido/materializado pelo OpenSDD
- selecao de profile backend orientada pela Foundation;
- seed documental para novos projetos derivados;
- ponte entre bootstrap OpenSDD e bundles/skills canonicos da Foundation;
- template/profile que torne a Foundation o default backend oficial sem mover a fonte canonica para este repositorio.

## Opcoes consideradas

### Opcao A - Somente seed documental e skills
- Vantagem: risco minimo.
- Limite: nao resolve bootstrap backend como padrao oficial.

### Opcao B - Kit backend estrutural no OpenSDD orientado pela Foundation
- Vantagem: permite oficializar um profile/backend default sem copiar toda a Foundation.
- Risco: precisa fronteira clara para nao transformar o OpenSDD em novo canonico.

### Opcao C - Starter backend real derivado da Foundation
- Vantagem: maior poder de bootstrap.
- Risco: maior chance de drift, acoplamento e duplicacao de ownership.

## Decisao arquitetural

Adotar a **Opcao B como alvo oficial da integracao**, com evolucao controlada:

1. **Fase de adocao imediata**
   - tratar a `devtrack-foundation-api` como fonte canonica de backend;
   - registrar essa fronteira na documentacao e no SDD do OpenSDD;
   - preparar um profile de distribuicao no OpenSDD.
2. **Fase de implementacao de baixo risco**
   - adicionar um profile backend explicito no OpenSDD, recomendado como `foundation-backend`;
   - esse profile passa a materializar contratos, bundles e seletores baseados na Foundation.
3. **Fase opcional posterior**
   - avaliar starter backend real derivado da Foundation apenas com politica clara de versionamento, importacao e sincronizacao.

## Fronteira entre os repositorios

### Continua exclusivo da Foundation API
- arquitetura backend canônica;
- skill `foundation-project-bootstrap-sdd` e skills `foundation-*`;
- bundles backend canonicos;
- regras de camadas, stack e scaffolding;
- starter backend real.

### Passa a ser responsabilidade do OpenSDD
- expor a Foundation como padrao oficial de backend na experiencia de bootstrap;
- oferecer profile/template de distribuicao para projetos novos;
- materializar seed documental e orquestrar a escolha de bundles/perfis;
- preservar retrocompatibilidade com o bootstrap atual.

## Profile proposto

### Nome recomendado
- `foundation-backend`

### Justificativa
- e semantico;
- deixa explicita a origem canonica;
- evita ambiguidade com `core/custom`, que hoje sao perfis de workflow e nao perfis de backend;
- abre caminho para futuros perfis sem esconder o ownership.

## Plano de integracao por etapas

1. Declarar a fronteira canonica e documentar o mapeamento atual.
2. Introduzir o conceito de profile backend sem alterar o profile atual de workflows.
3. Adicionar suporte a `foundation-backend` como profile de distribuicao.
4. Conectar esse profile a bundles/skills/documentos canonicos da Foundation.
5. Manter bootstrap atual como fallback/default legivel durante transicao.
6. Avaliar starter backend derivado apenas depois da distribuicao profile-based estabilizada.

## Criterios de aceite

- Existe mapeamento explicito do bootstrap atual do OpenSDD, com arquivos e responsabilidades.
- Existe mapeamento explicito dos ativos canonicos vindos da Foundation API.
- Existe decisao arquitetural registrada sobre o modelo de adocao.
- Existe plano incremental de baixo risco, sem quebra do bootstrap atual.
- Existe fronteira explicita entre canonico (Foundation) e distribuicao (OpenSDD).
- Existe proposta objetiva de profile backend para implementacao futura.
- Existe lista objetiva dos arquivos do OpenSDD a serem alterados na fase de implementacao.

## Refs
- Feature: FEAT-0018
- Acceptance refs: -
