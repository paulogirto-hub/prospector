# BACK-24 - API Versioning

> **Prioridade:** MEDIO
> **Depende de:** BACK-04, BACK-15
> **É dependência de:** (nenhum)
> **Categoria:** backend

## 1. Estrategia

### URL-based Versioning (escolhida)

```
https://api.dominio.com/v1/agents
https://api.dominio.com/v2/agents
```

| Vantagem | Desvantagem |
|----------|-------------|
| Explicito | URLs diferentes |
| Facil de rotear | Cache invalidado na mudanca |
| Facil de debugar | Necessita manter N versoes |

### Header-based (alternativa, nao usada)

```
GET /agents
Accept: application/vnd.saas.v2+json
```

**Nao escolhida:** mais elegante mas mais dificil de debugar e rotear.

## 2. Regras de Versionamento

### O que PODE mudarna mesma versao (non-breaking)

| Mudanca | Exemplo | Compativel? |
|---------|---------|------------|
| Adicionar campo na response | `{"name": "...", "new_field": "..."}` | SIM |
| Adicionar rota nova | `GET /v1/agents/:id/stats` | SIM |
| Adicionar query param opcional | `?include=executions` | SIM |
| Adicionar webhook event | Novo tipo de evento | SIM |
| Adicionar header opcional | `X-Custom-Header` | SIM |

### O que NAO PODE mudar na mesma versao (breaking)

| Mudanca | Exemplo | Precisa v2? |
|---------|---------|------------|
| Remover campo da response | Tirar `legacy_id` | SIM |
| Renomear campo | `name` → `full_name` | SIM |
| Mudar tipo de campo | `id: int` → `id: string` | SIM |
| Remover rota | `DELETE /v1/legacy` | SIM |
| Mudar contract de erro | `{ error: "msg" }` → `{ errors: [] }` | SIM |
| Adicionar campo obrigatorino no request | `email` obrigatorio | SIM |
| Mudar semantica | `status=1` significava ativo, agora inativo | SIM |

## 3. Ciclo de Vida de uma Versao

```
v1/current     → v1/deprecated  → v1/sunset     → Removida
   │                │                │                │
   │  Anuncio      │  Header        │  410 Gone     │  Removida do
   │  de v2        │  Deprecation   │  Response     │  codigo
   │               │  Warning       │                │
   ▼               ▼                ▼                ▼
   3 meses         6 meses         9 meses          12 meses
```

### Timeline

| Mes | Estado | Acao |
|-----|--------|------|
| 0 | v1 e current | Comunicar: v2 vem em 3 meses |
| 3 | v2 lancada | v1 = deprecated. Header `Deprecation: true` + `Sunset: date` |
| 6 | v1 ainda funciona | Reminder: v1 sera descontinuada em 3 meses |
| 9 | v1 = sunset | v1 retorna 410 Gone + body com link pra migracao |
| 12 | v1 removida | Codigo v1 removido do repo |

## 4. Headers de Deprecacao

### Response Headers

```
# Quando v1 esta deprecated
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
Link: <https://api.dominio.com/v2/agents>; rel="successor-version"
```

### Exemplo de Response 410 (Sunset)

```json
{
  "success": false,
  "error": {
    "code": "VERSION_SUNSET",
    "message": "API v1 has been discontinued. Please migrate to v2.",
    "migration_guide": "https://docs.dominio.com/migration/v1-to-v2",
    "v2_endpoint": "https://api.dominio.com/v2/agents"
  }
}
```

## 5. Exemplo: Migracao v1 → v2

### v1 (atual)

```json
GET /v1/agents/uuid

{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Agent 1",
    "status": "active",
    "config": {}
  }
}
```

### v2 (nova — mudancas breaking)

```json
GET /v2/agents/uuid

{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Agent 1",
    "state": "active",        // renomeado: status → state
    "configuration": {},       // renomeado: config → configuration
    "created_at": "2026-04-22", // adicionado
    "owner": {                  // expandido: era so user_id
      "id": "user-uuid",
      "name": "Joao",
      "role": "manager"
    }
  }
}
```

### Guia de Migracao (obrigatorio)

```markdown
# Migracao v1 → v2

## Mudancas Breaking

| v1 | v2 | Acao |
|----|----|------|
| `status` | `state` | Renomear campo |
| `config` | `configuration` | Renomear campo |
| `user_id` | `owner.id` | Acessar nested |
| — | `owner.name` | Novo campo (ignorar se nao usar) |
| — | `created_at` | Novo campo (ignorar se nao usar) |

## Compatibilidade
- v1 continua funcionando por 6 meses apos lancamento de v2
- v1 recebe header Deprecation: true
- Apos 6 meses: v1 retorna 410 Gone
```

## 6. Implementacao (Fastify)

```typescript
import Fastify from 'fastify'

const app = Fastify()

// Registrar rotas v1
app.register(import('../modules/v1/agents/agents.routes'), { prefix: '/v1/agents' })
app.register(import('../modules/v1/auth/auth.routes'), { prefix: '/v1/auth' })

// Registrar rotas v2
app.register(import('../modules/v2/agents/agents.routes'), { prefix: '/v2/agents' })

// Version not found
app.all('/v3/*', async (req, reply) => {
  return reply.status(404).send({
    success: false,
    error: {
      code: 'VERSION_NOT_FOUND',
      message: 'API version not found. Available versions: v1, v2',
    },
  })
})
```

### Middleware de Deprecacao

```typescript
function deprecationHeader(sunsetDate: string, successor: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    reply.header('Deprecation', 'true')
    reply.header('Sunset', sunsetDate)
    reply.header('Link', `<${successor}>; rel="successor-version"`)
  }
}

// Aplicar em rotas v1 quando v2 for lancada
app.register(import('../modules/v1/agents/agents.routes'), {
  prefix: '/v1/agents',
  preHandler: deprecationHeader('Sat, 01 Jan 2027 00:00:00 GMT', 'https://api.dominio.com/v2/agents'),
})
```

## 7. Checklist

- [ ] Versao atual na URL (/v1/)
- [ ] Regras de breaking vs non-breaking documentadas
- [ ] Headers Deprecation + Sunset nas rotas deprecated
- [ ] Response 410 com guia de migracao para versoes sunset
- [ ] Timeline de ciclo de vida definida (3-6-9-12 meses)
- [ ] Guia de migracao escrito ANTES de lancar v2
- [ ] Rotas v1 e v2 coexistem durante periodo de transicao
- [ ] Logs de uso por versao (para saber quando pode remover)
- [ ] Comunicacao a clientes antes de cada fase