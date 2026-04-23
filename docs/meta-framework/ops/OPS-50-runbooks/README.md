# OPS-50 - Operational Runbooks

> **Prioridade:** ALTO
> **Depende de:** INFRA-19, OPS-22
> **É dependência de:** 23
> **Categoria:** ops

## 1. Adicionar Novo Provider de IA

### Cenario
Precisa adicionar um novo provider (ex: Gemini, Mistral, DeepSeek).

### Passos

```bash
# 1. Gerar chave AES para criptografar API key
# (usar a ENCRYPTION_KEY ja configurada)

# 2. Adicionar no .env
NEW_PROVIDER_API_KEY=sk-xxxxx

# 3. Via Admin API (ou seed):
POST /v1/admin/providers
{
  "name": "deepseek",
  "base_url": "https://api.deepseek.com/v1",
  "cost_per_1k_tokens_input": 0.00014,
  "cost_per_1k_tokens_output": 0.00028,
  "rate_limit": 60,
  "priority": 3,
  "health_score": 100
}
# (API key e criptografada automaticamente pelo backend)

# 4. Testar conectividade
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/v1/admin/providers/deepseek/test

# 5. Adicionar modelos suportados
# No campo supported_models da config do provider:
["deepseek-chat", "deepseek-coder"]

# 6. Verificar no dashboard
# Acessar /admin/providers — deve aparecer na lista

# 7. Monitorar
# Verificar provider_logs apos 1h de uso
```

### Checklist
- [ ] API key adicionada (em .env, nao no codigo)
- [ ] Provider criado via Admin API
- [ ] Custo preenchido (pesquisar precos reais)
- [ ] Priority definida (1=primario, 2+=fallback)
- [ ] Teste de conectividade OK
- [ ] Monitoramento ativo (health score)

---

## 2. Adicionar Novo Plano

### Cenario
Precisa criar um plano intermediario (ex: "Team").

### Passos

```typescript
// 1. Atualizar constantes de limites (backend)
// Em src/modules/billing/billing.service.ts ou constants

const PLAN_LIMITS = {
  free:      { maxAgents: 1,   tokensLimit: 5000,    maxMembers: 1  },
  pro:       { maxAgents: 10,  tokensLimit: 500000,  maxMembers: 5  },
  team:      { maxAgents: 25,  tokensLimit: 2000000, maxMembers: 15 },  // NOVO
  enterprise:{ maxAgents: Infinity, tokensLimit: Infinity, maxMembers: Infinity },
}

// 2. Atualizar precos (business/08-pagamentos)
const PLAN_PRICES = {
  free: 0,
  pro: 49.90,
  team: 149.90,   // NOVO
  enterprise: 0,  // sob demanda
}

// 3. Atualizar Enum no Prisma
// Em prisma/schema.prisma:
// ALTER TYPE plan ADD VALUE 'team'

// 4. Criar migration
npx prisma migrate dev --name add_team_plan

// 5. Atualizar frontend
// Em frontend, atualizar planos exibidos + precos

// 6. Atualizar documentacao
// docs/01-regras-negocio, docs/16-custo-real

// 7. Testar
// Criar subscription com plano team via API
POST /v1/billing/subscribe { "plan": "team" }
```

### Checklist
- [ ] Constantes de limites atualizadas
- [ ] Precos atualizados
- [ ] Migration criada e testada
- [ ] Frontend atualizado
- [ ] Documentacao atualizada
- [ ] Testes passando

---

## 3. Escalar Verticalmente (Upgrade de VPS)

### Cenario
CPU/RAM nao aguenta mais.

### Passos

```bash
# 1. Verificar uso atual
ssh deploy@IP
docker stats --no-stream    # CPU/RAM por container
free -h                     # RAM do host
df -h                       # Disco

# 2. Provisionar nova VPS (maior)
# No painel do provider (Hetzner, DigitalOcean, etc)
# Ex: upgrade de CX22 (2vCPU/4GB) para CX32 (4vCPU/8GB)

# 3. Migrar
# Opcao A: Resize (Hetzner/DigitalOcean suportam)
# Opcao B: Nova VPS + migrar dados

# Se opcao B:
# 3a. Provisionar nova VPS
# 3b. Configurar (ver docs/19-deploy-infra)
# 3c. Migrar DB
pg_dump -h OLD_IP -U saas saas_db | psql -h NEW_IP -U saas saas_db
# 3d. Copiar .env
# 3e. Docker compose up
# 3f. Testar /health
# 3g. Atualizar DNS (se IP mudou)

# 4. Verificar
curl http://localhost:3000/health
docker stats --no-stream    # deve ter mais headroom
```

### Checklist
- [ ] Monitoramento confirmou necessidade
- [ ] Nova VPS provisionada
- [ ] Dados migrados
- [ ] Health check OK
- [ ] DNS atualizado
- [ ] Monitoramento funcionando
- [ ] Old VPS desligada (apos 24h de OK)

---

## 4. Rotacionar API Key de Provider

### Cenario
Rotacao periodica (90 dias) ou apos suspeita de vazamento.

### Passos

```bash
# 1. Gerar nova API key no console do provider
# (OpenRouter, OpenAI, etc)

# 2. Atualizar via Admin API
PUT /v1/admin/providers/openrouter
{
  "api_key_encrypted": "nova-chave-aqui"  # backend criptografa automaticamente
}

# ATENCAO: nao colocar a chave em texto no request
# Em producao, usar script com env var:

# 3. Script de rotacao
NEW_KEY=$OPENROUTER_API_KEY_NEW
curl -X PUT https://api.dominio.com/v1/admin/providers/openrouter \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"api_key_encrypted\": \"$NEW_KEY\"}"

# 4. Testar
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.dominio.com/v1/admin/providers/openrouter/test

# 5. Revogar chave antiga no console do provider

# 6. Registrar audit log
# O sistema ja registra automaticamente
```

### Checklist
- [ ] Nova chave gerada no provider
- [ ] Chave atualizada via Admin API (criptografada)
- [ ] Teste de conectividade OK
- [ ] Chave antiga revogada no provider
- [ ] Audit log registrado

---

## 5. Restaurar Backup do Banco

### Cenario
Dados corrompidos ou apagados acidentalmente.

### Passos

```bash
# 1. Parar API
docker compose stop api

# 2. Verificar backup disponivel
ls -la /home/deploy/backups/
# full_YYYYMMDD_HHMMSS.sql.gz

# 3. Restaurar
gunzip -c /home/deploy/backups/full_20260422_030000.sql.gz | \
  docker exec -i saas-postgres psql -U saas saas_db

# 4. Verificar integridade
docker exec saas-postgres psql -U saas -c "SELECT count(*) FROM users"

# 5. Reiniciar API
docker compose start api

# 6. Verificar
curl http://localhost:3000/health
```

### Se precisa restaurar tabela especifica

```bash
# 1. Restaurar DB inteiro em DB temporario
createdb -h localhost -U saas saas_recovery
gunzip -c backup.sql.gz | psql -U saas saas_recovery

# 2. Exportar tabela
pg_dump -U saas saas_recovery -t agents > agents_recovery.sql

# 3. Importar no DB principal
psql -U saas saas_db < agents_recovery.sql

# 4. Cleanup
dropdb saas_recovery
```

---

## 6. Configurar Nova Regiao / CDN

### Cenario
Expansion internacional ou performance para usuarios distantes.

### Passos

```bash
# 1. Provisionar VPS na nova regiao (mesmo processo doc 19)
# 2. Configurar replicacao DB
# PostgreSQL streaming replication:
# Primary: wal_level = replica
# Replica: hot_standby = on

# 3. Configurar CDN (Cloudflare)
# Adicionar dominio no Cloudflare
# Configurar cache rules:
#   /_next/static/* → cache 1 ano
#   /api/* → no cache
#   /v1/agents/*/run → no cache (SSE)

# 4. Configurar DNS
# Adicionar record para nova regiao (geo-routing)

# 5. Testar
# Verificar latencia da nova regiao
curl -o /dev/null -s -w "%{time_total}" https://api.newregion.dominio.com/health
```

---

## 7. Adicionar Novo Modelo de IA

### Cenario
Novo modelo disponivel (ex: GPT-5, Claude 4).

### Passos

```bash
# 1. Verificar se provider suporta
curl https://openrouter.ai/api/v1/models | grep "model-name"

# 2. Adicionar models suportados ao provider
PUT /v1/admin/providers/openrouter
{
  "supported_models": [...existing, "new-model-name"]
}

# 3. Atualizar config de custo
# Se o modelo tem preco diferente:
# Atualizar cost_per_1k_tokens_input/output
# OU criar provider novo se preco muito diferente

# 4. Atualizar frontend (seletor de modelos)

# 5. Atualizar permissao por plano
# Se modelo e premium → restringir por plano
```

---

## 8. Debug de Webhook Nao Processado

### Cenario
Webhook de pagamento chegou mas nao processou.

### Passos

```bash
# 1. Verificar DLQ
SELECT * FROM dead_letter_queue 
WHERE source = 'webhook_mercadopago' 
AND status IN ('pending', 'exhausted')
ORDER BY created_at DESC;

# 2. Ver detalhes do item
GET /v1/admin/dlq/:id

# 3. Ver erro
# Campo "error" deve conter a mensagem de erro

# 4. Corrigir causa
# Depende do erro. Exemplos:
# - Assinatura invalida → verificar webhook secret
# - Transaction not found → verificar se transaction foi criada
# - DB timeout → verificar conexoes

# 5. Retry manual
POST /v1/admin/dlq/:id/retry

# 6. Verificar se processou
SELECT status FROM dead_letter_queue WHERE id = 'uuid';

# 7. Se esgotou retries, processar manualmente
# Verificar pagamento no painel do gateway
# Atualizar transacao manualmente se confirmado
```

---

## 9. Ativar/Desativar Feature Flag

### Cenario
Ativar feature gradualmente ou em emergencia.

### Passos

```bash
# Ativar feature
PUT /v1/admin/feature-flags/agent_streaming
{ "enabled": true, "percentage": 10 }

# Aumentar gradualmente (canary)
PUT /v1/admin/feature-flags/agent_streaming
{ "percentage": 25 }

# Desativar (kill switch)
PUT /v1/admin/feature-flags/agent_streaming
{ "enabled": false }

# Maintenance mode (emergencia)
PUT /v1/admin/feature-flags/maintenance_mode
{ "enabled": true }

# Desativar maintenance
PUT /v1/admin/feature-flags/maintenance_mode
{ "enabled": false }
```