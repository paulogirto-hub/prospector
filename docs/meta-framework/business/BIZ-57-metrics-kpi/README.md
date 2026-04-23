# BIZ-57 - Metricas e KPIs de Negocio

> **Prioridade:** MEDIO
> **Depende de:** BIZ-08, BIZ-16, BIZ-53
> **É dependência de:** (nenhum)
> **Categoria:** business

## 1. North Star Metric

> **Métrica principal:** [Definir: ex: "Agentes executados com sucesso por mês"]

## 2. Framework de Métricas

### 2.1 AARRR em Números
| Estágio | Métrica | Alvo |
|---------|---------|------|
| Acquisition | Novos signups/mes | 500 |
| Activation | % que completam onboarding | 40% |
| Retention | D30 retention | 25% |
| Revenue | MRR | R$ 25.000 |
| Referral | K-factor | > 0.3 |

### 2.2 SaaS Metrics Essenciais
| Métrica | Formula | Alvo |
|---------|---------|------|
| MRR | Soma de receita recorrente | R$ 25k |
| ARR | MRR × 12 | R$ 300k |
| LTV | ARPU × Lifespan | > R$ 500 |
| CAC | Custo marketing + vendas / novos clientes | < R$ 150 |
| LTV:CAC | LTV / CAC | > 3:1 |
| Churn | Clientes perdidos / total | < 5%/mes |
| NRR | MRR atual + expansão - contração | > 100% |

### 2.3 Unit Economics
```
Receita por usuario = R$ 49,90/mes
Custo de servico = R$ 8,50/mes
Gross margin = 83%
CAC payback = 3 meses
```

## 3. Dashboards

### 3.1 Executive Dashboard
- MRR, Churn, LTV, CAC, Burn rate
- Runway (meses de caixa)
- Cohort retention curve

### 3.2 Product Dashboard
- Feature adoption (quem usa o que)
- Time-to-value
- Support tickets por feature
- NPS por segmento

### 3.3 Marketing Dashboard
- CAC por canal
- Conversion rate por landing
- Lead velocity rate (LVR)
- ROI por campanha

## 4. Alertas

| Condicao | Acao |
|----------|------|
| Churn > 7% | Reuniao de retencao urgente |
| CAC > LTV/3 | Revisar canais de aquisicao |
| NRR < 100% | Investigar downgrades |
| Runway < 6 meses | Acionar rodada/contingencia |

## 5. Checklist

- [ ] North Star definida e comunicada
- [ ] AARRR com baseline e targets
- [ ] LTV e CAC calculados mensalmente
- [ ] Dashboards auto-atualizados
- [ ] Alertas configurados
- [ ] Review semanal de métricas

## 6. AI-First Notes

> A IA que gera relatórios deve sempre incluir a North Star e pelo menos 3 das métricas SaaS essenciais. Nunca apresente dados sem contexto (baseline, target, tendência).
