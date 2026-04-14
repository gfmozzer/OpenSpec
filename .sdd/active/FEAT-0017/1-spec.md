# Spec FEAT-0017

## Resumo
- Titulo: Sanitização semântica de títulos na propagação INS → DEB → EPIC → FEAT
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

Eliminar títulos com prefixos funcionais (`Debate:`, `Insight:`) ou texto de placeholder em artefatos EPIC e FEAT. Atualmente, o título do DEBATE é copiado diretamente para a EPIC, resultando em EPICs e FEATs com nomes como "Debate: Mapear sistematicamente as lacunas...".

A feature entrega:
1. Campo `title_canonical` (máx. 60 chars, sem prefixos funcionais) nos schemas de INS e DEB.
2. Na transição DEB → EPIC, o sistema usa `title_canonical` em vez do `title` do debate.
3. Validação no `check` que rejeita EPIC ou FEAT cujo título contenha os padrões proibidos.
4. Frases proibidas adicionadas às lentes `epic` e `feature_spec` para cobrir esses títulos.

## Histórias do Usuário
- Como arquiteto SDD, quero que EPICs e FEATs tenham títulos orientados a entrega ("Mapear lacunas de cobertura automatizada") e não títulos de debate ("Debate: Mapear..."), para que o backlog seja legível e profissional.
- Como operador, quero que o `opensdd sdd check` me avise se algum EPIC ou FEAT tem "Debate:" no título, para poder corrigir antes de avançar.

## Regras de Negócio
- [ ] Campo `title_canonical?: string` adicionado ao schema de `InsightItem` e `DebateItem`.
- [ ] `title_canonical` é validado: máx. 60 chars, não pode conter `"Debate:"`, `"Insight:"`, `"(preencher"`, `"(placeholder"`.
- [ ] Na transição DEB → EPIC (comando que gera EPIC a partir de debate), usar `deb.title_canonical ?? deb.title.replace(/^Debate:\s*/i, '')` como título da EPIC.
- [ ] `LENSES.epic.forbidden_phrases` recebe: `"Debate:"`, `"Insight:"`, `"(preencher"`, `"(placeholder"`.
- [ ] `LENSES.feature_spec.forbidden_phrases` recebe os mesmos padrões proibidos de título.
- [ ] `opensdd sdd check` exibe aviso para cada EPIC/FEAT com título violador.

## Cenários de Aceite
- Ao criar EPIC a partir de DEB com `title_canonical: "Mapear lacunas de cobertura automatizada"`, a EPIC recebe esse título.
- Ao rodar `opensdd sdd check` com FEAT cujo título começa com "Debate:", o check exibe violação.
- Ao tentar finalizar EPIC com "Insight:" no título, o finalize bloqueia (via lente).
- Ao criar DEB com `title_canonical` de 65 chars, a criação falha com erro de validação.

## Declaração de Impacto Frontend
- Status: none
- Justificativa: Sanitização de títulos é operação interna do SDD sem superfície de produto.
- Comando: `opensdd sdd frontend-impact FEAT-0017 --status none --reason "Sanitização de títulos é operação interna do SDD sem superfície de produto."`

## Referências
- FEAT: FEAT-0017
- EPIC: EPIC-0008
- ADR: —
- FGAP: —
