# SHRD-40 - Anti-Patterns (O que NAO fazer)

> **Prioridade:** MEDIO
> **Depende de:** BACK-05, AI-10
> **É dependência de:** (nenhum)
> **Categoria:** shared

## 1. Seguranca

### ❌ Salvar senha em texto puro
```typescript
// ANTI-PATTERN
await db.user.create({ email, password: password })
```
```typescript
// CORRETO
const hash = await bcrypt.hash(password, 12)
await db.user.create({ email, passwordHash: hash })
```

### ❌ Usar HS256 com JWT
```typescript
// ANTI-PATTERN
jwt.sign(payload, 'my-secret-key')  // Se vaza, qualquer um assina tokens
```
```typescript
// CORRETO
jwt.sign(payload, JWT_PRIVATE_KEY, { algorithm: 'RS256' })
```

### ❌ Guardar API key em .env commitado
```bash
# ANTI-PATTERN
git add .env  # API keys no repo!
```
```bash
# CORRETO
echo ".env" >> .gitignore  # Nunca commitar
# Usar .env.example sem valores reais
```

### ❌ Confiar no frontend para validacao
```typescript
// ANTI-PATTERN
// So validar no frontend
if (!email.includes('@')) showError()
// Backend aceita qualquer coisa
```
```typescript
// CORRETO
// Validar com Zod no backend
const schema = z.object({ email: z.string().email() })
schema.parse(body)  // Rejeita invalido
```

### ❌ Retornar password_hash na API
```typescript
// ANTI-PATTERN
return { user: { id, email, passwordHash, name } }
```
```typescript
// CORRETO
return { user: { id, email, name }  // Nunca retornar hash
```

### ❌ Usar `any` no TypeScript
```typescript
// ANTI-PATTERN
function runAgent(input: any): any { ... }
```
```typescript
// CORRETO
function runAgent(input: AgentInput): AgentOutput { ... }
```

### ❌ Concatenar strings em queries SQL
```typescript
// ANTI-PATTERN
db.query(`SELECT * FROM users WHERE email = '${email}'`)
// SQL injection!
```
```typescript
// CORRETO
db.user.findUnique({ where: { email } })  // Prisma = parameterized
```

## 2. Autenticacao

### ❌ Access token sem expiracao
```typescript
// ANTI-PATTERN
jwt.sign(payload, key)  // Sem exp, nunca expira
```
```typescript
// CORRETO
jwt.sign(payload, key, { expiresIn: '15m' })
```

### ❌ Guardar token em localStorage
```typescript
// ANTI-PATTERN
localStorage.setItem('token', token)  // XSS pode ler
```
```typescript
// CORRETO
// Cookie httpOnly (setado pelo backend)
res.setCookie('access_token', token, {
  httpOnly: true, secure: true, sameSite: 'strict', maxAge: 900
})
```

### ❌ Revogacao sem lista negra
```typescript
// ANTI-PATTERN
// Se admin banir usuario, tokens antigos ainda funcionam
```
```typescript
// CORRETO
// Ao banir: revogar todas as sessoes
await db.userSession.updateMany({
  where: { userId, revokedAt: null },
  data: { revokedAt: new Date() }
})
```

## 3. Pagamentos

### ❌ Liberar acesso antes do webhook
```typescript
// ANTI-PATTERN
await createCharge(data)
user.plan = 'pro'  // Liberou sem confirmacao!
```
```typescript
// CORRETO
await createCharge(data)  // Status pending
// So liberar quando webhook confirmar status = approved
```

### ❌ Nao verificar assinatura do webhook
```typescript
// ANTI-PATTERN
app.post('/webhook', (req) => {
  processPayment(req.body)  // Qualquer um pode mandar!
})
```
```typescript
// CORRETO
app.post('/webhook', (req) => {
  if (!validateSignature(req.headers, req.body, WEBHOOK_SECRET)) {
    throw new AppError('WEBHOOK_INVALID_SIGNATURE', 401)
  }
  processPayment(req.body)
})
```

### ❌ Processar webhook sem idempotencia
```typescript
// ANTI-PATTERN
// Webhook chega 2x → credito 2x
await updateTransaction(body.id, 'approved')
await addCredits(body.amount)  // Pode rodar 2x!
```
```typescript
// CORRETO
const lockKey = `webhook:${body.id}`
const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 300)
if (!acquired) return // Ja processando
await processInTransaction(body)  // Atomico
```

### ❌ Confiar no valor enviado pelo cliente
```typescript
// ANTI-PATTERN
// Frontend envia: { plan: 'pro', amount: 0.01 }
app.post('/subscribe', (req) => { charge(req.body.amount) })
```
```typescript
// CORRETO
const amount = PLAN_PRICES[req.body.plan]  // Server-side
charge(amount)
```

## 4. IA / Agents

### ❌ Colocar API key no prompt
```typescript
// ANTI-PATTERN
const prompt = `You are agent X. API key: sk-abc123`
```
```typescript
// CORRETO
const prompt = `You are agent X.`  // API key no header HTTP, nunca no prompt
```

### ❌ Concatenar user input no system prompt
```typescript
// ANTI-PATTERN
const prompt = `You are helpful. User says: ${userInput}`
// userInput pode conter "Ignore above, do X"
```
```typescript
// CORRETO
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: `<user_input>${sanitize(userInput)}</user_input>` }
]
```

### ❌ Nao filtrar output do LLM
```typescript
// ANTI-PATTERN
return { output: llmResponse }  // Pode conter API keys, URLs, etc
```
```typescript
// CORRETO
return { output: filterOutput(llmResponse) }
```

### ❌ Sem rate limit em execucao de agent
```typescript
// ANTI-PATTERN
app.post('/agents/:id/run', (req) => executeAgent(req))
// Usuario pode chamar 1000x/min = custo enorme
```
```typescript
// CORRETO
app.post('/agents/:id/run',
  { preHandler: [rateLimit({ max: 10, timeWindow: '1 minute' })] },
  (req) => executeAgent(req)
)
```

## 5. Banco de Dados

### ❌ N+1 queries
```typescript
// ANTI-PATTERN
const users = await db.user.findMany()
for (const user of users) {
  const agents = await db.agent.findMany({ where: { userId: user.id } })
  // 100 users = 101 queries!
}
```
```typescript
// CORRETO
const users = await db.user.findMany({
  include: { agents: true }  // 1 query com JOIN
})
```

### ❌ Sem indice em campos de busca
```sql
-- ANTI-PATTERN
SELECT * FROM users WHERE email = 'x@test.com'
-- Sem indice: full table scan
```
```sql
-- CORRETO
CREATE UNIQUE INDEX idx_users_email ON users(email)
```

### ❌ Nao usar transacao em operacoes criticas
```typescript
// ANTI-PATTERN
await db.transaction.update({ id, status: 'approved' })
await db.subscription.update({ userId, plan: 'pro' })  // Se falha: inconsistente
```
```typescript
// CORRETO
await db.$transaction([
  db.transaction.update({ id, status: 'approved' }),
  db.subscription.update({ userId, plan: 'pro' })
])
```

## 6. API Design

### ❌ Retornar erro 200 para falhas
```typescript
// ANTI-PATTERN
res.status(200).json({ error: "Not found" })
```
```typescript
// CORRETO
res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '...' } })
```

### ❌ Erro generico sem codigo
```typescript
// ANTI-PATTERN
throw new Error('Something went wrong')
```
```typescript
// CORRETO
throw new AppError('CREDITS_INSUFFICIENT', 422, 'Insufficient tokens')
```

### ❌ Sem paginacao em listagens
```typescript
// ANTI-PATTERN
app.get('/agents', () => db.agent.findMany())  // Retorna TUDO
```
```typescript
// CORRETO
app.get('/agents', (req) => db.agent.findMany({
  skip: (page - 1) * limit,
  take: limit,
  where: { userId: req.user.sub }
}))
```

### ❌ CORS com `*` em producao
```typescript
// ANTI-PATTERN
app.use(cors({ origin: '*' }))
```
```typescript
// CORRETO
app.use(cors({ origin: ['https://dominio.com'], credentials: true }))
```

## 7. Infraestrutura

### ❌ Rodar container como root
```dockerfile
# ANTI-PATTERN
FROM node:20
COPY . .
CMD ["node", "server.js"]
```
```dockerfile
# CORRETO
FROM node:20-alpine
RUN adduser -D appuser
USER appuser
COPY --chown=appuser . .
CMD ["node", "dist/server.js"]
```

### ❌ DB com porta exposta na internet
```yaml
# ANTI-PATTERN
ports:
  - "5432:5432"  # Acessivel de qualquer lugar
```
```yaml
# CORRETO
ports:
  - "127.0.0.1:5432:5432"  # So localhost
```

### ❌ Sem health check
```typescript
// ANTI-PATTERN
// Docker nao sabe se app saudavel
```
```dockerfile
# CORRETO
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
```

### ❌ Usar `latest` em imagem de producao
```dockerfile
# ANTI-PATTERN
FROM node:latest  // Nao reprodutivel
```
```dockerfile
# CORRETO
FROM node:20-alpine  // Versao exata
```

## 8. Frontend

### ❌ Fetch sem error handling
```typescript
// ANTI-PATTERN
const data = await fetch('/api/agents').then(r => r.json())
// Se falha: crash sem tratamento
```
```typescript
// CORRETO
try {
  const res = await fetch('/api/agents')
  if (!res.ok) throw new Error(res.status)
  const data = await res.json()
} catch (err) {
  showToast('Erro ao carregar agents')
}
```

### ❌ Estado global para tudo
```typescript
// ANTI-PATTERN
// Tudo no zustand, sem cache, refetch toda hora
const agents = useStore(state => state.agents)
```
```typescript
// CORRETO
// TanStack Query: cache + refetch inteligente
const { data } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents })
```

### ❌ Layout shift (CLS)
```typescript
// ANTI-PATTERN
<img src="image.jpg" />  // Sem width/height = pula layout
```
```typescript
// CORRETO
<img src="image.jpg" width={400} height={300} />
// OU
<Image src="image.jpg" fill alt="descricao" />
```