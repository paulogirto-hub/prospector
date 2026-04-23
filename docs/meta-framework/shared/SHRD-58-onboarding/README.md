# SHRD-58 - Developer Onboarding

> **Prioridade:** ALTO
> **Depende de:** CORE-03, SHRD-33, INFRA-19
> **É dependência de:** (nenhum)
> **Categoria:** shared

## 1. Quick Start (rodar em 5 min)

```bash
# 1. Clone
git clone https://github.com/org/project-saas.git
cd project-saas

# 2. Copiar env
cp .env.example .env
# Editar .env com suas chaves (ver secao 2)

# 3. Docker up
docker compose -f docker/docker-compose.yml up -d

# 4. Migracoes + seed
npx prisma migrate dev
npx prisma db seed

# 5. Rodar
npm run dev

# 6. Verificar
curl http://localhost:3000/health
# → { "status": "ok" }

# 7. Frontend (outra tab)
cd frontend && npm i && npm run dev
# → http://localhost:3001
```

## 2. Environment (.env)

### Obrigatorio para rodar

| Variavel | De onde obter | Exemplo |
|----------|-------------|---------|
| DATABASE_URL | Docker (ja configurado) | `postgresql://saas:saas_password@localhost:5432/saas_db` |
| REDIS_URL | Docker | `redis://localhost:6379` |
| JWT_PRIVATE_KEY | Gerar (ver abaixo) | `-----BEGIN RSA PRIVATE KEY-----...` |
| JWT_PUBLIC_KEY | Gerar (ver abaixo) | `-----BEGIN PUBLIC KEY-----...` |
| ENCRYPTION_KEY | `openssl rand -hex 16` | `a1b2c3d4e5f6...` |

### Gerar chaves JWT

```bash
# Gerar par de chaves RS256
ssh-keygen -t rsa -b 4096 -f jwt-private.pem
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Copiar para .env (multiline)
# JWT_PRIVATE_KEY=$(cat jwt-private.pem)
# JWT_PUBLIC_KEY=$(cat jwt-public.pem)
```

### Opcional (sem elas, features desativam)

| Variavel | Para que | Sem ela |
|----------|---------|--------|
| OPENROUTER_API_KEY | Agents IA | Agents nao funcionam |
| MERCADOPAGO_ACCESS_TOKEN | Pagamentos | Pagamentos nao funcionam |
| RESEND_API_KEY | Emails | Emails nao sao enviados |
| SENTRY_DSN | Error tracking | Erros nao reportados |

## 3. Estrutura do Projeto

```
project-saas/
├── docs/                  ← Documentacao (COMECE PELO MASTER.md)
├── src/                   ← Backend (Fastify + TypeScript)
│   ├── config/            → Env, DB, Redis
│   ├── modules/           → Modulos de dominio
│   │   ├── auth/          → Login, registro, JWT
│   │   ├── users/         → Perfil, LGPD
│   │   ├── agents/        → CRUD + execucao de agents
│   │   ├── billing/       → Assinaturas, webhooks
│   │   ├── providers/     → Provider gateway IA
│   │   └── admin/         → Painel admin
│   ├── middleware/        → Auth, RBAC, rate limit, validation
│   ├── shared/            → Erros, utils (hash, token, crypto, sanitize)
│   └── queues/            → BullMQ workers
├── frontend/              ← Next.js 14 + Tailwind + shadcn/ui
├── prisma/                ← Schema + migracoes + seed
├── docker/                ← Docker + compose + Dockerfile
├── nginx/                 ← Reverse proxy config
├── tests/                 ← Testes (unit, integration, e2e)
└── scripts/               ← Backup, deploy helpers
```

## 4. Comandos Essenciais

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Roda backend em modo dev (hot reload) |
| `npm run build` | Compila TypeScript |
| `npm start` | Roda em producao |
| `npm test` | Roda testes unitarios |
| `npm run test:watch` | Testes em watch mode |
| `npm run test:integration` | Testes de integracao |
| `npm run test:e2e` | Testes end-to-end |
| `npm run lint` | Lint com ESLint |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npx prisma studio` | Visualiza DB no browser |
| `npx prisma migrate dev` | Cria migration nova |
| `npx prisma migrate deploy` | Aplica migrations (prod) |
| `npx prisma db seed` | Popula DB com dados iniciais |
| `docker compose up -d` | Sobe todos os servicos |
| `docker compose logs -f api` | Ver logs do backend |
| `docker compose restart api` | Reiniciar API |

## 5. Fluxo de Trabalho

### Git Flow

```
main        ← producao (deploy automatico)
  │
  ├── develop ← integracao
  │     │
  │     ├── feature/auth-jwt
  │     ├── feature/agent-streaming
  │     └── fix/payment-webhook
  │
  └── hotfix/critical-bug
```

### Criando uma feature

```bash
# 1. Criar branch
git checkout develop
git checkout -b feature/minha-feature

# 2. Desenvolver
npm run dev    # backend
# + frontend em outra tab

# 3. Testar
npm test
npm run typecheck
npm run lint

# 4. Commit
git add .
git commit -m "feat: description"

# 5. Push + PR
git push -u origin feature/minha-feature
# Criar PR via GitHub
```

### Convencao de Commits

| Prefixo | Uso |
|---------|-----|
| `feat:` | Nova feature |
| `fix:` | Bug fix |
| `docs:` | Documentacao |
| `refactor:` | Refatoracao |
| `test:` | Testes |
| `chore:` | Infra, deps, config |
| `perf:` | Performance |

## 6. Onde Ficar (Canais)

| Onde | O que tem |
|------|----------|
| `docs/MASTER.md` | Visao geral + ordem de leitura |
| `docs/shared/33-adrs/` | Decisoes arquiteturais |
| `docs/shared/36-glossario/` | Termos do sistema |
| `docs/prompts/` | Prompts de geracao |
| GitHub Issues | Bugs + features |
| Slack #dev | Duvidas do dia a dia |

## 7. Debugging

### Backend nao sobe?

```bash
# 1. Verificar se Docker esta rodando
docker compose ps

# 2. Verificar se DB esta acessivel
docker exec saas-postgres pg_isready

# 3. Verificar se Redis esta acessivel
docker exec saas-redis redis-cli ping

# 4. Ver logs
docker compose logs api --tail 50

# 5. Verificar .env
# Todas as variaveis obrigatorias estao preenchidas?
```

### Testes falhando?

```bash
# Rodar 1 teste especifico
npx vitest run tests/unit/shared/hash.test.ts

# Ver coverage
npm run test:coverage

# Limpar cache
npx vitest --clearCache
```

### Prisma problemas?

```bash
# Regenerar client
npx prisma generate

# Verificar schema
npx prisma validate

# Reset DB (CUIDADO: perde dados)
npx prisma migrate reset

# Ver DB
npx prisma studio
```

## 8. Antes de Fazer PR

- [ ] `npm run typecheck` sem erros
- [ ] `npm run lint` sem erros
- [ ] `npm test` passando
- [ ] Documentacao atualizada (se necessario)
- [ ] ADR criado (se decisao arquitetural)
- [ ] Changelog atualizado (se feature/fix relevante)

## 9. IDE Setup

### VS Code (recomendado)

Extensions:
- ESLint
- Prisma
- Tailwind CSS IntelliSense
- Error Lens
- GitLens

Settings:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Debug configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "src/server.ts"],
      "env": { "NODE_ENV": "development" },
      "console": "integratedTerminal"
    }
  ]
}
```