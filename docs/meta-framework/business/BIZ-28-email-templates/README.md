# BIZ-28 - Email Templates

> **Prioridade:** MEDIO
> **Depende de:** BACK-04, BIZ-08, BACK-25
> **É dependência de:** (nenhum)
> **Categoria:** business

## 1. Design System de Email

### Regras Gerais

| Regra | Valor |
|-------|-------|
| Largura maxima | 600px |
| Fonte | System fonts (Arial, Helvetica, sans-serif) |
| Font size minimo | 14px |
| Botoes | Min 44px altura (touch friendly) |
| Cores | Mesmas do design system (#0F172A, #3B82F6, #10B981, #EF4444) |
| Dark mode | Suportado (prefers-color-scheme) |
| Plaintext | Sempre gerar versao plaintext |
| Imagens | Alt text obrigatorio, max 1MB total |

### Layout Base

```
┌─────────────────────────────────────────┐
│  LOGO (150x40px)                        │
├─────────────────────────────────────────┤
│                                         │
│  [Conteúdo do email]                    │
│                                         │
│  Olá {{name}},                          │
│                                         │
│  [Mensagem principal]                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         [BOTÃO CTA]             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Texto secundário / detalhes]          │
│                                         │
├─────────────────────────────────────────┤
│  Footer                                 │
│  Dominio.com                            │
│  [Unsubscribe] | [Preferences]          │
│  CNPJ: XX.XXX.XXX/0001-XX             │
└─────────────────────────────────────────┘
```

## 2. Templates

### 2.1 Verificacao de Email

**Gatilho:** Cadastro
**Assunto:** Verifique seu email — {{app_name}}
**Prioridade:** Alta

```html
Olá {{name}},

Bem-vindo ao {{app_name}}! Para começar a usar, confirme seu email:

[CONFIRMAR EMAIL] ← botão, link: {{verification_url}}

Este link expira em 24 horas.

Se você não criou uma conta, ignore este email.
```

**Variaveis:** name, app_name, verification_url

---

### 2.2 Boas-vindas (Email verificado)

**Gatilho:** Email verificado com sucesso
**Assunto:** Conta ativada! — {{app_name}}
**Prioridade:** Normal

```html
Olá {{name}},

Sua conta está pronta! Aqui está o que você pode fazer:

→ Criar seu primeiro Agent
  Acesse Dashboard → Novo Agent

→ Conhecer os modelos disponíveis
  GPT-4o, Claude 3.5, Llama 3.1

→ Conferir seu plano
  Você está no plano Free: 5.000 tokens/mês

[CRIAR PRIMEIRO AGENT] ← botão

Precisa de ajuda? Responda este email.
```

**Variaveis:** name, plan, tokens_limit

---

### 2.3 Reset de Senha

**Gatilho:** Esqueceu senha
**Assunto:** Redefina sua senha — {{app_name}}
**Prioridade:** Alta

```html
Olá {{name}},

Recebemos uma solicitação para redefinir sua senha.

[REDEFINIR SENHA] ← botão, link: {{reset_url}}

Este link expira em 1 hora.

Se você não solicitou isso, ignore este email. Sua senha não será alterada.
```

**Variaveis:** name, reset_url

---

### 2.4 Pagamento Aprovado

**Gatilho:** Webhook de pagamento aprovado
**Assunto:** Pagamento confirmado — {{app_name}}
**Prioridade:** Alta

```html
Olá {{name}},

Seu pagamento foi confirmado!

Detalhes:
  Plano: {{plan}}
  Valor: R$ {{amount}}
  Método: {{payment_method}}
  Transação: {{transaction_id}}

Seus créditos já estão disponíveis.

[VER MINHA CONTA] ← botão

Dúvidas? Responda este email.
```

**Variaveis:** name, plan, amount, payment_method, transaction_id

---

### 2.5 Pagamento Recusado

**Gatilho:** Webhook de pagamento recusado
**Assunto:** Pagamento recusado — {{app_name}}
**Prioridade:** Alta

```html
Olá {{name}},

Seu pagamento não foi processado.

Detalhes:
  Valor: R$ {{amount}}
  Método: {{payment_method}}
  Motivo: Saldo insuficiente / Cartão recusado

[TENTAR NOVAMENTE] ← botão

Você ainda pode usar o plano Free enquanto resolve.
```

**Variaveis:** name, amount, payment_method

---

### 2.6 Creditos Baixos

**Gatilho:** Cron job (creditos < 10%)
**Assunto:** Seus créditos estão acabando — {{app_name}}
**Prioridade:** Normal

```html
Olá {{name}},

Seus créditos estão quase no fim.

Restam: {{remaining}} tokens de {{limit}}
Uso este mês: {{used}}%

Para continuar usando seus agents sem interrupção:

[COMPRAR CRÉDITOS] ← botão

Pacotes a partir de R$ 9,90 (100k tokens)
```

**Variaveis:** name, remaining, limit, used

---

### 2.7 Plano Expirando (3 dias)

**Gatilho:** Cron job (3 dias antes do vencimento)
**Assunto:** Renove seu plano — {{app_name}}
**Prioridade:** Normal

```html
Olá {{name}},

Seu plano {{plan}} expira em 3 dias ({{expires_at}}).

Para manter acesso a todos os recursos:
- Até {{agents_count}} agents ativos
- {{tokens_limit}} tokens/mês
- Suporte prioritário

[RENVOAR PLANO] ← botão

Se não renovar, sua conta voltará ao plano Free.
```

**Variaveis:** name, plan, expires_at, agents_count, tokens_limit

---

### 2.8 Plano Rebaixado (Grace Period)

**Gatilho:** Falha de pagamento + fim do grace period
**Assunto:** Plano atualizado para Free — {{app_name}}
**Prioridade:** Alta

```html
Olá {{name}},

Como não recebemos o pagamento, sua conta voltou ao plano Free.

O que mudou:
- Agents ativos: {{current_agents}} → 1 (os demais foram pausados)
- Tokens/mês: {{old_limit}} → 5.000
- Sem suporte prioritário

[ATUALIZAR PLANO] ← botão

Seus agents pausados serão restaurados ao reativar.
```

**Variaveis:** name, current_agents, old_limit

---

### 2.9 Execucao de Agent Falhou

**Gatilho:** Agent execution com erro persistente
**Assunto:** Erro no Agent "{{agent_name}}" — {{app_name}}
**Prioridade:** Normal

```html
Olá {{name}},

Seu agent "{{agent_name}}" encontrou um erro.

Detalhes:
  Agent: {{agent_name}}
  Erro: {{error_message}}
  Horário: {{timestamp}}
  Execuções falhadas: {{fail_count}}

[VER DETALHES] ← botão

Possíveis causas:
- Provider temporariamente indisponível
- Créditos insuficientes
- Configuração do agent

Tente novamente ou ajuste as configurações.
```

**Variaveis:** name, agent_name, error_message, timestamp, fail_count

---

### 2.10 Manutencao Programada

**Gatilho:** Admin agenda manutencao
**Assunto:** Manutenção programada — {{app_name}}
**Prioridade:** Normal

```html
Olá {{name}},

Programamos uma manutenção para melhorar o sistema.

Data: {{maintenance_date}}
Duração estimada: {{duration}} minutos
Impacto: O sistema ficará indisponível durante este período

Recomendamos:
- Salve seu trabalho antes do horário
- Execuções em andamento podem ser interrompidas

Avisaremos quando o sistema estiver de volta.

Obrigado pela compreensão.
```

**Variaveis:** name, maintenance_date, duration

---

### 2.11 Convite para Equipe

**Gatilho:** Admin adiciona membro
**Assunto:** Convite para {{tenant_name}} — {{app_name}}
**Prioridade:** Normal

```html
Olá {{invitee_email}},

{{inviter_name}} convidou você para fazer parte de {{tenant_name}}.

[ACEITAR CONVITE] ← botão, link: {{invite_url}}

Este convite expira em 7 dias.
```

**Variaveis:** invitee_email, inviter_name, tenant_name, invite_url

---

### 2.12 Delecao de Conta (LGPD)

**Gatilho:** Usuario solicita delecao
**Assunto:** Confirmação de exclusão de conta — {{app_name}}
**Prioridade:** Alta

```html
Olá {{name}},

Recebemos sua solicitação para excluir sua conta.

Sua conta será excluída permanentemente em 30 dias.
Até lá, você pode reverter esta ação fazendo login.

O que sera excluído:
- Dados pessoais (email, nome)
- Agents e configurações
- Histórico de execuções
- Transações (dados legais retidos por 5 anos)

Se mudou de ideia, faça login nos próximos 30 dias.

[FAZER LOGIN] ← botão
```

**Variaveis:** name, deletion_date

## 3. Implementacao (Resend)

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendVerificationEmail(to: string, name: string, verificationUrl: string) {
  await resend.emails.send({
    from: 'SaaS <noreply@dominio.com>',
    to,
    subject: 'Verifique seu email — SaaS',
    html: renderTemplate('verification', { name, verification_url: verificationUrl }),
    text: renderPlaintext('verification', { name, verification_url: verificationUrl }),
  })
}
```

## 4. Anti-Spam

| Regra | Implementacao |
|-------|--------------|
| SPF | Registro DNS: v=spf1 include=resend.com ~all |
| DKIM | Configurar no painel Resend |
| DMARC | Registro DNS: v=DMARC1; p=quarantine; rua=mailto:admin@dominio.com |
| Unsubscribe header | List-Unsubscribe: <{{unsubscribe_url}}> |
| Max destinatarios | 1 por email (nunca BCC) |
| Cooldown | 60s entre reenvios para mesmo email |

## 5. Checklist

- [ ] Templates HTML para todos os 12 cenarios
- [ ] Versao plaintext para cada template
- [ ] Dark mode suportado
- [ ] SPF + DKIM + DMARC configurados
- [ ] Resend configurado como provider
- [ ] Fallback AWS SES
- [ ] DLQ para emails que falham
- [ ] Unsubscribe link em marketing emails
- [ ] Rate limit de envio (respeitar provider)
- [ ] Teste de renderizacao (Client: Gmail, Outlook, Apple Mail)