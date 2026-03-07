# Contratos de Integração

<!-- Payloads de APIs, Eventos (ex: RabbitMQ, Kafka) e gRPC -->

## Eventos de Domínio Mapeados
- `UsuarioCriado`: Disparado quando um novo usuário se cadastra. (Payload contém `id` e `email`)

## Contratos de API
- **GET /api/v1/health**: Retorna `{ status: "ok" }`
