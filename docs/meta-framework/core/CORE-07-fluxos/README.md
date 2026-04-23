# CORE-07 - Fluxos de Usuario

> **Prioridade:** ALTO
> **Depende de:** CORE-01, CORE-03, BACK-04
> **É dependência de:** 11, 23
> **Categoria:** core

## 1. Cadastro

```
Usuario              Frontend             Backend              Email Service
  │                    │                    │                      │
  │  Preenche form     │                    │                      │
  │───────────────────>│                    │                      │
  │                    │  POST /auth/register │                      │
  │                    │───────────────────>│                      │
  │                    │                    │  Valida email unico    │
  │                    │                    │  Hash senha (bcrypt)   │
  │                    │                    │  Cria user (pending_email)
  │                    │                    │──────────────────────>│
  │                    │                    │                    Envia email verificacao
  │                    │                    │<──────────────────────│
  │                    │  201 { user }     │                      │
  │                    │<───────────────────│                      │
  │  "Verifique seu email"                │                      │
  │<───────────────────│                    │                      │
  │                    │                    │                      │
  │  Clica link email   │                    │                      │
  │───────────────────>│                    │                      │
  │                    │  POST /auth/verify-email                 │
  │                    │───────────────────>│                      │
  │                    │                    │  Valida token         │
  │                    │                    │  Atualiza status → active
  │                    │                    │  Cria subscription (free)
  │                    │                    │                      │
  │                    │  200 { active }    │                      │
  │                    │<───────────────────│                      │
  │  "Conta ativada!"  │                    │                      │
  │<───────────────────│                    │                      │
```

**Regras:**
- Email deve ser unico
- Senha: min 8 chars, 1 maiuscula, 1 numero
- Max 3 cadastros por IP/dia
- Conta sem verificar expira em 7 dias

## 2. Login

```
Usuario              Frontend             Backend              Redis
  │                    │                    │                    │
  │  Email + Senha     │                    │                    │
  │───────────────────>│                    │                    │
  │                    │  POST /auth/login   │                    │
  │                    │───────────────────>│                    │
  │                    │                    │  Verifica tentativas│
  │                    │                    │───────────────────>│
  │                    │                    │  < 5? OK           │
  │                    │                    │<───────────────────│
  │                    │                    │  Busca user         │
  │                    │                    │  Compara hash       │
  │                    │                    │  Gera access_token (15min)
  │                    │                    │  Gera refresh_token (7d)
  │                    │                    │  Salva sessao       │
  │                    │                    │───────────────────>│
  │                    │                    │                    │
  │                    │  200 { tokens }    │                    │
  │                    │<───────────────────│                    │
  │  Set httpOnly cookie                    │                    │
  │<───────────────────│                    │                    │
```

**Falha:**
```
Senha incorreta → Incrementa contador de tentativas
5 falhas → Lockout 30 min + notifica usuario
```

**Sucesso:**
- Reseta contador de tentativas
- Registra log de acesso (IP, device, timestamp)
- Verifica sessoes ativas (max 3, revoga mais antiga)

## 3. Execucao de Agent

```
Usuario              Frontend             Backend              Provider Gateway
  │                    │                    │                    │
  │  "Rodar agent X"   │                    │                    │
  │───────────────────>│                    │                    │
  │                    │  POST /agents/:id/run                  │
  │                    │───────────────────>│                    │
  │                    │                    │  1. Auth + permissoes
  │                    │                    │  2. Agent existe e ativo?       │
  │                    │                    │  3. Verificar plano/limites     │
  │                    │                    │  4. Creditos suficientes?       │
  │                    │                    │  5. Sanitizar input (anti-injection)
  │                    │                    │  6. Verificar rate limit        │
  │                    │                    │  7. Estimar tokens/custo       │
  │                    │                    │                    │
  │                    │                    │  Monta payload     │
  │                    │                    │  system_prompt +   │
  │                    │                    │  sanitized_input   │
  │                    │                    │───────────────────>│
  │                    │                    │                    │  Seleciona provider
  │                    │                    │                    │  (por prioridade + health)
  │                    │                    │                    │  Envia para API externa
  │                    │                    │                    │
  │                    │                    │  Se falhar →       │
  │                    │                    │<──────────────────│  retry + fallback
  │                    │                    │                    │
  │                    │                    │  Calcula tokens    │
  │                    │                    │  Calcula custo     │
  │                    │                    │  Debita creditos   │
  │                    │                    │  Registra execution│
  │                    │                    │  Registra provider_log
  │                    │                    │                    │
  │                    │  200 { result }    │                    │
  │                    │<───────────────────│                    │
  │  Resultado         │                    │                    │
  │<───────────────────│                    │                    │
```

**Cenarios de erro:**
| Cenario | Acao |
|---------|------|
| Agent nao existe | 404 |
| Agent inativo | 422 "Agent is not active" |
| Sem creditos | 422 "Insufficient credits" |
| Rate limit | 429 |
| Provider cai | 503 + fallback automatico |
| Timeout (30s) | 504 + retry 1x |
| Prompt injection detectado | 422 "Invalid input" |

## 4. Pagamento (PIX)

```
Usuario              Frontend             Backend              Gateway (MP/Stripe)
  │                    │                    │                    │
  │  "Assinar Pro"    │                    │                    │
  │───────────────────>│                    │                    │
  │                    │  POST /billing/subscribe               │
  │                    │───────────────────>│                    │
  │                    │                    │  Valida plano      │
  │                    │                    │  Cria transaction   │
  │                    │                    │  (pending)         │
  │                    │                    │  Gera idempotency_key
  │                    │                    │───────────────────>│
  │                    │                    │  Cria cobranca PIX │
  │                    │                    │<───────────────────│
  │                    │                    │  Salva gateway_id   │
  │                    │  200 { pix_code, qr_code }             │
  │                    │<───────────────────│                    │
  │  Exibe QR Code     │                    │                    │
  │<───────────────────│                    │                    │
  │                    │                    │                    │
  │  (Usuario paga)    │                    │                    │
  │                    │                    │                    │
  │                    │                    │  WEBHOOK           │
  │                    │                    │<───────────────────│
  │                    │                    │  1. Validar assinatura
  │                    │                    │  2. Verificar idempotencia
  │                    │                    │  3. Atualizar transaction → approved
  │                    │                    │  4. Ativar plano Pro
  │                    │                    │  5. Creditar tokens
  │                    │                    │  6. Enviar email confirmacao
  │                    │                    │                    │
  │  "Plano Pro ativo!"│                    │                    │
  │<───────────────────│                    │                    │
```

**Se webhook nao chega:** Polling a cada 5 min por 1 hora

## 5. Cancelamento de Assinatura

```
1. Usuario solicita cancelamento
2. Sistema marca subscription como "canceled_at_period_end"
3. Usuario mantem acesso ate fim do periodo
4. No fim do periodo:
   - Downgrade para Free
   - Reduz creditos para limite Free
   - Agentes acima do limite → pausados
   - Notifica usuario
5. Registra audit log
```

## 6. Reset de Senha

```
1. Usuario clica "Esqueceu senha"
2. Frontend → POST /auth/forgot-password { email }
3. Backend verifica se email existe (nao revela resultado)
4. Se existe: gera token (1h expiracao) + envia email
5. Usuario clica link no email
6. Frontend → POST /auth/reset-password { token, new_password }
7. Valida token + atualiza hash + revoga todas sessoes
8. Notifica usuario por email
```

## 7. Delecao de Conta (LGPD)

```
1. Usuario solicita delecao
2. Sistema marca deleted_at (soft delete)
3. Período de grace: 30 dias (pode reverter)
4. Apos 30 dias:
   - Hard delete de dados pessoais
   - Anonimizar dados relacionais (execucoes, logs)
   - Remover de backups (proximo ciclo)
5. Registra audit log
```

## 8. Fluxo de Erro Geral

```
Erro ocorre
    │
    ├── Erro de validacao (400)
    │   └── Retorna erro especifico por campo
    │
    ├── Erro de auth (401)
    │   └── Frontend redireciona para login
    │
    ├── Erro de permissao (403)
    │   └── Frontend mostra "Sem acesso"
    │
    ├── Erro de negocio (422)
    │   └── Frontend mostra mensagem + acao sugerida
    │
    ├── Rate limit (429)
    │   └── Frontend mostra "Aguarde X segundos"
    │
    ├── Erro de provider (503)
    │   └── Sistema tenta fallback automatico
    │   └── Se falha: "Servico temporariamente indisponivel"
    │
    └── Erro interno (500)
        ├── Sistema loga com correlationId
        └── Frontend: "Erro inesperado, tente novamente"
        └── Sentry captura
```