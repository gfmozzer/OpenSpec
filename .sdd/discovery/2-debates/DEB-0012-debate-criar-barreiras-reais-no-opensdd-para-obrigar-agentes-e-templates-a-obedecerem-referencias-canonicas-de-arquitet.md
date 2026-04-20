# Debate DEB-0012

## 1) Pergunta de decisao (obrigatorio)
Decidir se o OpenSDD deve transformar referências canônicas declaradas pelo usuário em contrato operacional obrigatório, com enforcement real para backend e frontend, em vez de tratá-las apenas como contexto documental ou orientação frouxa, para reduzir desvios de estrutura, nomenclatura, pacotes, contratos e regras básicas nos artefatos gerados.

## 2) Criterios de decisao (obrigatorio)
- Redução de retrabalho e perda de tempo
- Confiabilidade para decisões de negócio
- Clareza para humanos e agentes
- Capacidade de enforcement semântico real
- Custo de manutenção do contrato canônico
- Risco de rigidez excessiva

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta:
  Manter o modelo atual: referências seguem como contexto e orientação, mas o runtime do SDD não as transforma em contrato forte de geração e validação.
- Pras:
  - Menor esforço imediato.
  - Preserva flexibilidade máxima para cada projeto.
  - Evita ampliar agora o escopo de validação semântica.
- Contras:
  - Não resolve a dor central relatada pelo usuário.
  - Continua permitindo decisões fora do modelo canônico mesmo quando há referência explícita.
  - Mantém o custo de revisão manual alto.

### Opcao B
- Proposta:
  Endurecer apenas o backend, apoiando-se na `devtrack-foundation-api` como contrato obrigatório, mas deixar frontend em modo descritivo/guideline.
- Pras:
  - Aproveita diretamente a decisão já consolidada em `DEB-0010`.
  - Ataca um eixo de alto impacto técnico com referência já existente.
  - Reduz parte relevante dos desvios arquiteturais.
- Contras:
  - Resolve apenas metade do problema.
  - Mantém frontend como zona cinzenta, abrindo caminho para desalinhamento entre UI, rotas, contratos e experiência.
  - Continua exigindo revisão manual forte em features full-stack.

### Opcao C (opcional)
- Proposta:
  Criar um contrato canônico dual de referência no OpenSDD, com backend e frontend tratados como referências operacionais explícitas, incluindo:
  - declaração formal da referência obrigatória;
  - roteamento de prompts/templates por referência;
  - checks estruturais e semânticos de aderência;
  - override controlado por ADR;
  - strict mode para bloquear finalize/start/check quando houver desvio relevante.
- Pras:
  - Ataca diretamente a dor relatada: referência declarada passa a ter consequência operacional real.
  - Conecta arquitetura, template, prompt, validação e governança em um fluxo único.
  - Reduz ambiguidade para backend, frontend e casos full-stack.
  - Cria base reutilizável para projetos derivados.
- Contras:
  - Exige definição canônica explícita também para frontend, hoje ainda pouco madura no repositório.
  - Aumenta escopo de manutenção e sincronização.
  - Requer calibrar bem a fronteira entre enforcement útil e rigidez excessiva.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento:
  O runtime do SDD já possui guardrails suficientes para o estágio atual; o principal problema estaria na qualidade do uso humano dos templates e não em falta de enforcement do sistema.
- Evidencias:
  - O projeto já possui hardening estrutural importante vindo de `DEB-0004`, `DEB-0008` e `DEB-0011`.
  - `src/core/sdd/check.ts` já valida estrutura, referências inexistentes, gaps de frontend e coerência entre estados.
  - O risco de ampliar enforcement cedo demais é tornar o fluxo pesado e frágil para projetos variados.

### Agente B (defende B)
- Argumento:
  O backend já tem direção canônica suficiente e deveria ser endurecido primeiro, porque a `devtrack-foundation-api` já foi aceita como referência obrigatória; frontend pode amadurecer depois.
- Evidencias:
  - `DEB-0010` já decidiu que a Foundation deve ser tratada como contrato backend obrigatório.
  - O histórico da `FEAT-0018` já apontou `foundation-backend` como profile natural de implementação.
  - O frontend ainda não possui base equivalente madura: `.sdd/state/frontend-decisions.yaml` está vazio e `.sdd/core/frontend-decisions.md` não registra decisões canônicas.

### Agente C (defende C)
- Argumento:
  O problema descrito pelo usuário não é apenas “arquitetura backend frouxa”; é a ausência de um elo obrigatório entre referência declarada e artefato gerado. Se esse elo existir só no backend, o OpenSDD continuará vazando decisão não canônica por frontend, fluxos full-stack e geração de templates genéricos.
- Evidencias:
  - O README já reconhece a fronteira canônica da `devtrack-foundation-api` para backend, mas isso ainda não foi traduzido em enforcement pleno de geração e aderência.
  - O estado atual mostra assimetria clara:
    - backend tem debate canônico (`DEB-0010`);
    - frontend ainda não tem base canônica estruturada (`frontend-decisions` vazio).
  - O próprio template recém-gerado para `DEB-0012` veio praticamente vazio, mostrando que ainda existe distância entre “ter estrutura” e “obter resultado consistente”.
  - `FEAT-0019` está focada em integridade referencial cross-entity, o que melhora a existência e coesão das referências, mas não valida aderência ao modelo canônico indicado pelo usuário.
  - Sem contrato dual, o agente pode obedecer parcialmente a backend e ainda divergir em:
    - rotas;
    - nomenclatura de componentes;
    - organização de páginas;
    - fronteira BFF/frontend;
    - padrões de estado e integração.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Endurecer só backend pode criar falsa sensação de segurança.
  - O usuário continuará precisando revisar manualmente o frontend e a costura full-stack.
  - A dor de negócio persiste em features que cruzam API e interface.

### B critica A
- Riscos concretos:
  - Continuar no modelo atual significa aceitar que a referência obrigatória não obriga nada de fato.
  - O custo de revisão continua jogado no usuário.
  - A perda de tempo e oportunidade de negócio mencionada pelo usuário permanece estruturalmente sem resposta.

### C critica A e B
- Riscos concretos:
  - A opção A mantém o problema intacto.
  - A opção B melhora parcialmente, mas perpetua assimetria entre backend e frontend.
  - Sem um protocolo único de referência, cada template/prompt continuará reinterpretando “canônico” de forma diferente.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Redução de retrabalho e perda de tempo | 3 | 1 | 3 | 5 |
| Confiabilidade para decisões de negócio | 3 | 1 | 3 | 5 |
| Clareza para humanos e agentes | 3 | 2 | 3 | 5 |
| Capacidade de enforcement semântico real | 3 | 1 | 3 | 5 |
| Custo de manutenção do contrato canônico | 2 | 5 | 3 | 2 |
| Risco de rigidez excessiva | 2 | 5 | 3 | 3 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): C
- Justificativa: O problema relatado pelo usuário é de enforcement insuficiente, não de falta de documentação. O OpenSDD já possui bases importantes de estrutura, guardrails e integridade, mas ainda falha na passagem de “referência declarada” para “artefato fiel ao modelo”. A melhor resposta é transformar referências canônicas em contrato operacional dual, com backend baseado explicitamente na `devtrack-foundation-api`, frontend com base canônica igualmente explícita e ambos conectados a prompts, templates, checks e política de override. Sem isso, o custo de garantia de qualidade continua recaindo manualmente sobre o usuário.
- Riscos aceitos:
  - Será necessário formalizar uma base canônica de frontend, hoje ainda imatura.
  - O runtime precisará ganhar validação semântica além da integridade estrutural.
  - A manutenção entre OpenSDD, referências backend e referências frontend exigirá governança de sincronização.
- Condicoes de reversao:
  - Se o enforcement completo se mostrar rígido demais, iniciar por modo progressivo:
    - warning por padrão;
    - strict opcional;
    - bloqueio obrigatório só em referências marcadas como mandatórias.
  - Se o frontend ainda não tiver maturidade suficiente, dividir a implementação em duas fases:
    - fase 1: contrato backend + framework de referência frontend;
    - fase 2: enforcement frontend completo após consolidar a base.

## 8) Saida
- APPROVED -> EPIC futura para contrato canônico dual com enforcement real
- DISCARDED -> Registro em discarded

## 9) O que a base canônica precisa cobrir

### Backend
- referência obrigatória de arquitetura;
- estrutura de pacotes, módulos e nomenclatura;
- stack permitida e suas versões/faixas;
- contratos de integração, configuração e conexão;
- padrões obrigatórios de camadas, use cases, ports/adapters e validação;
- exemplos canônicos reutilizáveis;
- critérios objetivos de desvio aceitável.

### Frontend
- arquitetura de navegação, rotas e superfícies;
- taxonomia de páginas, componentes e naming;
- padrões de estado, fetch, cache e composição;
- contratos visuais e estruturais mínimos;
- acessibilidade e consistência de UX;
- relação obrigatória com backend/BFF/API quando aplicável;
- exemplos canônicos reutilizáveis de telas/fluxos/componentes.

## 10) Como o enforcement deve entrar no OpenSDD

### Declaração de referência
- permitir registrar em estado/config quais referências são:
  - mandatórias;
  - recomendadas;
  - contextuais.

### Roteamento de geração
- templates e prompts não podem ser genéricos quando houver referência mandatória;
- o runtime deve selecionar bundles/prompts/checklists específicos por referência.

### Validação
- o `check` precisa evoluir de “referência existe” para “saída aderiu ao contrato”;
- validar:
  - nomes;
  - pastas;
  - módulos;
  - contratos;
  - fronteiras;
  - padrões proibidos/permitidos.

### Override controlado
- qualquer desvio estrutural relevante exige ADR ou justificativa equivalente;
- o override deve ser rastreável e auditável, nunca silencioso.

### Modo progressivo
- `warning` quando a referência for recomendada;
- `error`/bloqueio quando a referência for obrigatória e o projeto estiver em modo estrito.

## 11) Barreiras sugeridas

- Checklists de aderência por domínio (`backend`, `frontend`, `full-stack`)
- Lentes semânticas específicas por referência
- Templates com exemplos positivos/negativos embutidos
- Perfis explícitos de distribuição, como `foundation-backend`
- Base equivalente para frontend, a ser definida
- Auditoria de desvio canônico por FEAT/EPIC
- Métrica de “aderência à referência” no `sdd audit`

## 12) Resultado esperado se aprovado

- menos tempo gasto em revisão corretiva;
- menos drift entre o que o usuário manda e o que o agente produz;
- bootstrap mais previsível;
- maior consistência entre backend, frontend e integrações;
- menor perda de oportunidade causada por retrabalho arquitetural e estrutural.

## 13) Metadados
- Insight de origem: INS-0012
- Titulo do insight: Contrato canônico backend/frontend com enforcement real
- Criado em: 2026-04-17T19:08:24.834Z
- Debate aberto em: 2026-04-17T19:08:32.791Z
