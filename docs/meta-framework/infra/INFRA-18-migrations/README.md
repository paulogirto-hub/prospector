# INFRA-18 - Migration Strategy

> **Prioridade:** ALTO
> **Depende de:** CORE-02
> **É dependência de:** 19
> **Categoria:** infra

## 1. Por Que Migration Strategy?

Sem estrategia:
```
Alterou schema no Prisma → npx prisma migrate dev → "algo quebrou"
Em producao: migrate DEU ERRO → DB inconsistente → downtime
```

Com estrategia:
```
Migrations versionadas, testadas, reversiveis
Deploy sem medo
Rollback possivel
Zero downtime (quando possivel)
```

## 2. Ferramenta: Prisma Migrate

### Fluxo de Desenvolvimento

```bash
# 1. Modificar schema.prisma
# 2. Criar migration
npx prisma migrate dev --name add_tenant_id

# 3. Prisma gera:
#    prisma/migrations/20260422100000_add_tenant_id/migration.sql
# 4. Aplica no DB de dev
# 5. Gera Prisma Client
npx prisma generate
```

### Fluxo de Producao

```bash
# 1. Deploy do codigo (com migration.sql incluido)
# 2. Aplicar migrations
npx prisma migrate deploy

# 3. Prisma SO executa migrations que ainda nao foram aplicadas
# 4. Tudo versionado na tabela _prisma_migrations
```

## 3. Estrutura de Pastas

```
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
    ├── 20260415100000_init/
    │   └── migration.sql
    ├── 20260416150000_add_feature_flags/
    │   └── migration.sql
    ├── 20260417100000_add_dead_letter_queue/
    │   └── migration.sql
    ├── 20260418120000_add_tenants/
    │   └── migration.sql
    └── migration_lock.toml
```

## 4. Regras de Migration

### Regra 1: NUNCA edite migration ja aplicada

```
ERRADO: alterar migration.sql que ja rodou em producao
CORRETO: criar nova migration que corrige o problema
```

### Regra 2: Migrations devem ser reversives (quando possivel)

| Operacao | Reversivel? | Como reverter |
|----------|------------|---------------|
| CREATE TABLE | SIM | DROP TABLE |
| ADD COLUMN | SIM | DROP COLUMN |
| DROP COLUMN | NAO (dados perdidos) | Backup antes |
| RENAME COLUMN | SIM (com cuidado) | RENAME de volta |
| ALTER TYPE | DIFICIL | Depende do caso |
| DROP TABLE | NAO | Backup antes |

### Regra 3: Migrations que removem dados = migration em 2 fases

```
Fase 1: Marcar campo como deprecated (nao usar mais)
Fase 2: (release seguinte) remover campo

Isso evita que codigo em producao quebre porque campo sumiu.
```

### Regra 4: Dados sensiveis = migration manual

```
Errado: migration automatica que altera dados de 1M de usuarios
Certo: migration em batches (1000 por vez) + monitoramento
```

## 5. Migration com Zero Downtime

### Problema
```
Deploy: novo codigo precisa de novo campo → migration adiciona campo
MAS: codigo antigo ainda rodando → nao conhece novo campo
```

### Solucao: Deploy em 2 fases

```
Fase 1:
  - Migration: ADD COLUMN (nullable, sem NOT NULL)
  - Deploy codigo que LE o novo campo (mas nao exige)
  - Funciona: campo nullable, codigo antigo ignora

Fase 2:
  - Deploy codigo que ESCREVE no novo campo
  - Migration: ADD NOT NULL CONSTRAINT (depois que todos os registros tem valor)
  - Funciona: campo ja tem dados, NOT NULL e seguro
```

### Exemplo: Adicionar tenant_id

**Migration 1 (Fase 1):**
```sql
-- Adicionar coluna nullable
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
-- NAO adiciona NOT NULL ainda
```

**Deploy 1:** Codigo que le tenant_id se existir (opcional)

**Migration 2 (Fase 2 - depois que dados estao populados):**
```sql
-- Agora todos os registros tem tenant_id (backfill completo)
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
```

**Deploy 2:** Codigo que exige tenant_id

## 6. Backfill de Dados

### Adicionar tenant_id em tabela com dados existentes

```sql
-- 1. Adicionar coluna nullable
ALTER TABLE users ADD COLUMN tenant_id UUID;

-- 2. Backfill em batches (evitar lock da tabela)
DO $$
DECLARE
  batch_offset INT := 0;
  batch_size INT := 1000;
  default_tenant UUID := 'uuid-do-tenant-default';
BEGIN
  LOOP
    UPDATE users
    SET tenant_id = default_tenant
    WHERE id IN (
      SELECT id FROM users WHERE tenant_id IS NULL
      LIMIT batch_size OFFSET batch_offset
    );

    batch_offset := batch_offset + batch_size;

    EXIT WHEN NOT FOUND;
    COMMIT;
  END LOOP;
END $$;

-- 3. Adicionar NOT NULL constraint
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
```

## 7. Seed Data

### prisma/seed.ts

```typescript
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/shared/utils/hash'
import { encrypt } from '../src/shared/utils/crypto'

const prisma = new PrismaClient()

async function main() {
  // Tenant default
  const tenant = await prisma.tenant.create({
    data: { name: 'Default Tenant', slug: 'default', plan: 'pro', status: 'active' },
  })

  // Admin user
  await prisma.user.create({
    data: {
      email: 'admin@dominio.com',
      passwordHash: await hashPassword('Admin123'),
      name: 'Admin',
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      tenantId: tenant.id,
    },
  })

  // Providers
  await prisma.provider.createMany({
    data: [
      {
        name: 'openrouter',
        apiKeyEncrypted: encrypt(process.env.OPENROUTER_API_KEY || 'dummy'),
        baseUrl: 'https://openrouter.ai/api/v1',
        costPer1kTokensInput: 0.0025,
        costPer1kTokensOutput: 0.01,
        rateLimit: 60,
        priority: 1,
      },
      {
        name: 'openai',
        apiKeyEncrypted: encrypt(process.env.OPENAI_API_KEY || 'dummy'),
        baseUrl: 'https://api.openai.com/v1',
        costPer1kTokensInput: 0.0025,
        costPer1kTokensOutput: 0.01,
        rateLimit: 60,
        priority: 2,
      },
    ],
  })

  // Feature flags
  await prisma.featureFlag.createMany({
    data: [
      { key: 'agent_streaming', description: 'SSE streaming for agent execution', enabled: false },
      { key: 'maintenance_mode', description: 'System maintenance mode', enabled: false },
      { key: 'new_dashboard', description: 'Dashboard v2', enabled: false, percentage: 0 },
    ],
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## 8. CI/CD para Migrations

```yaml
# .github/workflows/migrate.yml
name: Database Migration
on:
  push:
    branches: [main]
    paths: ['prisma/**']

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma generate

      # Validar schema
      - run: npx prisma validate
      - run: npx prisma format --check

      # Aplicar migrations em staging primeiro
      - name: Migrate staging
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      # Se staging OK, aplicar em producao
      - name: Migrate production
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 9. Rollback

Prisma NAO tem rollback automatico. Estrategias:

### Estrategia 1: Migration de Reversao

```sql
-- migration: 20260422100000_rollback_add_column
-- Reverte a migration anterior
ALTER TABLE users DROP COLUMN tenant_id;
```

### Estrategia 2: Backup antes de migrar

```bash
# Antes de cada migration em producao
pg_dump -Fc saas_db > backup_$(date +%Y%m%d%H%M).dump

# Se migration falhar
pg_restore -d saas_db backup_20260422100000.dump
```

### Estrategia 3: Blue-Green Deploy

```
1. DB-blue: versao atual
2. Criar DB-green: clone + apply migrations
3. Apontar app para DB-green
4. Se der erro → apontar de volta para DB-blue
5. Se OK → DB-green vira o novo DB-blue
```

## 10. Checklist de Migration

Antes de cada migration em producao:

- [ ] Testada em desenvolvimento
- [ ] Testada em staging (dados reais)
- [ ] Reversivel? (se nao: backup)
- [ ] Zero downtime? (2 fases se necessario)
- [ ] Backfill necessario? (batches)
- [ ] Nao destruir dados sem backup
- [ ] Indice criado sem lock (CREATE INDEX CONCURRENTLY)
- [ ] CI/CD configurado
- [ ] Rollback plan definido
- [ ] Timeout configurado (migrations longas)
- [ ] Seed data atualizado
- [ ] Prisma Client regerado

## 11. Comandos uteis

```bash
# Criar migration
npx prisma migrate dev --name descricao

# Aplicar em producao
npx prisma migrate deploy

# Status das migrations
npx prisma migrate status

# Resolver migration marcada como failed
npx prisma migrate resolve --rolled-back "migration_name"

# Reset DB (CUIDADO: perde dados)
npx prisma migrate reset

# Gerar client
npx prisma generate

# Validar schema
npx prisma validate

# Studio (visualizar DB)
npx prisma studio
```