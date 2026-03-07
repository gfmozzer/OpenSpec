import { CLI_NAME } from '../branding.js';
const DEFAULT_TOOLS = ['codex', 'cursor', 'claude', 'gemini'];
const DEFAULT_SOURCE_REPO = 'https://github.com/sickn33/antigravity-awesome-skills';
const LOCAL_SDD_SKILL_IDS = new Set([
    'source-intake-sdd',
    'business-extractor-sdd',
    'frontend-extractor-sdd',
    'planning-normalizer-sdd',
]);
const CURATED_BUNDLES = [
    {
        id: 'source-intake',
        title: 'Source Intake',
        domains: ['intake', 'planning', 'frontend'],
        phases: ['discover', 'plan'],
        skillIds: [
            'source-intake-sdd',
            'business-extractor-sdd',
            'frontend-extractor-sdd',
            'planning-normalizer-sdd',
        ],
    },
    {
        id: 'essentials-core',
        title: 'Essentials Core',
        domains: ['general', 'process'],
        phases: ['discover', 'plan', 'execute', 'verify', 'finalize'],
        skillIds: [
            'concise-planning',
            'brainstorming',
            'lint-and-validate',
            'systematic-debugging',
            'test-driven-development',
            'doc-coauthoring',
            'create-pr',
            'git-pushing',
            'kaizen',
            'code-review-checklist',
        ],
    },
    {
        id: 'architecture-backend',
        title: 'Architecture Backend',
        domains: ['architecture', 'backend'],
        phases: ['discover', 'plan', 'execute', 'verify'],
        skillIds: [
            'architecture',
            'senior-architect',
            'architecture-patterns',
            'microservices-patterns',
            'domain-driven-design',
            'ddd-context-mapping',
            'ddd-tactical-patterns',
            'api-design-principles',
            'database-design',
            'typescript-expert',
        ],
    },
    {
        id: 'frontend-product',
        title: 'Frontend Product',
        domains: ['frontend', 'product'],
        phases: ['plan', 'execute', 'verify'],
        skillIds: [
            'frontend-design',
            'react-best-practices',
            'react-patterns',
            'nextjs-best-practices',
            'nextjs-app-router-patterns',
            'tailwind-patterns',
            'ui-ux-pro-max',
            'mobile-design',
            'form-cro',
            'frontend-developer',
        ],
    },
    {
        id: 'security-quality',
        title: 'Security Quality',
        domains: ['security', 'quality'],
        phases: ['plan', 'execute', 'verify'],
        skillIds: [
            'security-auditor',
            'api-security-best-practices',
            'backend-security-coder',
            'frontend-security-coder',
            'cc-skill-security-review',
            'top-web-vulnerabilities',
            'vulnerability-scanner',
            'ethical-hacking-methodology',
            'cloud-penetration-testing',
            'pci-compliance',
        ],
    },
    {
        id: 'ai-agentic',
        title: 'AI Agentic',
        domains: ['ai', 'agent'],
        phases: ['discover', 'plan', 'execute', 'verify', 'finalize'],
        skillIds: [
            'prompt-engineering',
            'context-window-management',
            'ai-agents-architect',
            'agent-evaluation',
            'mcp-builder',
            'rag-engineer',
            'rag-implementation',
            'prompt-caching',
            'langgraph',
            'langfuse',
        ],
    },
    {
        id: 'devops-integration',
        title: 'DevOps Integration',
        domains: ['devops', 'integration'],
        phases: ['plan', 'execute', 'verify', 'finalize'],
        skillIds: [
            'docker-expert',
            'aws-serverless',
            'kubernetes-architect',
            'terraform-specialist',
            'environment-setup-guide',
            'deployment-procedures',
            'observability-engineer',
            'distributed-tracing',
            'performance-engineer',
            'incident-responder',
        ],
    },
];
function titleFromSkillId(skillId) {
    return skillId
        .split('-')
        .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
        .join(' ');
}
function priorityForIndex(index) {
    const priority = 10 - index;
    return priority < 6 ? 6 : priority;
}
function buildSkillEntry(bundle, skillId, index) {
    const isLocalSkill = LOCAL_SDD_SKILL_IDS.has(skillId);
    return {
        id: skillId,
        source_repo: isLocalSkill ? 'local://opensdd/sdd' : DEFAULT_SOURCE_REPO,
        source_path: isLocalSkill ? `.sdd/skills/curated/${skillId}/SKILL.md` : `skills/${skillId}/SKILL.md`,
        title: titleFromSkillId(skillId),
        description: isLocalSkill
            ? `Skill nativa do SDD para ${bundle.title.toLowerCase()}.`
            : `Skill curada para ${bundle.title.toLowerCase()} no fluxo SDD.`,
        phases: bundle.phases,
        domains: bundle.domains,
        tools: DEFAULT_TOOLS,
        bundle_ids: [bundle.id],
        priority: priorityForIndex(index),
    };
}
export const DEFAULT_CURATED_SKILL_CATALOG = {
    version: 1,
    skills: CURATED_BUNDLES.flatMap((bundle) => bundle.skillIds.map((skillId, index) => buildSkillEntry(bundle, skillId, index))),
    bundles: CURATED_BUNDLES.map((bundle) => ({
        id: bundle.id,
        title: bundle.title,
        skill_ids: [...bundle.skillIds],
    })),
};
export const SOURCE_INTAKE_SDD_SKILL_MD = `---
name: source-intake-sdd
description: Lê a pasta .sdd/deposito, indexa as fontes brutas e classifica o material de entrada do projeto.
---

# Source Intake SDD

Use esta skill quando houver material bruto do projeto em \`.sdd/deposito/\`.

## Objetivo

Transformar um conjunto heterogeneo de documentos em um inventario operacional rastreavel.

## Onde procurar

- \`.sdd/deposito/prds/\`
- \`.sdd/deposito/rfcs/\`
- \`.sdd/deposito/briefings/\`
- \`.sdd/deposito/historias/\`
- \`.sdd/deposito/wireframes/\`
- \`.sdd/deposito/html-mocks/\`
- \`.sdd/deposito/referencias-visuais/\`
- \`.sdd/deposito/entrevistas/\`
- \`.sdd/deposito/anexos/\`
- \`.sdd/deposito/legado/\`

## Fluxo obrigatorio

1. Liste as fontes existentes.
2. Classifique cada fonte por tipo.
3. Registre/atualize \`.sdd/state/source-index.yaml\`.
4. Preencha para cada item:
   - \`type\`
   - \`path\`
   - \`title\`
   - \`status\`
   - \`summary\`
   - \`used_by\`
   - \`consolidation_targets\`
5. Nao gere backlog direto nesta etapa.

## Regra de ouro

- Fonte bruta nao e fonte canonica.
- O objetivo aqui e inventariar e classificar.
- O backlog so nasce depois da normalizacao semantica.
`;
export const BUSINESS_EXTRACTOR_SDD_SKILL_MD = `---
name: business-extractor-sdd
description: Extrai historias, regras de negocio, atores, integracoes e restricoes a partir das fontes do deposito.
---

# Business Extractor SDD

Use esta skill quando o repositorio ja possui PRDs, briefings, historias ou documentos consolidados.

## Saidas esperadas

- atualizacao de contexto canônico:
  - \`.sdd/state/architecture.yaml\`
  - \`.sdd/state/service-catalog.yaml\`
  - \`.sdd/state/tech-stack.yaml\`
  - \`.sdd/state/integration-contracts.yaml\`
- sugestoes de:
  - RADs
  - FEATs
  - INSIGHTs apenas quando houver ambiguidade real

## Como decidir o destino

- Se o trecho descreve estrutura do sistema, consolide em contexto.
- Se o trecho e uma decisao grande e aprovada, normalize em RAD.
- Se o trecho ja e claro e executavel, normalize em FEAT.
- Se o trecho estiver ambíguo, contraditório ou incompleto, normalize em INSIGHT.

## Nao faca

- Nao transforme PRD inteiro em task list direta.
- Nao invente detalhes tecnicos nao presentes na fonte.
`;
export const FRONTEND_EXTRACTOR_SDD_SKILL_MD = `---
name: frontend-extractor-sdd
description: Extrai superficies, rotas, componentes, gaps e decisoes de frontend a partir de imagens, html, wireframes e referencias.
---

# Frontend Extractor SDD

Use esta skill quando existir inspiracao visual ou definicao de UI/UX em \`.sdd/deposito/\`.

## Fontes aceitas

- wireframes
- screenshots
- imagens de referencia
- html mockado
- historias com impacto de interface

## Saidas esperadas

- \`.sdd/state/frontend-map.yaml\`
- \`.sdd/state/frontend-gaps.yaml\`
- \`.sdd/state/frontend-decisions.yaml\`

## Criterios de classificacao

- O que ja esta claramente definido como tela/rota entra em frontend-map.
- O que esta faltando, mas necessario para cobrir jornada, entra em frontend-gaps.
- O racional de UX, navegacao, layout, padroes e inspiracao entra em frontend-decisions.
- Se uma superficie ja estiver bem definida e executavel, ela pode virar FEAT.
`;
export const PLANNING_NORMALIZER_SDD_SKILL_MD = `---
name: planning-normalizer-sdd
description: Converte o material extraído das fontes em backlog operacional do SDD, priorizando contexto, RADs e FEATs.
---

# Planning Normalizer SDD

Use esta skill depois de inventariar as fontes e extrair negocio/frontend.

## Missao

Transformar conhecimento consolidado em artefatos operacionais do SDD.

## Ordem de normalizacao

1. contexto canônico
2. RADs
3. FEATs
4. INSIGHTs apenas para excecoes

## Regras

- Nao passe por debate quando a fonte ja for consolidada e inequívoca.
- Use debate apenas para incerteza, conflito, ambiguidade ou opcao arquitetural aberta.
- Conecte FEATs com \`blocked_by\`, \`lock_domains\`, \`produces\` e \`consumes\` quando houver evidência suficiente.
- Registre em \`.sdd/state/source-index.yaml\` quais fontes geraram cada RAD/FEAT.

## Resultado minimo

Ao final, o agente deve conseguir responder:
- o que e contexto do sistema;
- o que ja esta aprovado para planejamento;
- o que ja pode entrar em execucao.
`;
export function buildCuratedBundlesMarkdown() {
    const lines = [
        '# Curadoria de Skills (PT-BR)',
        '',
        `Este arquivo descreve a curadoria inicial de ${DEFAULT_CURATED_SKILL_CATALOG.skills.length} skills para uso no SDD.`,
        '',
        '## Objetivo',
        '- Reduzir o universo de 900+ skills para um conjunto pratico.',
        '- Acelerar planejamento, execucao e validacao.',
        '- Facilitar delegacao entre agentes em portugues do Brasil.',
        '',
    ];
    CURATED_BUNDLES.forEach((bundle, index) => {
        lines.push(`## Bundle ${index + 1}: ${bundle.title} (${bundle.skillIds.length})`);
        bundle.skillIds.forEach((skillId) => lines.push(`- ${skillId}`));
        lines.push('');
    });
    lines.push('## Fonte canonica');
    lines.push('- `.sdd/state/skill-catalog.yaml`');
    lines.push('');
    lines.push('## Regra operacional');
    lines.push('- As skills deste documento sao referencia de curadoria.');
    lines.push('- O estado oficial de skills e bundles deve ser editado apenas no YAML canonico.');
    lines.push('');
    return lines.join('\n');
}
export const REPO_CONTEXT_BOOTSTRAP_SKILL_MD = `---
name: repo-context-bootstrap
description: Inspeciona um repositorio existente para preencher contexto inicial do SDD com evidencia, evitando inferencias frageis.
---

# Repo Context Bootstrap

Use esta skill quando o projeto ja existe e voce precisa criar contexto inicial confiavel para o SDD.

## Objetivo

Mapear e documentar, com base em evidencias do repositorio:
- stack tecnologica;
- catalogo de servicos;
- arquitetura inicial;
- integracoes/contratos;
- mapa de diretorios relevantes.

## Fluxo obrigatorio

1. Execute \`${CLI_NAME} sdd init --frontend\` se a estrutura SDD ainda nao existir.
2. Execute \`${CLI_NAME} sdd init-context --mode merge\`.
3. Leia os arquivos gerados:
   - \`.sdd/core/spec-tecnologica.md\`
   - \`.sdd/core/servicos.md\`
   - \`.sdd/core/arquitetura.md\`
   - \`.sdd/core/repo-map.md\`
4. Valide com \`${CLI_NAME} sdd check --render\`.
5. Registre qualquer duvida ou baixa confianca como item de revisao em \`.sdd/pendencias/tech-debt.md\`.

## Regras de qualidade

- Nao invente servicos que nao aparecem em diretorios ou manifests.
- Nao invente integracoes sem sinal concreto em dependencias ou configs.
- Priorize evidencias em:
  - \`package.json\`, \`pnpm-workspace.yaml\`, \`docker-compose.yml\`;
  - diretorios \`apps/\`, \`services/\`, \`packages/\`, \`src/\`;
  - arquivos de configuracao de framework.
- Quando houver incerteza, registre como "precisa revisao humana".

## Resultado esperado

Apos a execucao, o projeto deve ter contexto inicial util o suficiente para um agente novo continuar sem inspecao ampla de codigo.
`;
export const BUILT_IN_SDD_SKILLS = {
    'repo-context-bootstrap': REPO_CONTEXT_BOOTSTRAP_SKILL_MD,
    'source-intake-sdd': SOURCE_INTAKE_SDD_SKILL_MD,
    'business-extractor-sdd': BUSINESS_EXTRACTOR_SDD_SKILL_MD,
    'frontend-extractor-sdd': FRONTEND_EXTRACTOR_SDD_SKILL_MD,
    'planning-normalizer-sdd': PLANNING_NORMALIZER_SDD_SKILL_MD,
};
//# sourceMappingURL=default-skills.js.map