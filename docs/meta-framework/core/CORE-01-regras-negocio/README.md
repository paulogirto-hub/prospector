# CORE-01 - Regras de Negocio

> **Prioridade:** CRÍTICO
> **Depende de:** (nenhum — é a base de tudo)
> **É dependência de:** 02, 03, 04, 05, 07, 08, 09, 16
> **Categoria:** core

## 1. Tipos de Usuarios

| Tipo | Descricao | Acesso |
|------|-----------|--------|
| `admin` | Controla toda a plataforma | Total |
| `manager` | Gerencia agentes e configuracoes | Parcial |
| `user` | Usa o sistema normalmente | Basico |
| `api_client` | Consome endpoints programaticamente | ReadOnly/Write limitado |

## 2. Permissoes (RBAC)

### Matriz de Permissoes

| Permissao | admin | manager | user | api_client |
|-----------|-------|---------|------|------------|
| `create_user` | SIM | NAO | NAO | NAO |
| `delete_user` | SIM | NAO | NAO | NAO |
| `update_user` | SIM | NAO | NAO | NAO |
| `list_users` | SIM | NAO | NAO | NAO |
| `create_agent` | SIM | SIM | NAO | NAO |
| `update_agent` | SIM | SIM | NAO | NAO |
| `delete_agent` | SIM | SIM | NAO | NAO |
| `run_agent` | SIM | SIM | SIM | SIM |
| `view_agent_logs` | SIM | SIM | PROPRIA | PROPRIA |
| `manage_billing` | SIM | NAO | PROPRIA | NAO |
| `view_analytics` | SIM | SIM | PROPRIA | NAO |
| `manage_providers` | SIM | NAO | NAO | NAO |
| `manage_api_keys` | SIM | NAO | PROPRIA | PROPRIA |

### Estrutura do Token de Permissao

```json
{
  "role": "manager",
  "permissions": ["create_agent", "update_agent", "delete_agent", "run_agent", "view_agent_logs", "view_analytics"]
}
```

## 3. Limites de Uso

### Por Plano

| Limite | Free | Pro | Enterprise |
|--------|------|-----|------------|
| Requisicoes/dia | 10 | 1.000 | Ilimitado |
| Agents ativos | 1 | 10 | Ilimitado |
| Tokens IA/mes | 5.000 | 500.000 | Sob demanda |
| Armazenamento | 10MB | 1GB | Ilimitado |
| Membros equipe | 1 | 5 | Ilimitado |

### Por Seguranca

| Limite | Valor |
|--------|-------|
| Tentativas login (15min) | 5 |
| Requisicoes/minuto (rate limit) | 60 |
| Upload arquivo (tam max) | 10MB |
| Senha (min caracteres) | 8 |
| Sessao ativa por usuario | 3 |
| Criacao contas por IP/dia | 3 |

## 4. Regras de Monetizacao

### Modelo: Creditos + Assinatura

```
Plano Free:
  - Limitado funcionalmente
  - Sem custo
  - Sem suporte prioritario

Plano Pro (R$ 49,90/mes):
  - Creditos: 500.000 tokens IA/mes
  - 10 agents
  - Suporte email
  - Sem branding

Plano Enterprise (Sob demanda):
  - Creditos ilimitados
  - Agents ilimitados
  - SLA garantido
  - Suporte dedicado
  - Customizacao

Creditos avulsos:
  - Pacote 100k tokens: R$ 9,90
  - Pacote 500k tokens: R$ 39,90
  - Pacote 1M tokens: R$ 69,90
```

### Regras de Cobranca

- Cobranca proporcional no upgrade (prorata)
- Sem reembolso em downgrade no periodo
- Creditos expiram em 30 dias se nao usados
- Excedente de creditos gera cobranca automatica
- Falha de pagamento → 7 dias grace period → downgrade

## 5. Estados do Sistema

### Usuario

```
pending_email → active → suspended → deleted
```

- `pending_email`: Recem criado, aguardando verificacao
- `active`: Conta funcional
- `suspended`: Violacao de termos ou pagamento
- `deleted`: Removido (soft delete 30 dias)

### Agent

```
draft → active → paused → archived
```

- `draft`: Sendo configurado
- `active`: Funcionando
- `paused`: Temporariamente desativado
- `archived`: Removido (sem execucao)

### Pagamento

```
pending → approved → completed
pending → rejected
approved → refunded
approved → chargeback
```

## 6. Fluxos Principais

### Cadastro
1. Usuario informa email + senha
2. Sistema cria conta com status `pending_email`
3. Sistema envia email de verificacao
4. Usuario confirma → status `active`
5. Sistema cria plano Free automaticamente

### Execucao de Agent
1. Usuario seleciona agent ativo
2. Sistema verifica permissoes (RBAC)
3. Sistema verifica limites (plano + creditos)
4. Sistema estima custo em tokens
5. Se creditos insuficientes → bloqueia + notifica
6. Se OK → executa via provider
7. Registra log + debita creditos

### Upgrade de Plano
1. Usuario escolhe plano
2. Sistema cria cobranca no gateway
3. Gateway processa pagamento
4. Webhook confirma aprovacao
5. Sistema atualiza plano + creditos
6. Sistema registra log financeiro

## 7. Regras Anti-Abuso

| Regra | Implementacao |
|-------|---------------|
| Multi-conta | 1 conta por email verificado, max 3/IP/dia |
| Automacao | Rate limiting por usuario + IP |
| Uso abusivo | Monitoramento de consumo anomalo |
| Comportamento suspeito | Flag automatico + revisao manual |
| Creditos fraudulentos | Validar pagamento antes de creditar |
| Prompt injection | Sanitizacao + validacao de input |

## 8. Regras de Excecao

| Cenario | Acao |
|---------|------|
| API externa cai | Fallback para provider alternativo |
| Webhook nao chega | Polling a cada 5min por 1 hora |
| Pagamento falha | Retry 3x, notificar usuario, grace 7 dias |
| Creditos acabam | Bloquear execucao, notificar upgrade |
| Token expirado | Refresh automatico (se dentro do prazo) |
| Usuario banido | Invalidar todos os tokens, bloquear acesso |
| DB indisponivel | Fila de retentativa, health check |
| Upload falha | Retry 2x, erro controlado ao usuario |