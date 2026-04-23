# CORE-03 - Arquitetura do Sistema

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01, CORE-02
> **É dependência de:** 04, 05, 19, 22
> **Categoria:** core

## Visao Geral

```
                         ┌──────────────────────────────────┐
                         │         CDN / Static             │
                         └──────────────┬───────────────────┘
                                        │
                         ┌──────────────▼───────────────────┐
                         │      Frontend (Next.js/React)    │
                         │      SSR + Client Side           │
                         └──────────────┬───────────────────┘
                                        │ HTTPS
                         ┌──────────────▼───────────────────┐
                         │      Reverse Proxy (NGINX)       │
                         │      SSL Termination             │
                         │      Rate Limiting               │
                         └──────────────┬───────────────────┘
                                        │
                         ┌──────────────▼───────────────────┐
                         │      API Gateway / Load Balancer │
                         │      Auth Middleware             │
                         │      CORS                        │
                         │      Request Validation          │
                         └──────────────┬───────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
         ┌─────────▼─────────┐ ┌────────▼───────┐ ┌────────▼─────────┐
         │   Auth Service    │ │  Agent Service  │ │ Payment Service  │
         │   - JWT           │ │  - CRUD agents  │ │ - Gateway proxy  │
         │   - Sessions      │ │  - Execucao    │ │ - Webhooks       │
         │   - RBAC          │ │  - Logs        │ │ - Invoices       │
         └─────────┬─────────┘ └────────┬───────┘ └────────┬─────────┘
                    │                   │                   │
         ┌─────────▼─────────────────────▼──────────────────▼─────────┐
         │                    PostgreSQL (Primary)                   │
         │                    + Read Replica                         │
         └──────────────────────────┬───────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
         ┌─────────▼──────┐ ┌─────▼──────┐ ┌───────▼───────┐
         │    Redis       │ │  S3/MinIO  │ │ API Providers │
         │  - Cache       │ │  - Uploads │ │ - OpenRouter  │
         │  - Sessions    │ │  - Assets  │ │ - OpenAI      │
         │  - Rate Limit  │ │            │ │ - Outros      │
         └────────────────┘ └────────────┘ └───────────────┘
```

## Stack Tecnologica

### Backend
- **Runtime:** Node.js 20+ com TypeScript
- **Framework:** Fastify (performance superior ao Express)
- **ORM:** Prisma (type-safe, migracoes)
- **Banco:** PostgreSQL 16
- **Cache:** Redis 7
- **Filas:** BullMQ (Redis-backed)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query + Zustand
- **Forms:** React Hook Form + Zod

### Infraestrutura
- **Container:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoramento:** Prometheus + Grafana
- **Logs:** Structured logging (pino)
- **Reverse Proxy:** NGINX com certbot (SSL)

## Estrutura de Pastas (Backend)

```
src/
├── config/
│   ├── database.ts
│   ├── redis.ts
│   ├── env.ts
│   └── cors.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.validator.ts
│   │   └── auth.routes.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.validator.ts
│   │   └── users.routes.ts
│   ├── agents/
│   │   ├── agents.controller.ts
│   │   ├── agents.service.ts
│   │   ├── agents.validator.ts
│   │   ├── agents.routes.ts
│   │   └── agents.executor.ts
│   ├── billing/
│   │   ├── billing.controller.ts
│   │   ├── billing.service.ts
│   │   ├── billing.validator.ts
│   │   ├── billing.routes.ts
│   │   └── billing.webhook.ts
│   ├── providers/
│   │   ├── providers.controller.ts
│   │   ├── providers.service.ts
│   │   ├── providers.gateway.ts
│   │   ├── providers.router.ts
│   │   └── providers.routes.ts
│   └── admin/
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       └── admin.routes.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   ├── rateLimit.middleware.ts
│   ├── validate.middleware.ts
│   └── logger.middleware.ts
├── shared/
│   ├── errors/
│   │   ├── AppError.ts
│   │   └── errorCodes.ts
│   ├── utils/
│   │   ├── hash.ts
│   │   ├── token.ts
│   │   ├── crypto.ts
│   │   └── sanitize.ts
│   └── types/
│       └── index.ts
├── queues/
│   ├── agentExecution.queue.ts
│   ├── webhookProcessing.queue.ts
│   └── emailNotifications.queue.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── app.ts
└── server.ts
```

## Padroes de Comunicacao

### API → Database
- Prisma ORM com connection pooling
- Transacoes explicitas quando necessario
- Read replica para queries pesadas

### Backend → API Providers
- Gateway interno (proxy)
- Retry com exponential backoff
- Circuit breaker por provider
- Timeout: 30s

### Backend → Payment Gateway
- HTTPS obrigatorio
- Validacao de assinatura em webhooks
- Idempotencia por transacao
- Fila para processamento assincrono

### Eventos Internos
- BullMQ para filas
- Redis pub/sub para eventos em tempo real
- Websocket para notificacoes ao cliente

## Principios Arquiteturais

1. **Modular por dominio** - cada modulo e independente
2. **Camada de servico** - regras de negocio NOS SERVICES, nunca nos controllers
3. **Validacao na entrada** - Zod schemas em validators
4. **Erros estruturados** - AppError com codigo, status e mensagem
5. **Logs estruturados** - pino com correlationId
6. **Sem segredos no codigo** - env vars para tudo sensivel