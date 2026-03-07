# SDD Automadesk (Spec-Driven Development)

Este framework Híbrido foi desenhado para ecossistemas de alta complexidade (microsserviços, multi-tenant, event-driven), organizando conhecimento em Passado (Archive), Presente (Active) e Futuro (Discovery/Pendencias).

## Fluxograma Visual
```mermaid
graph TD
    %% Estilização
    classDef usuario fill:#2d3436,stroke:#74b9ff,stroke-width:2px,color:#fff;
    classDef porteiro fill:#6c5ce7,stroke:#fff,stroke-width:2px,color:#fff;
    classDef discovery fill:#0984e3,stroke:#fff,stroke-width:2px,color:#fff;
    classDef pendencias fill:#e17055,stroke:#fff,stroke-width:2px,color:#fff;
    classDef sandbox fill:#00b894,stroke:#fff,stroke-width:2px,color:#fff;
    classDef core fill:#d63031,stroke:#fff,stroke-width:2px,color:#fff;
    classDef skills fill:#fdcb6e,stroke:#2d3436,stroke-width:2px,color:#2d3436;

    %% Entrada
    User([Seu Prompt na IDE]) --> Porteiro{Camada 0: O Porteiro}
    class User usuario;
    class Porteiro porteiro;

    %% Roteamento do Porteiro
    Porteiro -->|Rota A: Ideia /sdd.insight| VerificaIndex[Verifica index-ideias.md]
    Porteiro -->|Rota B: Dívida| TechDebt[(tech-debt.md / frontend-gaps.md)]
    Porteiro -->|Rota C: Código Fast-Track| Active[active/ Sandbox]

    %% Fluxo Discovery
    VerificaIndex --> Insight[1-insights/]
    Insight -->|/sdd.debate| Debates[2-debates/]
    Debates -->|/sdd.decide| Radar[3-radar/ Épico]
    class VerificaIndex,Insight,Debates,Radar discovery;

    %% Fluxo Tech Lead (Quebra de Tarefas)
    Radar -->|/sdd.breakdown| TechLead[Agente Tech Lead]
    TechLead -->|Quebra em Micro-tasks| Backlog[(backlog-features.md)]
    class TechDebt,Backlog pendencias;

    %% Fluxo de Execução (Sandbox)
    Backlog -->|/sdd.start| Active
    
    subgraph Tríade de Execução
        Active --> Spec[1-spec.md]
        
        %% A Regra de Intersecção
        TechDebt -.->|Regra de Intersecção| Plan
        
        %% As Skills
        BibliotecaSkills[[skills/ nestjs, react, etc]] -.->|Consulta| Plan
        class BibliotecaSkills skills;
        
        Spec --> Plan[2-plan.md]
        Plan --> Tasks[3-tasks.md + 4-changelog.md]
    end
    class Active,Spec,Plan,Tasks sandbox;

    %% Fase de Consolidação
    Tasks -->|Fim das Tasks| Consolidacao{Rito de Fechamento}
    
    Consolidacao -->|Lê changelog e atualiza| Core[(core/ - Arquitetura, Contratos)]
    Consolidacao -->|Apaga Dívidas/Gaps Resolvidos| TechDebt
    Consolidacao -->|Adiciona Novos Gaps| TechDebt
    Consolidacao -->|Move a Feature| Archive[archive/]
    Consolidacao -->|Consolida no Git| Git[Commit Local]
    class Core,Archive core;
```

## Painel de Controle (Mapas Rápidos)
- [Mapa de Arquitetura](./core/arquitetura.md)
- [Dicionário de Dados](./core/dicionario-dados.md)
- [Sitemap Frontend Existente](./core/frontend-map.md)
- [Catálogo de Ideias](./discovery/index-ideias.md)
- [Fila de Gaps de Frontend](./pendencias/frontend-gaps.md)
- [Dívida Técnica](./pendencias/tech-debt.md)
- [Backlog de Features (Micro-tarefas)](./pendencias/backlog-features.md)

## Como Operar (Comandos)
* `/sdd.insight [ideia]`: Registra uma nova ideia no catálogo.
* `/sdd.debate [ID]`: Move uma ideia para debate.
* `/sdd.decide [ID] [radar/reject]`: Move uma ideia para aprovadas ou rejeitadas.
* `/sdd.breakdown [ID-DO-RADAR]`: Assuma a persona de Tech Lead e quebre tarefas.
* `/sdd.start [ID-DA-FEATURE]`: Inicia execução ativando o Sandbox de isolamento do contexto.
* `/sdd.archive [ID-DA-FEATURE]`: Move do Active para o Archive e consolida.
