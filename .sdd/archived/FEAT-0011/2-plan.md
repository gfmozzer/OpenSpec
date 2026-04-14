# Plano FEAT-0011

## Abordagem Técnica

Criar testes unitários em `test/commands/` para cada arquivo prioritário, exercitando os branches identificados no debate. Abordagem por arquivo:

**`src/utils/match.ts`** (8.7% statements — maior lacuna de ROI):
- Mapear todos os branches: correspondência exata, correspondência parcial, sem correspondência, string vazia, case-insensitive
- Criar `test/core/utils/match.test.ts`

**`src/commands/validate.ts`** (25.94% stmt / 46.43% branches):
- Cobrir: arquivo inexistente, schema inválido, formato JSON/text, flag `--bulk`, erros de parsing
- Criar `test/commands/validate.test.ts`

**`src/commands/spec.ts`** (29.38% stmt / 44.44% branches):
- Cobrir: spec inexistente, formato de saída, filtros por tag, ordenação, output vazio
- Criar `test/commands/spec.test.ts`

**`src/commands/change.ts`** (67.62% stmt / 54.76% branches — manter e expandir):
- Focar nos branches ainda descobertos: flags combinadas, saída sem matches, modo dry-run
- Complementar testes existentes em `test/core/parsers/change-parser.test.ts`

**`src/commands/completion.ts`** (55.21% stmt / 80.43% branches — focar em statements):
- Cobrir branches de instalação, detecção de shell, fallback sem shell detectado
- Criar ou complementar testes em `test/commands/completion.test.ts`

## Impacto Arquitetural
- Serviços/touches: apenas camada de testes (`test/`) — sem mudança em código de produção
- Lock domains: nenhum

## Contratos Afetados
- Nenhum

## Impacto Frontend
- Rotas afetadas: nenhuma
- Gaps criados ou resolvidos: nenhum
- Decisões de frontend relevantes: nenhuma
- Declaração obrigatória: `opensdd sdd frontend-impact FEAT-0011 --status none --reason "Testes automatizados de camadas de lógica interna da CLI não geram nem alteram superfície de produto."`

## Skills e Bundles Sugeridos
- Skills: `test-driven-development`, `javascript-testing-patterns`, `systematic-debugging`
- Bundles: `essentials-core`

## Regra de Intersecção
- Dívidas técnicas relacionadas: baixa cobertura em `match.ts` é risco real para sugestões da CLI
- Frontend gaps relacionados: nenhum
- Documentação que precisa mudar: nenhuma (feature é exclusivamente de testes)
