# CORE-52 - Analytics e Plataforma de Experimentos

> **Prioridade:** ALTO
> **Depende de:** CORE-01, BACK-04, OPS-22
> **É dependência de:** BIZ-57
> **Categoria:** core

## 1. Analytics de Produto

### 1.1 Event Tracking
| Evento | Quando | Propriedades |
|--------|--------|-------------|
| `user.signup` | Cadastro completo | method, referrer, utm_* |
| `agent.created` | Novo agente | template, model, config |
| `agent.executed` | Execução | model, tokens, cost, duration |
| `payment.completed` | Pagamento | plan, amount, method |
| `feature.used` | Feature usada | feature_name, context |
| `error.occurred` | Erro | error_code, severity, module |

### 1.2 Propriedades do Usuário
| Propriedade | Tipo | Uso |
|-----------|------|-----|
| plan | string | Segmentação |
| created_at | date | Cohort analysis |
| last_active | date | Reengajamento |
| total_agents | number | Engajamento |
| total_executions | number | Uso |
| mrr | number | Receita |

## 2. A/B Testing

### 2.1 Framework de Experimento
```
1. Hipótese: [Se mudarmos X, então Y acontecerá]
2. Métrica primária: [KPI a ser impactado]
3. Métrica secundária: [KPI de guarda]
4. Tamanho amostral: [calculado com power analysis]
5. Duração: [dias necessários para significância]
6. Segmento: [usuários elegíveis]
```

### 2.2 Regras de Experimento
- Máximo 3 experimentos simultâneos por página
- Duração mínima: 1 semana (elimina efeito de dia da semana)
- Significância estatística: p < 0.05
- Parada antecipada: somente se métrica de guarda piorar > 20%

### 2.3 Feature Flags com Métricas
| Flag | Status | Métricas |
|------|--------|----------|
| `new_onboarding` | 50% rollout | activation_rate, time_to_value |
| `dark_mode` | 100% | satisfaction_score |
| `pro_pricing` | 10% | conversion_rate, mrr |

## 3. Event Tracking Implementation

### 3.1 SDK (Conceito)
```typescript
// Identificar usuário
analytics.identify(userId, {
  plan: 'pro',
  createdAt: '2025-01-15',
})

// Rastrear evento
analytics.track('agent.executed', {
  model: 'gpt-4o',
  tokens: 350,
  cost: 0.0035,
  duration: 1250,
})

// Registrar propriedade de página
analytics.page('dashboard')
```

### 3.2 Eventos Obrigatórios
| Evento | Categoria | Prioridade |
|--------|----------|-----------|
| page_view | Navegação | Crítico |
| feature_used | Produto | Alto |
| error_occurred | Qualidade | Alto |
| experiment_viewed | Experimento | Alto |
| conversion | Negócio | Crítico |

## 4. Dashboard de Analytics

### 4.1 Métricas por Tempo
```
┌────────────────────────────────────────────┐
│  DAU / WAU / MAU                            │
│  ████████████████████████████████  1.250    │
│                                             │
│  Retenção (D1-D90)                          │
│  D1  ████████░░░░ 45%                       │
│  D7  ██████░░░░░░ 30%                       │
│  D30 ████░░░░░░░░ 25%                       │
│  D90 ██░░░░░░░░░░ 15%                       │
│                                             │
│  Funil de Conversão                         │
│  Visit → Signup: 15%                        │
│  Signup → Activation: 40%                     │
│  Activation → Paid: 12%                     │
└────────────────────────────────────────────┘
```

### 4.2 Cohort Analysis
| Cohort | Usuários | M1 | M2 | M3 | M4 | M5 | M6 |
|--------|----------|----|----|----|----|----|----|
| Jan-26 | 500 | 100% | 45% | 35% | 30% | 28% | 25% |
| Fev-26 | 650 | 100% | 48% | 38% | 32% | - | - |
| Mar-26 | 800 | 100% | 42% | - | - | - | - |

## 5. Experiment Registry

| ID | Nome | Hipótese | Status | Resultado |
|----|------|----------|--------|-----------|
| EXP-001 | Novo onboarding | Melhorar activation em 20% | Concluído | +18% ✅ |
| EXP-002 | Dark mode | Aumentar DAU em 10% | Em execução | - |
| EXP-003 | Preço R$ 39 | Melhorar conversão | Em execução | - |

## 6. Checklist

- [ ] Event tracking em todas as ações críticas
- [ ] Propriedades de usuário atualizadas em tempo real
- [ ] Feature flag system com rollout controlado
- [ ] A/B test framework com significância estatística
- [ ] Dashboard de analytics auto-atualizado
- [ ] Cohort tracking mensal
- [ ] Alerta para métricas de guarda

## 7. AI-First Notes

> A IA que gera funcionalidades deve sempre incluir eventos de tracking. Todo novo feature é uma hipótese e deve ser rastreável. Use o registry de experimentos para documentar decisões.
