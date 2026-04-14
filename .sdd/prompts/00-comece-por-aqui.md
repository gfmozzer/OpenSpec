# Comece Por Aqui (Primeiro Uso)

Se voce nunca usou o OpenSDD, siga exatamente esta ordem.

## 1) Instalar e iniciar no projeto

No terminal, dentro da pasta do seu projeto:

```bash
opensdd install --tools none --lang pt-BR --layout pt-BR
opensdd sdd init --frontend --lang pt-BR --layout pt-BR
opensdd sdd init-context
opensdd sdd check --render
opensdd sdd onboard system
```

## 2) Entender as pastas principais

- `.sdd/deposito/`: onde voce coloca material bruto (PRD, wireframe, historias, referencias).
- `.sdd/state/`: fonte canônica (verdade oficial em YAML).
- `.sdd/core/`: visao humana gerada automaticamente.
- `.sdd/planejamento/` ou `.sdd/pendencias/`: backlog, progresso, fila de finalize.
- `.sdd/execucao/` ou `.sdd/active/`: pacote de trabalho por FEAT.

## 3) Tenho PRD/wireframe/historias. E agora?

1. Copie os arquivos para `.sdd/deposito/` (subpastas corretas).
2. Rode:

```bash
opensdd sdd ingest-deposito --title "Planejamento inicial do sistema"
```

3. Revise:

```bash
opensdd sdd check --render
opensdd sdd next
```

Resultado esperado:
- fontes indexadas em `.sdd/state/source-index.yaml`
- EPIC criado/reaproveitado (`RAD` permanece apenas como alias legado)
- FEATs geradas no backlog
- primeira FEAT pronta iniciada automaticamente (quando possivel)

## 4) Como executar uma feature

```bash
opensdd sdd start FEAT-0001 --fluxo padrao
opensdd sdd context FEAT-0001
opensdd sdd frontend-impact FEAT-0001 --status required --reason "Nova rota e elementos de interface"
```

Implemente e atualize o pacote da FEAT:
- `1-especificacao.md` (ou `1-spec.md`)
- `2-planejamento.md` (ou `2-plan.md`)
- `3-tarefas.md` (ou `3-tasks.md`)
- `4-historico.md` (ou `4-changelog.md`)

## 5) Como finalizar sem perder contexto

```bash
opensdd archive <change-name>
opensdd sdd finalize --ref FEAT-0001
opensdd sdd check --render
opensdd sdd onboard system
```

Regra de ouro:
- Uma FEAT so esta realmente pronta depois da consolidacao documental.

## 6) Historia de uso curta (Marina)

Marina colocou PRD + wireframe em `.sdd/deposito/`.
Ela rodou `opensdd sdd ingest-deposito` e recebeu um EPIC + FEATs prontas para iniciar.
Comecou pela FEAT prioritaria com `opensdd sdd start FEAT-0001`.
Antes de codar, rodou `opensdd sdd context FEAT-0001`.
Ao terminar, arquivou a change e executou `opensdd sdd finalize --ref FEAT-0001`.
Resultado: backlog atualizado, docs sincronizadas e proxima FEAT liberada sem adivinhacao.

## 7) Comandos essenciais (resumo)

- `opensdd sdd onboard system`: entender o estado atual.
- `opensdd sdd ingest-deposito`: transformar material bruto em trilha executavel.
- `opensdd sdd next`: ver o que pode comecar agora.
- `opensdd sdd start FEAT-0001`: abrir execucao da feature.
- `opensdd sdd context FEAT-0001`: gerar contexto focado.
- `opensdd sdd frontend-impact FEAT-0001 --status required|none --reason "...":` declarar impacto frontend.
- `opensdd sdd finalize --ref FEAT-0001`: consolidar memoria e concluir.
