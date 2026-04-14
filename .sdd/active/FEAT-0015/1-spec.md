# Spec FEAT-0015

## Resumo
- Titulo: ADR mandatório automático para features com impacto arquitetural declarado
- Origem: epic (EPIC-0008)
- Tipo: feature
- Modo: local_plan
- Fluxo: padrao
- Etapa atual: proposta

## Gates
- Proposta: rascunho
- Planejamento: rascunho
- Tarefas: rascunho

## Objetivo

Automatizar a criação e o enforcement de ADRs (Architecture Decision Records) para features que declaram impacto arquitetural significativo. Hoje, ADRs são criados manualmente e nada garante sua existência ou completude antes do finalize.

A feature entrega:
1. Campo `requires_adr: boolean` no schema `BacklogItem`.
2. Ao executar `opensdd sdd start FEAT-####`, se `requires_adr: true`, criar automaticamente o arquivo `.sdd/core/adrs/ADR-FEAT-####.md` com o template de ADR preenchido com contexto da feature.
3. A seção `## Referências` da spec (`1-spec.md`) é atualizada para incluir o link ao ADR criado.
4. O `opensdd sdd finalize --ref FEAT-####` verifica se o ADR existe e não contém as `forbidden_phrases` da lente `adr` (já definida: `"(preencher contexto)"`). Se violado, bloqueia.

## Histórias do Usuário
- Como arquiteto, quero que ao iniciar qualquer FEAT marcada como `requires_adr: true`, o ADR template seja criado automaticamente com o contexto correto da feature, para não precisar criar manualmente.
- Como revisor de processo, quero que o `finalize` bloqueie se o ADR ainda tiver o texto padrão `(preencher contexto)`, garantindo que ADRs sejam preenchidos de verdade.

## Regras de Negócio
- [ ] Campo `requires_adr?: boolean` adicionado ao tipo `BacklogItem`.
- [ ] O comando `start` detecta `requires_adr: true` e cria `ADR-FEAT-####.md` em `.sdd/core/adrs/` se não existir.
- [ ] O template do ADR inclui, pré-preenchidos: título da FEAT, data, e referência `EPIC-####`.
- [ ] A spec `1-spec.md` gerada referencia o ADR na seção `## Referências`.
- [ ] O `finalize` executa `validateDocumentAgainstLens(content, LENSES.adr)` no ADR; se falhar, bloqueia (a menos que `--force`).
- [ ] Se `requires_adr` for `false` ou ausente, nenhum ADR é criado e nenhuma validação é feita.

## Cenários de Aceite
- Ao rodar `start` em FEAT com `requires_adr: true`, o arquivo `ADR-FEAT-####.md` é criado em `.sdd/core/adrs/`.
- Ao rodar `finalize` com o ADR contendo `"(preencher contexto)"`, o comando falha com mensagem clara.
- Ao rodar `finalize` com o ADR preenchido corretamente (contendo `## Contexto`, `## Decisão`, `## Consequências`), avança normalmente.
- Ao rodar `start` em FEAT com `requires_adr: false`, nenhum ADR é criado.

## Declaração de Impacto Frontend
- Status: none
- Justificativa: Geração de ADR é operação interna do SDD sem superfície de produto.
- Comando: `opensdd sdd frontend-impact FEAT-0015 --status none --reason "Geração de ADR é operação interna do SDD sem superfície de produto."`

## Referências
- FEAT: FEAT-0015
- EPIC: EPIC-0008
- ADR: — (esta própria feature não requer ADR pois não é uma decisão arquitetural de sistema; implementa mecanismo de ADR)
- FGAP: —
