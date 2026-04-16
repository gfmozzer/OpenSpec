# Epic EPIC-0009

## Origem
- Debate: DEB-0009
- Titulo base: Estratégia de convivência entre projetos com IDs de 3 e 4 dígitos

## Resumo aprovado
Tornar a largura numérica dos IDs um contrato por projeto, aplicado a qualquer artefato com sequenciador (INS, DEB, EPIC, FEAT, FGAP, TD, SRC, ADR derivado de FEAT). Projetos legados permanecem em 3 dígitos; projetos novos permanecem em 4 dígitos. A emissão, renderização, validação e compatibilidade obedecem à largura canônica do projeto. Histórico existente é preservado como fato e a política aplica-se a emissões futuras e views renderizadas.

### Escopo principal
- Definir onde vive a largura canônica do projeto (`.sdd/config.yaml` ou autodetecção)
- Aplicar a política a toda família sequencial: INS, DEB, EPIC, FEAT, FGAP, TD, SRC
- ADR seguir a largura da FEAT associada
- Compatibilidade de leitura ampla (`\d{3,}`)
- Emissão nova obedecendo a largura do projeto
- Renderização consistente nas views e comandos
- Atualizar docs, templates e mensagens que assumem `###`
- Revisar testes e fixtures que assertam padrões de 3 dígitos

## Status
READY

