# História de Uso: Leigo Construindo Sistema de Microserviços com OpenSpec SDD

## O Usuário

**Marina**, 34 anos, dona de uma rede de 12 pet shops. Não sabe programar. Sabe usar ferramentas básicas (Notion, Excel, WhatsApp Business). Quer um sistema próprio porque nenhum SaaS de mercado resolve o fluxo específico dela: agendamento → atendimento → prontuário veterinário → fidelidade → pagamento recorrente.

Ela contratou acesso a um agente de IA (tipo Claude/Cursor) e instalou o OpenSpec na máquina de desenvolvimento. Um consultor fez o setup inicial.

---

## O Sistema Que Ela Quer

**"PetFlow"** — plataforma para gestão integrada de pet shops.

### Microserviços necessários (ela ainda não sabe que são microserviços):

| Serviço | O que faz na linguagem dela |
|---|---|
| **Agendamento** | "O cliente marca banho, tosa ou consulta pelo celular" |
| **Prontuário** | "O veterinário registra vacinas, exames e tratamentos" |
| **Fidelidade** | "A cada 10 banhos, um grátis. Pontos por compra." |
| **Pagamento** | "Plano mensal pra quem quer banho semanal. Tipo assinatura." |
| **Notificação** | "Lembrete de vacina, confirmação de agendamento, promoção" |

---

## Fase 1: Marina Inicializa o Projeto

Marina abre o terminal (que o consultor deixou pronto) e digita:

```bash
openspec sdd init --frontend
```

O sistema cria a estrutura `.sdd/` com todos os arquivos de estado.

```bash
openspec sdd check --render
```

Tudo limpo. Agora ela tem um projeto organizado, vazio, pronto pra receber ideias.

**O que Marina sente:** "Ok, parece uma pasta vazia bonitinha. E agora?"

---

## Fase 2: Marina Despeja Ideias (Insights)

Marina começa a falar o que precisa. Ela não pensa em termos técnicos — pensa em problemas do dia a dia.

```bash
openspec sdd insight "Clientes ligam toda hora pra marcar banho, preciso de agendamento online"
# → INS-001

openspec sdd insight "O veterinário anota tudo em caderno, preciso de prontuário digital"
# → INS-002

openspec sdd insight "Quero programa de fidelidade tipo 10 banhos 1 grátis"
# → INS-003

openspec sdd insight "Clientes pedem plano mensal de banho semanal, tipo assinatura"
# → INS-004

openspec sdd insight "Preciso mandar lembrete de vacina pelo WhatsApp"
# → INS-005

openspec sdd insight "Quero ver dashboard com faturamento por loja"
# → INS-006

openspec sdd insight "Cada loja tem horários diferentes, o sistema precisa respeitar isso"
# → INS-007

openspec sdd insight "Quero que o cliente veja o histórico do pet dele"
# → INS-008
```

**O que Marina sente:** "Isso é tipo um bloco de notas inteligente. Gostei, posso ir jogando tudo aqui."

---

## Fase 3: Marina Debate Cada Ideia com o Agente

Marina pede pro agente avaliar cada insight. Ela não sabe a palavra "debate", mas o consultor ensinou: "pra cada ideia, roda o debate pra ver se faz sentido".

```bash
openspec sdd debate INS-001
```

O agente cria `.sdd/discovery/2-debates/DEB-001-agendamento-online.md` com o template formal: pergunta de decisão, critérios, opções, argumentos, matriz de pontuação.

Marina lê e conversa com o agente:

> **Marina:** "Preciso que funcione pra 12 lojas com horários diferentes."
> **Agente:** "Isso implica um serviço de agendamento multi-tenant com calendário por unidade. Vou registrar essa restrição no debate."

O agente preenche o debate completo. Marina valida e roda:

```bash
openspec sdd decide DEB-001 --outcome radar --rationale "Agendamento é a dor principal, resolver primeiro"
# → RAD-001
```

Ela repete para cada insight. O fluxo gera 8 debates. Resultado:

| DEB | Resultado | Motivo |
|---|---|---|
| DEB-001 Agendamento | → RAD-001 ✅ | Dor principal |
| DEB-002 Prontuário | → RAD-002 ✅ | Obrigação legal + valor alto |
| DEB-003 Fidelidade | → RAD-003 ✅ | Retenção de clientes |
| DEB-004 Assinatura | → RAD-004 ✅ | Receita recorrente |
| DEB-005 Notificação | → RAD-005 ✅ | WhatsApp é o canal |
| DEB-006 Dashboard | ❌ DISCARDED | "Faz depois, agora não é prioridade" |
| DEB-007 Multi-loja | → absorvido pelo RAD-001 | Virou requisito do agendamento |
| DEB-008 Histórico pet | → absorvido pelo RAD-002 | Virou requisito do prontuário |

**O que Marina sente:** "Caramba, comecei com 8 ideias soltas e agora tenho 5 decisões claras com motivo escrito. Nunca tinha conseguido fazer isso."

---

## Fase 4: Marina Quebra o Primeiro RAD Grande

O RAD-001 (agendamento) é complexo: multi-tenant, calendário por loja, integração com WhatsApp, frontend mobile.

```bash
openspec sdd breakdown RAD-001 --mode graph --titles "API de agendamento,Calendário por loja,Tela de agendamento cliente,Notificação de confirmação"
```

O sistema:
1. Classifica RAD-001 como `LARGE` (toca backend + frontend + integração)
2. Gera 4 FEATs com dependências:

```
RAD-001: Agendamento Online
├── FEAT-001 API de agendamento (backend)
│   scale: STANDARD
├── FEAT-002 Calendário por loja (backend)
│   blocked_by: [FEAT-001]
│   lock_domains: [scheduling-rules]
├── FEAT-003 Tela de agendamento cliente (frontend)
│   blocked_by: [FEAT-001, FEAT-002]
└── FEAT-004 Notificação de confirmação (integração)
    blocked_by: [FEAT-001]
    lock_domains: [notification-channel]
```

3. Marca RAD-001 como `SPLIT`
4. Gera `backlog-graph.md` com a visualização

Marina lê o grafo e entende:

> **Marina:** "Ah, então a tela do cliente só pode começar depois que a API e o calendário estiverem prontos? Faz sentido."
> **Agente:** "Exato. Mas a notificação pode andar em paralelo com o calendário, porque só depende da API base."

**O que Marina sente:** "Eu nunca teria pensado nessa ordem. O sistema pensou por mim."

---

## Fase 5: Marina Faz Breakdown dos Outros RADs

Ela repete o processo pros outros RADs:

### RAD-002: Prontuário Veterinário
```bash
openspec sdd breakdown RAD-002 --mode graph --titles "Modelo de prontuário,API de registros clínicos,Tela de prontuário,Upload de exames"
```
→ FEAT-005 a FEAT-008

### RAD-003: Fidelidade
```bash
openspec sdd breakdown RAD-003 --mode graph --titles "Motor de pontos,Regras de resgate,Painel de fidelidade"
```
→ FEAT-009 a FEAT-011

### RAD-004: Assinatura
```bash
openspec sdd breakdown RAD-004 --mode graph --titles "Planos e pricing,Gateway de pagamento,Gestão de assinaturas"
```
→ FEAT-012 a FEAT-014

### RAD-005: Notificação
```bash
openspec sdd breakdown RAD-005 --mode graph --titles "Canal WhatsApp,Canal email,Fila de envio,Templates de mensagem"
```
→ FEAT-015 a FEAT-018

Agora o backlog tem **18 FEATs** organizadas em 5 RADs, com dependências e locks mapeados.

```bash
openspec sdd check --render
```

O check mostra:
- 18 FEATs no backlog
- 6 prontas para iniciar (sem bloqueio)
- 8 bloqueadas esperando outras
- 2 com conflito de lock domain
- 2 cross-RAD (notificação depende de agendamento)

**O que Marina sente:** "Tenho 18 pedaços e sei exatamente quais podem começar agora. Isso é muito melhor do que 'quero um sistema de pet shop'."

---

## Fase 6: Marina Inicia Execução

O agente (ou o comando `sdd next`, quando existir) sugere:

> "FEATs prontas para iniciar agora: FEAT-001 (API agendamento), FEAT-005 (Modelo prontuário), FEAT-009 (Motor de pontos), FEAT-015 (Canal WhatsApp). Todas são independentes."

Marina começa pela mais importante:

```bash
openspec sdd start FEAT-001
```

O sistema:
1. Cria `openspec/changes/api-agendamento/`
2. Gera spec da feature
3. Gera plano com tasks locais
4. Marca FEAT-001 como `IN_PROGRESS`

O agente assume o papel de `backend-architect` (conforme `agent_role` da FEAT) e começa a implementar. Marina acompanha:

> **Marina:** "O que você está fazendo?"
> **Agente:** "Estou criando a API de agendamento. Primeiro o modelo de dados (horários, serviços, pets), depois os endpoints (criar/cancelar/listar agendamentos), depois os testes."

Marina não precisa entender código. Ela valida pelo que o agente descreve.

---

## Fase 7: Insight no Meio da Execução

Enquanto o agente implementa FEAT-001, Marina percebe algo:

> **Marina:** "Espera, cada loja aceita tipos de serviço diferentes. A loja do centro não faz consulta veterinária, só banho e tosa."

```bash
openspec sdd insight "Cada loja tem catálogo de serviços diferente, nem toda loja oferece todos os serviços"
# → INS-009
```

```bash
openspec sdd debate INS-009
```

O agente debate e conclui que isso impacta FEAT-001 (que está em andamento) e FEAT-002 (calendário por loja).

```bash
openspec sdd decide DEB-009 --outcome radar --rationale "Impacta modelo de dados, precisa entrar antes de finalizar FEAT-001"
# → RAD-006
```

```bash
openspec sdd breakdown RAD-006 --mode graph --titles "Catálogo de serviços por loja"
# → FEAT-019
# blocked_by: [] (pode começar agora)
# lock_domains: [scheduling-rules] (conflita com FEAT-002)
```

O agente adapta o plano: FEAT-019 precisa ser feita **antes** de FEAT-002, e FEAT-001 precisa considerar o catálogo.

> **Agente:** "Vou ajustar a FEAT-001 para incluir o modelo de catálogo por loja. FEAT-019 vai complementar isso, e FEAT-002 agora fica bloqueada por FEAT-019 também."

**O que Marina sente:** "No meio do caminho lembrei de uma coisa importante e o sistema não travou. Ele reorganizou o plano."

---

## Fase 8: Handoff Entre Agentes

FEAT-001 fica pronta. Marina quer que outro agente (ou outra sessão) continue com FEAT-002.

```bash
openspec sdd context FEAT-002 --json
```

O sistema gera um pacote de contexto com:
- O que FEAT-002 precisa fazer
- O que FEAT-001 já entregou (APIs disponíveis)
- O que FEAT-019 entregou (catálogo por loja)
- Lock domains ativos
- Skills recomendadas

O novo agente lê o contexto e começa sem precisar "ler o repo inteiro".

> **Marina:** "Troquei de agente e ele já sabia o que fazer. Não precisei explicar tudo de novo."

---

## Fase 9: Frontend Gaps Aparecem

Quando FEAT-001 (API) e FEAT-002 (calendário) ficam prontas, o agente backend registra os gaps de frontend:

```bash
openspec sdd fgap add "Tela de listagem de horários disponíveis" --origin FEAT-001 --routes /agendar
openspec sdd fgap add "Tela de seleção de serviço por loja" --origin FEAT-019 --routes /agendar/servicos
openspec sdd fgap add "Tela de configuração de horários por loja" --origin FEAT-002 --routes /admin/horarios
```

Quando FEAT-003 (tela de agendamento) começar, o agente de frontend já sabe quais telas precisa construir.

```bash
openspec sdd start FEAT-003
```

O agente de frontend consulta os FGAPs e implementa as telas. Ao terminar:

```bash
openspec sdd fgap done FGAP-001 --feature FEAT-003 --files src/pages/Agendar.tsx --routes /agendar
```

---

## Fase 10: Finalização e Consolidação

Conforme FEATs terminam, Marina finaliza cada uma:

```bash
openspec sdd finalize --ref FEAT-001
openspec sdd finalize --ref FEAT-002
openspec sdd finalize --ref FEAT-019
openspec sdd finalize --ref FEAT-003
openspec sdd finalize --ref FEAT-004
```

Cada `finalize`:
- Marca a FEAT como `DONE`
- Atualiza a fila de consolidação
- Desbloqueia FEATs que dependiam dela
- Atualiza os documentos em `.sdd/core/` e `.sdd/pendencias/`

```bash
openspec sdd check --render
```

Marina vê o progresso:
- RAD-001: 5/5 FEATs done ✅
- RAD-002: 0/4 FEATs done (próximo foco)
- RAD-003: 0/3 FEATs done
- RAD-004: 0/3 FEATs done
- RAD-005: 0/4 FEATs done

---

## Fase 11: Marina Acompanha Sem Entender Código

O que Marina lê periodicamente:

1. **`.sdd/pendencias/backlog-features.md`** — lista de tudo com status
2. **`.sdd/pendencias/backlog-graph.md`** — quem depende de quem, o que pode andar
3. **`.sdd/pendencias/frontend-gaps.md`** — telas que faltam
4. **`.sdd/core/index.md`** — resumo geral do sistema
5. **`.sdd/core/arquitetura.md`** — visão dos serviços e como se conectam

Esses arquivos são Markdown legível. Marina não precisa abrir código.

**O que Marina sente:** "Sei quanto falta, o que está travado, e o que pode andar. Nunca tive essa visão com freelancer nenhum."

---

## Fase 12: Sistema Completo

Após semanas, o backlog mostra:

```
RAD-001: Agendamento     → 5/5 DONE ✅
RAD-002: Prontuário      → 4/4 DONE ✅
RAD-003: Fidelidade      → 3/3 DONE ✅
RAD-004: Assinatura      → 3/3 DONE ✅
RAD-005: Notificação     → 4/4 DONE ✅
RAD-006: Catálogo (novo) → 1/1 DONE ✅
```

O `.sdd/core/` tem a documentação completa do sistema:
- Arquitetura dos 5 microserviços
- APIs documentadas
- Decisões registradas nos ADRs
- Gaps de frontend resolvidos
- Histórico de discovery preservado

---

## Resumo: O Que Marina Usou (Sem Saber Programar)

| Ação dela | Comando | Resultado |
|---|---|---|
| "Tenho uma ideia" | `sdd insight` | INS registrado |
| "Faz sentido?" | `sdd debate` + `sdd decide` | Decisão formal com motivo |
| "Como quebro isso?" | `sdd breakdown --mode graph` | Grafo de FEATs com dependências |
| "O que pode começar?" | `sdd check` / `sdd next` | Lista do que é paralelizável |
| "Começa essa" | `sdd start` | Execução com spec + plan + tasks |
| "Lembrei de mais uma coisa" | `sdd insight` (no meio) | Novo RAD que reorganiza o grafo |
| "Troca de agente" | `sdd context` | Handoff sem perda de contexto |
| "Falta tela" | `sdd fgap add` | Gap registrado e rastreado |
| "Terminou" | `sdd finalize` | Consolidação documental |
| "Como está?" | `sdd check --render` | Visão geral em Markdown |

---

## A Pergunta Final

O sistema ideal permitiria que Marina construísse um sistema de 5 microserviços, 19 FEATs, com insights surgindo no meio do caminho, handoff entre agentes, frontend gaps rastreados e documentação consolidada — **sem escrever uma linha de código e sem perder rastreabilidade**.

> A questão agora é: **quanto disso o OpenSpec SDD já entrega hoje, e onde estão os gaps?**
