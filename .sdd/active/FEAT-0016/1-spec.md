# Spec FEAT-0016

## Resumo
- Titulo: Protocolo de meta-evolução do SDD e comando sdd audit
- Origem: epic (EPIC-0008)
- Tipo: feature
- Modo: local_plan
- Fluxo: padrao
- Etapa atual: proposta

## Gates
- Proposta: rascunho
- Planejamento: rascunho
- Tarefas: rascunho

## Objetivo

Introduzir um mecanismo formal de auto-avaliação do próprio SDD como sistema de gestão de estado. A feature entrega:

1. Campo `meta_evolution` em `config.yaml` configurando o ciclo de auditoria (frequência, responsável, última execução).
2. Novo subcomando `opensdd sdd audit` que exibe um relatório de saúde do ciclo SDD com métricas objetivas.
3. O relatório **não cria artefatos automaticamente** — apenas exibe o diagnóstico e sugere próximos passos ao operador.

Métricas do relatório:
- `% FEATs archivadas sem placeholder` (requer FEAT-0012)
- `% debates com Decisão preenchida real` (requer lente debate com frases proibidas)
- `% ADRs esperados vs gerados` (requer FEAT-0015)
- `% FEATs com forced_transition registrado` (requer FEAT-0013)
- `FEATs em BLOCKED há mais de N dias` (configurável)

## Histórias do Usuário
- Como tech lead, quero rodar `opensdd sdd audit` mensalmente e receber um relatório objetivo de saúde do ciclo, para identificar quando o processo está degenerando.
- Como agente LLM, quero que o relatório me diga quais FEATs têm forced_transition sem justificativa, para priorizar revisão.

## Regras de Negócio
- [ ] `config.yaml` aceita campo `meta_evolution.cycle_days` (padrão: 30) e `meta_evolution.last_run_at` (ISO date).
- [ ] `opensdd sdd audit` lê o estado de `backlog.yaml`, `discovery-index.yaml` e os arquivos do workspace ativo/arquivado para calcular as métricas.
- [ ] O relatório exibe cada métrica com valor atual, limite saudável e status (OK/ATENÇÃO/CRÍTICO).
- [ ] O relatório sugere criação de INSIGHTs para métricas críticas, mas não cria automaticamente.
- [ ] O comando atualiza `meta_evolution.last_run_at` em `config.yaml` após execução.
- [ ] Se alguma dependência não estiver implementada (ex: `forced_transition` de FEAT-0013), a métrica correspondente exibe `"não disponível (requer FEAT-####)"`.

## Cenários de Aceite
- Ao rodar `opensdd sdd audit`, o relatório exibe todas as métricas disponíveis.
- Métricas não disponíveis por dependência ausente exibem aviso claro.
- `meta_evolution.last_run_at` é atualizado no `config.yaml` após execução.
- O comando não modifica nenhum artefato além do `config.yaml`.

## Declaração de Impacto Frontend
- Status: none
- Justificativa: Comando de auditoria é CLI interno do SDD sem superfície de produto.
- Comando: `opensdd sdd frontend-impact FEAT-0016 --status none --reason "Comando de auditoria é CLI interno do SDD sem superfície de produto."`

## Referências
- FEAT: FEAT-0016
- EPIC: EPIC-0008
- Bloqueado por: FEAT-0012, FEAT-0013, FEAT-0014, FEAT-0015
- ADR: —
- FGAP: —
