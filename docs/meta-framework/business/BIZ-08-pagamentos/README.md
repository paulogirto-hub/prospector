# BIZ-08 - Gateway de Pagamento

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01, BACK-04
> **É dependência de:** 14, 16, 28
> **Categoria:** business

## 1. Gateways Suportados

### Primario: Mercado Pago (Brasil)
### Secundario: Stripe (Internacional)

## 2. Fluxo de Pagamento Completo

```
                              ┌─────────────────┐
                              │   Usuario        │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   Frontend       │
                              │  (Escolhe plano) │
                              └────────┬────────┘
                                       │ POST /billing/subscribe
                              ┌────────▼────────┐
                              │   Backend        │
                              │  Valida plano    │
                              │  Gera idempotency│
                              │  Cria transaction│
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   Gateway        │
                              │  (MP ou Stripe)  │
                              │  Cria cobranca   │
                              └────────┬────────┘
                                       │
                          ┌────────────┼────────────┐
                          │            │            │
                   ┌──────▼──────┐ ┌───▼─────┐ ┌────▼───────┐
                   │   PIX       │ │ Cartao  │ │  Boleto    │
                   │  Instante   │ │ Online  │ │  1-3 dias  │
                   └──────┬──────┘ └───┬─────┘ └────┬───────┘
                          │            │            │
                          └────────────┼────────────┘
                                       │
                              ┌────────▼────────┐
                              │   Webhook        │
                              │  Confirma pagto  │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   Backend        │
                              │  Processa webhook │
                              │  Atualiza status  │
                              │  Libera acesso    │
                              └─────────────────┘
```

## 3. Estados do Pagamento

```
                ┌──────────┐
                │ pending  │ ← Estado inicial
                └────┬─────┘
                     │
           ┌─────────┼──────────┐
           │         │          │
    ┌──────▼────┐ ┌──▼──────┐ ┌─▼────────┐
    │ approved  │ │ rejected│ │ expired  │
    └──────┬────┘ └─────────┘ └──────────┘
           │
    ┌──────┼──────────┐
    │      │          │
┌───▼──┐ ┌▼────────┐ ┌▼──────────┐
│refunded│ │chargeback│ │completed │
└────────┘ └──────────┘ └──────────┘
```

| Estado | Libera Acesso? | Acao Sistema |
|--------|---------------|-------------|
| pending | NAO | Aguardar |
| approved | SIM | Ativar plano + creditar |
| rejected | NAO | Notificar usuario |
| expired | NAO | Notificar usuario |
| refunded | NAO (remove) | Remover beneficios |
| chargeback | NAO (remove + alerta) | Bloquear + investigar |
| completed | SIM (ja estava) | Apenas registro |

## 4. Webhook - Processamento

### Validacao de Seguranca

```typescript
// Conceito: Mercado Pago
function validateWebhookMP(headers: Headers, body: string): boolean {
  const signature = headers.get('x-signature')
  const timestamp = headers.get('x-timestamp')
  
  // 1. Verificar se timestamp esta dentro de janela (5 min)
  // 2. Calcular HMAC-SHA256 com secret key
  // 3. Comparar com assinatura recebida
  // 4. Rejeitar se invalido
}

// Conceito: Stripe
function validateWebhookStripe(headers: Headers, body: string): boolean {
  const sig = headers.get('stripe-signature')
  // 1. Extrair timestamp + assinatura do header
  // 2. Verificar janela de tempo (5 min)
  // 3. Calcular HMAC-SHA256
  // 4. Comparar assinaturas
}
```

### Processamento

```
Webhook recebido
    │
    ├── 1. Validar assinatura → INVALIDO → 401 + ignorar
    │
    ├── 2. Verificar idempotencia (transaction_id ja processado?)
    │   └── JA PROCESSADO → 200 + ignorar
    │
    ├── 3. Buscar transaction pelo gateway_transaction_id
    │   └── NAO ENCONTRADA → 404 + log erro
    │
    ├── 4. Verificar se status mudou (evitar reprocessamento)
    │   └── MESMO STATUS → 200 + ignorar
    │
    ├── 5. Atualizar status da transaction
    │
    ├── 6. Executar acao baseada no status:
    │   ├── approved → Ativar plano, creditar tokens, notificar
    │   ├── rejected → Notificar falha
    │   ├── refunded → Remover beneficios, notificar
    │   └── chargeback → Remover + bloquear + alertar admin
    │
    ├── 7. Registrar audit log
    │
    └── 8. Retornar 200 (ack ao gateway)
```

### Idempotencia (CRITICO)

```typescript
async function processWebhook(event: WebhookEvent) {
  const key = `webhook:${event.gateway}:${event.transaction_id}`
  
  // Redis SET com NX (so cria se nao existe)
  const acquired = await redis.set(key, 'processing', 'NX', 'EX', 300)
  
  if (!acquired) {
    // Ja esta sendo processado ou ja foi
    return { status: 'already_processed' }
  }
  
  try {
    // Processar pagamento
    await processPayment(event)
    await redis.set(key, 'completed', 'EX', 86400) // Manter 24h
  } catch (error) {
    await redis.del(key) // Liberar para retry
    throw error
  }
}
```

## 5. Metodos de Pagamento

### PIX
- Processamento: instantaneo
- Webhook: segundos apos pagamento
- Expiracao: 30 minutos (QR code)
- Conversao: melhor (sem friccao)

### Cartao de Credito
- Processamento: instantaneo (se aprovado)
- Riscos: chargeback (30-120 dias), fraude
- Webhook: segundos
- Antifraude: obrigatorio

### Boleto
- Processamento: 1-3 dias uteis
- Expiracao: 3 dias
- Sem chargeback
- Conversao: menor

## 6. Regras por Metodo

| Regra | PIX | Cartao | Boleto |
|-------|-----|--------|--------|
| Liberar antes de confirmar? | NAO | NAO | NAO |
| Chargeback possivel? | NAO | SIM (ate 120d) | NAO |
| Expiracao QR/Boleto | 30 min | N/A | 3 dias |
| Verificar pagamento | Webhook + polling 5min | Webhook | Webhook + polling 1h |
| Reembolso | Via API do gateway | Via API do gateway | Credito na conta |

## 7. Anti-Fraude

### Regras
- Max 3 tentativas de pagamento por hora (por usuario)
- Bloquear cartoes com 2+ chargebacks
- Alertar pagamentos acima de R$ 500 sem historico
- Verificar IP geolocation vs cartao
- Email + CPF validos e verificados

### Chargeback
```
1. Receber notificacao de chargeback
2. Remover acesso/beneficios IMEDIATAMENTE
3. Marcar usuario (flag de risco)
4. Registrar historico
5. Notificar admin
6. Se recorrente → banir conta
```

## 8. Reembolso

### Regras
- Ate 7 dias: reembolso automatico via gateway
- Apos 7 dias: analise manual
- Creditos devolvidos se nao usados
- Se creditos parcialmente usados: reembolso proporcional

### Processo
```
1. Usuario solicita reembolso
2. Sistema verifica prazo (7 dias?)
3. Calcula creditos usados vs total
4. Cria reembolso no gateway
5. Atualiza transaction → refunded
6. Remove beneficios
7. Registra audit log
```

## 9. Modelo de Assinatura

### Ciclo de Vida
```
1. Criacao: usuario assina plano Pro
2. Cobranca recorrente: a cada 30 dias
3. Falha de pagamento:
   - 3 retries (1, 3, 5 dias)
   - Grace period: 7 dias
   - Se nao pagar → downgrade para Free
4. Cancelamento:
   - Manual (usuario)
   - Automatico (falta pagamento)
   - Acesso mantido ate fim do periodo
5. Reativacao:
   - Dentro do grace period → retomar
```

## 10. Logs Financeiros

### Registro Obrigatorio

```json
{
  "transaction_id": "uuid",
  "user_id": "uuid",
  "amount": 49.90,
  "currency": "BRL",
  "status": "approved",
  "payment_method": "pix",
  "gateway": "mercadopago",
  "gateway_transaction_id": "abc123",
  "idempotency_key": "hash",
  "plan": "pro",
  "tokens_credited": 500000,
  "created_at": "2026-04-22T10:00:00Z",
  "updated_at": "2026-04-22T10:05:00Z",
  "webhook_received_at": "2026-04-22T10:04:55Z",
  "processed_at": "2026-04-22T10:05:00Z"
}
```

### Retencao
- Transacoes: 5 anos (obrigacao legal)
- Faturas: 5 anos
- Logs de webhook: 1 ano
- Audit de financeiro: permanente

## 11. Checklist

- [ ] Webhook endpoint seguro (HTTPS + assinatura)
- [ ] Validacao de assinatura implementada
- [ ] Idempotencia com Redis
- [ ] Controle de status (maquina de estados)
- [ ] Mutex em processamento (evitar race condition)
- [ ] Acao correta por estado (liberar/bloquear/remover)
- [ ] Logs financeiros completos
- [ ] Fila para processamento assincrono
- [ ] Retry de webhook (se falhar processamento)
- [ ] Anti-fraude basico
- [ ] Tratamento de chargeback
- [ ] Tratamento de reembolso
- [ ] Grace period para falha de pagamento
- [ ] Notificacao ao usuario em cada mudanca
- [ ] Monitoramento de transacoes pendentes (>24h)