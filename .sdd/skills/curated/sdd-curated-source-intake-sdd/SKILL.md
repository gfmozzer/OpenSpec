---
name: source-intake-sdd
description: Lê a pasta .sdd/deposito, indexa as fontes brutas e classifica o material de entrada do projeto.
---

# Source Intake SDD

Use esta skill quando houver material bruto do projeto em `.sdd/deposito/`.

## Objetivo

Transformar um conjunto heterogeneo de documentos em um inventario operacional rastreavel.

## Onde procurar

- `.sdd/deposito/prds/`
- `.sdd/deposito/rfcs/`
- `.sdd/deposito/briefings/`
- `.sdd/deposito/historias/`
- `.sdd/deposito/wireframes/`
- `.sdd/deposito/html-mocks/`
- `.sdd/deposito/referencias-visuais/`
- `.sdd/deposito/entrevistas/`
- `.sdd/deposito/anexos/`
- `.sdd/deposito/legado/`

## Fluxo obrigatorio

1. Liste as fontes existentes.
2. Classifique cada fonte por tipo.
3. Registre/atualize `.sdd/state/source-index.yaml`.
4. Preencha para cada item:
   - `type`
   - `path`
   - `title`
   - `status`
   - `summary`
   - `used_by`
   - `consolidation_targets`
5. Nao gere backlog direto nesta etapa.

## Regra de ouro

- Fonte bruta nao e fonte canonica.
- O objetivo aqui e inventariar e classificar.
- O backlog so nasce depois da normalizacao semantica.
