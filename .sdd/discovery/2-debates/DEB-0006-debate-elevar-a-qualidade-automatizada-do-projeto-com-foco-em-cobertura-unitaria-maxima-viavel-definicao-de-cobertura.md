# Debate DEB-0006

## 1) Pergunta de decisao (obrigatorio)
Decidir elevar a cobertura automatizada por uma trilha orientada a risco, com gates mensuraveis e expansao sistematica de testes unitarios e e2e, em vez de apenas impor uma meta numerica global sem redefinir o universo de cobertura, para resolver a lacuna atual entre confianca desejada e evidencias reais de qualidade do projeto.

## 2) Criterios de decisao (obrigatorio)
- Impacto no usuario
- Complexidade de implementacao
- Risco tecnico
- Custo operacional
- Tempo de entrega

## 3) Opcoes consideradas (minimo 2)
### Opcao A
- Proposta: Buscar 95% global imediatamente, impondo threshold unico de cobertura e2e e unitario antes de expandir a malha de testes.
- Pras:
  - Cria pressao imediata por meta alta.
  - Simplifica a mensagem executiva.
- Contras:
  - Pode bloquear o projeto por um alvo ainda desconectado da realidade atual.
  - E2E ainda nao possui universo formalizado para medir 95% com honestidade.
  - Risco alto de gerar testes cosmeticos so para satisfazer numero.

### Opcao B
- Proposta: Maximizar cobertura viavel orientada a risco, definir gates reais para unitario e E2E, expandir testes nos modulos mais criticos e formalizar a matriz E2E de fluxos CLI antes de prometer percentuais finais.
- Pras:
  - Ataca primeiro os buracos com maior impacto tecnico.
  - Produz indicadores honestos e sustentaveis.
  - Permite transformar cobertura em criterio de release, nao em numero decorativo.
- Contras:
  - Pode nao atingir 95% global neste primeiro ciclo.
  - Exige trabalho adicional de desenho da matriz E2E.

### Opcao C (opcional)
- Proposta: Manter a cobertura atual e apenas documentar uma meta futura de qualidade.
- Pras:
  - Menor custo imediato.
  - Nenhum risco de atrasar o ciclo atual.
- Contras:
  - Nao melhora confianca real.
  - Nao responde ao objetivo do usuario.
  - Mantem o projeto vulneravel a regressao silenciosa.

## 4) Rodada de argumentos com evidencia
### Agente A (defende A)
- Argumento: Um threshold unico de 95% comunica ambicao e cria um forcing function forte para fechar lacunas rapidamente.
- Evidencias:
  - A cobertura atual de unitario esta em aproximadamente 70.59% de statements/lines e 80.69% de branches, logo existe grande espaco para endurecimento.
  - Funcions ja esta em 96.04%, mostrando que parte do projeto responde bem a instrumentacao atual.

### Agente B (defende B)
- Argumento: O projeto precisa de qualidade maxima baseada em evidencia, nao de um alvo arbitrario aplicado sobre uma malha de testes ainda mal definida, especialmente em E2E.
- Evidencias:
  - Hoje existe apenas uma suite explicitamente E2E em `test/cli-e2e/basic.test.ts`.
  - Ha modulos centrais com lacunas reais de cobertura, como `src/core/sdd/transition-engine.ts`, `src/core/validation/validator.ts` e `src/utils/item-discovery.ts`.
  - Varias entradas de comando aparecem com 0% atribuido no relatorio, o que exige investigacao de instrumentacao e/ou novos testes dedicados.

## 5) Rodada de critica cruzada
### A critica B
- Riscos concretos:
  - Sem um numero final duro, a iniciativa pode se alongar demais.
  - Pode haver acomodacao em thresholds intermediarios.

### B critica A
- Riscos concretos:
  - Forcar 95% agora pode levar a testes artificiais e baixo valor.
  - A meta E2E ficaria semanticamente vazia sem definir fluxos criticos.
  - Pode bloquear release por razoes de metricas, nao por risco real ao usuario.

## 6) Matriz de pontuacao (0-5)
| Criterio | Peso | A | B | C |
| --- | --- | --- | --- | --- |
| Impacto no usuario | 3 | 3 | 5 | 1 |
| Complexidade de implementacao | 2 | 1 | 4 | 5 |
| Risco tecnico | 3 | 1 | 5 | 1 |
| Custo operacional | 2 | 2 | 4 | 5 |
| Tempo de entrega | 2 | 1 | 4 | 5 |

## 7) Decisao do mediador (obrigatorio)
- Escolha (A/B/C): B
- Justificativa: A melhor decisao para este ciclo e maximizar a qualidade automatizada de forma verificavel e orientada a risco. O objetivo do usuario e elevar o nivel de confianca ao maximo possivel, e isso pede duas frentes complementares: expandir cobertura onde o risco tecnico e maior e formalizar uma definicao honesta de E2E. A opcao B preserva ambicao alta, mas evita prometer 95% em cima de um universo ainda indefinido. Ela permite endurecer gates, escrever testes de alto valor, corrigir lacunas de instrumentacao e sair do ciclo com qualidade real superior.
- Riscos aceitos:
  - O percentual global final pode continuar abaixo de 95% neste ciclo.
  - Parte do trabalho pode revelar limites estruturais do desenho atual de comandos e suites.
- Condicoes de reversao:
  - Se a expansao de testes mostrar custo desproporcional em relacao ao risco mitigado.
  - Se houver necessidade de priorizar entrega funcional urgente acima do hardening de qualidade.

## 8) Saida
- APPROVED -> EPIC-0006
- DISCARDED -> Registro em discarded

## Metadados
- Insight de origem: INS-0006
- Titulo do insight: Elevar a qualidade automatizada do projeto com foco em cobertura unitária máxima viável, definição de cobertura e2e mens
- Criado em: 2026-04-13T03:51:02.978Z
- Debate aberto em: 2026-04-13T03:51:12.306Z
