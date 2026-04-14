# Changelog de Arquitetura: FEAT-0016

## Novas Entidades / Modelos
- Tipo `MetaEvolutionConfig` adicionado ao config em `src/core/sdd/types.ts`
- Interface `AuditMetric` e `AuditReport` em `src/core/sdd/audit.ts`
- Novo módulo `src/core/sdd/audit.ts`

## Novas Rotas / Endpoints / Eventos
- Novo subcomando CLI: `opensdd sdd audit`

## Cobertura Frontend
- Impacto declarado (`opensdd sdd frontend-impact`): none
- FGAPs criados/atualizados: nenhum

## Mudanças Estruturais
- `src/core/sdd/types.ts`: campo `meta_evolution` no tipo de config
- `src/core/sdd/audit.ts`: novo módulo de métricas de saúde
- Handler `audit` registrado no CLI de `sdd`
- `.sdd/config.yaml`: campo `meta_evolution` adicionado com defaults

## Documentos que Precisam Ser Atualizados
- `README.md` — documentar `opensdd sdd audit` e suas métricas
- `.sdd/AGENT.md` — instruir sobre uso periódico do comando audit
- `.sdd/core/spec-tecnologica.md` — registrar protocolo de meta-evolução e ciclo de auditoria
