# AI-12 - Streaming API (Server-Sent Events)

> **Prioridade:** ALTO
> **Depende de:** BACK-04, AI-09, AI-10
> **É dependência de:** 30
> **Categoria:** ai

## 1. Por Que Streaming?

Sem streaming:
```
Usuario envia pergunta → espera 10-30s → recebe resposta completa
```
UX horrivel. Usuario acha que travou.

Com streaming:
```
Usuario envia pergunta → recebe palavras em tempo real → resposta aparece gradualmente
```
UX tipo ChatGPT. Usuario ve que ta funcionando.

## 2. Arquitetura SSE

```
Frontend                     Backend                    Provider
  │                            │                          │
  │  POST /agents/:id/run     │                          │
  │  (Accept: text/event-stream)│                         │
  │───────────────────────────>│                          │
  │                            │  POST /chat/completions  │
  │                            │  (stream: true)          │
  │                            │─────────────────────────>│
  │                            │                          │
  │  SSE: token                │  chunk: token             │
  │<───────────────────────────│<─────────────────────────│
  │  SSE: token                │  chunk: token             │
  │<───────────────────────────│<─────────────────────────│
  │  SSE: token                │  chunk: token             │
  │<───────────────────────────│<─────────────────────────│
  │  SSE: [DONE]              │  [DONE]                   │
  │<───────────────────────────│<─────────────────────────│
  │                            │                          │
  │                            │  Calcula tokens + custo   │
  │                            │  Registra execution       │
  │                            │  Debita creditos          │
```

## 3. Formato SSE

### Eventos

| Evento | Dados | Descricao |
|--------|-------|-----------|
| `token` | `{ content: "word" }` | Cada token da resposta |
| `usage` | `{ tokens: 150, cost: 0.003 }` | Metadados de uso (no final) |
| `error` | `{ code: "...", message: "..." }` | Erro durante execucao |
| `done` | `{ execution_id: "uuid" }` | Execucao concluida |

### Fluxo de Dados

```
event: token
data: {"content": "Para"}

event: token
data: {"content": " resetar"}

event: token
data: {"content": " sua"}

event: token
data: {"content": " senha,"}

...

event: usage
data: {"tokens": 150, "cost": 0.003}

event: done
data: {"execution_id": "uuid-abc"}
```

## 4. Endpoint

### POST /agents/:id/run (streaming)

**Diferenca do endpoint normal:**
- Se header `Accept: text/event-stream` → responde com SSE
- Se sem header → responde com JSON normal (backward compatible)

**Request igual:**
```json
{
  "input": "Como resetar minha senha?",
  "config_override": { "temperature": 0.5 }
}
```

**Response (SSE):**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

## 5. Implementacao Conceitual (Backend)

```typescript
async function runAgentStream(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params
  const { input } = req.body
  const user = req.user!

  // Validadesmesmas do run normal
  const agent = await validateAgent(id, user)
  await checkCredits(user)
  const intentCheck = detectMaliciousIntent(input)
  if (!intentCheck.safe) throw new AppError('VALIDATION_ERROR', 400, '...')

  // Headers SSE
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  // Criar execution record
  const execution = await prisma.agentExecution.create({
    data: { agentId: id, userId: user.sub, status: 'running', input, ... }
  })

  let totalTokens = 0
  let fullContent = ''

  try {
    // Chamar provider com stream: true
    const stream = await providerGateway.executeStream({
      provider: agent.provider,
      model: agent.model,
      messages: buildPromptMessages(agent.systemPrompt, input),
      maxTokens: agent.maxTokensPerRun,
      temperature: agent.temperature,
    })

    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        const token = chunk.choices[0].delta.content
        fullContent += token

        reply.raw.write(`event: token\ndata: ${JSON.stringify({ content: token })}\n\n`)
      }

      if (chunk.usage) {
        totalTokens = chunk.usage.total_tokens
      }
    }

    // Filtrar output final
    const filteredOutput = filterOutput(fullContent)
    const cost = calculateCost(totalTokens, agent.provider)

    // Evento de uso
    reply.raw.write(`event: usage\ndata: ${JSON.stringify({ tokens: totalTokens, cost })}\n\n`)

    // Evento de conclusao
    reply.raw.write(`event: done\ndata: ${JSON.stringify({ execution_id: execution.id })}\n\n`)

    // Atualizar BD
    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: { status: 'completed', output: filteredOutput, tokensUsed: totalTokens, cost, completedAt: new Date() },
    })

    await prisma.subscription.update({
      where: { userId: user.sub },
      data: { tokensUsed: { increment: totalTokens } },
    })

  } catch (err) {
    reply.raw.write(`event: error\ndata: ${JSON.stringify({ code: 'PROVIDER_ERROR', message: err.message })}\n\n`)
    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: { status: 'failed', errorMessage: err.message, completedAt: new Date() },
    })
  }

  reply.raw.end()
}
```

## 6. Implementacao Conceitual (Frontend)

```typescript
async function runAgentStream(agentId: string, input: string, onToken: (token: string) => void) {
  const response = await fetch(`/v1/agents/${agentId}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ input }),
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('event: token')) {
        // Proxima linha tem o data
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        if (data.content) onToken(data.content)
      }
    }
  }
}

// Uso
runAgentStream('agent-uuid', 'Como resetar senha?', (token) => {
  setFullText(prev => prev + token)
})
```

## 7. Provider Gateway (Streaming)

```typescript
async executeStream(params: ExecuteParams): AsyncIterable<StreamChunk> {
  const provider = await this.selectProvider(params.provider)
  const apiKey = decrypt(provider.apiKeyEncrypted)

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      stream: true,  // <- CHAVE
    }),
    signal: AbortSignal.timeout(60000), // 60s para streams
  })

  if (!response.ok || !response.body) {
    throw new Error(`Provider error: ${response.status}`)
  }

  return this.parseSSEStream(response.body)
}

private async *parseSSEStream(body: ReadableStream): AsyncIterable<StreamChunk> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        yield JSON.parse(data)
      }
    }
  }
}
```

## 8. Timeout e Cancelamento

| Cenario | Acao |
|---------|------|
| Usuario fecha a pagina | AbortSignal cancela request ao provider |
| Provider demora > 60s | Timeout + evento error + encerrar stream |
| Tokens ultrapassam limite | Parar stream + evento usage com limite atingido |
| Erro no meio do stream | Enviar evento error + encerrar |

### Detecao de Desconexao
```typescript
req.raw.on('close', () => {
  // Usuario desconectou
  // Cancelar request ao provider (AbortController)
  // Registrar tokens usados ate o momento
  // Atualizar execution record
})
```

## 9. Creditos em Tempo Real

Problema: sem stream, sabemos o total de tokens ANTES de responder.
Com stream, sabemos DEPOIS.

Solução: **pre-authorize + settle**

```
1. Antes do stream: bloquear creditos estimados (max_tokens_per_run)
2. Durante o stream: contar tokens reais
3. Apos o stream: creditar diferenca (estimado - real)
```

### Fluxo
```typescript
// Pre-authorize
const estimatedTokens = agent.maxTokensPerRun
await prisma.subscription.update({
  where: { userId: user.sub },
  data: { tokensUsed: { increment: estimatedTokens } },
})

// ... stream ...

// Settle
const actualTokens = totalTokens
const diff = estimatedTokens - actualTokens
await prisma.subscription.update({
  where: { userId: user.sub },
  data: { tokensUsed: { decrement: diff } },
})
```

## 10. Compatibilidade

| Metodo | Quando | Response |
|--------|--------|----------|
| JSON (padrao) | Sem header Accept | `{ success: true, data: { ... } }` |
| SSE (stream) | Com `Accept: text/event-stream` | SSE events |

O mesmo endpoint suporta os dois. O frontend escolhe.

## 11. Checklist

- [ ] Endpoint suporta SSE via header Accept
- [ ] Provider chamado com stream: true
- [ ] Tokens enviados em tempo real (evento token)
- [ ] Usage enviado ao final (evento usage)
- [ ] Erro enviado como evento (evento error)
- [ ] Done enviado ao final (evento done)
- [ ] Desconexao do cliente cancela request
- [ ] Timeout de 60s para streams
- [ ] Pre-authorize de creditos antes do stream
- [ ] Settle de creditos apos o stream
- [ ] Backward compatible (sem header = JSON normal)
- [ ] Output filtrado (filterOutput) apos stream completo
- [ ] X-Accel-Buffering: no (NGINX nao bufferiza)
- [ ] NGINX configurado para SSE (proxy_buffering off)