# CORE-02 - Modelagem de Dados

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01
> **É dependência de:** 04, 11, 17, 18
> **Categoria:** core

## Diagrama de Relacionamentos

```
Users 1──N UserSessions
Users 1──N Agents
Users 1──N Subscriptions
Users 1──N Transactions
Users 1──N UsageLogs
Agents 1──N AgentExecutions
Agents 1──N AgentLogs
Subscriptions 1──N Invoices
Providers 1──N ProviderLogs
```

## Tabelas

### users

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email de acesso |
| password_hash | VARCHAR(255) | NOT NULL | Hash bcrypt da senha |
| name | VARCHAR(100) | NOT NULL | Nome do usuario |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'user' | admin, manager, user, api_client |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending_email' | Estado da conta |
| email_verified_at | TIMESTAMP | NULL | Data de verificacao |
| last_login_at | TIMESTAMP | NULL | Ultimo login |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data de criacao |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Ultima atualizacao |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Indices:**
- `idx_users_email` UNIQUE on email
- `idx_users_status` on status
- `idx_users_created_at` on created_at

### user_sessions

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| user_id | UUID | FK → users.id, NOT NULL | Dono da sessao |
| refresh_token | VARCHAR(500) | NOT NULL | Refresh token JWT |
| device_info | VARCHAR(255) | NULL | Info do dispositivo |
| ip_address | INET | NOT NULL | IP do acesso |
| expires_at | TIMESTAMP | NOT NULL | Expiracao do refresh token |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Inicio da sessao |
| revoked_at | TIMESTAMP | NULL | Revogacao manual |

**Indices:**
- `idx_sessions_user_id` on user_id
- `idx_sessions_refresh_token` on refresh_token
- `idx_sessions_expires_at` on expires_at

### agents

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| user_id | UUID | FK → users.id, NOT NULL | Dono do agent |
| name | VARCHAR(100) | NOT NULL | Nome do agent |
| description | TEXT | NULL | Descricao |
| system_prompt | TEXT | NOT NULL | Prompt de sistema |
| model | VARCHAR(50) | NOT NULL | Modelo IA (ex: gpt-4) |
| provider | VARCHAR(50) | NOT NULL | Provider (ex: openrouter) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | Estado do agent |
| config | JSONB | NOT NULL, DEFAULT '{}' | Configuracoes extras |
| max_tokens_per_run | INTEGER | NOT NULL, DEFAULT 4000 | Limite por execucao |
| temperature | DECIMAL(3,2) | NOT NULL, DEFAULT 0.7 | Temperatura do modelo |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Atualizacao |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Indices:**
- `idx_agents_user_id` on user_id
- `idx_agents_status` on status
- `idx_agents_provider` on provider

### agent_executions

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| agent_id | UUID | FK → agents.id, NOT NULL | Agent executado |
| user_id | UUID | FK → users.id, NOT NULL | Quem executou |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'running' | running, completed, failed |
| input | TEXT | NOT NULL | Input do usuario |
| output | TEXT | NULL | Resposta do agent |
| tokens_used | INTEGER | NOT NULL, DEFAULT 0 | Tokens consumidos |
| cost | DECIMAL(10,6) | NOT NULL, DEFAULT 0 | Custo em USD |
| provider | VARCHAR(50) | NOT NULL | Provider utilizado |
| model | VARCHAR(50) | NOT NULL | Modelo utilizado |
| error_message | TEXT | NULL | Mensagem de erro |
| started_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Inicio |
| completed_at | TIMESTAMP | NULL | Fim |

**Indices:**
- `idx_exec_agent_id` on agent_id
- `idx_exec_user_id` on user_id
- `idx_exec_status` on status
- `idx_exec_started_at` on started_at

### subscriptions

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| user_id | UUID | FK → users.id, NOT NULL, UNIQUE | Dono |
| plan | VARCHAR(20) | NOT NULL, DEFAULT 'free' | free, pro, enterprise |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | active, past_due, canceled |
| tokens_limit | BIGINT | NOT NULL, DEFAULT 5000 | Limite de tokens/mes |
| tokens_used | BIGINT | NOT NULL, DEFAULT 0 | Tokens usados no mes |
| current_period_start | TIMESTAMP | NOT NULL | Inicio do periodo |
| current_period_end | TIMESTAMP | NOT NULL | Fim do periodo |
| gateway_subscription_id | VARCHAR(255) | NULL | ID no gateway |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Atualizacao |

**Indices:**
- `idx_sub_user_id` UNIQUE on user_id
- `idx_sub_status` on status
- `idx_sub_period_end` on current_period_end

### transactions

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| user_id | UUID | FK → users.id, NOT NULL | Dono |
| subscription_id | UUID | FK → subscriptions.id, NULL | Assinatura relacionada |
| amount | DECIMAL(10,2) | NOT NULL | Valor |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'BRL' | Moeda |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, approved, rejected, refunded, chargeback |
| payment_method | VARCHAR(20) | NOT NULL | pix, credit_card, boleto |
| gateway | VARCHAR(50) | NOT NULL | Gateway utilizado |
| gateway_transaction_id | VARCHAR(255) | UNIQUE, NOT NULL | ID no gateway |
| idempotency_key | VARCHAR(255) | UNIQUE, NOT NULL | Chave de idempotencia |
| metadata | JSONB | DEFAULT '{}' | Dados extras |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Atualizacao |

**Indices:**
- `idx_trans_user_id` on user_id
- `idx_trans_status` on status
- `idx_trans_gateway_id` UNIQUE on gateway_transaction_id
- `idx_trans_idempotency` UNIQUE on idempotency_key
- `idx_trans_created_at` on created_at

### invoices

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| subscription_id | UUID | FK → subscriptions.id, NOT NULL | Assinatura |
| transaction_id | UUID | FK → transactions.id, NULL | Transacao associada |
| amount | DECIMAL(10,2) | NOT NULL | Valor da fatura |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending, paid, overdue |
| due_date | DATE | NOT NULL | Vencimento |
| paid_at | TIMESTAMP | NULL | Data de pagamento |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |

**Indices:**
- `idx_inv_subscription_id` on subscription_id
- `idx_inv_status` on status
- `idx_inv_due_date` on due_date

### providers

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Nome (openrouter, openai, etc) |
| api_key_encrypted | TEXT | NOT NULL | API key criptografada |
| base_url | VARCHAR(255) | NOT NULL | URL base |
| cost_per_1k_tokens_input | DECIMAL(10,6) | NOT NULL | Custo input/1k tokens |
| cost_per_1k_tokens_output | DECIMAL(10,6) | NOT NULL | Custo output/1k tokens |
| rate_limit | INTEGER | NOT NULL | Limite req/min do provider |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | active, inactive, maintenance |
| priority | INTEGER | NOT NULL, DEFAULT 1 | Ordem de preferencia |
| health_score | DECIMAL(3,2) | NOT NULL, DEFAULT 100.00 | Score de saude (0-100) |
| last_health_check | TIMESTAMP | NULL | Ultima verificacao |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Atualizacao |

**Indices:**
- `idx_providers_name` UNIQUE on name
- `idx_providers_status` on status
- `idx_providers_priority` on priority

### provider_logs

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| provider_id | UUID | FK → providers.id, NOT NULL | Provider |
| user_id | UUID | FK → users.id, NOT NULL | Usuario |
| agent_id | UUID | FK → agents.id, NULL | Agent |
| request_tokens | INTEGER | NOT NULL, DEFAULT 0 | Tokens enviados |
| response_tokens | INTEGER | NOT NULL, DEFAULT 0 | Tokens recebidos |
| cost | DECIMAL(10,6) | NOT NULL, DEFAULT 0 | Custo |
| latency_ms | INTEGER | NOT NULL | Latencia em ms |
| status_code | INTEGER | NOT NULL | HTTP status |
| error | TEXT | NULL | Erro se houver |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |

**Indices:**
- `idx_plog_provider_id` on provider_id
- `idx_plog_user_id` on user_id
- `idx_plog_created_at` on created_at

### usage_logs

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| user_id | UUID | FK → users.id, NOT NULL | Usuario |
| action | VARCHAR(50) | NOT NULL | Acao realizada |
| resource_type | VARCHAR(50) | NOT NULL | Tipo do recurso |
| resource_id | UUID | NOT NULL | ID do recurso |
| ip_address | INET | NOT NULL | IP de origem |
| user_agent | VARCHAR(255) | NULL | Browser/client |
| metadata | JSONB | DEFAULT '{}' | Dados extras |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |

**Indices:**
- `idx_ulog_user_id` on user_id
- `idx_ulog_action` on action
- `idx_ulog_created_at` on created_at

### audit_logs

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| id | UUID | PK | Identificador unico |
| actor_id | UUID | FK → users.id, NULL | Quem fez |
| action | VARCHAR(100) | NOT NULL | Acao realizada |
| entity_type | VARCHAR(50) | NOT NULL | Tipo da entidade |
| entity_id | UUID | NOT NULL | ID da entidade |
| old_value | JSONB | NULL | Valor anterior |
| new_value | JSONB | NULL | Novo valor |
| ip_address | INET | NOT NULL | IP |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Criacao |

**Indices:**
- `idx_alog_actor_id` on actor_id
- `idx_alog_entity` on entity_type, entity_id
- `idx_alog_created_at` on created_at

## Regras Gerais do Banco

- Todas as tabelas com UUID como PK
- Soft delete (deleted_at) em tabelas principais
- JSONB para dados flexiveis (config, metadata)
- Timestamps com timezone
- Conexao SSL obrigatoria
- Prepared statements em todas as queries
- Migracoes versionadas