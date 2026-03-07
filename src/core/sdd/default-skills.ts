import type { SkillBundle, SkillCatalogEntry, SkillCatalogState } from './types.js';

interface CuratedBundleSeed {
  id: string;
  title: string;
  domains: string[];
  phases: string[];
  skillIds: string[];
}

const DEFAULT_TOOLS = ['codex', 'cursor', 'claude', 'gemini'];
const DEFAULT_SOURCE_REPO = 'https://github.com/sickn33/antigravity-awesome-skills';

const CURATED_BUNDLES: CuratedBundleSeed[] = [
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

function titleFromSkillId(skillId: string): string {
  return skillId
    .split('-')
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function priorityForIndex(index: number): number {
  const priority = 10 - index;
  return priority < 6 ? 6 : priority;
}

function buildSkillEntry(bundle: CuratedBundleSeed, skillId: string, index: number): SkillCatalogEntry {
  return {
    id: skillId,
    source_repo: DEFAULT_SOURCE_REPO,
    source_path: `skills/${skillId}/SKILL.md`,
    title: titleFromSkillId(skillId),
    description: `Skill curada para ${bundle.title.toLowerCase()} no fluxo SDD.`,
    phases: bundle.phases,
    domains: bundle.domains,
    tools: DEFAULT_TOOLS,
    bundle_ids: [bundle.id],
    priority: priorityForIndex(index),
  };
}

export const DEFAULT_CURATED_SKILL_CATALOG: SkillCatalogState = {
  version: 1,
  skills: CURATED_BUNDLES.flatMap((bundle) =>
    bundle.skillIds.map((skillId, index) => buildSkillEntry(bundle, skillId, index))
  ),
  bundles: CURATED_BUNDLES.map<SkillBundle>((bundle) => ({
    id: bundle.id,
    title: bundle.title,
    skill_ids: [...bundle.skillIds],
  })),
};

export function buildCuratedBundlesMarkdown(): string {
  const lines: string[] = [
    '# Curadoria de Skills (PT-BR)',
    '',
    'Este arquivo descreve a curadoria inicial de 60 skills para uso no SDD.',
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

1. Execute \`openspec sdd init --frontend\` se a estrutura SDD ainda nao existir.
2. Execute \`openspec sdd init-context --mode merge\`.
3. Leia os arquivos gerados:
   - \`.sdd/core/spec-tecnologica.md\`
   - \`.sdd/core/servicos.md\`
   - \`.sdd/core/arquitetura.md\`
   - \`.sdd/core/repo-map.md\`
4. Valide com \`openspec sdd check --render\`.
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
