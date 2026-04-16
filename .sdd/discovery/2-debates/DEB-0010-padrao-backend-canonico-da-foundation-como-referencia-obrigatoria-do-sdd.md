# Debate DEB-0010

## 1) Pergunta de decisao (obrigatorio)
Decidir se o OpenSDD deve tratar a arquitetura completa da `devtrack-foundation-api` como contrato backend obrigatório de referência, em vez de usar apenas diretrizes genéricas de backend, para reduzir erros arquiteturais pequenos, recorrentes e cumulativos nos projetos derivados.

## 2) Criterios de decisao (obrigatorio)
- Impacto na qualidade estrutural dos projetos
- Clareza para humanos e agentes
- Risco de drift entre repositórios
- Custo de manutenção do contrato
- Velocidade de bootstrap de projetos novos

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
  Manter o OpenSDD com orientação backend genérica, usando bundles/skills amplos e deixando a estrutura final ser especializada caso a caso.
- Pras:
  - Menor esforço imediato.
  - Menos acoplamento explícito à Foundation.
  - Dá flexibilidade máxima para times e agentes.
- Contras:
  - Mantém margem alta para pequenos erros arquiteturais.
  - Continua permitindo divergência de pastas, nomenclatura, camadas, conexão, configuração e validadores.
  - Não captura a intenção do usuário de usar a Foundation como espelho fiel.

### Opcao B
- Proposta:
  Usar a `devtrack-foundation-api` apenas como referência documental, sem transformá-la em contrato operacional do bootstrap SDD.
- Pras:
  - Preserva a fronteira canônica da Foundation.
  - Evita criar enforcement cedo demais.
  - Permite amadurecer a proposta antes de materializar templates.
- Contras:
  - O padrão continua existindo “no papel”, mas não chega à estrutura dos projetos.
  - Não resolve o problema relatado de erros simples e recorrentes de arquitetura.
  - Depende demais da disciplina manual de quem implementa.

### Opcao C (opcional)
- Proposta:
  Tornar a arquitetura completa da Foundation o contrato backend padrão do OpenSDD, com materialização controlada por profile/template/bootstrap, ADRs mandatórios para desvios e exemplos canônicos suficientes para servir de espelho aos projetos derivados.
- Pras:
  - Traduz a arquitetura já pensada em padrão operacional real.
  - Reduz ambiguidade para agentes e equipes.
  - Cria consistência em stack, estrutura, camadas, nomes, validações e fluxos.
  - Mantém especialização possível, mas sempre como exceção justificada.
- Contras:
  - Exige mapear explicitamente o contrato em vários eixos, não só pasta/camada.
  - Pode aumentar custo de manutenção se a Foundation evoluir sem regra clara de sincronização.
  - Requer mais material canônico e possivelmente novos exemplos espelho.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
  Um padrão genérico é suficiente porque times maduros conseguem adaptar a arquitetura correta sem que o SDD precise impor um espelho fiel.
- Evidencias:
  - O OpenSDD já possui bundles e skills genéricos de backend em backlog e planos históricos.
  - O repositório já opera com noções como `architecture-backend` e `backend-dev-guidelines`.

### Agente B (defende C)
- Argumento:
  O problema relatado pelo usuário não é falta de “boas práticas” abstratas; é falta de uma referência concreta e obrigatória. A Foundation já foi construída exatamente para isso e precisa virar contrato operacional, não apenas documentação inspiracional.
- Evidencias:
  - O documento [`/Volumes/WORKSPACE/DEVTRACK_TOOLS/devtrack-foundation-api/arquitetura.md`](/Volumes/WORKSPACE/DEVTRACK_TOOLS/devtrack-foundation-api/arquitetura.md) descreve uma arquitetura completa, não só infraestrutura:
    - stack principal: NestJS modular;
    - camadas explícitas: `domain`, `application`, `presentation`, `infrastructure`, `shared`;
    - ORM exclusivo: TypeORM;
    - bordas suportadas: REST, GraphQL, CLI e WebSocket;
    - testes em 3 níveis: unit, e2e e load.
  - O mesmo documento também descreve regras de separação de responsabilidade:
    - domínio sem framework/ORM/HTTP;
    - aplicação orquestra casos de uso via portas;
    - apresentação valida formato/autorização e traduz protocolo;
    - infraestrutura implementa adapters concretos;
    - `shared` concentra blocos transversais reutilizáveis.
  - A Foundation traz exemplos reais de regras de negócio validadas:
    - entidades como `Pessoa` e `Wallet`;
    - validadores explícitos;
    - value objects como `EmailVO` e `TelefoneVO`;
    - contratos de repositório e exceptions de negócio.
  - A `FEAT-0018` já registrou a decisão de fronteira:
    - a Foundation é a fonte canônica de backend;
    - o OpenSDD deve materializar profile/bootstrap/template, não criar um backend canônico paralelo.
  - O problema descrito pelo usuário amplia o escopo do contrato além de “infra”, cobrindo o projeto backend inteiro:
    - versões de bibliotecas;
    - formas de conexão;
    - configurações;
    - padrão arquitetural;
    - padrões de projeto implementados;
    - regras de negócio com validadores especificados.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Transformar a Foundation em contrato obrigatório pode endurecer demais o bootstrap.
  - Se o contrato não for explicitado por eixos, ele pode virar uma cópia superficial de diretórios.
  - Sem governança de versão, o OpenSDD pode refletir um padrão desatualizado.

### B critica A
- Riscos concretos:
  - “Guideline genérica” não impede erro pequeno repetido.
  - Sem espelho fiel, cada projeto reinterpreta a arquitetura e reintroduz drift.
  - O investimento já feito na Foundation perde valor prático se não virar template operacional.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto na qualidade estrutural dos projetos | 3 | 2 | 3 | 5 |
| Clareza para humanos e agentes | 3 | 2 | 3 | 5 |
| Risco de drift entre repositórios | 3 | 1 | 3 | 4 |
| Custo de manutenção do contrato | 2 | 5 | 4 | 3 |
| Velocidade de bootstrap de projetos novos | 2 | 3 | 2 | 5 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): C
- Justificativa:
  A Foundation deve virar referência obrigatória do backend no OpenSDD porque ela já foi desenhada explicitamente para servir como modelo. O contrato não pode se limitar à infraestrutura. Ele deve cobrir a estrutura completa do projeto backend: stack e versões, conexões, configurações, camadas, nomenclatura, padrões de projeto, contratos de validação e fluxos operacionais. A especialização continua permitida, mas passa a exigir justificativa explícita e ADR quando desviar do padrão.
- Riscos aceitos:
  - Será necessário formalizar melhor a sincronização entre OpenSDD e Foundation.
  - O contrato precisará ser decomposto em eixos claros para não virar apenas “cópia de pastas”.
  - Alguns exemplos adicionais podem precisar ser implementados na Foundation para cobrir cenários recorrentes e servir de espelho.
- Condicoes de reversao:
  - Se a materialização integral no bootstrap se mostrar prematura, começar pela versão “contrato + validação + ADR”, deixando o scaffolding mais pesado para uma fase seguinte.
  - Se faltarem exemplos canônicos em algum eixo, registrar explicitamente os gaps e implementar exemplos espelho antes de endurecer o enforcement.

## 8) Saida
- APPROVED -> EPIC futura para transformar a arquitetura completa da Foundation em contrato backend operacional do SDD
- DISCARDED -> Registro em discarded

## 9) O que o contrato backend precisa cobrir

- Estrutura de projeto
  - pacotes
  - pastas
  - nomenclatura
  - composição por módulos
- Stack e versionamento
  - bibliotecas permitidas
  - versões esperadas ou faixas suportadas
  - componentes exclusivos, como TypeORM como ORM oficial
- Conexões e integrações
  - HTTP client
  - banco
  - cache
  - Redis
  - filas
  - AWS
  - LLM
  - vector store
  - Temporal
- Configuração
  - bootstrap central
  - config module
  - validação de ambiente
  - feature flags
  - toggles de módulos pesados
- Padrão arquitetural
  - `domain`
  - `application`
  - `presentation`
  - `infrastructure`
  - `shared`
- Padrões de projeto e contratos
  - ports-and-adapters
  - repository ports
  - use cases
  - handlers
  - value objects
  - validators explícitos
  - exceptions e filters padronizados
- Regras de negócio estruturadas
  - entidades de domínio sem framework
  - validadores por agregado
  - formatos canônicos
  - contratos claros de entrada/saída
- Fluxos padrão
  - request -> presentation -> application -> domain -> infrastructure
  - eventos assíncronos
  - bootstrap
  - testes unit/e2e/load

## 10) Como isso deve entrar no OpenSDD

- Como profile de distribuição/backend:
  - `foundation-backend`
- Como seed documental:
  - README/AGENTS/AGENT/.sdd/core descrevendo a arquitetura padrão
- Como template estrutural:
  - materialização inicial da árvore e módulos canônicos
- Como contrato de validação:
  - checks que detectem desvios estruturais relevantes
- Como política de ADR:
  - qualquer desvio importante do padrão da Foundation exige ADR
- Como espelho de exemplos:
  - módulos e casos exemplares da Foundation devem servir como referência concreta
  - se faltarem exemplos úteis, eles devem ser adicionados para servir de espelho

## 11) Regras de governança sugeridas

- O OpenSDD não vira novo canônico de backend.
- A Foundation continua dona da arquitetura de referência.
- O OpenSDD materializa e reforça esse contrato em projetos derivados.
- Especializações são permitidas, mas precisam ser:
  - explícitas;
  - justificadas;
  - rastreadas por ADR quando afetarem estrutura, stack, fluxo ou regra arquitetural.

## 12) Metadados
- Insight de origem: INS-0010
- Titulo do insight: Backend canônico da Foundation como contrato obrigatório do SDD
- Criado em: 2026-04-15T20:11:35.336Z
- Debate aberto em: 2026-04-15T20:11:48.023Z
