import { CLI_NAME } from '../branding.js';

export interface SddReadmeFolders {
  discovery?: string;
  planning?: string;
  skills?: string;
  templates?: string;
  active?: string;
  deposito?: string;
  prompts?: string;
}

export function buildSddInternalReadme(
  memoryDir = '.sdd',
  folders: SddReadmeFolders = {}
): string {
  const discovery = folders.discovery || 'discovery';
  const planning = folders.planning || 'pendencias';
  const skills = folders.skills || 'skills';
  const templates = folders.templates || 'templates';
  const active = folders.active || 'active';
  const deposito = folders.deposito || 'deposito';
  const prompts = folders.prompts || 'prompts';
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
- \`${discovery}/\`: insights, debates, radar e descartes.
- \`${planning}/\`: backlog, progresso, gaps e fila de finalize.
- \`state/\`: fonte canonica em YAML.
- \`${skills}/\`: curadoria local e bundles.
- \`${templates}/\`: modelos base de spec, plano, tasks e changelog.
- \`${prompts}/\`: prompts recomendados para workflows comuns.
- \`${active}/\`: workspaces ativos por FEAT.
- \`${deposito}/\`: documentos brutos, PRDs, wireframes e referencias externas.

## Regra operacional
Toda feature concluida deve atualizar a documentacao relevante antes do \`finalize\`.
`;
}

export const PROMPTS_README_MD = `# Prompts Recomendados SDD

Use estes prompts para acelerar workflows no agente sem perder padrao.

## Ordem recomendada para material bruto
1. \`00-comece-por-aqui.md\`
2. \`01-ingestao-deposito.md\`
3. \`02-normalizar-planejamento.md\`
4. \`03-execucao-feature.md\`
5. \`04-consolidacao-finalize.md\`

Regra: os prompts guiam o agente, mas o estado canônico continua em \`.sdd/state/*.yaml\`.
`;

export const PROMPT_00_COMECE_POR_AQUI_MD = `# Comece Por Aqui (Primeiro Uso)

Se voce nunca usou o OpenSDD, siga exatamente esta ordem.

## 1) Instalar e iniciar no projeto

No terminal, dentro da pasta do seu projeto:

\`\`\`bash
opensdd install --tools none --lang pt-BR --layout pt-BR
opensdd sdd init --frontend --lang pt-BR --layout pt-BR
opensdd sdd init-context
opensdd sdd check --render
opensdd sdd onboard system
\`\`\`

## 2) Entender as pastas principais

- \`.sdd/deposito/\`: onde voce coloca material bruto (PRD, wireframe, historias, referencias).
- \`.sdd/state/\`: fonte canônica (verdade oficial em YAML).
- \`.sdd/core/\`: visao humana gerada automaticamente.
- \`.sdd/planejamento/\` ou \`.sdd/pendencias/\`: backlog, progresso, fila de finalize.
- \`.sdd/execucao/\` ou \`.sdd/active/\`: pacote de trabalho por FEAT.

## 3) Tenho PRD/wireframe/historias. E agora?

1. Copie os arquivos para \`.sdd/deposito/\` (subpastas corretas).
2. Rode:

\`\`\`bash
opensdd sdd ingest-deposito --title "Planejamento inicial do sistema"
\`\`\`

3. Revise:

\`\`\`bash
opensdd sdd check --render
opensdd sdd next
\`\`\`

Resultado esperado:
- fontes indexadas em \`.sdd/state/source-index.yaml\`
- RAD criado/reaproveitado
- FEATs geradas no backlog
- primeira FEAT pronta iniciada automaticamente (quando possivel)

## 4) Como executar uma feature

\`\`\`bash
opensdd sdd start FEAT-001 --fluxo padrao
opensdd sdd context FEAT-001
\`\`\`

Implemente e atualize o pacote da FEAT:
- \`1-especificacao.md\` (ou \`1-spec.md\`)
- \`2-planejamento.md\` (ou \`2-plan.md\`)
- \`3-tarefas.md\` (ou \`3-tasks.md\`)
- \`4-historico.md\` (ou \`4-changelog.md\`)

## 5) Como finalizar sem perder contexto

\`\`\`bash
opensdd archive <change-name>
opensdd sdd finalize --ref FEAT-001
opensdd sdd check --render
opensdd sdd onboard system
\`\`\`

Regra de ouro:
- Uma FEAT so esta realmente pronta depois da consolidacao documental.

## 6) Historia de uso curta (Marina)

Marina colocou PRD + wireframe em \`.sdd/deposito/\`.
Ela rodou \`opensdd sdd ingest-deposito\` e recebeu RAD + FEATs prontas para iniciar.
Comecou pela FEAT prioritaria com \`opensdd sdd start FEAT-001\`.
Antes de codar, rodou \`opensdd sdd context FEAT-001\`.
Ao terminar, arquivou a change e executou \`opensdd sdd finalize --ref FEAT-001\`.
Resultado: backlog atualizado, docs sincronizadas e proxima FEAT liberada sem adivinhacao.

## 7) Comandos essenciais (resumo)

- \`opensdd sdd onboard system\`: entender o estado atual.
- \`opensdd sdd ingest-deposito\`: transformar material bruto em trilha executavel.
- \`opensdd sdd next\`: ver o que pode comecar agora.
- \`opensdd sdd start FEAT-###\`: abrir execucao da feature.
- \`opensdd sdd context FEAT-###\`: gerar contexto focado.
- \`opensdd sdd finalize --ref FEAT-###\`: consolidar memoria e concluir.
`;

export const PROMPT_01_INGESTAO_DEPOSITO_MD = `# Prompt: Ingestao de Deposito

Use as skills:
- source-intake-sdd
- business-extractor-sdd
- frontend-extractor-sdd
- planning-normalizer-sdd

Objetivo:
1. Varrer \`.sdd/deposito/\`.
2. Atualizar \`.sdd/state/source-index.yaml\`.
3. Consolidar contexto canônico (\`architecture\`, \`service-catalog\`, \`tech-stack\`, \`integration-contracts\`, frontend quando habilitado).
4. Gerar trilha executável (RAD + FEATs) com rastreabilidade de origem.

Saida obrigatoria:
- resumo das fontes lidas;
- IDs criados/atualizados (RAD/FEAT/FGAP/INS quando houver ambiguidade);
- proximos comandos CLI recomendados.
`;

export const PROMPT_02_NORMALIZAR_PLANEJAMENTO_MD = `# Prompt: Normalizar Planejamento

Objetivo:
Transformar material consolidado em plano executável com dependências claras.

Instrucoes:
1. Parta de \`.sdd/state/source-index.yaml\` e \`.sdd/core/*.md\`.
2. Proponha RADs e FEATs com nomes claros em portugues.
3. Defina dependencias (\`blocked_by\`) e conflitos (\`lock_domains\`).
4. Liste onde pode paralelizar.
5. Termine com checklist de consolidacao documental por feature.
`;

export const PROMPT_03_EXECUCAO_FEATURE_MD = `# Prompt: Execucao de Feature

Objetivo:
Executar uma FEAT sem perder rastreabilidade.

Instrucoes:
1. Rode \`opensdd sdd context FEAT-###\`.
2. Atualize \`.sdd/execucao|active/FEAT-###/\` (spec/plano/tarefas/historico).
3. Implemente.
4. Atualize docs canônicas afetadas.
5. Finalize com \`opensdd archive <change-name>\` e \`opensdd sdd finalize --ref FEAT-###\`.
`;

export const PROMPT_04_CONSOLIDACAO_FINALIZE_MD = `# Prompt: Consolidacao e Finalize

Objetivo:
Fechar uma feature com memoria operacional completa.

Checklist:
1. Revisar diff técnico da FEAT.
2. Atualizar documentação central (\`README.md\`, \`.sdd/AGENT.md\`, \`.sdd/core/*.md\`, \`AGENTS.md\`, \`AGENT.md\`).
3. Garantir registro de gaps/decisoes de frontend quando aplicavel.
4. Rodar \`opensdd sdd check --render\`.
5. Rodar \`opensdd sdd finalize --ref FEAT-###\` e reportar docs atualizados.
`;

export const TEMPLATE_1_SPEC_MD = `# Especificacao: [NOME_DA_ENTREGA]

## Resumo da Entrega
- Entrega:
- Fluxo: direto|padrao|rigoroso
- Origem: INS/DEB/RAD/FEAT direta

## Problema
Descreva a dor real que esta entrega resolve.

## Objetivo
Descreva o resultado esperado para usuario ou sistema.

## Escopo
- [ ] Item 1
- [ ] Item 2

## Fora do Escopo
- [ ] Item 1
- [ ] Item 2

## Valor Esperado
- Indicador:
- Meta:

## Regras de Negocio
- [ ] Regra 1
- [ ] Regra 2

## Criterios de Aceite
- CA-01:
- CA-02:
- CA-03:

## Referencias
- FEAT:
- RAD:
- FGAP:
- ADR:
`;

export const TEMPLATE_2_PLAN_MD = `# Planejamento: [NOME_DA_ENTREGA]

## Abordagem Tecnica
Descreva como a solucao sera implementada.

## Fatias Executaveis
- F1:
- F2:
- F3:

## Paralelizacao
- Pode rodar em paralelo:
- Depende de:

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

export const TEMPLATE_3_TASKS_MD = `# Checklist de Tarefas: [NOME_DA_ENTREGA]

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

## Definition of Done
- [DOC] Documentacao central atualizada
- [UI] Lacunas/decisoes de frontend registradas (quando aplicavel)
- [ARQ] Change tecnica arquivada no OpenSpec
- [MEM] Memoria consolidada com \`${CLI_NAME} sdd consolidar --ref FEAT-###\`
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
