# BACK-05 - Seguranca

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01, CORE-03, BACK-04
> **É dependência de:** 19, 21, 23
> **Categoria:** backend

## 1. Autenticacao

### JWT (Access Token)
- Algoritmo: RS256 (asymmetric)
- Expiracao: 15 minutos
- Payload: `{ sub: user_id, role: "user", permissions: [...], iat, exp }`
- Armazenamento: Cookie httpOnly, secure, sameSite=strict
- Rotation: novo token a cada refresh

### Refresh Token
- Expiracao: 7 dias
- Armazenado no Redis + DB
- Rotation: novo refresh token a cada uso
- Max sessoes simultaneas: 3 por usuario
- Revogacao: ao logout, mudanca de senha, suspeita de sequestro

### Hash de Senha
- Algoritmo: bcrypt
- Cost factor: 12 (balance entre seguranca e performance)
- Nunca expor hash em responses
- Rate limit em tentativas de login

### Email Verification
- Token unico com expiracao de 24h
- Necessario para ativar conta
- Reenvio com cooldown de 5 min

## 2. Autorizacao (RBAC)

### Middleware de Permissao
```
auth.middleware → verifica token valido
rbac.middleware → verifica permissao necessaria
```

### Implementacao
```typescript
// Exemplo conceitual
function requirePermission(permission: string) {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      throw new AppError('FORBIDDEN', 403)
    }
    next()
  }
}
```

### Regras
- Admin tem todas as permissoes implicitamente
- Verificar propriedade do recurso (user so acessa seus dados)
- API client so acessa endpoints permitidos pelo escopo

## 3. Protecao de Rotas

### Middleware Stack
```
1. CORS validation
2. Rate limiting (por IP + user)
3. Request logging (pino)
4. Body parsing + size limit (1MB)
5. Auth middleware (rotas protegidas)
6. RBAC middleware (verificacao de permissao)
7. Input validation (Zod)
8. Business logic (service)
9. Response logging
```

### Rotas Publicas (sem auth)
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/verify-email
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /billing/webhook (validacao por assinatura)
- GET /health

### Todas as demais: protegidas

## 4. Rate Limiting

### Camadas

| Camada | Limite | Janela | Implementacao |
|--------|--------|--------|---------------|
| Global (IP) | 100 req | 1 min | NGINX |
| Auth (IP) | 10 req | 1 min | Redis |
| Login (email+IP) | 5 req | 15 min | Redis |
| API (user) | 60 req | 1 min | Redis |
| Agent run (user) | 10 req | 1 min | Redis |
| Webhook (IP) | 100 req | 1 min | NGINX |

### Resposta 429
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 60
  }
}
```

## 5. CORS

```typescript
const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}
```

**Regras:**
- NEVER `*` em producao
- Apenas dominios permitidos
- Credentials habilitado para cookies

## 6. Validacao de Input

### Usando Zod
- TODO input do usuario e validado com Zod schemas
- Rejeitar payloads maiores que 1MB
- Strip unknown keys (remover campos nao esperados)
- Tipos estritos (coercao minima)

### Sanitizacao
- Remover HTML tags de strings
- Normalizar Unicode
- Trim whitespace
- Escapar caracteres especiais em queries

### Regra: NUNCA confiar no input do usuario

## 7. Protecao contra Ataques

### SQL Injection
- Prisma ORM com prepared statements
- NUNCA concatenar strings em queries
- Parametrizar tudo

### Command Injection
- Nunca usar eval() ou exec() com input do usuario
- Validacao estrita de tipos
- Se precisar executar algo, usar allowlist

### XSS (Cross-Site Scripting)
- Content-Security-Policy header
- Sanitizar output
- HttpOnly cookies
- Escape HTML em respostas

### CSRF (Cross-Site Request Forgery)
- SameSite=Strict em cookies
- Validar Origin header
- Token CSRF em rotas de formulario (se houver)

### Prompt Injection (especifico para IA)
- Separar system prompt de user input
- Sanitizar input antes de enviar ao LLM
- Marcar user input com delimitadores claros
- Nunca colocar segredos no prompt
- Verificar resposta do LLM (nao executar cegamente)

## 8. Headers de Seguranca

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 9. Protecao de API Keys (Providers)

### Regras OBRIGATORIAS
- API keys criptografadas em repouso (AES-256-GCM)
- Carregadas em memoria apenas quando necessario
- Nunca em logs
- Nunca em responses
- Nunca no frontend
- Rotacao periodica (a cada 90 dias ou apos incidente)
- Variaveis de ambiente para chave de criptografia

### Fluxo
```
Frontend → Backend API → Provider Gateway → Provider Externo
              ↑
         API key usada AQUI
         (nunca sai do backend)
```

## 10. Logs de Seguranca

### O que registrar
- Tentativas de login (sucesso e falha)
- Acesso a rotas protegidas
- Mudancas de permissao
- Acoes de admin
- Erros de validacao
- Rate limit atingido
- Falhas de webhook

### O que NAO registrar
- Senhas (nunca)
- Tokens completos
- API keys
- Dados financeiros sensiveis

### Formato
```json
{
  "timestamp": "2026-04-22T10:00:00Z",
  "level": "warn",
  "event": "login_failed",
  "actor_id": "uuid",
  "ip": "1.2.3.4",
  "user_agent": "...",
  "correlation_id": "uuid",
  "details": { "reason": "invalid_password" }
}
```

## 11. LGPD (Protecao de Dados)

### Requisitos
- Minimizacao: coletar apenas necessario
- Finalidade: cada dado tem proposito claro
- Consentimento: usuario aceita termos
- Acesso: usuario pode ver seus dados
- Portabilidade: exportar dados em formato legivel
- Delecao: direito ao esquecimento (delete em 30 dias)
- Criptografia: dados sensiveis em repouso (AES)

### Dados Sensiveis
| Dado | Tratamento |
|------|-----------|
| Email | Criptografado em repouso |
| Senha | Hash bcrypt (nunca recuperar) |
| IP | Log temporario (30 dias) |
| Prompts | Relacionados ao usuario, deletados juntos |
| Historico financeiro | Retido por obrigatoriedade legal |
| Tokens de acesso | Redis com TTL |

### Endpoints LGPD
- GET /users/me/data → exportar todos os dados
- DELETE /users/me → solicitar delecao

## 12. Infraestrutura

### Obrigatorio
- HTTPS em tudo (TLS 1.2+)
- Firewall ativo (ufw)
- SSH com chave (sem senha)
- Fail2ban
- Portas expostas: apenas 80, 443
- DB sem acesso publico
- Redis sem acesso publico
- Backups automaticos (criptografados)