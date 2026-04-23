# ADV-14 - Dead Letter Queue

> **Prioridade:** MEDIO
> **Depende de:** BACK-04, BIZ-08
> **É dependência de:** 22, 23
> **Categoria:** advanced

## 1. O Problema

Sem DLQ:
```
Webhook chega → processamento falha → some → ninguem sabe
Email falha → some → usuario nao recebe
Retry sem limite → sobrecarrega sistema → mais falha
```

Com DLQ:
```
Webhook chega → processamento falha → vai pra fila de mortos
Email falha → vai pra fila de mortos → retry automatico depois
Tudo logado → visibilidade → pode processar manualmente
```

## 2. O Que e Dead Letter Queue

Fila onde mensagens/processamentos FALHOS sao colocados para:
- Retry automatico (com backoff)
- Investigacao manual (admin)
- Nao perder dados (persistencia)
- Visibilidade (dashboard de falhas)

## 3. Modelo de Dados

### Tabela: dead_letter_queue

| Campo | Tipo | Constraint | Descricao |
|-------|------|-----------|-----------|
| id | UUID | PK | Identificador |
| source | VARCHAR(50) | NOT NULL | Origem (webhook, email, provider, queue) |
| payload | JSONB | NOT NULL | Dados originais da mensagem |
| error | TEXT | NOT NULL | Mensagem de erro |
| retry_count | INTEGER | DEFAULT 0 | Tentativas de retry |
| max_retries | INTEGER | DEFAULT 3 | Maximo de retries |
| status | VARCHAR(20) | DEFAULT 'pending' | pending, processing, succeeded, exhausted |
| process_at | TIMESTAMP | NULL | Quando tentar de novo |
| created_at | TIMESTAMP | DEFAULT NOW() | Criacao |
| updated_at | TIMESTAMP | DEFAULT NOW() | Atualizacao |

### Tabela: dead_letter_queue_events (historico)

| Campo | Tipo | Constraint | Descricao |
|-------|------|-----------|-----------|
| id | UUID | PK | Identificador |
| dlq_id | UUID | FK → dead_letter_queue.id | Item relacionado |
| event | VARCHAR(50) | NOT NULL | created, retried, succeeded, exhausted, manual_retry |
| error | TEXT | NULL | Erro no retry (se houve) |
| created_at | TIMESTAMP | DEFAULT NOW() | Criacao |

## 4. Fontes de Falha

| Source | Cenarios | Criticidade |
|--------|----------|-------------|
| `webhook_stripe` | Falha no processamento, DB down, timeout | Alta |
| `webhook_mp` | Falha no processamento, assinatura invalida | Alta |
| `email` | Servidor SMTP cai, email invalido, rate limit | Media |
| `provider_call` | API cai apos retries, resposta invalida | Alta |
| `agent_execution` | Timeout, provider cai, creditos insuficientes | Media |
| `subscription_renewal` | Falha na cobranca automatica | Alta |
| `token_settlement` | Falha no ajuste de creditos pos-stream | Alta |

## 5. Fluxo de Processamento

```
Mensagem original
    │
    ├── Sucesso → processado normalmente
    │
    └── Falha
        │
        ├── 1a tentativa → retry imediato (1s)
        │   └── Falha
        │       ├── 2a tentativa → retry (30s)
        │       │   └── Falha
        │       │       ├── 3a tentativa → retry (5min)
        │       │       │   └── Falha
        │       │       │       └── DLQ (status: exhausted) → alerta admin
        │       │       └── Sucesso → removido da DLQ
        │       └── Sucesso → removido da DLQ
        └── Sucesso → removido da DLQ
```

## 6. Implementacao Conceitual

### DLQ Service

```typescript
class DeadLetterQueueService {
  async enqueue(source: string, payload: any, error: string, maxRetries = 3): Promise<void> {
    const processAt = this.calculateNextRetry(0)

    const item = await prisma.deadLetterQueue.create({
      data: { source, payload, error, retryCount: 0, maxRetries, status: 'pending', processAt },
    })

    await prisma.deadLetterQueueEvent.create({
      data: { dlqId: item.id, event: 'created', error },
    })

    await this.scheduleRetry(item.id, processAt)

    // Alertar se source critico
    if (this.isCritical(source)) {
      await this.notifyAdmin(item)
    }
  }

  async processRetry(dlqId: string): Promise<void> {
    const item = await prisma.deadLetterQueue.findUnique({ where: { id: dlqId } })
    if (!item || item.status !== 'pending') return

    if (new Date() < item.processAt!) return // Ainda nao e hora

    await prisma.deadLetterQueue.update({
      where: { id: dlqId },
      data: { status: 'processing', retryCount: { increment: 1 } },
    })

    try {
      await this.reprocess(item)

      await prisma.deadLetterQueue.update({ where: { id: dlqId }, data: { status: 'succeeded' } })
      await prisma.deadLetterQueueEvent.create({ data: { dlqId, event: 'succeeded' } })
    } catch (err: any) {
      if (item.retryCount >= item.maxRetries) {
        await prisma.deadLetterQueue.update({ where: { id: dlqId }, data: { status: 'exhausted' } })
        await prisma.deadLetterQueueEvent.create({ data: { dlqId, event: 'exhausted', error: err.message } })
      } else {
        const processAt = this.calculateNextRetry(item.retryCount)
        await prisma.deadLetterQueue.update({
          where: { id: dlqId },
          data: { status: 'pending', processAt, error: err.message },
        })
        await prisma.deadLetterQueueEvent.create({ data: { dlqId, event: 'retried', error: err.message } })
        await this.scheduleRetry(dlqId, processAt)
      }
    }
  }

  private calculateNextRetry(retryCount: number): Date {
    const delays = [1000, 30000, 300000] // 1s, 30s, 5min
    const delay = delays[Math.min(retryCount, delays.length - 1)]
    return new Date(Date.now() + delay)
  }

  private async reprocess(item: DeadLetterQueueItem): Promise<void> {
    switch (item.source) {
      case 'webhook_stripe':
      case 'webhook_mp':
        return billingService.processWebhook(item.payload.gateway, item.payload.headers, item.payload.body)
      case 'email':
        return emailService.send(item.payload)
      case 'provider_call':
        return providerGateway.execute(item.payload)
      case 'token_settlement':
        return tokenSettlementService.settle(item.payload)
      default:
        throw new Error(`Unknown DLQ source: ${item.source}`)
    }
  }

  private isCritical(source: string): boolean {
    return ['webhook_stripe', 'webhook_mp', 'subscription_renewal', 'token_settlement'].includes(source)
  }
}
```

### Integracao com Webhooks

```typescript
async function processWebhook(gateway: string, headers: any, body: any) {
  try {
    // ... processamento normal ...
  } catch (err) {
    // NAO perder o webhook → mandar pra DLQ
    await dlqService.enqueue(`webhook_${gateway}`, { gateway, headers, body }, err.message)
    // Ainda retornar 200 pro gateway (nao rejeitar)
  }
}
```

### Integracao com Emails

```typescript
async function sendEmail(to: string, template: string, data: any) {
  try {
    await resend.emails.send({ to, ... })
  } catch (err) {
    await dlqService.enqueue('email', { to, template, data }, err.message)
  }
}
```

## 7. BullMQ Scheduler

```typescript
import { Queue, Worker } from 'bullmq'

const dlqRetryQueue = new Queue('dlq-retry', { connection: redisConnection })

// Worker que processa retries
const dlqWorker = new Worker('dlq-retry', async (job) => {
  await dlqService.processRetry(job.data.dlqId)
}, { connection: redisConnection })

// Agendar retry
async function scheduleRetry(dlqId: string, processAt: Date) {
  const delay = Math.max(0, processAt.getTime() - Date.now())
  await dlqRetryQueue.add('retry', { dlqId }, { delay })
}
```

## 8. API de Admin

| Rota | Metodo | Descricao |
|------|--------|-----------|
| /admin/dlq | GET | Listar items (filtros: source, status) |
| /admin/dlq/:id | GET | Detalhes + historico de eventos |
| /admin/dlq/:id/retry | POST | Forcar retry manual |
| /admin/dlq/:id/discard | POST | Descartar item (nao tentar mais) |
| /admin/dlq/stats | GET | Metricas da DLQ |

### GET /admin/dlq/stats

```json
{
  "total_pending": 5,
  "total_exhausted": 12,
  "by_source": {
    "webhook_mp": 3,
    "email": 2,
    "provider_call": 0
  },
  "oldest_pending": "2026-04-22T08:00:00Z"
}
```

## 9. Alertas

| Cenario | Alerta |
|---------|--------|
| Item DLQ criado (source critico) | Notificar admin imediato |
| Item muda para exhausted | Notificar admin (falha permanente) |
| Pending items > 10 | Alerta de acumulo |
| Item com processAt atrasado > 30min | Worker pode estar travado |
| exhausted nos ultimos 24h > 5 | Problema sistematico |

## 10. Retencao

| Status | Retencao |
|--------|----------|
| succeeded | 7 dias (depois deletar) |
| exhausted | 90 dias (auditoria) |
| pending | Indefinido (ate processar) |

## 11. Checklist

- [ ] Tabela dead_letter_queue no schema
- [ ] Tabela dead_letter_queue_events no schema
- [ ] DLQ Service com enqueue + processRetry
- [ ] Integracao com webhooks (catch → enfileirar)
- [ ] Integracao com emails (catch → enfileirar)
- [ ] Integracao com provider calls (apos todos retries falharem)
- [ ] BullMQ scheduler para retries automaticos
- [ ] API admin para listar/retry/discard
- [ ] Calculo de next retry (exponential backoff)
- [ ] Alertas para items criticos e exhausted
- [ ] Historico de eventos por item
- [ ] Retencao configurada
- [ ] Webhook retorna 200 MESMO se DLQ (nao rejeitar)