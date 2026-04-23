# OPS-22 - Observabilidade

> **Prioridade:** ALTO
> **Depende de:** CORE-03, INFRA-19
> **É dependência de:** 20, 23, 29
> **Categoria:** ops

## 1. Os 3 Pilares

```
┌─────────────────────────────────────────────────┐
│                Observabilidade                   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Logs    │  │ Metrics  │  │   Traces      │  │
│  │          │  │          │  │               │  │
│  │  Pino    │  │Prometheus│  │ OpenTelemetry │  │
│  │  + Loki  │  │+ Grafana │  │  + Jaeger     │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                                                  │
│  "O que aconteceu?"  "Quanto?"   "Onde demorou?" │
└─────────────────────────────────────────────────┘
```

## 2. Logs (Pino)

### Formato Estruturado

```json
{
  "level": "info",
  "time": 1745332800000,
  "correlationId": "req-uuid-abc",
  "msg": "Request completed",
  "method": "POST",
  "url": "/v1/agents/uuid/run",
  "statusCode": 200,
  "duration": 1250,
  "userId": "user-uuid",
  "tenantId": "tenant-uuid",
  "agentId": "agent-uuid",
  "tokensUsed": 350,
  "cost": 0.0035,
  "provider": "openrouter",
  "model": "gpt-4o-mini"
}
```

### Regras de Logging

| Regra | Implementacao |
|-------|--------------|
|Nunca logar senhas| Pino redact: `req.headers.authorization` |
| Nunca logar API keys | Redact: `apiKey`, `api_key` |
| Nunca logar tokens JWT | Redact: `req.headers.cookie` |
| Sempre correlationId | Fastify requestIdHeader |
| Log de request = INFO | A cada request |
| Log de erro = ERROR | Com stack trace |
| Log de seguranca = WARN | Login falho, rate limit |
| Log financeiro = AUDIT | Webhook, transacao |

### Niveis de Log

| Nivel | Quando | Exemplo |
|-------|--------|---------|
| fatal | Sistema morre | DB indisponivel, sem recovery |
| error | Operacao falha | 5xx, provider timeout |
| warn | Situacao anomala | Rate limit, login falho, DLQ item |
| info | Operacao normal | Request, login sucesso, webhook processado |
| debug | Debug em dev | Query SQL, payload (sem secrets) |
| trace | Muito detalhado | Timestamp de cada etapa interna |

### Tipos de Log por Categoria

**Acesso:**
```json
{ "event": "request", "method": "GET", "url": "/v1/agents", "statusCode": 200, "duration": 45, "userId": "uuid", "ip": "1.2.3.4" }
```

**Seguranca:**
```json
{ "event": "login_failed", "email": "u@e.com", "ip": "1.2.3.4", "attempts": 3, "reason": "invalid_password" }
{ "event": "rate_limit_exceeded", "ip": "1.2.3.4", "route": "/v1/auth/login", "limit": 5 }
{ "event": "prompt_injection_blocked", "userId": "uuid", "agentId": "uuid", "pattern": "ignore_previous" }
```

**Financeiro:**
```json
{ "event": "payment_approved", "userId": "uuid", "transactionId": "uuid", "amount": 49.90, "method": "pix", "gateway": "mp" }
{ "event": "webhook_processed", "gateway": "mercadopago", "transactionId": "abc", "status": "approved", "duration": 120 }
```

**Provider:**
```json
{ "event": "provider_call", "provider": "openrouter", "model": "gpt-4o", "tokens": 350, "cost": 0.0035, "latency": 1250, "cacheHit": false }
{ "event": "provider_fallback", "from": "openrouter", "to": "openai", "reason": "503" }
```

## 3. Metricas (Prometheus + Grafana)

### Metricas da Aplicacao

| Metrica | Tipo | Labels | Descricao |
|---------|------|--------|-----------|
| `http_requests_total` | Counter | method, route, status | Total de requests |
| `http_request_duration_seconds` | Histogram | method, route | Latencia |
| `agent_executions_total` | Counter | provider, model, status | Execucoes |
| `agent_tokens_used` | Counter | provider, model | Tokens consumidos |
| `agent_cost_dollars` | Counter | provider, model | Custo USD |
| `webhook_processed_total` | Counter | gateway, status | Webhooks |
| `dlq_items_total` | Gauge | source, status | Items na DLQ |
| `active_sessions` | Gauge | — | Sessoes ativas |
| `subscription_tokens_remaining` | Gauge | plan | Creditos restantes |

### Metricas de Sistema

| Metrica | Tipo | Descricao |
|---------|------|-----------|
| `process_cpu_usage` | Gauge | CPU do processo Node |
| `process_resident_memory_bytes` | Gauge | RAM do processo |
| `nodejs_active_handles` | Gauge | Conexoes ativas |
| `nodejs_eventloop_lag_seconds` | Gauge | Lag do event loop |

### Metricas de Infra

| Metrica | Fonte | Descricao |
|---------|-------|-----------|
| `node_filesystem_avail_bytes` | Node exporter | Disco livre |
| `container_memory_usage_bytes` | cAdvisor | RAM por container |
| `container_cpu_usage_seconds_total` | cAdvisor | CPU por container |

### Dashboard Grafana

```
┌──────────────────────────────────────────────────┐
│ SaaS Operations Dashboard                  LIVE   │
├──────────────────────────────────────────────────┤
│                                                   │
│ Requests/s    ▓▓▓▓▓▓▓▓▓▓  45.2/s                │
│ Latencia p50  ██░░░░░░░░  120ms                  │
│ Latencia p95  ████░░░░░░  380ms                  │
│ Error rate    ░░░░░░░░░░  0.02%                  │
│                                                   │
│ ┌─ Tokens por Provider ─────────────────────┐    │
│ │ OpenRouter:  ▓▓▓▓▓▓▓▓  350k/dia          │    │
│ │ OpenAI:      ██░░░░░░   50k/dia          │    │
│ │ Cache hit:   ▓▓▓░░░░░   32%              │    │
│ └───────────────────────────────────────────┘    │
│                                                   │
│ ┌─ Custo Diário ────────────────────────────┐    │
│ │ Ontem:  $12.50  Hoje:  $8.30  Mês:  $280 │    │
│ │ Margem: 94%                               │    │
│ └───────────────────────────────────────────┘    │
│                                                   │
│ ┌─ Active Users ───────────────────────────┐    │
│ │ Online: 125  Agents rodando: 8  DLQ: 2   │    │
│ └───────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

## 4. Distributed Tracing (OpenTelemetry)

### Por que Tracing?

Logs dizem "o que" aconteceu. Tracing diz "onde demorou".

```
POST /v1/agents/:id/run
├── auth middleware        2ms    █
├── rbac middleware        1ms    █
├── input validation       3ms    ██
├── agent lookup (DB)     12ms    ██████
├── credit check (Redis)   5ms    ███
├── sanitize input         1ms    █
├── provider call       1200ms    ████████████████████████████████████████████
│  ├── build payload      2ms
│  ├── http request     1195ms
│  └── parse response     3ms
├── filter output          1ms    █
├── write execution (DB)  8ms    ████
├── debit credits (DB)     5ms    ███
└── TOTAL               1238ms
```

### Implementacao (conceito)

```typescript
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('saas-api')

async function runAgent(req, reply) {
  const span = tracer.startSpan('agent.run')

  span.setAttribute('agent.id', agentId)
  span.setAttribute('agent.model', model)
  span.setAttribute('user.id', userId)

  try {
    const authSpan = tracer.startSpan('auth.check')
    await checkAuth(req)
    authSpan.end()

    const dbSpan = tracer.startSpan('db.agent_lookup')
    const agent = await prisma.agent.findUnique(...)
    dbSpan.end()

    const providerSpan = tracer.startSpan('provider.call')
    const result = await providerGateway.execute(...)
    providerSpan.setAttribute('provider.tokens', result.tokens)
    providerSpan.setAttribute('provider.cost', result.cost)
    providerSpan.end()

    span.setStatus({ code: 1 }) // OK
  } catch (err) {
    span.setStatus({ code: 2, message: err.message }) // ERROR
    throw err
  } finally {
    span.end()
  }
}
```

## 5. Stack de Observabilidade

| Componente | Ferramenta | Funcao |
|-----------|-----------|--------|
| Logs | Pino + Loki | Structured logs, query |
| Metrics | Prometheus + Grafana | Time series, dashboards, alertas |
| Tracing | OpenTelemetry + Jaeger | Distributed traces |
| Error tracking | Sentry | Erros com stack trace |
| Uptime | Prometheus Blackbox | Health checks externos |
| Alerting | Grafana Alerting → Slack/PagerDuty | Notificacoes |

### Docker Compose (observabilidade)

```yaml
# docker/docker-compose.observability.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ../monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["127.0.0.1:9090:9090"]

  grafana:
    image: grafana/grafana
    ports: ["127.0.0.1:3002:3000"]
    volumes:
      - grafana_data:/var/lib/grafana

  loki:
    image: grafana/loki
    ports: ["127.0.0.1:3100:3100"]

  jaeger:
    image: jaegertracing/all-in-one
    ports: ["127.0.0.1:16686:16686"]
    environment:
      COLLECTOR_OTLP_ENABLED: true

volumes:
  grafana_data:
```

## 6. Checklist

- [ ] Pino configurado com redact (senhas, tokens, keys)
- [ ] CorrelationId em todas as requests
- [ ] Logs de seguranca separados (login, rate limit)
- [ ] Logs financeiros separados (transacoes, webhooks)
- [ ] Prometheus expondo metricas (/metrics)
- [ ] Grafana com dashboard de operacoes
- [ ] Alertas configurados (Slack + PagerDuty)
- [ ] OpenTelemetry SDK configurado
- [ ] Jaeger recebendo traces
- [ ] Sentry para erros nao tratados
- [ ] Health check externo (Blackbox exporter)
- [ ] Docker compose de observabilidade rodando