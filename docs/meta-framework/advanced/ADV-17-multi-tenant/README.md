# ADV-17 - Estrategia Multi-Tenant

> **Prioridade:** OPCIONAL
> **Depende de:** CORE-01, CORE-02, BACK-04
> **É dependência de:** (nenhum)
> **Categoria:** advanced

## 1. O Que e Multi-Tenant

Um tenant = um cliente (empresa/organizacao) que usa seu sistema.

Single-tenant:
```
1 instalacao = 1 cliente
Facil, mas caro de manter
```

Multi-tenant:
```
1 instalacao = N clientes
Complexo, mas escalavel economicamente
```

## 2. Niveis de Isolamento

### Nivel 1: Shared Database, Shared Schema (mais facil)

```
Todos os tenants compartilham:
- Mesmo banco
- Mesmas tabelas
Isolamento: campo tenant_id em cada tabela
```

| Vantagem | Desvantagem |
|----------|-------------|
| Simples de implementar | Vazamento de dados entre tenants (se esquecer filtro) |
| Barato (1 DB) | Performance compartilhada |
| Facil de gerenciar | Backup parcial dificil |

### Nivel 2: Shared Database, Separate Schemas (medio)

```
Cada tenant tem seu schema no mesmo banco
```

| Vantagem | Desvantagem |
|----------|-------------|
| Isolamento forte | Migracoes sao N vezes |
| Backup por tenant | Connection pooling mais complexo |

### Nivel 3: Separate Databases (mais seguro)

```
Cada tenant tem seu banco
```

| Vantagem | Desvantagem |
|----------|-------------|
| Isolamento total | Caro (N bancos) |
| Backup isolado | Mais complexo |
| Regulacao (LGPD) | Maintenance overhead |

### Recomendacao para este sistema

**Nivel 1** (shared DB + tenant_id) para MVP, com plano de migrar para Nivel 2 quando necessario.

## 3. Modelo de Dados

### Tabela: tenants

| Campo | Tipo | Constraint | Descricao |
|-------|------|-----------|-----------|
| id | UUID | PK | Identificador |
| name | VARCHAR(100) | NOT NULL | Nome da empresa |
| slug | VARCHAR(50) | UNIQUE | Identificador para URL |
| plan | VARCHAR(20) | DEFAULT 'free' | Plano do tenant |
| status | VARCHAR(20) | DEFAULT 'active' | active, suspended, deleted |
| config | JSONB | DEFAULT '{}' | Configuracoes customizadas |
| created_at | TIMESTAMP | DEFAULT NOW() | Criacao |
| updated_at | TIMESTAMP | DEFAULT NOW() | Atualizacao |

### Alteracao em todas as tabelas existentes

Adicionar `tenant_id` em TODAS as tabelas que pertencem a um tenant:

```sql
-- Exemplo: users passa a ter tenant_id
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- agents
ALTER TABLE agents ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_agents_tenant_id ON agents(tenant_id);

-- subscription
ALTER TABLE subscriptions ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- etc
```

### Regra: TODA query deve ter WHERE tenant_id = ?

## 4. Estrategia de Isolamento (Nivel 1)

### Middleware de Tenant

```typescript
async function tenantMiddleware(req: FastifyRequest, _reply: FastifyReply) {
  // 1. Extrair tenant do token JWT (ou subdomain)
  const tenantId = req.user?.tenant_id

  if (!tenantId) {
    throw new AppError('FORBIDDEN', 403, 'Tenant not specified')
  }

  // 2. Validar que tenant existe e esta ativo
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, status: 'active' },
  })

  if (!tenant) {
    throw new AppError('FORBIDDEN', 403, 'Tenant not found or inactive')
  }

  // 3. Disponibilizar tenant_id no request
  req.tenantId = tenantId
  req.tenant = tenant
}
```

### Extensao do Prisma (Tenant Filter)

```typescript
// Prisma middleware que adiciona tenant_id automaticamente
prisma.$use(async (params, next) => {
  if (params.model && tenantContext.getCurrentTenantId()) {
    const tenantId = tenantContext.getCurrentTenantId()

    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, tenantId }
    }

    if (params.action === 'create') {
      params.args.data.tenantId = tenantId
    }

    if (params.action === 'update' || params.action === 'delete') {
      params.args.where = { ...params.args.where, tenantId }
    }
  }

  return next(params)
})
```

**WARNING:** Isso nao e 100% seguro. Use testes de seguranca para verificar isolamento.

### Alternativa mais segura: Row Level Security (RLS)

```sql
-- No PostgreSQL
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Antes de cada query, setar a variavel
SET app.current_tenant = 'uuid-do-tenant';
```

RLS garante isolamento no nivel do banco, mesmo se o app errar.

## 5. Identificacao do Tenant

### Opcao A: Subdomain

```
empresa1.dominio.com → tenant_id = empresa1
empresa2.dominio.com → tenant_id = empresa2
```

| Vantagem | Desvantagem |
|----------|-------------|
| Visivel para usuario | Requer DNS wildcard |
| SSL por subdomain | Config mais complexa |

### Opcao B: Header

```
X-Tenant-ID: uuid-do-tenant
```

| Vantagem | Desvantagem |
|----------|-------------|
| Simples | Frontend gerencia |
| Sem DNS | Menos visivel |

### Opcao C: JWT

```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "role": "admin"
}
```

| Vantagem | Desvantagem |
|----------|-------------|
| Seguro (assinado) | Trocar tenant = novo login |
| Nao spoofable | Menos flexivel |

**Recomendacao:** JWT para autenticacao + Header para troca de tenant (se usuario pertence a multiplos tenants).

## 6. Isolamento de Dados por Tipo

### Dados por Tenant (isolados)

| Tabela | Regra |
|--------|-------|
| users | So ve usuarios do mesmo tenant |
| agents | So ve agents do mesmo tenant |
| subscriptions | So ve assinaturas do mesmo tenant |
| transactions | So ve transacoes do mesmo tenant |
| agent_executions | So ve execucoes do mesmo tenant |
| provider_logs | So ve logs do mesmo tenant |

### Dados Globais (compartilhados)

| Tabela | Regra |
|--------|-------|
| providers | Admin only, todos tenants usam |
| feature_flags | Pode ser global ou por tenant |
| tenants | Super admin only |
| audit_logs | Admin pode ver cross-tenant |

## 7. API Keys por Tenant

```
Cada tenant pode ter suas proprias API keys
OU usar as API keys do sistema (mais comum no inicio)

Plano Enterprise: BYOK (Bring Your Own Key)
  → tenant configura propria API key
  → custos sao do tenant
  → sistema nao paga
```

### Modelo

```typescript
interface TenantConfig {
  use_system_api_keys: boolean  // true = sistema paga, false = tenant paga
  custom_api_keys?: {
    openrouter?: string  // criptografada
    openai?: string
  }
}
```

## 8. Limits por Tenant

```typescript
const TENANT_LIMITS = {
  free: {
    max_users: 1,
    max_agents: 1,
    max_tokens_per_month: 5000,
    max_members: 1,
  },
  pro: {
    max_users: 10,
    max_agents: 10,
    max_tokens_per_month: 500000,
    max_members: 5,
  },
  enterprise: {
    max_users: Infinity,
    max_agents: Infinity,
    max_tokens_per_month: Infinity,
    max_members: Infinity,
  },
}
```

### Verificacao de Limite

```typescript
async function checkTenantLimit(tenantId: string, resource: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  const limits = TENANT_LIMITS[tenant.plan]

  const currentCount = await prisma[resource].count({
    where: { tenantId, deletedAt: null },
  })

  return currentCount < limits[`max_${resource}`]
}
```

## 9. Onboarding de Novo Tenant

```
1. Admin cria tenant (nome, slug, plano)
2. Sistema cria:
   - Registro em tenants
   - Admin user do tenant (invited)
   - Subscription (plano escolhido)
   - Config padrao
3. Envia convite para admin do tenant
4. Admin do tenant faz login
5. Admin do tenant configura equipe
```

## 10. Checklist

- [ ] Tabela tenants no schema
- [ ] Campo tenant_id em todas as tabelas de dados
- [ ] Indice tenant_id em todas as tabelas
- [ ] Middleware de tenant (extrair + validar)
- [ ] Prisma extension para filtro automatico OU RLS
- [ ] JWT com tenant_id no payload
- [ ] API de CRUD de tenants (super admin)
- [ ] Verificacao de limites por tenant
- [ ] Onboarding de novo tenant
- [ ] Testes de isolamento (tenant A nao acessa dados do B)
- [ ] BYOK para enterprise (opcional)
- [ ] Config de tenant em Redis (cache)