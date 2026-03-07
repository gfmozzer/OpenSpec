# Dicionário de Dados

<!-- Entidades globais e regras de isolamento (ex: Multi-tenant) -->

## Entidades Principais

| Entidade | Descrição | Relacionamentos |
|---|---|---|
| **Usuário** | Conta de acesso ao sistema | 1:N com Perfil |

## Regras Globais
- Todas as tabelas que pertencem a um inquilino devem ter a chave `tenant_id`.
