# Checklist de Tarefas: [NOME_DA_FEATURE]

## Passos de Implementacao
- [ ] Entender o contexto com `opensdd sdd context FEAT-###`
- [ ] Ajustar ou confirmar o plano tecnico
- [ ] Implementar o codigo
- [ ] Validar comportamento e testes
- [ ] Declarar impacto frontend com `opensdd sdd frontend-impact FEAT-### --status required|none --reason "..."`

## Consolidacao Obrigatoria
- [ ] Atualizar `README.md`, `.sdd/AGENT.md`, `AGENTS.md`, `AGENT.md` e os arquivos de `.sdd/core/` afetados
- [ ] Se impacto frontend=required, garantir FGAP aberto/atualizado antes do finalize
- [ ] Registrar gaps de frontend criados ou resolvidos
- [ ] Atualizar o changelog da feature
- [ ] Arquivar a mudanca tecnica e executar `opensdd sdd finalize --ref FEAT-###`
