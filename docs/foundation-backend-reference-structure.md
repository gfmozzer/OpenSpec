# Estrutura de Pacotes Derivada da DevTrack Foundation API

Este documento existe para tornar a referencia backend operavel dentro do OpenSDD sem criar um canonico paralelo.

## Status

- Tipo: referencia derivada
- Fonte canonica: `devtrack-foundation-api`
- Escopo: arvore de pacotes e subcamadas internas observadas em `src/`

## Regra de sincronizacao

- A fonte de verdade continua sendo `/Volumes/WORKSPACE/DEVTRACK_TOOLS/devtrack-foundation-api/src` e `/Volumes/WORKSPACE/DEVTRACK_TOOLS/devtrack-foundation-api/arquitetura.md`.
- Este arquivo nao define arquitetura por conta propria.
- Se houver conflito entre este documento e a Foundation, a Foundation vence.
- Qualquer atualizacao aqui deve ser feita a partir da leitura direta da Foundation, nunca por reinterpretacao livre.

## Arvore canonica detalhada

```text
src/
├── app.module.ts
├── main.ts
├── application/
│   ├── application.module.ts
│   ├── business/
│   │   ├── auth/
│   │   │   ├── ports/
│   │   │   │   ├── in/
│   │   │   │   └── out/
│   │   │   ├── services/
│   │   │   └── use-cases/
│   │   ├── aws-integrations/
│   │   │   ├── ports/
│   │   │   │   └── in/
│   │   │   ├── services/
│   │   │   └── use-cases/
│   │   ├── files/
│   │   │   ├── ports/
│   │   │   │   ├── in/
│   │   │   │   └── out/
│   │   │   └── use-cases/
│   │   ├── integrations/
│   │   │   ├── handlers/
│   │   │   ├── ports/
│   │   │   │   ├── in/
│   │   │   │   └── out/
│   │   │   └── use-cases/
│   │   ├── knowledge/
│   │   │   ├── ports/
│   │   │   │   ├── in/
│   │   │   │   └── out/
│   │   │   └── use-cases/
│   │   ├── notifications/
│   │   │   ├── ports/
│   │   │   │   ├── in/
│   │   │   │   └── out/
│   │   │   └── use-cases/
│   │   ├── pessoas/
│   │   │   ├── handlers/
│   │   │   ├── ports/
│   │   │   │   ├── in/
│   │   │   │   └── out/
│   │   │   └── use-cases/
│   │   └── wallets/
│   │       ├── ports/
│   │       │   ├── in/
│   │       │   └── out/
│   │       └── use-cases/
│   └── intelligence/
│       └── agents/
│           ├── chat/
│           │   ├── nodes/
│           │   └── providers/
│           ├── customer-support/
│           │   └── nodes/
│           ├── researcher/
│           └── tools/
├── domain/
│   ├── auth/
│   │   ├── repository-ports/
│   │   └── types/
│   ├── files/
│   │   └── types/
│   ├── integrations/
│   │   └── types/
│   ├── knowledge/
│   │   └── types/
│   ├── notifications/
│   │   ├── constants/
│   │   └── types/
│   ├── pessoas/
│   │   ├── entities/
│   │   ├── events/
│   │   ├── repository-ports/
│   │   ├── types/
│   │   └── validators/
│   └── wallets/
│       ├── entities/
│       ├── repository-ports/
│       ├── types/
│       └── validators/
├── infrastructure/
│   ├── infrastructure.module.ts
│   └── adapters/
│       ├── auth/
│       ├── aws/
│       │   ├── cloudwatch/
│       │   ├── eventbridge/
│       │   ├── s3/
│       │   ├── scheduler/
│       │   ├── secrets-manager/
│       │   ├── ses/
│       │   ├── sns/
│       │   └── sqs/
│       ├── cache/
│       ├── http/
│       ├── llm/
│       │   ├── anthropic/
│       │   ├── gemini/
│       │   └── openai/
│       ├── orm/
│       │   ├── entities/
│       │   ├── mappers/
│       │   ├── migrations/
│       │   └── repositories/
│       ├── queue/
│       ├── redis/
│       ├── sync-engine/
│       ├── temporal/
│       │   └── workflows/
│       └── vector-store/
├── presentation/
│   ├── presentation.module.ts
│   ├── cli/
│   │   └── pessoas/
│   │       └── commands/
│   ├── graphql/
│   │   ├── guards/
│   │   └── pessoas/
│   │       ├── resolvers/
│   │       └── types/
│   ├── rest/
│   │   ├── auth/
│   │   │   ├── controllers/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   └── presentation-validators/
│   │   ├── aws-integrations/
│   │   │   ├── controllers/
│   │   │   └── presentation-validators/
│   │   ├── files/
│   │   │   ├── controllers/
│   │   │   └── presentation-validators/
│   │   ├── integrations/
│   │   │   ├── controllers/
│   │   │   └── presentation-validators/
│   │   ├── knowledge/
│   │   │   ├── controllers/
│   │   │   └── presentation-validators/
│   │   ├── notifications/
│   │   │   ├── controllers/
│   │   │   └── presentation-validators/
│   │   ├── pessoas/
│   │   │   ├── controllers/
│   │   │   └── presentation-validators/
│   │   └── wallets/
│   │       ├── controllers/
│   │       └── presentation-validators/
│   └── websocket/
│       └── dtos/
└── shared/
    ├── agent/
    │   ├── annotations/
    │   ├── factories/
    │   ├── guards/
    │   └── ports/
    ├── domain/
    │   ├── configuration/
    │   ├── exceptions/
    │   ├── types/
    │   └── value-objects/
    ├── infrastructure/
    │   ├── adapter/
    │   │   ├── auth/
    │   │   ├── aws/
    │   │   ├── cache/
    │   │   ├── http/
    │   │   ├── llm/
    │   │   ├── orm/
    │   │   ├── queue/
    │   │   ├── redis/
    │   │   ├── sync-engine/
    │   │   ├── temporal/
    │   │   └── vector-store/
    │   └── configuration/
    └── presentation/
        ├── dtos/
        ├── filters/
        └── validators/
```

## Padroes internos recorrentes por camada

### `application/business/<modulo>`

- `ports/in`: contratos de entrada para casos de uso e fluxos aplicacionais.
- `ports/out`: contratos de saida para dependencias externas ou modulos adjacentes.
- `use-cases`: orquestracao principal do modulo.
- `services`: servicos de aplicacao complementares, produtores ou coordenadores.
- `handlers`: tratamento de eventos ou mensagens quando o modulo possui fluxo assincrono.

### `application/intelligence/agents`

- `nodes`: passos internos de grafos e fluxos de agente.
- `providers`: adaptacao de provedores de modelo quando o agente precisa alternancia/configuracao por provider.
- `tools`: ferramentas usadas pelos agentes.

### `domain/<modulo>`

- `entities`: entidades de negocio.
- `events`: eventos de dominio.
- `repository-ports`: contratos de persistencia.
- `types`: tipos canonicos do dominio.
- `validators`: regras explicitas de validacao.
- `constants`: constantes de negocio quando necessario.

### `presentation/rest/<modulo>`

- `controllers`: ponto de entrada HTTP.
- `presentation-validators`: validacao de payload e contrato de borda.
- `guards`: autenticacao/autorizacao quando o modulo exige protecao.
- `decorators`: decoradores de apresentacao quando o modulo usa anotacoes customizadas.

### `presentation/graphql/<modulo>`

- `resolvers`: entrada GraphQL.
- `types`: tipos GraphQL expostos.
- `guards`: protecao transversal do canal.

### `presentation/cli/<modulo>`

- `commands`: comandos de linha de comando por modulo.

### `presentation/websocket`

- `dtos`: contratos de entrada/saida do canal realtime.

### `infrastructure/adapters`

- `aws/*`: adapters especializados por servico AWS.
- `llm/*`: adapters especializados por provider.
- `orm/entities|mappers|migrations|repositories`: persistencia relacional e traducao entre dominio e banco.
- `temporal/workflows`: workflows duraveis.
- `vector-store`: persistencia e busca vetorial.

### `shared`

- `shared/agent`: primitives reutilizaveis de agentes.
- `shared/domain`: tipos basicos, configuracao, excecoes e value objects compartilhados.
- `shared/infrastructure/adapter`: contratos base de adapters transversais.
- `shared/presentation`: DTOs, filtros e validadores reaproveitaveis na borda.

## Leitura canonica rapida

- `domain`: negocio puro e contratos centrais.
- `application`: casos de uso, portas e orquestracao.
- `presentation`: todos os canais de entrada.
- `infrastructure`: implementacoes concretas de integracao e persistencia.
- `shared`: blocos cross-cutting reutilizaveis.

## Uso no OpenSDD

Esta estrutura deve ser usada como referencia explicita para:

- definicao de `foundation-backend` como profile de distribuicao;
- prompts e templates backend com exemplo estrutural real;
- checks semanticos de pastas, pacotes e nomenclatura;
- ADR obrigatorio quando houver desvio estrutural relevante.
