# BIZ-16 - Dashboard de Custo Real

> **Prioridade:** ALTO
> **Depende de:** CORE-01, AI-09
> **É dependência de:** 20
> **Categoria:** business

## 1. O Problema

Sem dashboard de custo:
```
Voce paga OpenRouter/OpenAI por token
Usuarios consomem tokens
Voce NAO sabe quanto gastou
Voce NAO sabe quem mais consome
Voce NAO sabe se ta tendo prejuizo
No fim do mes → surpresa
```

## 2. Custos Reais por Modelo (Abril 2025)

### OpenRouter

| Modelo | Input (USD/1M tokens) | Output (USD/1M tokens) | Notas |
|--------|----------------------|----------------------|-------|
| openai/gpt-4o | $2.50 | $10.00 | Bom custo/beneficio |
| openai/gpt-4o-mini | $0.15 | $0.60 | Mais barato |
| anthropic/claude-3.5-sonnet | $3.00 | $15.00 | Bom para codigo |
| anthropic/claude-3-haiku | $0.25 | $1.25 | Rapido e barato |
| meta-llama/llama-3.1-70b | $0.18 | $0.18 | Open source |
| google/gemini-pro | $0.50 | $1.50 | Google |

### OpenAI Direto

| Modelo | Input (USD/1M tokens) | Output (USD/1M tokens) |
|--------|----------------------|----------------------|
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4-turbo | $10.00 | $30.00 |
| o1-preview | $15.00 | $60.00 |

### Anthropic Direto

| Modelo | Input (USD/1M tokens) | Output (USD/1M tokens) |
|--------|----------------------|----------------------|
| claude-3.5-sonnet | $3.00 | $15.00 |
| claude-3-haiku | $0.25 | $1.25 |
| claude-3-opus | $15.00 | $75.00 |

## 3. Custo por Tipo de Execucao (Estimativa)

### Chat Simples (suporte)

| Parametro | Valor |
|-----------|-------|
| Input medio | 200 tokens (prompt + contexto) |
| Output medio | 300 tokens |
| Modelo | gpt-4o-mini |
| Custo input | 200 / 1M * $0.15 = $0.00003 |
| Custo output | 300 / 1M * $0.60 = $0.00018 |
| **Total por chat** | **$0.00021 (R$ 0.0012)** |

### Analise de Documento

| Parametro | Valor |
|-----------|-------|
| Input medio | 2000 tokens |
| Output medio | 1000 tokens |
| Modelo | gpt-4o |
| Custo input | 2000 / 1M * $2.50 = $0.0050 |
| Custo output | 1000 / 1M * $10.00 = $0.0100 |
| **Total por analise** | **$0.0150 (R$ 0.087)** |

### Geracao de Codigo

| Parametro | Valor |
|-----------|-------|
| Input medio | 500 tokens |
| Output medio | 800 tokens |
| Modelo | claude-3.5-sonnet |
| Custo input | 500 / 1M * $3.00 = $0.0015 |
| Custo output | 800 / 1M * $15.00 = $0.0120 |
| **Total por geracao** | **$0.0135 (R$ 0.078)** |

## 4. Modelo de Margem

### Plano Pro (R$ 49.90/mes = ~$8.50 USD)

| Recurso | Custo mensal estimado | Margem |
|---------|----------------------|--------|
| 500k tokens gpt-4o-mini | 500k/1M * $0.60 = $0.30 | 96% |
| 500k tokens gpt-4o | 500k/1M * $10.00 = $5.00 | 41% |
| 500k tokens claude-3.5-sonnet | 500k/1M * $15.00 = $7.50 | 12% (prejuizo!) |

**Insight:** Se usuario do Pro usar sonnet o mes todo → prejuizo.
Precisa limitar modelo por plano OU cobrar mais.

### Ajuste Sugerido

| Plano | Tokens/mes | Modelos permitidos | Preco |
|-------|-----------|-------------------|-------|
| Free | 5k | haiku, llama | R$ 0 |
| Pro | 100k | mini, haiku, llama | R$ 49.90 |
| Pro+ | 500k | Todos (incluindo gpt-4o, sonnet) | R$ 149.90 |
| Enterprise | Sob demanda | Todos | Sob demanda |

### Margem por Plano (ajustado)

| Plano | Receita | Custo estimado | Margem |
|-------|---------|---------------|--------|
| Free | R$ 0 | R$ 0.003 | -100% (aquisicao) |
| Pro | R$ 49.90 | R$ 0.60 (mini) | 99% |
| Pro+ | R$ 149.90 | R$ 7.50 (mix) | 95% |
| Enterprise | R$ 500+ | Variavel | 80%+ |

## 5. Metricas do Dashboard

### Custo Total

| Metrica | Formula | Unidade |
|---------|---------|---------|
| Custo dia | SUM(provider_logs.cost WHERE date = today) | USD |
| Custo mes | SUM(provider_logs.cost WHERE month = current) | USD |
| Custo por usuario | SUM(cost WHERE user_id = X) | USD |
| Custo por agent | SUM(cost WHERE agent_id = X) | USD |
| Custo por modelo | SUM(cost WHERE model = X) | USD |
| Custo por provider | SUM(cost WHERE provider = X) | USD |

### Receita vs Custo

| Metrica | Formula | Unidade |
|---------|---------|---------|
| Receita dia | SUM(transactions.amount WHERE status = 'approved' AND date = today) | BRL |
| Custo dia (BRL) | custo_usd * cotacao_dolar | BRL |
| Margem dia | (receita - custo_brl) / receita * 100 | % |
| LTV medio | receita_media_mensal * tempo_medio_permanencia | BRL |
| CAC | custo_marketing / novos_usuarios_mes | BRL |

### Eficiencia

| Metrica | Formula | Unidade |
|---------|---------|---------|
| Custo medio por execucao | total_cost / total_executions | USD |
| Tokens medio por execucao | total_tokens / total_executions | tokens |
| Cache hit rate | cache_hits / total_requests * 100 | % |
| Fallback rate | fallback_calls / total_calls * 100 | % |
| Error rate | failed_calls / total_calls * 100 | % |

## 6. Alertas de Custo

| Alerta | Condicao | Acao |
|--------|----------|------|
| Custo diario alto | custo_dia > $50 | Notificar admin |
| Prejuizo | custo_dia > receita_dia | Notificar admin + investigar |
| Usuario abuso | custo_usuario > $10/dia | Notificar + limitar |
| Provider caro | custo_provider > orcamento_dia | Mudar prioridade |
| Modelo caro | custo_modelo > threshold | Sugerir downgrade de modelo |
| Margem baixa | margem < 50% | Revisar precos |

## 7. Queries de Dashboard

### Custo por dia (ultimos 30 dias)

```sql
SELECT 
  DATE(created_at) AS date,
  provider,
  model,
  SUM(request_tokens + response_tokens) AS total_tokens,
  SUM(cost) AS total_cost_usd,
  COUNT(*) AS total_requests,
  AVG(latency_ms) AS avg_latency_ms
FROM provider_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), provider, model
ORDER BY date DESC, total_cost_usd DESC
```

### Top 10 usuarios por custo

```sql
SELECT 
  u.id,
  u.email,
  s.plan,
  SUM(pl.cost) AS total_cost_usd,
  SUM(pl.request_tokens + pl.response_tokens) AS total_tokens,
  COUNT(*) AS total_requests
FROM provider_logs pl
JOIN users u ON pl.user_id = u.id
JOIN subscriptions s ON s.user_id = u.id
WHERE pl.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, s.plan
ORDER BY total_cost_usd DESC
LIMIT 10
```

### Margem por plano

```sql
SELECT 
  s.plan,
  SUM(t.amount) AS revenue_brl,
  COUNT(DISTINCT t.user_id) AS active_users,
  SUM(pl.cost) * 5.5 AS cost_brl_estimated
FROM transactions t
JOIN subscriptions s ON s.user_id = t.user_id
LEFT JOIN provider_logs pl ON pl.user_id = t.user_id 
  AND pl.created_at >= DATE_TRUNC('month', t.created_at)
WHERE t.status = 'approved'
  AND t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.plan
```

## 8. Simulador de Custo (para admin)

```json
{
  "model": "gpt-4o",
  "avg_input_tokens": 500,
  "avg_output_tokens": 300,
  "daily_executions": 1000,
  "estimated_daily_cost_usd": 0.0055,
  "estimated_monthly_cost_usd": 0.165,
  "estimated_monthly_cost_brl": 0.91,
  "model": "gpt-4o-mini",
  "estimated_daily_cost_usd": 0.00021,
  "estimated_monthly_cost_usd": 0.0063,
  "estimated_monthly_cost_brl": 0.035,
  "savings_with_mini": "97% cheaper than gpt-4o"
}
```

## 9. Otimizacao de Custo

### Estrategias

| Estrategia | Economia | Implementacao |
|-----------|---------|---------------|
| Usar modelos menores (mini/haiku) para chat simples | 90% | Roteamento por tipo de task |
| Cache de respostas repetidas | 30-40% | Redis com hash de input |
| Limitar historico de contexto | 20-30% tokens | Sliding window (ultimas 10 msgs) |
| Prompt compression | 10-20% tokens | Resumir contexto longo |
| Batch requests | 50% (em alguns providers) | Agrupar requests similares |
| Rate limit por modelo | Evita uso desnecessario | Bloquear modelos caros no free |

### Roteamento por Custo

```typescript
function selectOptimalModel(task: string, plan: string): string {
  const modelRoutes = {
    simple_chat: { free: 'llama-3.1-70b', pro: 'gpt-4o-mini', enterprise: 'gpt-4o' },
    code_generation: { free: null, pro: 'gpt-4o-mini', enterprise: 'claude-3.5-sonnet' },
    document_analysis: { free: null, pro: 'gpt-4o-mini', enterprise: 'gpt-4o' },
    complex_reasoning: { free: null, pro: null, enterprise: 'claude-3.5-sonnet' },
  }

  return modelRoutes[task]?.[plan] || 'gpt-4o-mini'
}
```

## 10. Checklist

- [ ] Tabela provider_logs populada com custo por chamada
- [ ] Views/queries de custo por dia/mes/usuario/agent/modelo
- [ ] Dashboard admin com graficos de custo
- [ ] Alertas de custo (diario, prejuizo, abuso)
- [ ] Calcular margem por plano em tempo real
- [ ] Cotacao USD/BRL atualizada (cache 1h)
- [ ] Simulador de custo no admin
- [ ] Relatorio mensal automatico (custo vs receita)
- [ ] Top usuarios por consumo visivel
- [ ] Recomendacao de modelo mais barato por task