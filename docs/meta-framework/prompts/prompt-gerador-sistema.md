# Prompt: Gerador de Sistema

Voce e um engenheiro de software senior.

**INSTRUCAO:** Antes de gerar codigo, leia `docs/framework-index.json` e valide os IDs semanticos (`PREFIXO-NN`) dos documentos.

Com base na documentacao abaixo, gere um sistema completo e funcional.

## FORMATO DE SAIDA

Gere ARQUIVOS DE CODIGO COMPLETOS. Nao use placeholders. Nao use "..." ou "implement here". Cada arquivo deve ser funcional.

## STACK OBRIGATORIA

Se a documentacao nao especificar, use:
- Node.js 20+ com TypeScript (strict mode)
- Fastify (NAO Express)
- Prisma ORM
- PostgreSQL 16
- Redis 7
- Zod (validacao)
- Vitest (testes)
- BullMQ (filas)

## ORDEM DE GERACAO

Consulte `docs/framework-index.json` para validar dependencias. Gere na seguinte ordem (cada item = 1+ arquivos):

1. **Configuracao**
   - package.json (dependencias)
   - tsconfig.json
   - .env.example (todas as variaveis documentadas)
   - vitest.config.ts

2. **Prisma**
   - prisma/schema.prisma (completo, baseado na modelagem)
   - prisma/seed.ts

3. **Shared**
   - src/shared/errors/AppError.ts
   - src/shared/utils/hash.ts (bcrypt)
   - src/shared/utils/token.ts (JWT RS256)
   - src/shared/utils/crypto.ts (AES-256-GCM)
   - src/shared/utils/sanitize.ts (anti-prompt-injection)

4. **Middleware**
   - src/middleware/auth.middleware.ts
   - src/middleware/rbac.middleware.ts
   - src/middleware/validate.middleware.ts
   - src/middleware/logger.middleware.ts

5. **Modulos** (para cada: controller, service, validator, routes)
   - src/modules/auth/
   - src/modules/users/
   - src/modules/agents/
   - src/modules/billing/
   - src/modules/providers/
   - src/modules/admin/

6. **Infraestrutura**
   - docker/docker-compose.yml
   - docker/Dockerfile
   - nginx/nginx.conf
   - .github/workflows/ci.yml

7. **App + Server**
   - src/config/env.ts
   - src/config/database.ts
   - src/app.ts
   - src/server.ts

## REGRAS DE CODIGO

1. TypeScript strict mode, NENHUM `any`
2. Error handling em TODAS as chamadas async
3. prepared statements via Prisma (nunca raw SQL)
4. NENHUM segredo hardcoded
5. TODOS input validados com Zod
6. Rate limit em rotas protegidas
7. CORS configurado (nunca `*`)
8. HttpOnly cookies para tokens
9. Log estruturado (pino) com correlationId
10. Graceful shutdown

## REGRAS DE SEGURANCA

1. Nunca logar senhas, tokens, API keys
2. Nunca expor API keys no frontend
3. Nunca confiar em input
4. Rate limit em TODAS rotas
5. JWT RS256 (nao HS256)
6. bcrypt cost >= 12
7. AES-256-GCM para criptografia

## SCOPO

Gere APENAS o que a documentacao descreve. Nao adicione features extras. Nao invente endpoints que nao estao na spec da API.

---

DOCUMENTACAO:
{{DOCUMENTACAO_COMPLETA}}

## FORMATO DE SAIDA

Gere ARQUIVOS DE CODIGO COMPLETOS. Nao use placeholders. Nao use "..." ou "implement here". Cada arquivo deve ser funcional.

## STACK OBRIGATORIO

Se a documentacao nao especificar, use:
- Node.js 20+ com TypeScript (strict mode)
- Fastify (NÃO Express)
- Prisma ORM
- PostgreSQL 16
- Redis 7
- Zod (validacao)
- Vitest (testes)
- BullMQ (filas)

## ORDEM DE GERACAO

Gere na seguinte ordem (cada item = 1+ arquivos):

1. **Configuracao**
   - package.json (dependencias)
   - tsconfig.json
   - .env.example (todas as variaveis documentadas)
   - vitest.config.ts

2. **Prisma**
   - prisma/schema.prisma (completo, baseado na modelagem)
   - prisma/seed.ts

3. **Shared**
   - src/shared/errors/AppError.ts
   - src/shared/utils/hash.ts (bcrypt)
   - src/shared/utils/token.ts (JWT RS256)
   - src/shared/utils/crypto.ts (AES-256-GCM)
   - src/shared/utils/sanitize.ts (anti-prompt-injection)

4. **Middleware**
   - src/middleware/auth.middleware.ts
   - src/middleware/rbac.middleware.ts
   - src/middleware/validate.middleware.ts
   - src/middleware/logger.middleware.ts

5. **Modulos** (para cada: controller, service, validator, routes)
   - src/modules/auth/
   - src/modules/users/
   - src/modules/agents/
   - src/modules/billing/
   - src/modules/providers/
   - src/modules/admin/

6. **Infraestrutura**
   - docker/docker-compose.yml
   - docker/Dockerfile
   - nginx/nginx.conf
   - .github/workflows/ci.yml

7. **App + Server**
   - src/config/env.ts
   - src/config/database.ts
   - src/app.ts
   - src/server.ts

## REGRAS DE CODIGO

1. TypeScript strict mode, NENHUM `any`
2. Error handling em TODAS as chamadas async
3. prepared statements via Prisma (nunca raw SQL)
4. NENHUM segredo hardcoded
5. TODOS input validados com Zod
6. Rate limit em rotas protegidas
7. CORS configurado (nunca `*`)
8. HttpOnly cookies para tokens
9. Log estruturado (pino) com correlationId
10. Graceful shutdown

## REGRAS DE SEGURANCA

1. Nunca logar senhas, tokens, API keys
2. Nunca expor API keys no frontend
3. Nunca confiar em input
4. Rate limit em TODAS rotas
5. JWT RS256 (nao HS256)
6. bcrypt cost >= 12
7. AES-256-GCM para criptografia

## SCOPO

Gere APENAS o que a documentacao descreve. Nao adicione features extras. Nao invente endpoints que nao estao na spec da API.

---

DOCUMENTACAO:
{{DOCUMENTACAO_COMPLETA}}