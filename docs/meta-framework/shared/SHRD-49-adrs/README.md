# SHRD-49 - Architecture Decision Records (ADRs)

> **Prioridade:** ALTO
> **Depende de:** CORE-03
> **É dependência de:** 34
> **Categoria:** shared

## O que sao ADRs?

Registro de decisoes arquiteturais. Cada ADR documenta:
1. **Contexto** — porque a decisao foi necessaria
2. **Opcoes consideradas** — alternativas avaliadas
3. **Decisao** — o que foi escolhido
4. **Consequencias** — o que muda com a escolha

---

## ADR-001: Fastify ao inves de Express

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos de um framework HTTP para a API. Performance e critical pois chamamos APIs externas de IA em cada request.

### Opcoes

| Framework | Performance | Ecossistema | TypeScript | Manutencao |
|-----------|-----------|-------------|-----------|-----------|
| Express | Baixa | Enorme | Medio | Lento (v5 em beta ha anos) |
| Fastify | Alta (2-3x Express) | Bom | Excelente | Ativo |
| Hono | Alta | Pequeno | Excelente | Moderado |
| Koa | Media | Pequeno | Bom | Lento |

### Decisao
Fastify. Performance superior, schema-based validation nativa, TypeScript first, plugin system otimo, mantido ativamente.

### Consequencias
- **Positivas:** Performance 2-3x melhor, validation integrada via JSON Schema, logging integrado (pino)
- **Negativas:** Ecossistema menor que Express, alguns plugins Express nao funcionam
- **Riscos:** Comunidade menor, mas crescendo rapido

---

## ADR-002: JWT RS256 ao inves de HS256

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos autenticar requests. JWT e o padrao. Precisamos escolher o algoritmo de assinatura.

### Opcoes

| Algoritmo | Tipo | Como funciona | Risco |
|-----------|------|--------------|-------|
| HS256 | Simetrico | 1 chave compartilhada (server) | Se vaza, qualquer um assina tokens |
| RS256 | Assimetrico | Chave privada assina, publica verifica | Se chave publica vaza, nao compromete |
| ES256 | Assimetrico | ECDSA, mesma logica RS256 | Mais rapido mas menos suportado |

### Decisao
RS256. Chave privada fica so no server. Chave publica pode ser distribuída (microservices, frontends). Se a chave publica vazar, nao compromete o sistema.

### Consequencias
- **Positivas:** Rotacao de chave sem redistribuir segredo, microservices podem verificar tokens sem chave privada
- **Negativas:** Tokens ~15% maiores, gerenciamento de par de chaves
- **Riscos:** Se chave privada vazar = mismo risco que HS256. Mitigar com env var isolada.

---

## ADR-003: PostgreSQL ao inves de MySQL

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos de banco relacional para dados do sistema (usuarios, agents, transacoes).

### Opcoes

| Banco | JSONB | Row Level Security | Conexoes | Compliance |
|-------|-------|-------------------|---------|-----------|
| PostgreSQL | Sim | Sim (nativo) | PgBouncer | Melhor LGPD |
| MySQL | Sim (desde 5.7) | Nao | Pool nativo | Bom |
| CockroachDB | Sim | Sim | Nativo | Excelente |

### Decisao
PostgreSQL 16. JSONB nativo para configs flexíveis, RLS para multi-tenancy, melhor suporte a LGPD (anonimizacao), enorme ecossistema.

### Consequencias
- **Positivas:** JSONB sem overhead, RLS gratis para multi-tenant, extensao pgcrypto, comunidade enorme
- **Negativas:** Configuracao mais complexa que MySQL, replicas precisam de mais atencao
- **Riscos:** Migrations com zero downtime requer planejamento (ver doc 18)

---

## ADR-004: Prisma ao inves de TypeORM

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos de ORM type-safe para TypeScript.

### Opcoes

| ORM | Type-safe | Migrations | DX | Performance |
|-----|----------|-----------|-----|-----------|
| Prisma | Excelente (schema-first) | Bom | Excelente | Bom |
| TypeORM | Medio (decorator) | Medio | Medio | Medio |
| Drizzle | Excelente (SQL-like) | Manual | Bom | Otimo |
| Kysely | Bom (SQL) | Manual | Medio | Otimo |
| Raw SQL | N/A | Manual | Ruim | Maximo |

### Decisao
Prisma. Schema-first gera tipos automaticos. Migrations integradas. DX excelente com Prisma Studio. Para queries complexas, usar `$queryRaw` com tipagem.

### Consequencias
- **Positivas:** Tipos gerados, migrations versionadas, Prisma Studio para debug
- **Negativas:** Queries complexas sao verbosas, N+1 sem cuidado, middleware limitado
- **Riscos:** Se Prisma nao suportar query, fallback para raw SQL com tipagem manual

---

## ADR-005: Redis para Cache/Sessoes/Filas

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos de cache, sessoes, rate limiting e filas. Um servico so resolve tudo.

### Opcoes

| Uso | Opcao A | Opcao B |
|-----|---------|---------|
| Cache | Redis | Memcached (sem TTL granular) |
| Sessoes | Redis | DB (lento) / JWT stateless (sem revogacao) |
| Rate Limit | Redis (sliding window) | NGINX only (sem granularidade) |
| Filas | BullMQ (Redis) | RabbitMQ (complexo) / SQS (custo) |

### Decisao
Redis para tudo. Single dependency para 4 funcoes. BullMQ para filas (Redis-backed). Sliding window para rate limit.

### Consequencias
- **Positivas:** 1 servico, extremamente rapido, TTL nativo, pub/sub para WebSocket
- **Negativas:** Single point of failure (se Redis cai, cache + sessoes + rate limit + filas caem)
- **Mitigacao:** Redis persistence (AOF), monitoring, graceful degradation (cache miss → DB)

---

## ADR-006: bcript ao inves de argon2

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos hashear senhas.

### Opcoes

| Algoritmo | Performance | Resistencia GPU | Suporte Node |
|-----------|-----------|---------------|-------------|
| bcrypt | Medio | Boa | Excelente (nativo) |
| argon2 | Lento (melhor) | Excelente | Requer binding nativo |
| scrypt | Medio | Boa | Nativo (crypto) |

### Decisao
bcrypt cost 12. Amplamente suportado, sem dependencia nativa,抵抗encia GPU suficiente. argon2 e melhor tecnicamente mas introduz complexidade de build (native binding).

### Consequencias
- **Positivas:** Sem build nativo, amplamente testado, suporte universal
- **Negativas:** Menos resistente a GPU que argon2
- **Mitigacao:** Cost factor 12 (balance), monitorar avanco de hardware

---

## ADR-007: Server-Sent Events ao inves de WebSocket para Agent Streaming

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Agentes IA precisam streaming de tokens. WebSocket oferece bidirecional, SSE oferece server→client.

### Opcoes

| Tecnologia | Direcao | Reconnect | Proxy-friendly | Complexidade |
|-----------|---------|-----------|---------------|-------------|
| SSE | Server → Client | Auto | Sim (HTTP) | Baixa |
| WebSocket | Bidirecional | Manual | Parcial (upgrade) | Alta |
| Long polling | Server → Client | Auto | Sim | Baixa (mas ineficiente) |

### Decisao
SSE para streaming de agentes. WebSocket ja usado para notificacoes em tempo real (doc 27). SSE e mais simples, auto-reconnect, funciona com HTTP proxies, nao precisa de upgrade handshake. Para chat (tokens), SSE e suficiente (unidirecional).

### Consequencias
- **Positivas:** Simples, auto-reconnect, HTTP-compatible, cachavel
- **Negativas:** Unidirecional (só server→client), max 6 conexoes por dominio (HTTP/1.1)
- **Mitigacao:** HTTP/2 remove limite de conexoes SSE

---

## ADR-008: Mercado Pago como gateway principal (Brasil)

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos processar pagamentos. Publico alvo principal: Brasil.

### Opcoes

| Gateway | PIX | Cartao | Boleto | Taxa Brasil | Webhooks |
|---------|-----|--------|--------|------------|---------|
| Mercado Pago | Sim (instant) | Sim | Sim | ~2.99% | Confiavel |
| Stripe | Parcial (via partner) | Sim | Nao | ~3.5% + cambio | Excelente |
| PagSeguro | Sim | Sim | Sim | ~2.99% | Medio |
| Pagar.me | Sim | Sim | Sim | ~2.99% | Bom |

### Decisao
Mercado Pago como primario (melhor cobertura PIX Brasil). Stripe como secundario (para internacional/futuro). Ver doc 08 para detalhes.

### Consequencias
- **Positivas:** PIX instantaneo, cobertura Brasil, taxas competitivas
- **Negativas:** API menos elegante que Stripe, documentacao inferior
- **Riscos:** Timeout em webhooks (mitigar com polling + DLQ)

---

## ADR-009: Next.js 14 (App Router) para Frontend

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos de framework frontend com SSR, routing, e boa DX.

### Opcoes

| Framework | SSR | Routing | Bundler | DX |
|-----------|-----|---------|---------|-----|
| Next.js 14 | Sim (App Router) | File-based | Turbopack | Excelente |
| Remix | Sim | File-based | Esbuild | Bom |
| Vite + React Router | Nao (SPA) | Manual | Esbuild | Bom |
| Nuxt | Sim | File-based | Vite | Bom (Vue) |

### Decisao
Next.js 14 App Router. SSR para SEO + performance. File-based routing. Enorme ecossistema. React para contratar devs. shadcn/ui e otimo com Next.

### Consequencias
- **Positivas:** SSR/ISR, API routes, otima DX, maior ecossistema React
- **Negativas:** App Router ainda evoluindo, server components requer atencao
- **Riscos:** Breaking changes no App Router (estavel desde 14)

---

## ADR-010: Zod para validacao (shared frontend + backend)

**Status:** Aceito
**Data:** 2026-04-01

### Contexto
Precisamos validar dados no frontend e backend. Ideal: mesmas regras.

### Opcoes

| Lib | Type inference | Frontend | Backend | DX |
|-----|--------------|---------|---------|-----|
| Zod | Excelente | Sim | Sim | Excelente |
| Joi | Medio | Sim | Sim | Medio |
| Yup | Medio | Sim | Sim | Medio |
| class-validator | Medio | Nao | Sim | Medio |

### Decisao
Zod. Type inference funciona em ambas camadas. Shared schemas = zero divergencia. Integra com React Hook Form e Prisma.

### Consequencias
- **Positivas:** 1 schema, 2 usos (frontend + backend), type inference, excelente DX
- **Negativas:** Performance inferior a Joi para schemas muito grandes
- **Mitigacao:** Schemas pequenos e focados