# Guia de Contribuição

Obrigado por considerar contribuir com o OpenSDD.

## Antes de começar

- Leia [README.md](README.md), [AGENTS.md](AGENTS.md) e [.sdd/AGENT.md](.sdd/AGENT.md).
- Confirme se já existe issue, debate SDD ou feature aberta para o tema.
- Em mudanças maiores, abra primeiro uma issue ou proposta para alinhar escopo.

## Requisitos locais

- Node.js `>=20.19.0`
- `pnpm`

Instalação:

```bash
pnpm install
```

## Fluxo recomendado

1. Atualize sua branch a partir de `main`.
2. Faça mudanças pequenas, focadas e rastreáveis.
3. Atualize testes e documentação afetados.
4. Rode a validação local.
5. Abra um pull request com contexto suficiente para revisão.

## Fluxo SDD deste repositório

Para mudanças significativas no próprio OpenSDD, siga o contrato operacional do projeto:

```bash
pnpm exec opensdd sdd onboard system
pnpm exec opensdd sdd next
pnpm exec opensdd sdd start FEAT-#### 
pnpm exec opensdd sdd context FEAT-####
```

Antes de fechar o trabalho:

```bash
pnpm exec opensdd sdd frontend-impact FEAT-#### --status none --reason "Sem impacto de frontend"
pnpm exec opensdd sdd finalize --ref FEAT-####
```

Se a mudança não nasceu de uma FEAT existente, abra a trilha correta por `insight -> debate -> decide -> breakdown`.

## Checklist de qualidade

Execute, no mínimo:

```bash
pnpm run build
pnpm test
pnpm run lint
```

Quando alterar empacotamento/publicação, também rode:

```bash
pnpm run check:pack-version
npm pack --dry-run
```

## Segurança e privacidade

- Nunca commite segredos, tokens, chaves privadas, arquivos `.env` reais ou dumps sensíveis.
- Não inclua artefatos locais de IDE, logs temporários ou arquivos gerados fora do escopo do projeto.
- Vulnerabilidades devem ser reportadas conforme [SECURITY.md](SECURITY.md), não em issue pública.

## Pull requests

Um bom PR deve incluir:

- problema e motivação;
- abordagem adotada;
- riscos e rollback;
- evidências de teste;
- impacto em documentação, SDD e release, quando aplicável.

Use commits claros, preferencialmente em estilo Conventional Commits.

## Documentação que costuma precisar de sync

- `README.md`
- `AGENTS.md`
- `AGENT.md`
- `.sdd/AGENT.md`
- `docs/`
- `.sdd/core/*.md` quando a mudança afetar visão operacional derivada

## Dúvidas

Veja [SUPPORT.md](SUPPORT.md) para os canais corretos por tipo de assunto.
