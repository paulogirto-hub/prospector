# ADV-13 - Feature Flags

> **Prioridade:** MEDIO
> **Depende de:** CORE-02, BACK-04
> **É dependência de:** 19
> **Categoria:** advanced

## 1. Por Que Feature Flags?

Sem feature flags:
```
Codigo novo → merge em main → deploy → todos recebem
Se deu bug → TODOS sentem → rollback → todos perdem
```

Com feature flags:
```
Codigo novo → merge em main → deploy → flag OFF → ninguem recebe
Ativar para testes → 5% dos users → testar
Ativar para todos → se der bug → desliga flag → sofe rollback
```

**Beneficios:**
- Deploy sem medo (codigo novo sem impacto)
- Release gradual (canary release)
- A/B testing
- Kill switch (desliga feature em 1s)
- Testar em producao com seguranca

## 2. Modelo de Dados

### Tabela: feature_flags

| Campo | Tipo | Constraint | Descricao |
|-------|------|-----------|-----------|
| id | UUID | PK | Identificador |
| key | VARCHAR(100) | UNIQUE | Nome da flag (ex: `agent_streaming`) |
| description | TEXT | NOT NULL | O que a flag controla |
| enabled | BOOLEAN | DEFAULT false | Flag global ligada/desligada |
| percentage | INTEGER | DEFAULT 100 | % de usuarios que recebem (0-100) |
| allowed_roles | JSONB | DEFAULT '[]' | Roles permitidos (se vazio = todos) |
| created_at | TIMESTAMP | DEFAULT NOW() | Criacao |
| updated_at | TIMESTAMP | DEFAULT NOW() | Atualizacao |

### Exemplos de Flags

| Key | Descricao | Default | Percentage | Roles |
|-----|-----------|---------|-----------|-------|
| `agent_streaming` | SSE streaming para execucao de agent | false | 100 | [] |
| `agent_file_upload` | Upload de arquivos no agent | false | 50 | ["pro", "enterprise"] |
| `new_dashboard` | Dashboard v2 | false | 20 | [] |
| `mercado_pago_integration` | Gateway Mercado Pago | true | 100 | ["admin"] |
| `max_agents_20` | Permitir 20 agents no plano pro | false | 100 | ["pro"] |
| `maintenance_mode` | Modo manutencao (desliga tudo) | false | 100 | [] |

## 3. Implementacao Conceitual

### Service

```typescript
class FeatureFlagService {
  async isEnabled(key: string, context: { userId?: string; role?: string }): Promise<boolean> {
    // 1. Cache check (Redis, TTL 60s)
    const cached = await redis.get(`flag:${key}`)
    if (cached) {
      const flag = JSON.parse(cached)
      return this.evaluate(flag, context)
    }

    // 2. DB lookup
    const flag = await prisma.featureFlag.findUnique({ where: { key } })
    if (!flag) return false

    // 3. Cache it
    await redis.set(`flag:${key}`, JSON.stringify(flag), 'EX', 60)

    // 4. Evaluate
    return this.evaluate(flag, context)
  }

  private evaluate(flag: FeatureFlag, context: { userId?: string; role?: string }): boolean {
    if (!flag.enabled) return false

    if (flag.allowedRoles.length > 0 && context.role) {
      if (!flag.allowedRoles.includes(context.role)) return false
    }

    if (flag.percentage < 100 && context.userId) {
      const hash = this.hashUserId(context.userId, flag.key)
      return (hash % 100) < flag.percentage
    }

    return true
  }

  private hashUserId(userId: string, flagKey: string): number {
    const hash = crypto.createHash('sha256').update(`${userId}:${flagKey}`).digest()
    return hash.readUInt32BE(0) % 100
  }
}
```

### Middleware

```typescript
function requireFeatureFlag(flagKey: string) {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    const featureFlagService = new FeatureFlagService()
    const enabled = await featureFlagService.isEnabled(flagKey, {
      userId: req.user?.sub,
      role: req.user?.role,
    })

    if (!enabled) {
      throw new AppError('FORBIDDEN', 403, 'This feature is not available')
    }
  }
}
```

### Uso nas Rotas

```typescript
// So funciona se a flag agent_streaming estiver ativa
app.post('/:id/run/stream',
  { preHandler: [authMiddleware, requireFeatureFlag('agent_streaming')] },
  async (req, reply) => { ... }
)

// Maintenance mode: desliga tudo
app.addHook('onRequest', async (req, reply) => {
  const enabled = await featureFlagService.isEnabled('maintenance_mode', {})
  if (enabled && req.url !== '/health') {
    return reply.status(503).send({ success: false, error: { code: 'MAINTENANCE', message: 'System under maintenance' } })
  }
})
```

## 4. API de Admin para Flags

| Rota | Metodo | Descricao |
|------|--------|-----------|
| /admin/feature-flags | GET | Listar todas flags |
| /admin/feature-flags | POST | Criar flag |
| /admin/feature-flags/:key | PUT | Atualizar flag (enabled, percentage, roles) |
| /admin/feature-flags/:key | DELETE | Remover flag |

### PUT /admin/feature-flags/:key

```json
{
  "enabled": true,
  "percentage": 25,
  "allowed_roles": ["pro", "enterprise"]
}
```

## 5. Cache Strategy

```
TTL: 60 segundos (balance entre performance e flexibilidade)
Invalidacao: ao atualizar flag via admin API → del cache key
Fallback: se Redis cair → assume disabled (safe default)
```

### Invalidation
```typescript
async function updateFlag(key: string, data: Partial<FeatureFlag>) {
  const flag = await prisma.featureFlag.update({ where: { key }, data })
  await redis.del(`flag:${key}`)  // Invalidar cache
  return flag
}
```

## 6. Padroes de Uso

### Release Gradual (Canary)
```
Dia 1: percentage = 5   → 5% dos usuarios
Dia 2: percentage = 25  → 25%
Dia 3: percentage = 50  → 50%
Dia 4: percentage = 100  → todos (flag permanente ou remover)
```

### Kill Switch
```
Se feature tem bug em producao:
1. Admin API: PUT /admin/feature-flags/agent_streaming { enabled: false }
2. Em ate 60s (TTL do cache), feature desligada para TODOS
3. Investigar bug sem pressao
4. Ligar de novo quando corrigido
```

### Feature para Plano Especifico
```json
{
  "key": "max_agents_20",
  "enabled": true,
  "allowed_roles": ["pro", "enterprise"]
}
```

### A/B Testing
```json
{
  "key": "new_dashboard",
  "enabled": true,
  "percentage": 50
}
```

## 7. Checklist

- [ ] Tabela feature_flags no Prisma schema
- [ ] FeatureFlagService com cache Redis
- [ ] Middleware requireFeatureFlag
- [ ] Rotas admin para CRUD de flags
- [ ] Cache com TTL 60s + invalidacao manual
- [ ] Safe default (desabilitado se flag nao existe)
- [ ] Support para percentage rollout
- [ ] Support para roles permitidos
- [ ] Logging de avaliacao de flags (qual user, qual flag, resultado)
- [ ] Kill switch para maintenance mode