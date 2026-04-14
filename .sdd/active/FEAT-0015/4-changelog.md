# Changelog de Arquitetura: FEAT-0015

## Novas Entidades / Modelos
- Campo `requires_adr?: boolean` adicionado ao tipo `BacklogItem` em `src/core/sdd/types.ts`
- Novo módulo `src/core/sdd/adr.ts` com `generateAdrTemplate`

## Novas Rotas / Endpoints / Eventos
- Nenhum endpoint externo novo

## Cobertura Frontend
- Impacto declarado (`opensdd sdd frontend-impact`): none
- FGAPs criados/atualizados: nenhum

## Mudanças Estruturais
- `src/core/sdd/types.ts`: campo `requires_adr` adicionado ao `BacklogItem`
- `src/core/sdd/adr.ts`: novo módulo de geração de ADR
- Handler de `start`: criação automática de ADR quando `requires_adr: true`
- Handler de `finalize`: validação de lente `adr` quando `requires_adr: true`
- `.sdd/core/adrs/`: passa a receber arquivos criados automaticamente pelo CLI

## Documentos que Precisam Ser Atualizados
- `.sdd/core/spec-tecnologica.md` — documentar campo `requires_adr` e o mecanismo de ADR automático
- `README.md` — mencionar criação automática de ADR
- `.sdd/AGENT.md` — orientar sobre `requires_adr` e preenchimento do ADR antes do finalize
