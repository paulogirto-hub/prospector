# ADV-06 - Integracoes Externas

> **Prioridade:** ALTO
> **Depende de:** CORE-01, CORE-03
> **É dependência de:** 09, 12
> **Categoria:** advanced

## Visao Geral das Integracoes

```
                    ┌──────────────────────┐
                    │    Sistema SaaS      │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Auth (OAuth)   │◄──── Google / GitHub / MS
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Provider       │  │
                    │  │ Gateway        │◄──── OpenRouter
                    │  │ (Internal)     │◄──── OpenAI
                    │  └────────────────┘◄──── Anthropic
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Payment        │◄──── Stripe / Mercado Pago
                    │  │ Gateway        │◄──── Webhook receiver
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Communication  │◄──── Resend (Email)
                    │  │ & Messaging    │◄──── Twilio (WhatsApp)
                    │  └────────────────┘◄──── Slack / Discord
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Storage        │◄──── S3 / MinIO
                    │  │ Service        │  │
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ CRMs & ERPs    │◄──── HubSpot / Salesforce
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Outbound       │  │
                    │  │ Webhooks       │────► Customer APIs
                    │  └────────────────┘  │
                    └──────────────────────┘
```

## 1. Providers de IA

### OpenRouter (Primario)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Roteador de modelos IA (GPT-4, Claude, Llama, etc) |
| URL Base | `https://openrouter.ai/api/v1` |
| Auth | Bearer token (API key) |
| Rate Limit | Depende do plano (60 req/min default) |
| Formato | OpenAI-compatible API |

**Fluxo:**
```
1. Sistema recebe requisicao de execucao
2. Provider Gateway seleciona provider + modelo
3. Monta payload (system_prompt + user_input)
4. Envia para OpenRouter
5. Recebe resposta
6. Calcula tokens + custo
7. Registra log
8. Retorna resposta
```

**Riscos:**
- API key vazada → uso nao autorizado + custo
- Provider cai → sem execucao
- Resposta inesperada → erro de parsing
- Promp injection via user input

**Fallback:**
- OpenRouter indisponivel → tentar OpenAI direto
- OpenAI indisponivel → tentar Anthropic
- Todos indisponiveis → erro 503 + retry automatico

**Cache:**
- Cache por hash do input + config (TTL: 1h)
- Invalidacao: mudanca de agent config
- Chave: `agent:{agent_id}:{hash(input)}`

### OpenAI (Fallback 1)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Provider direto de modelos GPT |
| Auth | Bearer token (API key) |
| Modelos | gpt-4, gpt-4-turbo, gpt-3.5-turbo |

### Anthropic (Fallback 2)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Provider direto de modelos Claude |
| Auth | x-api-key header |
| Modelos | claude-3-opus, claude-3-sonnet, claude-3-haiku |

## 2. Gateway de Pagamento

### Stripe (Primario Internacional)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Processamento de pagamentos internacionais |
| Metodos | Cartao de credito, PIX (via Stripe Brazil) |
| Webhook URL | `https://api.dominio.com/v1/billing/webhook/stripe` |
| Assinatura | Verificacao HMAC-SHA256 |

### Mercado Pago (Primario Brasil)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Processamento de pagamentos Brasil |
| Metodos | PIX, cartao, boleto |
| Webhook URL | `https://api.dominio.com/v1/billing/webhook/mercadopago` |
| Assinatura | Verificacao via header x-signature |

**Detalhes em:** `08-pagamentos/`

## 3. Servico de Email

### Resend (Primario)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Envio de emails transacionais |
| Auth | Bearer token |
| Tipos | Verificacao, reset senha, notificacoes |

### Twilio / WPP Connect (Mensageria)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Notificacoes via WhatsApp e SMS |
| Uso | Alertas criticos, 2FA, lembretes de execucao |

**Emails e Mensagens necessarios:**

| Tipo | Gatilho | Canal | Template |
|------|---------|-------|----------|
| Verificacao de email | Cadastro | Email | Link com token (24h expiracao) |
| Reset de senha | Esqueceu senha | Email | Link com token (1h expiracao) |
| Boas-vindas | Email verificado | Email | Info basica da conta |
| Pagamento aprovado | Webhook | Email/WPP | Recibo + detalhes |
| Plano expirando | Cron (3 dias antes) | Email | Link de renovacao |
| Creditos baixos | Uso < 10% | Email/WPP | Sugerir upgrade |
| Falha de pagamento | Webhook | Email | Link de retry |
| Alerta de Incidente | Monitoramento | WPP/Slack | Detalhes do erro critico |

**Fallback:** AWS SES (se Resend cair)

**Anti-abuso:**
- Max 100 emails/dia por usuario
- Max 20 mensagens WPP/dia por usuario
- Cooldown de 60s entre reenvios
- Rate limit por IP

## 4. Armazenamento

### S3 / MinIO

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Armazenamento de arquivos (upload, assets) |
| Auth | Access key + secret key |
| Tipos permitidos | PDF, TXT, CSV, JSON, imagens |
| Tam max | 10MB por arquivo |
| Bucket | `saas-uploads`, `saas-assets` |

**Regras:**
- Upload via presigned URL (nunca direto ao S3)
- Validacao de tipo e tamanho no backend
- Scan de malware (ClamAV async)
- Expiracao de URLs assinadas: 15 min

## 5. Monitoramento

### Sentry (Erros)

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Tracking de erros em producao |
| Dados coletados | Stack trace, contexto, user_id |
| NAO coletar | Senhas, tokens, API keys |
| Sampling | 100% erros, 10% transacoes |

### Prometheus + Grafana (Metricas)

| Metrica | Tipo |
|---------|------|
| Requests por segundo | Counter |
| Latencia de API | Histogram |
| Erros por endpoint | Counter |
| Uso de creditos | Gauge |
| Tokens por provider | Counter |
| Custo acumulado | Gauge |

## 6. CRMs e Ferramentas de Marketing

### HubSpot / Salesforce

| Aspecto | Detalhe |
|---------|---------|
| Funcao | Sincronizacao de leads e clientes |
| Gatilho | Novo cadastro, upgrade de plano, churn |
| Auth | OAuth2 / Client Secret |

## 7. Webhooks de Saida (Outbound)

### Para o Usuario Final

O sistema permite que o usuario configure URLs de destino para eventos internos.

| Evento | Payload |
|--------|---------|
| `agent.execution.completed` | ID, output, custo, timestamp |
| `billing.payment.success` | Valor, plano, data |
| `quota.limit.reached` | Tipo de recurso, limite, data |

**Seguranca:**
- Header `X-SaaS-Signature` (HMAC-SHA256)
- Retry com exponential backoff (5 tentativas)
- Timeout de 10s

## 6. Matriz de Dependencia

| Integracao | Criticidade | Fallback | Impacto se cair |
|-----------|-------------|----------|-----------------|
| OpenRouter | Alta | OpenAI, Anthropic | Sem execucao de agents |
| Stripe/MP | Alta | Manual manual | Sem cobranca |
| Resend | Media | AWS SES | Sem emails automaticos |
| S3 | Baixa | Local storage | Sem upload |
| Sentry | Baixa | Logs locais | Sem tracking centralizado |
| Redis | Alta | Memoria (limitado) | Sem cache/rate limit |

## 7. Checklist de Integracao

Para cada nova integracao:

- [ ] API key em variavel de ambiente
- [ ] Criptografada em repouso (se no DB)
- [ ] Proxy pelo backend (nunca frontend direto)
- [ ] Timeout configurado
- [ ] Retry com backoff
- [ ] Fallback definido
- [ ] Logs de requisicao + resposta
- [ ] Rate limit respeitado
- [ ] Tratamento de erro especifico
- [ ] Validacao de resposta
- [ ] Documentacao atualizada
- [ ] Teste de integracao
- [ ] Monitoramento configurado