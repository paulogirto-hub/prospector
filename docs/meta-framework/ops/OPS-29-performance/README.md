# OPS-29 - Performance Targets

> **Prioridade:** MEDIO
> **Depende de:** BACK-11, OPS-22
> **É dependência de:** (nenhum)
> **Categoria:** ops

## 1. Targets por Tipo de Rota

### API (Backend)

| Rota | p50 | p95 | p99 | Max |
|------|-----|-----|-----|-----|
| GET /health | 5ms | 10ms | 20ms | 50ms |
| POST /auth/login | 100ms | 200ms | 500ms | 1s |
| POST /auth/register | 150ms | 300ms | 600ms | 1s |
| GET /agents | 50ms | 100ms | 200ms | 500ms |
| POST /agents | 100ms | 200ms | 400ms | 1s |
| POST /agents/:id/run | 1s | 3s | 10s | 30s |
| GET /billing/subscription | 50ms | 100ms | 200ms | 500ms |
| POST /billing/webhook | 100ms | 300ms | 500ms | 1s |
| GET /admin/analytics | 200ms | 500ms | 1s | 3s |

### Frontend (Core Web Vitals)

| Metrica | Target | Bom | Pobre |
|---------|--------|-----|-------|
| LCP (Largest Contentful Paint) | <1.2s | <2.5s | >4s |
| INP (Interaction to Next Paint) | <100ms | <200ms | >500ms |
| CLS (Cumulative Layout Shift) | <0.05 | <0.1 | >0.25 |
| FCP (First Contentful Paint) | <0.8s | <1.8s | >3s |
| TTFB (Time to First Byte) | <200ms | <500ms | >800ms |

### Agent Execution

| Metrica | Target | Max |
|---------|--------|-----|
| Time to first token (streaming) | <1s | <3s |
| Execucao simples (chat) | <5s | <15s |
| Execucao complexa (analise) | <15s | <30s |
| Execucao timeout | 30s | 60s (hard) |

## 2. Capacidades

### Load Targets

| Metrica | Target MVP | Target Escalado |
|---------|-----------|----------------|
| Requests/segundo (API) | 100 rps | 1.000 rps |
| Concurrent WebSockets | 500 | 10.000 |
| Concurrent agent executions | 10 | 100 |
| Database connections | 20 | 100 |
| Redis connections | 10 | 50 |

### Resource Limits

| Recurso | Limite por Container | Alerta |
|---------|---------------------|--------|
| CPU | 1 vCPU | >80% por 5min |
| Memory | 1GB | >85% (OOM iminente) |
| Disk | 40GB | >80% |
| Open connections (DB) | 20 | >15 |
| Event loop lag | 0ms | >50ms |

## 3. Estrategias de Otimizacao

### Backend

| Otimizacao | Impacto | Complexidade | Quando |
|-----------|---------|-------------|--------|
| Connection pooling (Prisma) | Alto | Baixa | MVP |
| Redis caching | Alto | Media | MVP |
| DB indices corretos | Alto | Baixa | MVP |
| Compression (gzip) | Medio | Baixa | MVP |
| Response pagination | Alto | Baixa | MVP |
| Query optimization | Alto | Media | Quando necessario |
| Read replicas | Alto | Alta | 1000+ rps |
| Horizontal scaling | Alto | Alta | 5000+ rps |

### Frontend

| Otimizacao | Impacto | Complexidade | Quando |
|-----------|---------|-------------|--------|
| Next.js SSR + ISR | Alto | Media | MVP |
| Static assets CDN | Alto | Baixa | MVP |
| Image optimization | Medio | Baixa | MVP |
| Code splitting | Alto | Media | MVP |
| Font preloading | Medio | Baixa | MVP |
| Bundle analysis | Medio | Baixa | Quando necessario |
| Edge caching | Alto | Media | 10k+ visitantes |

### Database

| Otimizacao | Impacto | Complexidade | Quando |
|-----------|---------|-------------|--------|
| Proper indexes | Alto | Baixa | MVP |
| EXPLAIN ANALYZE queries | Alto | Media | Regularmente |
| VACUUM regular | Medio | Baixa | Cron |
| Connection pooling (PgBouncer) | Alto | Media | 100+ conexoes |
| Partitioning (logs table) | Alto | Media | >1M linhas |
| Read replica | Alto | Alta | Queries lentas |

## 4. Load Testing

### Ferramenta: k6

```javascript
// tests/load/basic.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '1m', target: 50 },     // Sustained
    { duration: '30s', target: 100 },   // Peak
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% abaixo de 500ms
    http_req_failed: ['rate<0.01'],     // <1% de erros
  },
}

const BASE_URL = 'http://localhost:3000/v1'

export default function () {
  // Health check
  http.get(`${BASE_URL}/health`)

  sleep(1)
}
```

### Teste de Login

```javascript
// tests/load/auth.js
export default function () {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass1',
  }), { headers: { 'Content-Type': 'application/json' } })

  check(res, {
    'login 200': (r) => r.status === 200,
    'has token': (r) => r.json('data.access_token') !== undefined,
    'under 200ms': (r) => r.timings.duration < 200,
  })

  sleep(1)
}
```

### Teste de Agent Execution

```javascript
// tests/load/agent-run.js
export default function () {
  const token = loginAndGetToken()

  const res = http.post(`${BASE_URL}/agents/${AGENT_ID}/run`, JSON.stringify({
    input: 'Explain quantum computing in simple terms',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    timeout: '60s',
  })

  check(res, {
    'run 200': (r) => r.status === 200,
    'has output': (r) => r.json('data.output') !== undefined,
    'under 10s': (r) => r.timings.duration < 10000,
  })

  sleep(2)
}
```

### CI Load Test

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  schedule:
    - cron: '0 6 * * 1'  # Toda segunda 6am
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g k6
      - run: k6 run tests/load/basic.js --out json=results.json
      - run: k6 run tests/load/auth.js --out json=auth-results.json
      - uses: actions/upload-artifact@v4
        with: { name: load-results, path: '*-results.json' }
```

## 5. Monitoramento de Performance

### Prometheus Queries

```promql
# Latencia p95 por rota
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{route!~"/health|/metrics"}[5m])) by (le, route))

# Requisicoes por segundo
sum(rate(http_requests_total[1m]))

% Erros 5xx
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Event loop lag
nodejs_eventloop_lag_seconds

# DB connections
pg_stat_activity_count
```

### Alertas de Performance

| Condicao | Severidade | Acao |
|----------|-----------|------|
| p95 > SLO por 5min | Warning | Investigar |
| p99 > SLO por 5min | Warning | Investigar |
| 5xx > 1% | Critical | Incidente |
| Event loop lag > 50ms | Warning | Investigar |
| DB connections > 80% max | Warning | Aumentar pool |
| Memory > 85% | Critical | Reiniciar / escalar |
| CPU > 80% por 10min | Warning | Considerar escalar |

## 6. Checklist

- [ ] Targets definidos por tipo de rota
- [ ] Core Web Vitals monitorados (frontend)
- [ ] Connection pooling configurado (Prisma)
- [ ] Indices criados para queries frequentes
- [ ] Gzip compression ativo (NGINX)
- [ ] CDN para assets estaticos
- [ ] k6 load tests escritos
- [ ] Load tests no CI (semanal)
- [ ] Prometheus metricas expostas (/metrics)
- [ ] Grafana dashboard de performance
- [ ] Alertas de degradacao configurados