import { CLI_NAME } from '../branding.js';
export function buildSddInternalReadme(memoryDir = '.sdd') {
    return `# SDD README

Este diretorio guarda a memoria operacional do projeto.

## O que ler primeiro
1. \`README.md\`
2. \`${memoryDir}/AGENT.md\`
3. \`${memoryDir}/core/index.md\`
4. \`${memoryDir}/core/arquitetura.md\`
5. \`${memoryDir}/core/servicos.md\`
6. \`${memoryDir}/core/spec-tecnologica.md\`
7. \`${memoryDir}/core/repo-map.md\`
8. \`${memoryDir}/core/fontes.md\`
9. \`${memoryDir}/core/frontend-decisions.md\` (quando frontend estiver ativado)

## Como operar
1. Rode \`${CLI_NAME} sdd onboard system\` para entender o estado atual.
2. Rode \`${CLI_NAME} sdd next\` para ver o que pode comecar agora.
3. Rode \`${CLI_NAME} sdd start FEAT-###\` para abrir a execucao.
4. Rode \`${CLI_NAME} sdd context FEAT-###\` antes de implementar.
5. Rode \`${CLI_NAME} sdd finalize --ref FEAT-###\` ao consolidar a feature.

## Pastas principais
- \`core/\`: visao macro atual do sistema.
- \`discovery/\`: insights, debates, radar e descartes.
- \`pendencias/\`: backlog, progresso, gaps e fila de finalize.
- \`state/\`: fonte canonica em YAML.
- \`skills/\`: curadoria local e bundles.
- \`templates/\`: modelos base de spec, plano, tasks e changelog.
- \`active/\`: workspaces ativos por FEAT.
- \`deposito/\`: documentos brutos, PRDs, wireframes e referencias externas.

## Regra operacional
Toda feature concluida deve atualizar a documentacao relevante antes do \`finalize\`.
`;
}
export const TEMPLATE_1_SPEC_MD = `# Especificacao: [NOME_DA_FEATURE]

## Objetivo
Descreva o que esta feature precisa entregar para o usuario ou para o sistema.

## Historias do Usuario
- Como um [ator], quero [acao] para que [motivo].

## Regras de Negocio
- [ ] Regra 1
- [ ] Regra 2

## Cenarios de Aceite
- Ao fazer [x], espero que [y].

## Referencias
- FEAT:
- RAD:
- FGAP:
- ADR:
`;
export const TEMPLATE_2_PLAN_MD = `# Plano de Execucao: [NOME_DA_FEATURE]

## Abordagem Tecnica
Descreva como a solucao sera implementada.

## Impacto Arquitetural
- Servicos afetados:
- Contratos afetados:
- Dados afetados:

## Impacto no Frontend
- Rotas afetadas:
- Gaps criados ou resolvidos:
- Decisoes de frontend relevantes:

## Skills e Bundles
- Skills consultadas:
- Bundles sugeridos:

## Regra de Interseccao
- Dividas tecnicas relacionadas:
- Frontend gaps relacionados:
- Documentacao que precisa mudar:
`;
export const TEMPLATE_3_TASKS_MD = `# Checklist de Tarefas: [NOME_DA_FEATURE]

## Passos de Implementacao
- [ ] Entender o contexto com \`${CLI_NAME} sdd context FEAT-###\`
- [ ] Ajustar ou confirmar o plano tecnico
- [ ] Implementar o codigo
- [ ] Validar comportamento e testes

## Consolidacao Obrigatoria
- [ ] Atualizar \`README.md\`, \`.sdd/AGENT.md\`, \`AGENTS.md\`, \`AGENT.md\` e os arquivos de \`.sdd/core/\` afetados
- [ ] Registrar gaps de frontend criados ou resolvidos
- [ ] Atualizar o changelog da feature
- [ ] Arquivar a mudanca tecnica e executar \`${CLI_NAME} sdd finalize --ref FEAT-###\`
`;
export const TEMPLATE_4_CHANGELOG_MD = `# Changelog de Arquitetura: [NOME_DA_FEATURE]

## Novas Entidades / Modelos
-

## Novas Rotas / Endpoints / Eventos
-

## Mudancas Estruturais
-

## Documentos que Precisam Ser Atualizados
-
`;
//# sourceMappingURL=default-bootstrap-files.js.map