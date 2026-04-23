# BACK-04 - API: Rotas e Contratos

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01, CORE-02, CORE-03
> **É dependência de:** 05, 11, 15, 24, 25, 27
> **Categoria:** backend

## Base URL

```
Production: https://api.dominio.com/v1
Development: http://localhost:3000/v1
```

## Autenticacao

Todas as rotas protegidas requerem header:
```
Authorization: Bearer <access_token>
```

## Formato de Resposta Padrao

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Required" }
    ]
  }
}
```

## Codigo de Status

| Codigo | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado |
| 204 | Sem conteudo (delete) |
| 400 | Erro de validacao |
| 401 | Nao autenticado |
| 403 | Sem permissao |
| 404 | Nao encontrado |
| 409 | Conflito (duplicado) |
| 422 | Regra de negocio violada |
| 429 | Rate limit excedido |
| 500 | Erro interno |

---

## Rotas Publicas

### POST /auth/register

```json
// Request
{
  "email": "user@example.com",
  "password": "minhapassword123",
  "name": "Joao Silva"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Joao Silva",
    "status": "pending_email"
  }
}
```

**Validacoes:**
- email: valido, unico
- password: min 8 chars, 1 maiuscula, 1 numero
- name: min 2 chars, max 100

### POST /auth/login

```json
// Request
{
  "email": "user@example.com",
  "password": "minhapassword123"
}

// Response 200
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Joao Silva",
      "role": "user",
      "status": "active"
    }
  }
}
```

**Regras:**
- Max 5 tentativas por 15 min (por IP + email)
- Apos 5 falhas → lockout 30 min

### POST /auth/refresh

```json
// Request
{
  "refresh_token": "eyJ..."
}

// Response 200
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900
  }
}
```

### POST /auth/verify-email

```json
// Request
{
  "token": "verification-token"
}

// Response 200
{
  "success": true,
  "data": { "status": "active" }
}
```

### POST /auth/forgot-password

```json
// Request
{
  "email": "user@example.com"
}

// Response 200 (sempre 200, nao revela se email existe)
{
  "success": true,
  "data": { "message": "If email exists, reset link sent" }
}
```

### POST /auth/reset-password

```json
// Request
{
  "token": "reset-token",
  "password": "newpassword123"
}

// Response 200
{
  "success": true,
  "data": { "message": "Password updated" }
}
```

---

## Rotas Protegidas

### GET /users/me

```
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Joao Silva",
    "role": "user",
    "status": "active",
    "subscription": {
      "plan": "pro",
      "tokens_used": 15000,
      "tokens_limit": 500000
    }
  }
}
```

### PUT /users/me

```json
// Request
{
  "name": "Joao Santos"
}

// Response 200
{
  "success": true,
  "data": { "id": "uuid", "name": "Joao Santos" }
}
```

### PUT /users/me/password

```json
// Request
{
  "current_password": "oldpass",
  "new_password": "newpass123"
}
```

### DELETE /users/me

Soft delete + agendamento de remocao em 30 dias.

```json
// Response 200
{
  "success": true,
  "data": { "message": "Account scheduled for deletion", "deletes_at": "2026-05-22T00:00:00Z" }
}
```

### POST /auth/logout

Invalida refresh token e sessao.

```json
// Response 200
{
  "success": true,
  "data": { "message": "Logged out" }
}
```

---

## Agents

### GET /agents

```
// Query: ?page=1&limit=20&status=active

// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Support Bot",
      "description": "...",
      "model": "gpt-4",
      "provider": "openrouter",
      "status": "active",
      "created_at": "..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

### POST /agents

**Permissao:** `create_agent`

```json
// Request
{
  "name": "Support Bot",
  "description": "Bot de suporte ao cliente",
  "system_prompt": "You are a helpful support agent...",
  "model": "gpt-4",
  "provider": "openrouter",
  "config": {
    "max_tokens_per_run": 4000,
    "temperature": 0.7
  }
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Support Bot",
    "status": "draft",
    "..."
  }
}
```

**Validacoes:**
- system_prompt: max 4000 chars
- model: deve estar na lista de modelos suportados
- provider: deve estar ativo no sistema
- Verificar limite de agents do plano

### GET /agents/:id

### PUT /agents/:id

**Permissao:** `update_agent` + dono do agent

### DELETE /agents/:id

**Permissao:** `delete_agent` + dono do agent (ou admin)

### POST /agents/:id/run

**Permissao:** `run_agent`

```json
// Request
{
  "input": "Como resetar minha senha?",
  "config_override": {
    "temperature": 0.5
  }
}

// Response 200
{
  "success": true,
  "data": {
    "execution_id": "uuid",
    "status": "completed",
    "output": "Para resetar sua senha, siga...",
    "tokens_used": 250,
    "cost": 0.0025
  }
}
```

**Regras:**
- Verificar status do agent (deve estar active)
- Verificar creditos do usuario
- Sanitizar input (anti-prompt-injection)
- Rate limit por usuario

### GET /agents/:id/executions

Historico de execucoes do agent.

```
// Query: ?page=1&limit=20

// Response 200
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 50 }
}
```

### POST /agents/:id/pause

Muda status para `paused`.

### POST /agents/:id/resume

Muda status para `active`.

---

## Billing

### GET /billing/subscription

Retorna assinatura atual do usuario.

### POST /billing/subscribe

```json
// Request
{
  "plan": "pro",
  "payment_method": "pix"
}

// Response 200
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "gateway_transaction_id": "abc123",
    "status": "pending",
    "pix_code": "00020126...",
    "pix_qr_code_base64": "..."
  }
}
```

### POST /billing/cancel

Cancela assinatura (no fim do periodo).

### POST /billing/credits

```json
// Request
{
  "package": "100k"
}

// Response 200
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "amount": 9.90,
    "status": "pending",
    "pix_code": "..."
  }
}
```

### GET /billing/transactions

Historico de transacoes.

### POST /billing/webhook

Rota publica para receber webhooks do gateway.

**Seguranca:**
- Validar assinatura do gateway
- Verificar idempotencia
- Processar de forma assincrona

---

## Admin (apenas role: admin)

### GET /admin/users

Lista todos os usuarios com filtros.

### PUT /admin/users/:id/status

Altera status de usuario (suspender, reativar).

### GET /admin/analytics

Metricas gerais do sistema.

### GET /admin/providers

Lista providers configurados.

### PUT /admin/providers/:id

Atualiza configuracao de provider (API key, status, prioridade).

### GET /admin/audit-logs

Logs de auditoria com filtros.

---

## Erros Especificos

| Codigo | HTTP | Descricao |
|--------|------|-----------|
| `INVALID_CREDENTIALS` | 401 | Email ou senha incorretos |
| `TOKEN_EXPIRED` | 401 | Access token expirado |
| `TOKEN_INVALID` | 401 | Token malformado ou revogado |
| `FORBIDDEN` | 403 |Sem permissao |
| `EMAIL_EXISTS` | 409 | Email ja cadastrado |
| `AGENT_LIMIT_REACHED` | 422 | Limite de agents do plano excedido |
| `CREDITS_INSUFFICIENT` | 422 | Creditos insuficientes |
| `RATE_LIMIT_EXCEEDED` | 429 | Muitas requisicoes |
| `PROVIDER_UNAVAILABLE` | 503 | Provider IA indisponivel |
| `PAYMENT_FAILED` | 422 | Pagamento recusado |