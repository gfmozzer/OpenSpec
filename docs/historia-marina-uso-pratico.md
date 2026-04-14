# Historia de Uso: Marina (Fluxo Completo no OpenSDD)

## Contexto
Marina precisa evoluir um sistema grande sem perder contexto. Ela quer:
- planejar antes de executar;
- registrar ideias no meio do caminho;
- permitir execucao rapida quando a mudanca for pequena;
- garantir que toda entrega finalize com documentacao atualizada.

## Objetivo da Marina
Construir e evoluir o sistema com rastreabilidade ponta a ponta:
- da ideia ate a entrega;
- da entrega ate a documentacao canonica;
- com onboarding de novos agentes sem inspecao ampla de codigo.

---

## Fase 1: Instalacao e Base do Projeto
Marina entra no repositorio e roda:

```bash
opensdd install --tools none --lang pt-BR --layout pt-BR
opensdd sdd init --frontend --lang pt-BR --layout pt-BR
opensdd sdd init-context
opensdd sdd checar --render
opensdd sdd orientar system
```

### O que o sistema gera para ela
- `.sdd/descoberta/` para ideias e debates.
- `.sdd/planejamento/` para backlog e progresso.
- `.sdd/execucao/FEAT-0001/` para execucao ativa.
- `.sdd/state/*.yaml` como fonte de verdade.
- `.sdd/core/*.md` como visao operacional gerada.

Resultado: Marina comeca com contexto inicial de arquitetura, stack, servicos e mapa do repositorio.

---

## Fase 2: Entrada de Informacoes (PRD e Material Bruto)
Marina recebe PRD, wireframes e referencias visuais. Ela coloca tudo em:
- `.sdd/deposito/prds/`
- `.sdd/deposito/historias/`
- `.sdd/deposito/wireframes/`
- `.sdd/deposito/referencias-visuais/`

Depois inicia a normalizacao automatica:

```bash
opensdd sdd ingest-deposito --title "Planejamento inicial do petshop"
opensdd sdd checar --render
opensdd sdd proximo
```

Se quiser guiar um agente por prompt, ela usa:
- `.sdd/prompts/01-ingestao-deposito.md`

Resultado: o material bruto vira insumo estruturado para iniciativas e entregas.

---

## Fase 3: Planejamento (Sem Burocracia Excessiva)
Marina decide comecar por uma iniciativa de agendamento online.

```bash
opensdd sdd ideia "Clientes precisam agendar banho online por loja"
opensdd sdd debater INS-0001
opensdd sdd decidir DEB-0001 --outcome epic --rationale "Dor principal do negocio"
opensdd sdd desdobrar EPIC-0001 --mode graph --incremental --titles "API de agendamento,Calendario por loja,Tela de agendamento"
opensdd sdd proximo
```

### Como ela escolhe nivel de rigor
- Mudanca pequena: `--fluxo direto`
- Mudanca normal: `--fluxo padrao`
- Mudanca grande/critica: `--fluxo rigoroso`

Exemplo de inicio em modo rigoroso:

```bash
opensdd sdd start FEAT-0001 --fluxo rigoroso
```

---

## Fase 4: Uso dos Arquivos de Execucao por Entrega
Ao iniciar uma entrega, o sistema cria:
- `.sdd/execucao/FEAT-0001/1-especificacao.md`
- `.sdd/execucao/FEAT-0001/2-planejamento.md`
- `.sdd/execucao/FEAT-0001/3-tarefas.md`
- `.sdd/execucao/FEAT-0001/4-historico.md`

Marina usa assim:
1. `1-especificacao.md`: problema, objetivo, escopo, fora de escopo, criterios de aceite (`CA-##`).
2. `2-planejamento.md`: fatias executaveis, paralelizacao, riscos, impacto tecnico e frontend.
3. `3-tarefas.md`: execucao e Definition of Done documental.
4. `4-historico.md`: evidencias da implementacao.

Para revisar contexto antes de codar:

```bash
opensdd sdd contexto FEAT-0001
```

Antes de fechar a entrega, ela declara impacto de frontend:

```bash
opensdd sdd impacto-frontend FEAT-0001 --status required --reason "Nova rota e novo fluxo visual"
```

Se for somente backend sem efeito de UI:

```bash
opensdd sdd impacto-frontend FEAT-0001 --status none --reason "Apenas refatoracao interna sem alteracao de interface"
```

---

## Fase 5: Gates Leves (Quando Necessario)
No modo `rigoroso`, Marina aprova etapas antes de concluir:

```bash
opensdd sdd aprovar FEAT-0001 --etapa proposta --por "Marina"
opensdd sdd aprovar FEAT-0001 --etapa planejamento --por "Marina"
opensdd sdd aprovar FEAT-0001 --etapa tarefas --por "Marina"
```

No modo `direto`, ela pode executar mais rapido sem cerimonia pesada.

---

## Fase 6: Insight no Meio da Execucao
Durante a implementacao, surge nova ideia:

```bash
opensdd sdd ideia "Cada loja tem catalogo proprio de servicos"
opensdd sdd debater INS-0009
opensdd sdd decidir DEB-0009 --outcome epic --rationale "Impacta o agendamento"
opensdd sdd desdobrar EPIC-0006 --mode graph --incremental --titles "Catalogo por loja"
opensdd sdd proximo
```

Resultado: replanejamento incremental, sem perder rastreabilidade.

---

## Fase 7: Arquivamento e Consolidacao de Memoria
Quando termina a entrega tecnica:

```bash
opensdd arquivar <change-name>
opensdd sdd consolidar --ref FEAT-0001
opensdd sdd checar --render
opensdd sdd orientar system
```

### O que a consolidacao garante
- FEAT marcada como concluida.
- Atualizacao da memoria canônica (`.sdd/state`).
- Atualizacao das views (`.sdd/core` e `.sdd/planejamento`).
- ADR da entrega (quando aplicavel).
- Desbloqueio visivel de dependentes.
- Guardrail frontend: sem declaracao/cobertura, `finalize` bloqueia por padrao.
- Auditoria visivel em `.sdd/planejamento/frontend-auditoria.md`.

---

## Resultado para Marina
Sim, o sistema ajuda Marina a cumprir a historia dela porque:
- ela planeja e executa no mesmo fluxo;
- pode usar rigor alto ou execucao direta, conforme o tamanho da mudanca;
- toda entrega fecha com consolidacao documental;
- novos agentes entram pelo `orientar` + `contexto` sem precisar varrer codigo inteiro.
