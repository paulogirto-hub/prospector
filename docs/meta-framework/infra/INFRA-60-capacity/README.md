# INFRA-60 - Capacity Planning

> **Prioridade:** MEDIO
> **Depende de:** CORE-03, INFRA-19, OPS-29
> **É dependência de:** (nenhum)
> **Categoria:** infra

## 1. Tiers de Escala

### Tier 1: MVP (0-100 usuarios)

| Recurso | Especificacao | Custo/mes |
|---------|-------------|----------|
| VPS | 2 vCPU, 4GB RAM, 40GB SSD | R$ 42 (Hetzner) |
| DB | Same VPS (Docker) | Incluso |
| Redis | Same VPS (Docker) | Incluso |
| CDN | Cloudflare Free | R$ 0 |
| Email | Resend Free (100/dia) | R$ 0 |
| Monitoring | Sentry Free (5k eventos) | R$ 0 |
| **Total** | | **~R$ 42/mes** |

### Tier 2: Growth (100-1.000 usuarios)

| Recurso | Especificacao | Custo/mes |
|---------|-------------|----------|
| VPS | 4 vCPU, 8GB RAM, 80GB SSD | R$ 85 (Hetzner) |
| DB | Same VPS + PgBouncer | Incluso |
| Redis | Same VPS + persistence | Incluso |
| CDN | Cloudflare Pro | R$ 25 |
| Email | Resend Pro (10k/mes) | R$ 50 |
| Monitoring | Sentry Team | R$ 35 |
| AI Cost | ~$10-50/mes | R$ 55-275 |
| Observabilidade | Self-hosted (Prometheus+Grafana) | Incluso |
| **Total** | | **~R$ 250-470/mes** |

### Tier 3: Scale (1.000-10.000 usuarios)

| Recurso | Especificacao | Custo/mes |
|---------|-------------|----------|
| App Server | 8 vCPU, 16GB RAM | R$ 180 |
| DB Primary | 4 vCPU, 8GB RAM, 200GB SSD | R$ 120 |
| DB Replica | 2 vCPU, 4GB RAM | R$ 60 |
| Redis | Managed (Upstash) | R$ 50 |
| CDN | Cloudflare Business | R$ 125 |
| Email | Resend Pro | R$ 50 |
| Monitoring | Sentry Business | R$ 110 |
| AI Cost | ~$50-300/mes | R$ 275-1650 |
| Observabilidade | Managed Grafana | R$ 35 |
| S3 | 100GB storage | R$ 15 |
| Backup | S3 cross-region | R$ 10 |
| **Total** | | **~R$ 1.030-2.405/mes** |

### Tier 4: Enterprise (10.000+ usuarios)

| Recurso | Especificacao | Custo/mes |
|---------|-------------|----------|
| App Cluster | 2x 8vCPU, 16GB | R$ 360 |
| DB Cluster | Managed RDS/Supabase | R$ 400 |
| Redis Cluster | Managed | R$ 150 |
| CDN | Cloudflare Enterprise | Sob demanda |
| Email | Resend Enterprise | Sob demanda |
| AI Cost | $300-2000/mes | R$ 1.650-11.000 |
| Observabilidade | Datadog/NewRelic | R$ 200 |
| **Total** | | **R$ 3.000+/mes** |

## 2. Breakpoints (quando migrar)

| Metrica | Tier 1→2 | Tier 2→3 | Tier 3→4 |
|---------|----------|----------|----------|
| Usuarios ativos | 100 | 1.000 | 10.000 |
| Requests/min | 50 | 500 | 5.000 |
| Agent exec/min | 5 | 50 | 500 |
| DB size | 1GB | 10GB | 100GB |
| CPU avg | >70% | >70% | >70% |
| RAM avg | >80% | >80% | >80% |
| DB connections | >15 | >80 | >300 |

## 3. Otimizacoes por Tier

### Tier 1 → 2 (primeiro upgrade)

| Problema | Causa | Solucao |
|----------|-------|--------|
| API lenta | CPU alto | Upgrade VPS |
| DB lento | Sem pool | Adicionar PgBouncer |
| Redis cai | Sem persistence | Ativar AOF |
| Email falha | Limite free | Upgrade Resend |
| Sem visibilidade | Sem monitoramento | Prometheus + Grafana |

### Tier 2 → 3 (separar servicos)

| Problema | Causa | Solucao |
|----------|-------|--------|
| DB lock | Mesmo server que API | DB em VPS separada |
| Sem alta disponibilidade | 1 server | Read replica |
| Redis sem HA | 1 instancia | Redis Sentinel ou managed |
| Upload lento | S3 single-region | Multi-region + CDN |

### Tier 3 → 4 (clusterizar)

| Problema | Causa | Solucao |
|----------|-------|--------|
| 1 server nao aguenta | Volume | Horizontal scaling (2+ API) |
| DB replica insuficiente | Reads altas | Multiple read replicas |
| Falha unica | Single point | Load balancer + failover |
| Observabilidade limitada | Self-hosted scale | Managed (Datadog) |

## 4. Estimativa por Cenario

### 100 usuarios, 20 agents, 500 execucoes/dia

| Metrica | Valor |
|---------|------|
| Requests/min | ~15 |
| Agent exec/min | ~0.35 |
| DB queries/min | ~50 |
| Tokens/dia | ~175k (medio 350 tokens/exec) |
| Custo IA/dia | ~$0.35 (gpt-4o-mini) |
| Custo IA/mes | ~$10.50 |
| Disco necessario | ~5GB |
| Redis memoria | ~50MB |

### 1.000 usuarios, 200 agents, 5.000 execucoes/dia

| Metrica | Valor |
|---------|------|
| Requests/min | ~150 |
| Agent exec/min | ~3.5 |
| DB queries/min | ~500 |
| Tokens/dia | ~1.75M |
| Custo IA/dia | ~$3.50 |
| Custo IA/mes | ~$105 |
| Disco necessario | ~50GB |
| Redis memoria | ~500MB |

### 10.000 usuarios, 2.000 agents, 50.000 execucoes/dia

| Metrica | Valor |
|---------|------|
| Requests/min | ~1.500 |
| Agent exec/min | ~35 |
| DB queries/min | ~5.000 |
| Tokens/dia | ~17.5M |
| Custo IA/dia | ~$35 |
| Custo IA/mes | ~$1.050 |
| Disco necessario | ~500GB |
| Redis memoria | ~5GB |

## 5. Checklist por Tier

### Tier 1
- [ ] 1 VPS com Docker
- [ ] Cloudflare Free
- [ ] Backups diarios automaticos
- [ ] Health checks ativos

### Tier 2
- [ ] Upgrade VPS
- [ ] PgBouncer configurado
- [ ] Redis persistence
- [ ] Prometheus + Grafana
- [ ] Alertas configurados

### Tier 3
- [ ] DB em VPS separada
- [ ] Read replica
- [ ] Redis managed ou Sentinel
- [ ] S3 multi-region
- [ ] CI/CD com deploy azul-verde

### Tier 4
- [ ] Horizontal scaling (2+ API)
- [ ] DB cluster gerenciado
- [ ] Redis cluster
- [ ] Load balancer + failover
- [ ] CDN enterprise
- [ ] Observabilidade managed