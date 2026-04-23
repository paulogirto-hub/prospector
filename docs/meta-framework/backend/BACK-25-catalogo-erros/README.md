# BACK-25 - Catalogo Centralizado de Erros

> **Prioridade:** ALTO
> **Depende de:** BACK-04, BACK-05
> **É dependência de:** 11, 28
> **Categoria:** backend

## 1. Formato de Erro

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## 2. Erros por Dominio

### Auth (AUTH_*)

| Codigo | HTTP | Mensagem | Quando | Acao frontend |
|--------|------|----------|-------|--------------|
| AUTH_INVALID_CREDENTIALS | 401 | Invalid email or password | Senha errada ou usuario nao existe | Pedir credenciais |
| AUTH_TOKEN_MISSING | 401 | Authorization token is required | Sem header Authorization | Redirecionar login |
| AUTH_TOKEN_EXPIRED | 401 | Access token expired | Token JWT expirou | Tentar refresh |
| AUTH_TOKEN_INVALID | 401 | Invalid access token | Token malformado, revogado | Redirecionar login |
| AUTH_REFRESH_INVALID | 401 | Invalid refresh token | Refresh token expirado ou revogado | Redirecionar login |
| AUTH_EMAIL_EXISTS | 409 | Email already registered | Email duplicado no cadastro | Pedir outro email |
| AUTH_EMAIL_NOT_VERIFIED | 403 | Email not verified | Login com conta nao verificada | Pedir verificacao |
| AUTH_ACCOUNT_LOCKED | 423 | Account locked. Try again later | Muitas tentativas de login | Mostrar tempo de lockout |
| AUTH_PASSWORD_TOO_WEAK | 400 | Password does not meet requirements | Senha nao atende regras | Mostrar regras |
| AUTH_RESET_TOKEN_INVALID | 401 | Invalid or expired reset token | Token de reset expirado | Pedir novo link |

### Permissao (PERM_*)

| Codigo | HTTP | Mensagem | Quando | Acao frontend |
|--------|------|----------|-------|--------------|
| PERM_FORBIDDEN | 403 | You do not have permission | Sem permissao RBAC | Mostrar "sem acesso" |
| PERM_NOT_OWNER | 403 | You can only access your own resources | Usuario acessando recurso de outro | Mostrar "sem acesso" |
| PERM_TENANT_MISMATCH | 403 | Resource belongs to different tenant | Cross-tenant access | Mostrar "sem acesso" |
| PERM_FEATURE_DISABLED | 403 | This feature is not available | Feature flag desligada | Mostrar "indisponível" |

### Agentes (AGENT_*)

| Codigo | HTTP | Mensagem | Quando | Acao frontend |
|--------|------|----------|-------|--------------|
| AGENT_NOT_FOUND | 404 | Agent not found | ID nao existe ou deletado | Listar agentes |
| AGENT_NOT_ACTIVE | 422 | Agent is not active | Status draft/paused/archived | Ativar agent primeiro |
| AGENT_LIMIT_REACHED | 422 | Agent limit reached for your plan | Plano excedido | Oferecer upgrade |
| AGENT_INPUT_MALICIOUS | 400 | Input contains potentially malicious content | Prompt injection detectado | Avisar usuario |
| AGENT_EXECUTION_FAILED | 500 | Agent execution failed | Erro interno do provider | Retry |
| AGENT_MODEL_NOT_ALLOWED | 422 | Model not available for your plan | Modelo restrito | Oferecer upgrade |

### Creditos (CREDITS_*)

| Codigo | HTTP | Mensagem | Quando | Acao frontend |
|--------|------|----------|-------|--------------|
| CREDITS_INSUFFICIENT | 422 | Insufficient tokens | Tokens usados >= limite | Oferecer compra creditos |
| CREDITS_EXPIRED | 422 | Credits have expired | Creditos fora da validade | Oferecer compra |

### Pagamento (PAYMENT_*)

| Codigo | HTTP | Mensagem | Quando | Acao frontend |
|--------|------|----------|-------|--------------|
| PAYMENT_FAILED | 422 | Payment was rejected | Gateway recusou | Tentar outro metodo |
| PAYMENT_PENDING | 202 | Payment is being processed | Ainda processando | Aguardar |
| PAYMENT_AMOUNT_INVALID | 400 | Invalid payment amount | Valor <= 0 | Corrigir valor |
| PAYMENT_METHOD_UNAVAILABLE | 422 | Payment method not available | Metodo nao suportado | Escolher outro |
| PAYMENT_ALREADY_PROCESSED | 409 | Payment already processed | Idempotencia | Nao tentar de novo |

### Provider (PROVIDER_*)

| Codigo | HTTP | Mensagem | Quando | Acao frontend |
|--------|------|----------|-------|--------------|
| PROVIDER_UNAVAILABLE | 503 | AI provider is unavailable | Provider caiu + fallback falhou | Retry em 30s |
| PROVIDER_TIMEOUT | 504 | AI provider timeout | Request demorou > 30s | Retry |
| PROVIDER_RATE_LIMITED | 429 | AI provider rate limit exceeded | Rate limit do provider | Aguardar |
| PROVIDER_INVALID_RESPONSE | 502 | Invalid response from provider | Resposta malformada | Retry |

### Rate Limit (RATE_*)

| Codigo | HTTP | Mensagem | Quando | Acao frontend |
|--------|------|----------|-------|--------------|
| RATE_LIMIT_EXCEEDED | 429 | Too many requests | Limite global atingido | Mostrar retry_after |
| RATE_LIMIT_AUTH | 429 | Too many login attempts | 5+ tentativas de login | Mostrar tempo de lockout |
| RATE_LIMIT_AGENT_RUN | 429 | Too many agent executions | 10+ execucoes/min | Aguardar |

### Validacao (VALIDATION_*)

| Codigo | HTTP | Mensagem | Quando | Sistema |
|--------|------|----------|-------|---------|
| VALIDATION_ERROR | 400 | Invalid input | Zod validation falhou | Field + message em details |
| VALIDATION_QUERY_ERROR | 400 | Invalid query parameters | Query param invalido | Field + message |
| VALIDATION_FILE_TOO_LARGE | 400 | File exceeds maximum size | Upload > 10MB | Rejeitar |
| VALIDATION_FILE_TYPE | 400 | File type not allowed | Tipo nao permitido | Rejeitar |

### Sistema (SYS_*)

| Codigo | HTTP | Mensagem | Quando | Acao |
|--------|------|----------|-------|------|
| SYS_NOT_FOUND | 404 | Resource not found | Rota ou recurso nao existe | 404 page |
| SYS_INTERNAL_ERROR | 500 | An unexpected error occurred | Erro nao tratado | Sentry captura |
| SYS_MAINTENANCE | 503 | System under maintenance | Feature flag ativa | Mostrar mensagem |
| SYS_VERSION_SUNSET | 410 | API version has been discontinued | Versao removida | Guia migracao |
| SYS_VERSION_NOT_FOUND | 404 | API version not found | Versao nao existe | Listar versoes |

### Webhook (WEBHOOK_*)

| Codigo | HTTP | Mensagem | Quando | Uso |
|--------|------|----------|-------|-----|
| WEBHOOK_INVALID_SIGNATURE | 401 | Invalid webhook signature | Assinatura nao confere | Ignorar |
| WEBHOOK_ALREADY_PROCESSED | 200 | Webhook already processed | Idempotencia | Ignorar |

## 3. Uso no Codigo

```typescript
import { AppError, ErrorCodes } from '../shared/errors/AppError'

// Throw padrao
throw new AppError(
  ErrorCodes.CREDITS_INSUFFICIENT.code,
  ErrorCodes.CREDITS_INSUFFICIENT.statusCode,
  'Insufficient tokens. You have 0 remaining.'
)

// Throw com details
throw new AppError(
  ErrorCodes.VALIDATION_ERROR.code,
  ErrorCodes.VALIDATION_ERROR.statusCode,
  'Invalid input',
  [
    { field: 'email', message: 'Invalid email format' },
    { field: 'password', message: 'Must contain at least 1 uppercase letter' },
  ]
)
```

## 4. Checklist

- [ ] Todos os codigos de erro centralizados em ErrorCodes
- [ ] Cada erro tem: code, statusCode, message, condition
- [ ] Catalogo acessível em /docs/errors (endpoint ou pagina)
- [ ] Nenhum erro generico "Something went wrong"
- [ ] Frontend mapeia code → acao (nao HTTP status)
- [ ] Novos erros adicionados ao catalogo ANTES de implementar