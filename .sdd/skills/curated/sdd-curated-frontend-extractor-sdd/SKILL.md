---
name: frontend-extractor-sdd
description: Extrai superficies, rotas, componentes, gaps e decisoes de frontend a partir de imagens, html, wireframes e referencias.
---

# Frontend Extractor SDD

Use esta skill quando existir inspiracao visual ou definicao de UI/UX em `.sdd/deposito/`.

## Fontes aceitas

- wireframes
- screenshots
- imagens de referencia
- html mockado
- historias com impacto de interface

## Saidas esperadas

- `.sdd/state/frontend-map.yaml`
- `.sdd/state/frontend-gaps.yaml`
- `.sdd/state/frontend-decisions.yaml`

## Criterios de classificacao

- O que ja esta claramente definido como tela/rota entra em frontend-map.
- O que esta faltando, mas necessario para cobrir jornada, entra em frontend-gaps.
- O racional de UX, navegacao, layout, padroes e inspiracao entra em frontend-decisions.
- Se uma superficie ja estiver bem definida e executavel, ela pode virar FEAT.
