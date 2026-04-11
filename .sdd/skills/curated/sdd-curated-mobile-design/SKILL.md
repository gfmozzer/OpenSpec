---
name: mobile-design
description: Diretrizes oficiais e operacionais para apps Flutter com arquitetura escalavel, offline-first, acessibilidade, testes e performance.
---

# Mobile Design e Engenharia Flutter

## Contexto
- Dominios: frontend, mobile, flutter
- Fases: plan, execute, verify

## Instrucoes
Use esta skill quando o trabalho envolver app mobile em Flutter, especialmente quando precisarmos definir ou revisar:

- arquitetura por feature
- fluxo de dados entre UI, dominio, repositorios e APIs
- navegacao, deep links e experiencia mobile
- design system e acessibilidade
- testes, observabilidade e performance

Esta skill foi consolidada a partir de:

- documentacao oficial do Flutter em `docs.flutter.dev`
- guias oficiais do Dart em `dart.dev`
- arquitetura de referencia do app `memory-lane-app`

## Objetivo

Garantir um padrao unico e consistente para desenvolvimento mobile com Flutter no ecossistema SDD, cobrindo:

- front-end mobile
- integracao com back-end
- fluxo de dados completo
- operacao offline-first
- qualidade visual e acessibilidade
- testes e performance de producao

## Principios canonicos

### P1. Arquitetura guiada por separacao de responsabilidades

Siga a recomendacao oficial do Flutter de separar a aplicacao em camadas com responsabilidades claras:

- `UI layer`
  - `Views`
  - `ViewModels`
- `Data layer`
  - `Repositories`
  - `Services`
- `Domain layer`
  - opcional, mas obrigatoria quando a logica de negocio crescer ou for reutilizada

Regra operacional:

- cada feature deve ter fronteiras claras
- a UI nao conversa direto com API, banco local ou SDKs de infraestrutura
- logica de apresentacao fica em `ViewModel` ou provider equivalente
- logica de negocio compartilhada ou complexa vai para `use cases`

## Estrutura recomendada

```text
lib/
  core/
    errors/
    network/
    routing/
    sync/
    theme/
    widgets/
  features/
    <feature>/
      presentation/
        views/
        viewmodels/
        widgets/
      domain/
        entities/
        repositories/
        usecases/
      data/
        models/
        repositories/
        services/
        mappers/
```

### P2. Repositorios sao a source of truth

O guia oficial de arquitetura do Flutter recomenda explicitamente que repositories sejam a source of truth dos dados de modelo.

Regra operacional:

- toda leitura de negocio passa por repository
- repository encapsula cache, retry, tratamento de erro e transformacao
- services apenas acessam fontes externas ou locais
- repositories nunca dependem uns dos outros
- quando houver composicao entre multiplos repositories, resolva em `ViewModel` ou `UseCase`

### P3. Estado efemero e estado de aplicacao nao podem ser misturados sem criterio

Adote a distincao oficial do Flutter:

- `ephemeral state`
  - local ao widget
  - pode usar `StatefulWidget` e `setState()`
  - exemplos: aba atual, pagina atual, animacao em andamento
- `app state`
  - compartilhado entre telas ou persistido entre sessoes
  - exemplos: autenticacao, preferencias, carrinho, filtros persistidos, sincronizacao

Regra operacional:

- se o estado so importa para um widget, mantenha local
- se o estado precisa sobreviver a reconstrucao, navegar entre telas ou sincronizar com dados, promova para provider/viewmodel
- a escolha entre estado local e compartilhado deve ser revisitada quando a feature crescer

### P4. Offline-first e sincronizacao eventual sao padrao

Para apps mobile de produto, use o padrao oficial de `offline-first`.

Fluxo recomendado:

1. UI solicita dados ao `ViewModel`
2. `ViewModel` consulta `Repository`
3. `Repository` le do armazenamento local primeiro
4. `Repository` sincroniza com remoto em background quando fizer sentido
5. alteracoes locais persistem imediatamente e entram em fila de sync quando estiver offline

Regras obrigatorias:

- features com dados remotos devem ter estrategia local
- leitura prioriza resposta rapida local
- escrita deve ser desenhada para tolerancia a rede intermitente
- conflitos de sync precisam ter regra explicita
- erro de rede nao pode destruir estado local valido

### P5. Navegacao moderna, declarativa e pronta para deep link

Quando houver fluxo real de produto, use `MaterialApp.router` com roteamento declarativo.

Base recomendada:

- `go_router` e aceitavel como padrao porque o proprio time do Flutter o mantem para cenarios de roteamento mais complexos

Regras obrigatorias:

- rotas nomeadas ou tipadas por feature
- navegacao centralizada em `core/routing/`
- suporte a deep links desde o desenho da feature
- guards de autenticacao e onboarding devem ficar na camada de roteamento, nao espalhados pela UI
- argumentos de rota devem ser explicitos e testaveis

### P6. Design system mobile e acessibilidade sao parte da arquitetura

Todo app Flutter deve ter tokens e componentes reutilizaveis.

Estrutura minima:

- `app_theme.dart`
- `app_colors.dart`
- `app_typography.dart`
- `app_spacing.dart`
- `core/widgets/`

Regras obrigatorias:

- nada de cores hardcoded em feature
- nada de `TextStyle` inline repetido
- componentes interativos com alvo minimo de `48x48dp`
- contraste alinhado a `WCAG 2`
- suporte a `TalkBack` e `VoiceOver`
- usar `Semantics` quando o significado nao for inferivel automaticamente
- preferencia de tema do usuario deve ser persistivel

### P7. Testes seguem a piramide oficial do Flutter

O Flutter recomenda combinar:

- `unit tests`
- `widget tests`
- `integration tests`

Padrao operacional:

- muitos testes unitarios e de widget
- testes de integracao apenas para jornadas criticas
- cobertura por si so nao substitui qualidade de casos

Meta recomendada para projetos de produto:

- `domain`: 100%
- `data/core`: >= 95%
- `viewmodels/providers`: >= 95%
- `widgets` criticos: >= 80%
- fluxos criticos: ao menos 1 teste de integracao por jornada central

Checklist minimo por feature:

- sucesso
- vazio
- erro
- retry
- loading
- offline
- restauracao ou persistencia quando aplicavel

### P8. Performance deve ser tratada no desenvolvimento, nao so no fim

Aplicar as recomendacoes oficiais de performance do Flutter:

- controlar custo de `build()`
- usar `const` sempre que possivel
- preferir widgets reutilizaveis em vez de helper functions para subarvores importantes
- evitar operacoes graficas caras sem necessidade, como `saveLayer()`
- minimizar rebuilds desnecessarios

Regras operacionais:

- provider/viewmodel nao deve causar rebuild global de tela por mudanca local
- listas e grids devem ser pensadas para grande volume
- parsing pesado deve sair da UI thread quando necessario
- animacoes devem manter subtree estavel sempre que possivel

### P9. Estilo Dart oficial e analise estatica forte

Adote `Effective Dart` como baseline:

- tipos em `UpperCamelCase`
- outros identificadores em `lowerCamelCase`
- arquivos e diretorios em `lowercase_with_underscores`
- `dart:` antes de outros imports
- `package:` antes de imports relativos
- `dart format` obrigatorio

Convencoes adicionais recomendadas neste ecossistema:

- `flutter_lints` ativo
- `always_use_package_imports` como regra de projeto quando o app crescer
- `analysis_options.yaml` tratado como contrato de qualidade

## Stack recomendada

Esta skill nao obriga um pacote unico, mas a combinacao abaixo e a referencia atual mais segura para apps Flutter de produto no ecossistema SDD:

- estado de app: `Riverpod`
- DI e servicos infra: `GetIt` ou container equivalente
- navegacao: `go_router`
- serializacao e sealed types: `freezed` e `json_serializable`
- persistencia local leve: `Hive` ou alternativa equivalente claramente justificada
- conectividade e fila de sync: abstraidas em `core/network` e `core/sync`

Regra:

- qualquer troca de stack precisa preservar os principios desta skill
- escolha de biblioteca nunca pode degradar testabilidade ou separacao de camadas

## Contrato de implementacao por feature

Ao criar ou revisar uma feature Flutter, valide se existe:

1. `View` com composicao clara e widgets menores
2. `ViewModel` ou provider com UI state explicito
3. `Domain entity` sem dependencias de Flutter
4. `Repository interface` no domain
5. `Repository implementation` no data
6. `Services` para remoto/local
7. `Mapper` entre DTO/model e entity
8. testes unitarios do dominio
9. testes do estado de apresentacao
10. widget tests do comportamento visivel

## Contrato de integracao com backend

Para que mobile, frontend e backend mantenham consistencia de dados:

- DTO remoto nao e entity de dominio
- entity de dominio nao e model de persistencia
- toda borda precisa de mapper explicito
- erros de API devem ser normalizados em failures de dominio ou aplicacao
- contratos de autenticacao, refresh token, sincronizacao e paginacao precisam estar documentados
- eventos e estados de sync precisam ser observaveis na UI

## Fluxos obrigatorios

### Fluxo de leitura

`View -> ViewModel -> UseCase? -> Repository -> local/remoto`

### Fluxo de escrita

`View -> command/action -> ViewModel -> UseCase? -> Repository -> persistencia local -> sync remoto`

### Fluxo de erro

`Service error -> Repository normalization -> Failure/AppError -> ViewModel state -> UI feedback`

### Fluxo de autenticacao

- sessao carregada no bootstrap
- guard de rota centralizado
- renovacao de credencial desacoplada de tela
- logout limpa estado local sensivel

## Anti-patterns proibidos

- chamar API diretamente da UI
- usar widget como deposito de regra de negocio
- usar modelo remoto como modelo de tela sem mapeamento
- colocar logica de sync em widget
- depender de `setState()` para estado compartilhado
- misturar tema, navegacao e regra de negocio no mesmo arquivo
- hardcode de cor, espaco, copy tecnica ou endpoint em widget
- criar componentizacao sem semantica ou sem acessibilidade

## Criterios de revisao

Ao revisar um app Flutter, pergunte:

- a feature respeita as fronteiras entre presentation, domain e data?
- o estado foi classificado corretamente entre efemero e de aplicacao?
- repository realmente centraliza a verdade dos dados?
- a feature funciona offline de forma coerente?
- o roteamento suporta deep link e guardas?
- a UI e acessivel para scanner e leitor de tela?
- ha teste suficiente no nivel certo?
- a tela evita rebuilds e custos desnecessarios?

## Uso com o app de referencia

Quando houver duvida de aplicacao concreta, use `/Volumes/WORKSPACE/MEMORY_LANE/repos/memory-lane-app` como referencia arquitetural para:

- organizacao feature-first
- offline-first
- design system Flutter
- thresholds de qualidade e testes

Se houver conflito entre o app de referencia e a documentacao oficial:

- a documentacao oficial do Flutter/Dart vence
- o app de referencia deve ser adaptado, nao copiado cegamente
