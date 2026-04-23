# AI-09 - Gerenciamento de APIs de Terceiros

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01, ADV-06
> **É dependência de:** 10, 12, 16
> **Categoria:** ai

## 1. Arquitetura: Provider Gateway

```
                    ┌─────────────────────────────────┐
                    │        Provider Gateway          │
                    │                                 │
                    │  ┌─────────────────────────────┐ │
Request ──────────> │  │     Request Router          │ │
                    │  │  (seleciona provider)       │ │
                    │  └──────────┬──────────────────┘ │
                    │             │                    │
                    │  ┌──────────▼──────────────────┐ │
                    │  │     Health Checker           │ │
                    │  │  (score + latencia + erros)  │ │
                    │  └──────────┬──────────────────┘ │
                    │             │                    │
                    │  ┌──────────▼──────────────────┐ │
                    │  │     Cost Calculator          │ │
                    │  │  (tokens × preco/1k)        │ │
                    │  └──────────┬──────────────────┘ │
                    │             │                    │
                    │  ┌──────────▼──────────────────┐ │
                    │  │     Cache Layer              │ │
                    │  │  (Redis, TTL 1h)            │ │
                    │  └──────────┬──────────────────┘ │
                    │             │                    │
                    │  ┌──────────▼──────────────────┐ │
                    │  │     Retry + Circuit Breaker  │ │
                    │  │  (3 retries, exponential)   │ │
                    │  └──────────┬──────────────────┘ │
                    │             │                    │
                    └─────────────┼────────────────────┘
                                  │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │ OpenRouter │ │  OpenAI   │ │ Anthropic │
              └───────────┘ └───────────┘ └───────────┘
```

## 2. Cadastro de Providers

### Schema de Configuracao

```json
{
  "id": "uuid",
  "name": "openrouter",
  "display_name": "OpenRouter",
  "base_url": "https://openrouter.ai/api/v1",
  "api_key_encrypted": "AES-256-GCM encrypted",
  "status": "active",
  "priority": 1,
  "cost_per_1k_tokens_input": 0.002,
  "cost_per_1k_tokens_output": 0.006,
  "rate_limit_per_minute": 60,
  "supported_models": [
    "openai/gpt-4",
    "anthropic/claude-3-opus",
    "meta-llama/llama-3-70b"
  ],
  "health": {
    "score": 98.5,
    "avg_latency_ms": 450,
    "error_rate_24h": 0.02,
    "last_check": "2026-04-22T10:00:00Z"
  },
  "fallback_chain": ["openai", "anthropic"],
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Regras de Cadastro
- API key criptografada com AES-256-GCM
- Chave de criptografia em env var (nunca no DB)
- Validar conectividade antes de ativar
- Pelo menos 2 providers ativos (para fallback)

## 3. Roteamento Inteligente

### Criterios de Selecao

```typescript
function selectProvider(request: AgentRunRequest): Provider {
  const candidates = providers
    .filter(p => p.status === 'active')
    .filter(p => p.supported_models.includes(request.model))
    .filter(p => p.health.score > 70)
    .sort((a, b) => {
      // 1. Prioridade configurada
      if (a.priority !== b.priority) return a.priority - b.priority
      // 2. Health score (desempate)
      return b.health.score - a.health.score
    })

  return candidates[0] || null
}
```

### Score de Saude (Health Score)

```
health_score = (
  availability_percent * 0.4 +
  (100 - normalized_latency) * 0.3 +
  (100 - error_rate_percent) * 0.3
)
```

Atualizado a cada 5 minutos via health check:
```
1. Enviar request simples para cada provider
2. Medir latencia
3. Verificar status code
4. Atualizar score
5. Se score < 50 → marcar como maintenance
6. Se score > 70 → reativar
```

## 4. Controle de Custo

### Calculo por Requisicao

```typescript
function calculateCost(
  tokens_input: number,
  tokens_output: number,
  provider: Provider
): number {
  const input_cost = (tokens_input / 1000) * provider.cost_per_1k_tokens_input
  const output_cost = (tokens_output / 1000) * provider.cost_per_1k_tokens_output
  return input_cost + output_cost
}
```

### Budget por Usuario

```typescript
async function checkUserBudget(userId: string, estimatedCost: number): Promise<boolean> {
  const subscription = await getSubscription(userId)
  
  const remaining = subscription.tokens_limit - subscription.tokens_used
  if (remaining <= 0) return false
  
  const estimatedTokens = tokensFromCost(estimatedCost, subscription.plan)
  if (estimatedTokens > remaining) return false
  
  return true
}
```

### Dashboard de Custos

| Metrica | Descricao |
|---------|-----------|
| Custo total/dia | Soma de todas as chamadas |
| Custo por usuario | Gasto individual |
| Custo por provider | Quanto custa cada API |
| Custo por modelo | Qual modelo e mais caro |
| Margem | Receita - custo de API |
| Tokens consumidos | Volume total |

### Alertas de Custo
- Custo diario > R$ 100 → alerta admin
- Usuario consumindo > 80% dos creditos → notificar
- Provider com custo acima do esperado → alerta

## 5. Cache

### Estrategia

```typescript
const cacheKey = `agent:${agentId}:run:${hash(JSON.stringify({ input, config }))}`
const cached = await redis.get(cacheKey)

if (cached) {
  // Hit: retornar sem chamar API
  return JSON.parse(cached)
}

// Miss: chamar API
const result = await callProvider(payload)

// Salvar no cache (TTL: 1h para queries, 5min para execucoes)
await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600)
```

### Regras de Cache

| Cenario | TTL | Invalidate |
|---------|-----|-----------|
| Query simples (mesma pergunta) | 1h | Mudanca de agent config |
| Execucao com side effects | NAO CACHA | - |
| Listagem de modelos | 24h | Mudanca de status |
| Health check | 5min | Sempre |

### Economia Estimada
- Sem cache: 100% das chamadas pagas
- Com cache: ~30-40% de economia (depends on repeticao)

## 6. Rate Limiting (duplo)

### Limites do Provider (respeitar)
```typescript
const providerLimiter = new RateLimiter({
  key: `provider:${providerId}`,
  limit: provider.rate_limit_per_minute,
  window: 60
})
```

### Limites do Sistema (impor)
```typescript
const userLimiter = new RateLimiter({
  key: `user:${userId}:run`,
  limit: 10, // 10 execucoes/min
  window: 60
})
```

### Se limite atingido
- Provider: queue + retry com backoff
- Usuario: 429 + retry_after

## 7. Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private nextRetry: Date

  async execute(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (new Date() < this.nextRetry) {
        throw new Error('Circuit is open')
      }
      this.state = 'half-open'
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    if (this.failures >= 5) {
      this.state = 'open'
      this.nextRetry = new Date(Date.now() + 30000) // 30s
    }
  }
}
```

### Configuracao por Provider

| Provider | Falhas para abrir | Tempo de espera | Half-open requests |
|----------|-------------------|-----------------|-------------------|
| OpenRouter | 5 | 30s | 1 |
| OpenAI | 5 | 30s | 1 |
| Anthropic | 5 | 30s | 1 |

## 8. Retry Strategy

```typescript
async function callWithRetry(fn, maxRetries = 3): Promise<T> {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (!isRetryable(error)) throw error // 4xx nao retry
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff, max 10s
      await sleep(delay + Math.random() * 1000) // Jitter
    }
  }
  
  throw lastError
}
```

### Codigois Retryable
- 429 (rate limit) → retry
- 500, 502, 503, 504 → retry
- 400, 401, 403, 404 → NAO retry
- Timeout → retry

## 9. Fallback Chain

```typescript
async function executeWithFallback(
  model: string,
  payload: RequestPayload,
  primaryProvider: Provider
): Promise<ProviderResponse> {
  const chain = [primaryProvider, ...primaryProvider.fallback_chain.map(getProvider)]
  
  for (const provider of chain) {
    try {
      return await callWithRetry(() => callProvider(provider, model, payload))
    } catch (error) {
      log.warn(`Provider ${provider.name} failed, trying next`, { error })
      continue
    }
  }
  
  throw new AppError('ALL_PROVIDERS_FAILED', 503, 'All providers unavailable')
}
```

## 10. Logs e Auditoria

### Log de Cada Chamada

```json
{
  "timestamp": "2026-04-22T10:00:00Z",
  "provider": "openrouter",
  "model": "gpt-4",
  "user_id": "uuid",
  "agent_id": "uuid",
  "execution_id": "uuid",
  "request_tokens": 500,
  "response_tokens": 200,
  "total_tokens": 700,
  "cost_usd": 0.005,
  "latency_ms": 1200,
  "status_code": 200,
  "cache_hit": false,
  "retry_count": 0,
  "circuit_breaker": "closed",
  "correlation_id": "uuid"
}
```

### Agregacao Diaria

```json
{
  "date": "2026-04-22",
  "provider": "openrouter",
  "total_requests": 1500,
  "total_tokens": 500000,
  "total_cost_usd": 3.50,
  "avg_latency_ms": 800,
  "error_rate": 0.02,
  "cache_hit_rate": 0.35
}
```

## 11. Checklist

- [ ] API keys criptografadas em repouso
- [ ] Gateway interno (nunca chamar direto do frontend)
- [ ] Cost tracking por requisicao
- [ ] Limite por usuario (plano)
- [ ] Roteamento inteligente (prioridade + health)
- [ ] Fallback chain configurada
- [ ] Circuit breaker ativo
- [ ] Retry com exponential backoff
- [ ] Cache implementado
- [ ] Rate limit duplo (provider + usuario)
- [ ] Health check periodico
- [ ] Logs completos
- [ ] Dashboard de custos
- [ ] Alertas de custo anormal