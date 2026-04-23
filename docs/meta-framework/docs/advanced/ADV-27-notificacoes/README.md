# ADV-27 - Notificacoes Real-Time (WebSocket)

> **Prioridade:** MEDIO
> **Depende de:** BACK-04, OPS-22
> **É dependência de:** 30
> **Categoria:** advanced

## 1. Por Que WebSocket?

Polling:
```
Frontend: "Ja acabou o pagamento?" → Backend: "Nao"
Frontend: "Ja acabou?" → Backend: "Nao"
Frontend: "Ja acabou?" → Backend: "Nao"
Frontend: "Ja acabou?" → Backend: "SIM"  (waste de requests)
```

WebSocket:
```
Backend: "Pagamento aprovado!" → Frontend atualiza UI  (instantaneo)
```

## 2. Eventos que Precisam de Notificacao

| Evento | Origem | Destino | Urgencia |
|--------|--------|---------|----------|
| Pagamento aprovado | Webhook processor | Usuario que pagou | Alta |
| Execucao de agent concluida | Agent executor | Usuario que executou | Alta |
| Creditos baixos (<10%) | Cron job | Usuario | Media |
| Agent pausado por erro | Provider gateway | Dono do agent | Media |
| Novo membro na equipe | Admin action | Membros do tenant | Baixa |
| Manutencao programada | Admin | Todos usuarios | Baixa |

## 3. Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Backend API │────>│  Redis Pub/Sub│<────│  Workers     │
│              │     │              │     │  (BullMQ)     │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  WS Gateway  │
                     │  (Fastify WS)│
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────▼────┐  ┌────▼────┐  ┌──────▼────┐
         │ User A  │  │ User B  │  │ User C   │
         │ (ws)    │  │ (ws)    │  │ (ws)     │
         └─────────┘  └─────────┘  └──────────┘
```

## 4. Formato de Mensagem

### Client → Server

```json
{ "type": "subscribe", "channel": "user:{userId}" }
{ "type": "subscribe", "channel": "tenant:{tenantId}" }
{ "type": "unsubscribe", "channel": "user:{userId}" }
{ "type": "ping" }
```

### Server → Client

```json
{ "type": "payment.approved", "data": { "transaction_id": "uuid", "plan": "pro" }, "timestamp": "2026-04-22T10:00:00Z" }
{ "type": "agent.completed", "data": { "execution_id": "uuid", "agent_id": "uuid", "tokens": 350 }, "timestamp": "..." }
{ "type": "credits.low", "data": { "remaining": 500, "limit": 5000 }, "timestamp": "..." }
{ "type": "system.maintenance", "data": { "message": "Scheduled maintenance at 02:00 UTC", "duration_min": 30 }, "timestamp": "..." }
{ "type": "pong" }
```

## 5. Canais

| Canal | Padrao | Quem recebe | Tipos de evento |
|-------|--------|-------------|----------------|
| User | `user:{userId}` | So o usuario | payment, agent, credits |
| Tenant | `tenant:{tenantId}` | Membros do tenant | member_joined, maintenance |
| Agent | `agent:{agentId}` | Quem esta assistindo | execution_update |
| Global | `global` | Todos conectados | maintenance |

## 6. Autenticacao do WebSocket

```
1. Client abre conexao: wss://api.dominio.com/v1/ws?token=JWT_ACCESS_TOKEN
2. Server valida JWT (mesmo middleware de auth)
3. Se invalido → fechar conexao (4001)
4. Se valido → aceitar conexao + mapear userId → socket
```

### Implementacao (conceito)

```typescript
import websocket from '@fastify/websocket'

app.register(websocket)

app.get('/v1/ws', { preHandler: [authMiddleware] }, (socket, req) => {
  const userId = req.user.sub
  const tenantId = req.user.tenant_id

  // Registrar conexao
  connectionManager.register(userId, tenantId, socket)

  // Subscribes
  socket.on('message', (msg) => {
    const data = JSON.parse(msg.toString())
    if (data.type === 'subscribe') {
      connectionManager.subscribe(userId, data.channel)
    }
    if (data.type === 'ping') {
      socket.send(JSON.stringify({ type: 'pong' }))
    }
  })

  // Cleanup
  socket.on('close', () => {
    connectionManager.unregister(userId)
  })
})
```

### Publicacao (uso nos services)

```typescript
// Quando pagamento e aprovado (no webhook processor)
await redis.publish(
  `user:${userId}`,
  JSON.stringify({
    type: 'payment.approved',
    data: { transaction_id: txn.id, plan: 'pro' },
    timestamp: new Date().toISOString(),
  })
)

// Quando agent termina (no agent executor)
await redis.publish(
  `user:${userId}`,
  JSON.stringify({
    type: 'agent.completed',
    data: { execution_id: execId, agent_id: agentId, tokens: 350 },
    timestamp: new Date().toISOString(),
  })
)
```

### Connection Manager

```typescript
class ConnectionManager {
  private connections: Map<string, Set<WebSocket>> = new Map()
  private subscriptions: Map<string, Set<string>> = new Map() // channel → userIds

  register(userId: string, tenantId: string, socket: WebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(socket)

    // Auto-subscribe ao canal do usuario
    this.subscribe(userId, `user:${userId}`)
    if (tenantId) this.subscribe(userId, `tenant:${tenantId}`)
  }

  unregister(userId: string) {
    this.connections.delete(userId)
  }

  subscribe(userId: string, channel: string) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
    }
    this.subscriptions.get(channel)!.add(userId)
  }

  broadcast(channel: string, message: object) {
    const userIds = this.subscriptions.get(channel)
    if (!userIds) return

    const payload = JSON.stringify(message)
    for (const userId of userIds) {
      const sockets = this.connections.get(userId)
      if (sockets) {
        for (const socket of sockets) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(payload)
          }
        }
      }
    }
  }
}
```

### Redis Subscriber (background)

```typescript
// Iniciar ao boot do servidor
const subscriber = new Redis(REDIS_URL)
const manager = new ConnectionManager()

subscriber.psubscribe('user:*', 'tenant:*', 'agent:*', 'global')

subscriber.on('pmessage', (pattern, channel, message) => {
  manager.broadcast(channel, JSON.parse(message))
})
```

## 7. Frontend (Hook)

```typescript
function useWebSocket(token: string) {
  const [connected, setConnected] = useState(false)
  const callbacks = useRef(new Map<string, (data: any) => void>())

  useEffect(() => {
    const ws = new WebSocket(`wss://api.dominio.com/v1/ws?token=${token}`)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      const callback = callbacks.current.get(msg.type)
      if (callback) callback(msg.data)
    }

    return () => ws.close()
  }, [token])

  function on(eventType: string, callback: (data: any) => void) {
    callbacks.current.set(eventType, callback)
  }

  return { connected, on }
}

// Uso
function Dashboard() {
  const { connected, on } = useWebSocket(accessToken)

  useEffect(() => {
    on('payment.approved', (data) => {
      toast.success('Plano Pro ativado!')
      queryClient.invalidateQueries(['subscription'])
    })
    on('agent.completed', (data) => {
      addNotification(`Agent concluído: ${data.tokens} tokens usados`)
    })
    on('credits.low', (data) => {
      showCreditsWarning(data.remaining)
    })
  }, [])
}
```

## 8. Reconexao

```typescript
function useWebSocket(token: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const MAX_RETRIES = 10

  function connect() {
    const ws = new WebSocket(`wss://api.dominio.com/v1/ws?token=${token}`)

    ws.onclose = () => {
      retryCount.current++
      if (retryCount.current <= MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000)
        setTimeout(connect, delay)
      }
    }

    ws.onopen = () => {
      retryCount.current = 0
    }

    wsRef.current = ws
  }

  useEffect(() => { connect() }, [token])
}
```

## 9. Checklist

- [ ] @fastify/websocket configurado
- [ ] Autenticacao JWT na conexao WS
- [ ] Connection Manager (userId → sockets)
- [ ] Redis Pub/Sub para publicacao cross-process
- [ ] Canais: user, tenant, agent, global
- [ ] Eventos definidos por tipo
- [ ] Frontend hook useWebSocket
- [ ] Reconexao automatica com exponential backoff
- [ ] Ping/pong (keep-alive a cada 30s)
- [ ] Limite de conexoes por usuario (3)
- [ ] Cleanup de conexoes mortas