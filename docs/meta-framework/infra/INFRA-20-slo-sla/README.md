# INFRA-20 - SLO / SLA

> **Prioridade:** ALTO
> **Depende de:** INFRA-19, OPS-22
> **É dependência de:** 23
> **Categoria:** infra

## 1. Definicoes

| Termo | Significado |
|-------|-------------|
| **SLI** (Service Level Indicator) | Metrica que voce mede (ex: latencia, uptime) |
| **SLO** (Service Level Objective) | Meta para o SLI (ex: 99.9% uptime) |
| **SLA** (Service Level Agreement) | Contrato com penas (ex: 99.9% ou reembolso) |

## 2. SLIs (O que medir)

### Disponibilidade

| SLI | Medicao | Fonte |
|-----|---------|-------|
| Uptime da API | % de requests 200-499 (nao 5xx) | NGINX logs / Prometheus |
| Uptime do DB | pg_isready a cada 30s | Health check |
| Uptime do Redis | PING a cada 30s | Health check |

### Latencia

| SLI | Medicao | Fonte |
|-----|---------|-------|
| API p50 | 50% das requests abaixo de Xms | Prometheus histogram |
| API p95 | 95% abaixo de Xms | Prometheus histogram |
| API p99 | 99% abaixo de Xms | Prometheus histogram |
| Agent execution p50 | Tempo ate primeiro token (streaming) | Provider logs |
| DB query p95 | Tempo medio de queries | Prisma metrics |

### Confiabilidade

| SLI | Medicao | Fonte |
|-----|---------|-------|
| Error rate (5xx) | % de requests com erro 5xx | NGINX logs |
| Webhook success rate | % de webhooks processados < 60s | DLQ metrics |
| Provider success rate | % de chamadas com resposta valida | Provider logs |

### Negocio

| SLI | Medicao | Fonte |
|-----|---------|-------|
| Token delivery rate | % creditos creditados < 1min apos pagamento | Transactions |
| Login success rate | % logins sem erro | Auth logs |

## 3. SLOs (Metas)

### Por服务水平

| SLO | Target | Janela | Calculo |
|-----|--------|--------|---------|
| API Uptime | 99.9% | 30 dias | (total_requests - 5xx) / total_requests |
| API Latencia p50 | < 200ms | 5 min rolling | histogram percentile |
| API Latencia p95 | < 500ms | 5 min rolling | histogram percentile |
| API Latencia p99 | < 2000ms | 5 min rolling | histogram percentile |
| Error rate (5xx) | < 0.1% | 30 dias | 5xx / total |
| Webhook process time | < 60s (p95) | 24h | timestamp processed - received |
| Agent time to first token | < 2s (p95) | 24h | provider_logs |
| DB query p95 | < 100ms | 5 min rolling | Prisma metrics |
| Health check pass | 100% | Contínuo | probe a cada 30s |

### Error Budget

Com 99.9% uptime SLO em 30 dias:

| Janela | Downtime permitido |
|--------|-------------------|
| 30 dias | 43.2 minutos |
| 1 semana | 10.08 minutos |
| 1 dia | 1.44 minutos |
| 1 hora | 3.6 segundos |

**Regra:** Se gastou o error budget do mes, FREEZE deploys de risco ate o mes acabar.

### Error Budget Policy

| Consumo | Acao |
|---------|------|
| 0-50% | Normal. Deploys liberados. |
| 50-80% | Cautela. Deploys com rollback automatico. |
| 80-100% | Freezear features. Focar em estabilidade. |
| >100% | Incidente. Post-mortem obrigatorio. Feature freeze. |

## 4. SLA (Contrato com Clientes)

### Por Plano

| SLA | Free | Pro | Enterprise |
|-----|------|-----|------------|
| Uptime garantido | N/A | 99.5% | 99.9% |
| Latencia garantida | N/A | p95 < 1s | p95 < 500ms |
| Suporte | Comunidade | Email (24h) | Dedicado (4h) |
| Compensacao | N/A | 10x tempo fora do ar | Custom |

### Compensacao (Pro)

```
Se SLA 99.5% nao for atingido no mes:
- 99.5% - 99.0%: creditar 1 dia de assinatura
- 99.0% - 95.0%: creditar 3 dias
- < 95.0%: creditar 10 dias (10x downtime)
```

### Exclusoes

- Manutencao programada (comunicada 48h antes)
- Falha de provider externo (OpenAI, etc)
- Force majeure
- Ataques DDoS (best effort)

## 5. Dashboard de SLO

### Metricas em Tempo Real

```
┌─────────────────────────────────────────────────┐
│ SLO Dashboard                         99.94% ▲  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Uptime (30d)  ████████████████████████░  99.94%  │
│ Budget used   ████░░░░░░░░░░░░░░░░░░░   14.4min  │
│                                                  │
│ Latencia p50  ██░░░░░░░░░░░░░░░░░░░░   120ms    │
│ Latencia p95  ███░░░░░░░░░░░░░░░░░░░   380ms    │
│ Latencia p99  ██████░░░░░░░░░░░░░░░░   950ms    │
│                                                  │
│ 5xx rate     ░░░░░░░░░░░░░░░░░░░░░░   0.02%    │
│ Webhook p95  ███████░░░░░░░░░░░░░░░   12s      │
│                                                  │
│ [Last 24h] [7d] [30d]                           │
└─────────────────────────────────────────────────┘
```

### Prometheus Queries

```promql
# Uptime (5min windows, 30d)
100 - (sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100)

# Latencia p95
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Error budget consumed (minutes)
(sum(increase(http_requests_total{code=~"5.."}[30d])) / sum(increase(http_requests_total[30d]))) * 43200

# Webhook process time p95
histogram_quantile(0.95, sum(rate(webhook_processing_seconds_bucket[24h])) by (le))
```

## 6. Alertas

| Alerta | Condicao | Severidade | Canal |
|--------|----------|-----------|-------|
| SLO at risk | Error budget > 80% consumido | Warning | Slack |
| SLO violated | Uptime < SLO no mes | Critical | Slack + PagerDuty |
| Latencia alta | p95 > SLO por 5min | Warning | Slack |
| 5xx spike | Taxa > 1% por 1min | Critical | Slack + PagerDuty |
| DB slow | Query p95 > 200ms por 5min | Warning | Slack |
| Webhook backlog | 10+ na DLQ | Warning | Slack |

## 7. Checklist

- [ ] SLIs definidos com fonte de dados
- [ ] SLOs definidos com targets mensuráveis
- [ ] Error budget calculado por janela
- [ ] Error budget policy documentada
- [ ] SLA definido por plano (com compensacao)
- [ ] Prometheus + Grafana configurados
- [ ] Dashboard de SLO visível
- [ ] Alertas configurados por severidade
- [ ] Review semanal de SLOs
- [ ] Post-mortem quando SLO violado