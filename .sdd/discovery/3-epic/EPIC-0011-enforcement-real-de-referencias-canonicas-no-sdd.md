# Epic EPIC-0011

## Origem
- Debate Base: DEB-0012
- Insight de Origem: INS-0012
- Titulo base: Enforcement real de referências canônicas no SDD
- Decisao aprovada no debate: Opcao C — contrato canônico dual com enforcement real
- Data de aprovacao: 2026-04-17
- Referencias operacionais ja existentes:
  - `DEB-0010` para a fronteira canonica do backend com a `devtrack-foundation-api`
  - `docs/foundation-backend-reference-structure.md` como mapa derivado da arvore de pacotes backend
  - `README.md` e `AGENTS.md` para a fronteira oficial entre Foundation e OpenSDD

## Resumo aprovado
O `EPIC-0011` formaliza a transformação de referências canônicas em contrato operacional real dentro do OpenSDD. A partir do debate `DEB-0012`, a direção aprovada é endurecer o elo entre referência declarada e artefato gerado, com backend ancorado explicitamente na `devtrack-foundation-api`, frontend com base canônica equivalente a ser consolidada, e ambos conectados a prompts, templates, checks semânticos, política de override por ADR e modo estrito progressivo.

O problema que este Epic resolve não é somente “falta de guideline”. A dor central é a ausência de consequência operacional quando o usuário informa uma referência canônica. Hoje o sistema ainda permite que prompts, templates e saídas finais se afastem dessa referência em nomenclatura, pacotes, fronteiras, contratos e organização estrutural. O objetivo do Epic é reduzir esse retrabalho, diminuir revisão corretiva manual e tornar o bootstrap de projetos derivados previsível, auditável e aderente ao modelo solicitado.

## Objetivo Cognitivo e de Controle Estrutural
Este Epic não deve ser lido apenas como “mais uma camada de validação”. O objetivo principal é ampliar a cognitividade operacional da ferramenta, para que o OpenSDD:

- saia melhor de problemas comuns já mapeados;
- reaja com mais direção em problemas complexos e ambíguos;
- detecte perda de contexto antes que ela contamine plano, pacote e nomenclatura;
- reduza variação indevida entre pedido, plano, artefato gerado e estado canônico;
- produza alertas estruturais com severidade progressiva quando guard rails forem tocados ou violados.

Em termos práticos, isso significa que o runtime precisa ganhar uma camada explícita de:

- memória estrutural da referência;
- verificação semântica de aderência;
- detecção de drift de plano e de contexto;
- política clara de alerta, bloqueio e override.

Hoje o repositório já tem peças importantes desse caminho:

- `warnAndLink()` em [src/core/sdd/dedup.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/dedup.ts) para dedupe semântico;
- `TransitionEngine` em [src/core/sdd/transition-engine.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/transition-engine.ts) para bloquear transições inválidas;
- `SddCheckCommand` em [src/core/sdd/check.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/check.ts) para integridade estrutural;
- `SddAuditCommand` em [src/core/sdd/operations.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/operations.ts) para saúde do ciclo e meta-evolução.

O que falta é unificar essas capacidades sob um contrato canônico explícito, com semântica de referência e sinais de guard rail que o sistema consiga interpretar e fazer cumprir.

## Planejamento e Desdobramento (Breakdown)
O desdobramento recomendado deste Epic deve seguir frentes independentes, mas coordenadas, para sair do estado atual de “referência documental” e chegar ao estado de “contrato operacional”.

### P0 — Base Contratual e Declaracao de Referencia
Primeiro precisamos formalizar no OpenSDD que uma referência pode ser:

- mandatória;
- recomendada;
- contextual.

Essa camada deve permitir registrar a referência no estado/config e associá-la ao domínio correto (`backend`, `frontend` ou `full-stack`). No backend, a fonte canônica permanece sendo a `devtrack-foundation-api`, com materialização controlada pelo OpenSDD e sem duplicação de canônico.

### P1 — Contrato Canonico Backend
No backend, a implementação precisa transformar a Foundation em contrato operacional verificável, cobrindo:

- estrutura de pacotes, módulos e nomenclatura;
- camadas obrigatórias;
- stack permitida e faixas de versão;
- contratos de integração, configuração e conexão;
- padrões obrigatórios como `ports/in`, `ports/out`, `use-cases`, `handlers`, `validators`, `repository-ports` e equivalentes;
- critérios objetivos de desvio aceitável.

O mapa derivado em `docs/foundation-backend-reference-structure.md` deve servir como referência operacional de apoio, sempre subordinada à Foundation.

### P2 — Base Canonica Frontend
O frontend ainda não possui base canônica madura equivalente. Antes de endurecer o enforcement dual completo, o OpenSDD precisa consolidar uma base explícita para frontend cobrindo:

- arquitetura de navegação, rotas e superfícies;
- taxonomia de páginas, componentes e nomenclatura;
- padrões de estado, fetch, cache e composição;
- contratos visuais e estruturais mínimos;
- acessibilidade e consistência de UX;
- relação obrigatória com backend, BFF ou API quando aplicável;
- exemplos canônicos reutilizáveis.

### P3 — Roteamento de Geracao
Prompts, templates, bundles e checklists não podem continuar genéricos quando houver referência mandatória declarada. O runtime deve selecionar material específico por referência, impedindo que o sistema responda com uma estrutura “genérica aceitável” quando o usuário pediu aderência a uma base canônica concreta.

Essa frente deve cobrir:

- roteamento de prompts por referência;
- templates específicos por domínio e referência;
- exemplos positivos e negativos embutidos;
- checklists de aderência por `backend`, `frontend` e `full-stack`.

### P4 — Validacao Semantica e Strict Mode
O `check` atual já valida bastante integridade estrutural, mas ainda não valida aderência semântica suficiente ao modelo canônico. Esta frente deve introduzir validações para:

- nomes;
- pastas;
- módulos;
- contratos;
- fronteiras entre camadas;
- padrões permitidos e proibidos.

O rollout aprovado no debate é progressivo:

- `warning` quando a referência for recomendada;
- `error` ou bloqueio quando a referência for obrigatória e o projeto estiver em modo estrito.

### P5 — Governanca de Desvio e Auditoria
O modelo aprovado não é de rigidez cega. Desvios estruturais relevantes continuam permitidos, mas precisam ser explícitos, justificados e auditáveis.

Essa frente deve consolidar:

- override controlado por ADR;
- trilha de auditoria de desvio canônico por FEAT e EPIC;
- métrica de aderência à referência no `sdd audit`;
- governança de sincronização entre OpenSDD, Foundation backend e futura base frontend.

## Estrutura de Pacotes a Implementar
Para evitar espalhar a lógica nova em arquivos utilitários genéricos e aumentar a inteligibilidade do runtime, a implementação recomendada deve introduzir um subdomínio dedicado sob `src/core/sdd/`.

```text
src/core/sdd/
├── reference-contract/
│   ├── model/
│   │   ├── reference-contract.ts
│   │   ├── guardrail.ts
│   │   └── alert.ts
│   ├── backend/
│   │   ├── foundation-backend-contract.ts
│   │   ├── package-structure.ts
│   │   ├── naming-rules.ts
│   │   └── boundary-rules.ts
│   ├── frontend/
│   │   ├── frontend-reference-contract.ts
│   │   ├── route-structure.ts
│   │   ├── component-taxonomy.ts
│   │   └── state-rules.ts
│   ├── validation/
│   │   ├── semantic-checker.ts
│   │   ├── package-boundary-checker.ts
│   │   ├── naming-checker.ts
│   │   ├── plan-variance-checker.ts
│   │   └── guardrail-evaluator.ts
│   ├── routing/
│   │   ├── prompt-router.ts
│   │   ├── template-router.ts
│   │   └── checklist-router.ts
│   ├── context/
│   │   ├── context-snapshot.ts
│   │   ├── context-recovery.ts
│   │   ├── canonical-drift-detector.ts
│   │   └── problem-pattern-registry.ts
│   ├── alerts/
│   │   ├── alert-engine.ts
│   │   ├── severity-policy.ts
│   │   └── alert-sink.ts
│   └── governance/
│       ├── adr-override-policy.ts
│       ├── strict-mode-policy.ts
│       └── reference-audit.ts
├── check.ts
├── dedup.ts
├── operations.ts
├── state.ts
├── transition-engine.ts
├── types.ts
└── views.ts
```

### Justificativa da Estrutura
- `reference-contract/model`: concentra os tipos centrais do novo domínio e evita espalhar enums e interfaces por `types.ts`.
- `reference-contract/backend`: isola a tradução da Foundation em contrato operacional verificável.
- `reference-contract/frontend`: evita que o frontend vire um “anexo” do backend e força uma base canônica própria.
- `reference-contract/validation`: separa validação semântica da validação estrutural já existente em `check.ts`.
- `reference-contract/routing`: trata prompts, templates e checklists como consequência da referência, e não como seleção genérica.
- `reference-contract/context`: endereça diretamente perda de contexto e variação de plano.
- `reference-contract/alerts`: dá forma explícita aos alertas de guard rail.
- `reference-contract/governance`: centraliza a política de override, strict mode e auditoria.

### Pontos de Integração com a Estrutura Atual
- [src/core/sdd/types.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/types.ts): continua sendo a fronteira de schemas Zod persistidos, mas passa a importar tipos contratuais novos.
- [src/core/sdd/check.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/check.ts): vira orquestrador de validadores semânticos e agregador de alertas.
- [src/core/sdd/operations.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/operations.ts): passa a aplicar roteamento por referência em `start`, `context`, `breakdown`, `finalize` e `audit`.
- [src/core/sdd/transition-engine.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/transition-engine.ts): torna-se ponto único para bloquear avanço quando guard rails críticos forem violados.
- [src/core/sdd/views.ts](/Volumes/WORKSPACE/DEVTRACK_TOOLS/repos-tools/devtrack-tools-opensdd/src/core/sdd/views.ts): deve renderizar aderência, alertas ativos e desvios aprovados.

## Fragmentos de Implementacao Recomendados
Os trechos abaixo não são decisão de código final, mas referências estruturais de implementação coerentes com o runtime atual e com o problema que o Epic precisa resolver.

### 1) Declaracao Formal de Referencia e Alerta
Arquivo alvo: `src/core/sdd/reference-contract/model/reference-contract.ts`

```ts
import { z } from 'zod';

export const ReferenceStrengthSchema = z.enum(['contextual', 'recommended', 'mandatory']);
export const GuardrailSeveritySchema = z.enum(['info', 'warning', 'error', 'blocking']);

export const ReferenceContractDeclarationSchema = z.object({
  id: z.string().min(1),
  domain: z.enum(['backend', 'frontend', 'full-stack']),
  source: z.string().min(1),
  strength: ReferenceStrengthSchema,
  strict_mode: z.boolean().default(false),
  allow_adr_override: z.boolean().default(true),
});

export const GuardrailAlertSchema = z.object({
  guardrail_id: z.string().min(1),
  reference_id: z.string().min(1),
  severity: GuardrailSeveritySchema,
  message: z.string().min(1),
  evidence: z.array(z.string()).default([]),
  blocking: z.boolean().default(false),
});
```

Justificativa:
- o runtime hoje sabe que existe `strict`, mas ainda não modela uma referência canônica como entidade explícita;
- sem isso, não existe caminho consistente entre “usuário declarou referência” e “sistema mudou seu comportamento”;
- o alerta precisa virar objeto estruturado, não string solta em warning.

### 2) Politica Progressiva de Guard Rail
Arquivo alvo: `src/core/sdd/reference-contract/validation/guardrail-evaluator.ts`

```ts
type Strength = 'contextual' | 'recommended' | 'mandatory';
type Severity = 'info' | 'warning' | 'error' | 'blocking';

export function evaluateGuardrailSeverity(input: {
  strength: Strength;
  strictMode: boolean;
  violations: string[];
}): { severity: Severity; blocking: boolean } {
  if (input.violations.length === 0) {
    return { severity: 'info', blocking: false };
  }

  if (input.strength === 'mandatory' && input.strictMode) {
    return { severity: 'blocking', blocking: true };
  }

  if (input.strength === 'mandatory') {
    return { severity: 'error', blocking: false };
  }

  if (input.strength === 'recommended') {
    return { severity: 'warning', blocking: false };
  }

  return { severity: 'warning', blocking: false };
}
```

Justificativa:
- o debate aprovou progressão explícita entre `warning` e bloqueio;
- a política precisa estar centralizada e testável;
- isso evita decisões espalhadas em `check.ts`, `operations.ts` e `transition-engine.ts`.

### 3) Validador de Fronteira de Pacotes Backend
Arquivo alvo: `src/core/sdd/reference-contract/validation/package-boundary-checker.ts`

```ts
interface BoundaryViolation {
  path: string;
  rule: string;
  reason: string;
}

export function validateFoundationBackendBoundaries(paths: Set<string>): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];

  const requiredPaths = [
    'src/application',
    'src/domain',
    'src/infrastructure',
    'src/presentation',
    'src/shared',
    'src/application/business/auth/ports/in',
    'src/application/business/auth/ports/out',
    'src/presentation/rest/auth/controllers',
    'src/domain/pessoas/entities',
  ];

  for (const requiredPath of requiredPaths) {
    if (!paths.has(requiredPath)) {
      violations.push({
        path: requiredPath,
        rule: 'foundation-backend-package-structure',
        reason: 'Pacote obrigatório ausente para a referência backend declarada.',
      });
    }
  }

  return violations;
}
```

Justificativa:
- a maior parte do desvio atual acontece em estrutura de pacotes, não só em texto;
- o runtime precisa saber detectar violação estrutural concreta;
- o documento `foundation-backend-reference-structure.md` vira insumo operacional direto dessa checagem.

### 4) Detector de Variacao de Plano e Perda de Contexto
Arquivo alvo: `src/core/sdd/reference-contract/context/plan-variance-checker.ts`

```ts
import { semanticSimilarity } from '../../dedup.js';

export function detectPlanVariance(expectedTopics: string[], generatedTopics: string[]) {
  const missing = expectedTopics.filter((expected) =>
    !generatedTopics.some((actual) => semanticSimilarity(expected, actual) >= 0.72)
  );

  const drift = generatedTopics.filter((actual) =>
    !expectedTopics.some((expected) => semanticSimilarity(expected, actual) >= 0.72)
  );

  return {
    missing,
    drift,
    highVariance: missing.length > 0 || drift.length > 2,
  };
}
```

Justificativa:
- a ferramenta já possui base de dedupe semântico em `warnAndLink()` e `semanticSimilarity()`;
- o mesmo princípio deve ser reutilizado para detectar quando plano e execução começaram a divergir;
- isso ataca diretamente a dor relatada de perda de contexto e variação de planos.

### 5) Bloqueio de Finalize por Guard Rail Critico
Arquivo alvo: integração em `src/core/sdd/operations.ts`

```ts
const alerts = runReferenceContractChecks({
  projectRoot,
  feature,
  referenceContracts,
});

const blockingAlerts = alerts.filter((alert) => alert.blocking);

if (blockingAlerts.length > 0 && !forceTransition) {
  throw new Error(
    `Finalize bloqueado por guard rails canônicos:\n- ${blockingAlerts
      .map((alert) => `${alert.guardrail_id}: ${alert.message}`)
      .join('\n- ')}`
  );
}
```

Justificativa:
- o sistema hoje já bloqueia transições por lente e por ADR;
- o próximo passo coerente é bloquear também por violação canônica de alto impacto;
- isso transforma guard rail em consequência real, não em recomendação passiva.

### 6) Metrica de Aderencia no Audit
Arquivo alvo: integração em `src/core/sdd/operations.ts` no `SddAuditCommand`

```ts
const canonicalAlerts = await collectCanonicalAlerts(paths);
const adherenceOk = canonicalAlerts.filter((alert) => alert.severity !== 'error' && !alert.blocking).length;

const canonicalAdherence = {
  ok: adherenceOk,
  total: canonicalAlerts.length,
  percent: normalizePercent(adherenceOk, canonicalAlerts.length),
};
```

Justificativa:
- se a ferramenta precisa ganhar cognitividade, ela precisa medir se está aderindo ao modelo correto;
- sem métrica, o problema continua sendo percebido só por dor humana e retrabalho;
- isso conecta a governança do Epic ao `sdd audit`, já existente.

## Guard Rails Prioritarios
Os guard rails abaixo devem ser tratados como primeira linha de defesa do Epic, porque atacam diretamente as dores relatadas de perda de contexto, drift e variação estrutural:

1. `reference_declared_but_not_enforced`
   - a referência foi declarada, mas prompts/templates/checks seguiram genéricos.

2. `canonical_package_boundary_violated`
   - a estrutura de pacotes divergiu do contrato obrigatório.

3. `plan_variance_above_threshold`
   - o plano gerado se afastou semanticamente do plano esperado ou da referência base.

4. `context_recovery_required`
   - o runtime detectou falta de sinais mínimos para continuar de forma confiável.

5. `mandatory_reference_without_adr_override`
   - houve desvio estrutural importante em referência mandatória sem ADR de override.

6. `frontend_required_but_canonical_base_missing`
   - o sistema tenta endurecer enforcement dual sem ainda ter base frontend consolidada.

### Politica de Alerta
- `info`: estado monitorado, sem ação imediata.
- `warning`: drift ou risco detectado, mas ainda não bloqueante.
- `error`: violação grave que exige correção antes de consolidar.
- `blocking`: guard rail crítico atingido em referência mandatória com `strict_mode=true`.

## Impacto Arquitetural e Consideracoes Gerais
Este Epic reforça uma fronteira já decidida no repositório:

- a `devtrack-foundation-api` continua sendo a fonte canônica do backend;
- o OpenSDD não vira novo canônico de backend;
- o papel do OpenSDD é materializar, reforçar e auditar o contrato em projetos derivados.

O principal risco aceito é de manutenção e sincronização: quanto mais forte o enforcement, maior a necessidade de manter alinhadas a referência backend, a futura referência frontend e o runtime do OpenSDD. O debate também reconhece o risco de rigidez excessiva. Por isso, a estratégia aprovada combina progressão de severidade, strict mode opcional e override via ADR, em vez de bloqueio universal imediato.

Outro ponto importante é que a assimetria atual entre backend e frontend não pode ser mascarada. O backend já possui direção canônica suficiente para endurecimento inicial; o frontend ainda precisa de formalização. Portanto, o desdobramento deste Epic deve preservar a ordem lógica:

1. declarar referências e consolidar contrato backend;
2. estruturar a base canônica frontend;
3. só então endurecer enforcement dual completo.

## Resultado Esperado
Ao final do Epic, o OpenSDD deve sair do estado em que “a referência existe como contexto” para o estado em que “a referência produz consequência real”. O resultado esperado é:

- menos retrabalho em revisão corretiva;
- menor drift entre pedido do usuário e artefato gerado;
- bootstrap mais previsível;
- maior consistência entre backend, frontend e integrações;
- menor perda de oportunidade causada por decisões fora do modelo canônico.

## Status
READY
