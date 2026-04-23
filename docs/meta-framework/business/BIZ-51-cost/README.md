# BIZ-51 - Cost Calculator

> **Prioridade:** MEDIO
> **Depende de:** BIZ-16
> **É dependência de:** (nenhum)
> **Categoria:** business

## 1. Formulas

### Custo por Execucao

```
cost_per_execution = (input_tokens / 1_000_000) * input_price + (output_tokens / 1_000_000) * output_price
```

### Custo Mensal por Usuario

```
monthly_cost_per_user = avg_daily_executions * 30 * cost_per_execution
```

### Margem

```
margin = (monthly_revenue_per_user - monthly_cost_per_user) / monthly_revenue_per_user * 100
```

### Break-even

```
break_even_users = monthly_fixed_cost / (monthly_revenue_per_user - monthly_cost_per_user)
```

## 2. Precos de Referencia (Abril 2025)

### Modelos

| Modelo | Input $/1M | Output $/1M | Cenario: 500in/300out |
|--------|-----------|------------|----------------------|
| gpt-4o | $2.50 | $10.00 | $0.00425 |
| gpt-4o-mini | $0.15 | $0.60 | $0.00026 |
| gpt-4-turbo | $10.00 | $30.00 | $0.01900 |
| claude-3.5-sonnet | $3.00 | $15.00 | $0.00600 |
| claude-3-haiku | $0.25 | $1.25 | $0.00044 |
| llama-3.1-70b | $0.18 | $0.18 | $0.00014 |
| gemini-pro | $0.50 | $1.50 | $0.00070 |

### USD → BRL

```
cotacao = 5.50 (atualizar periodicamente)
cost_brl = cost_usd * cotacao
```

## 3. Calculadora por Plano

### Plano Free (R$ 0/mes)

```
Limite: 5.000 tokens/mes
Modelos: haiku, llama
Custo max: 5k * $0.00044/1k (haiku input) = $0.0022/mes = R$ 0.01/mes
Margem: -100% (aquisicao)
Objetivo: converter para Pro
```

### Plano Pro (R$ 49.90/mes = ~$9.07)

```
Modelo: gpt-4o-mini (preco base)
Limite: 500.000 tokens/mes
Custo max: 500k * $0.00038/1k = $0.19/mes = R$ 1.05/mes
Margem: 97.9%

Cenario pessimo (se usar gpt-4o):
500k * $0.00425/1k avg = $2.13/mes = R$ 11.70/mes
Margem: 76.5%

Cenario critico (se usar claude-3.5-sonnet):
500k * $0.00600/1k avg = $3.00/mes = R$ 16.50/mes
Margem: 66.9%
```

### Plano Enterprise (R$ 500/mes = ~$90.91)

```
Modelo: mix de todos
Uso estimado: 2M tokens/mes
Custo medio: $0.003/1k avg = $6.00/mes = R$ 33.00/mes
Margem: 93.4%
```

## 4. Break-even Analysis

### Cenario: 100 usuarios Pro

```
Receita: 100 * R$ 49.90 = R$ 4.990/mes
Custo IA: 100 * R$ 1.05 = R$ 105/mes (gpt-4o-mini)
Custo Infra: R$ 42/mes (Tier 1)
Custo Email: R$ 0 (free tier)
Total custos: R$ 147/mes
Margem: 97%
Lucro: R$ 4.843/mes

Break-even: R$ 42 / (49.90 - 1.05) = 0.86 usuarios
→ 1 usuario ja cobre custos
```

### Cenario: 1.000 usuarios (800 Pro + 200 Free)

```
Receita: 800 * R$ 49.90 = R$ 39.920/mes
Custo IA: 800 * R$ 1.05 + 200 * R$ 0.01 = R$ 842/mes
Custo Infra: R$ 250/mes (Tier 2)
Custo Email: R$ 50/mes
Custo Monitoring: R$ 35/mes
Total custos: R$ 1.177/mes
Margem: 97%
Lucro: R$ 38.743/mes

Break-even: R$ 1.177 / (39.920/1.000) = 29.5 usuarios
```

### Cenario: 5.000 usuarios (4.000 Pro + 1.000 Free)

```
Receita: 4.000 * R$ 49.90 = R$ 199.600/mes
Custo IA: R$ 4.210/mes
Custo Infra: R$ 1.030/mes (Tier 3)
Custo Email: R$ 50/mes
Custo Monitoring: R$ 145/mes
Total custos: R$ 5.435/mes
Margem: 97.3%
Lucro: R$ 194.165/mes
```

## 5. Simulador de Custo (JSON Input)

```json
{
  "users": 500,
  "plan_distribution": { "free": 100, "pro": 350, "enterprise": 50 },
  "avg_daily_executions_per_pro_user": 5,
  "avg_tokens_per_execution": { "input": 500, "output": 300 },
  "primary_model": "gpt-4o-mini",
  "cache_hit_rate": 0.30
}
```

### Resultado esperado

```json
{
  "monthly_revenue_brl": 17785.00,
  "monthly_ai_cost_usd": 19.95,
  "monthly_ai_cost_brl": 109.73,
  "monthly_infra_cost_brl": 250.00,
  "monthly_total_cost_brl": 359.73,
  "monthly_profit_brl": 17425.27,
  "margin_percent": 97.98,
  "tokens_per_month": 31500000,
  "break_even_users": 7.2,
  "cache_savings_usd": 8.55,
  "cache_savings_percent": 30,
  "cost_per_pro_user_brl": 0.31,
  "revenue_per_pro_user_brl": 49.90
}
```

## 6. Alertas de Viabilidade

| Condicao | Acao |
|----------|------|
| Margem < 50% | Urgente: aumentar preco ou trocar modelo |
| Margem < 0% | Critico: modelo caro demais, corrigir imediatamente |
| Custo IA > 50% receita | Restringir modelos premium no Pro |
| Break-even > 50 usuarios | Custo fixo alto demais, otimizar infra |
| Cache hit < 10% | Implementar/improvar cache |
| Usuario custa > R$ 10/mes | Sugerir downgrade de modelo |