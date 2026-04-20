# Insight INS-0012

## Titulo
Contrato canônico backend/frontend com enforcement real

## Descricao
Criar um contrato canônico explícito no OpenSDD para backend e frontend, com enforcement real sobre geração por agentes, templates, nomenclatura, estrutura de pacotes, contratos e regras básicas, sempre que o usuário indicar uma referência obrigatória. Hoje o SDD já registra referências e possui alguns guardrails estruturais, mas ainda permite decisões fora do modelo canônico, especialmente no salto entre referência declarada e artefato gerado. Isso produz retrabalho, desalinhamento arquitetural e impacto direto em tempo e oportunidade de negócio. A discussão precisa cobrir guardrails semânticos, validação de aderência, roteamento de prompts/templates por referência, política de override com ADR, strict mode e uma base estruturada de referência para backend e frontend.
