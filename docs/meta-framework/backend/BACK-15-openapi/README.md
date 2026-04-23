# BACK-15 - OpenAPI / Swagger Spec

> **Prioridade:** MEDIO
> **Depende de:** BACK-04
> **É dependência de:** 24
> **Categoria:** backend

## 1. Por Que OpenAPI?

Sem spec formal:
- Frontend consulta codigo para saber o schema
- Integracao com terceiros = documentacao na mao
- SDKs gerados manualmente
- Contrato entre times = confianca no codigo

Com OpenAPI:
- Contrato formal da API (single source of truth)
- SDKs gerados automaticamente
- Documentacao interativa (Swagger UI)
- Validacao de request/response automatica
- Testes de contrato

## 2. Versao e Formato

- **OpenAPI:** 3.1.0
- **Formato:** YAML (legivel) + JSON (processavel)
- **Server:** `https://api.dominio.com/v1`

## 3. Estrutura do Documento

```yaml
openapi: "3.1.0"
info:
  title: SaaS Platform API
  description: API para plataforma SaaS com agentes IA
  version: "1.0.0"
  contact:
    email: dev@dominio.com
  license:
    name: Proprietary

servers:
  - url: https://api.dominio.com/v1
    description: Production
  - url: http://localhost:3000/v1
    description: Development

tags:
  - name: Auth
    description: Autenticacao e autorizacao
  - name: Users
    description: Gestao de usuarios
  - name: Agents
    description: Agentes IA
  - name: Billing
    description: Pagamentos e assinaturas
  - name: Admin
    description: Administracao do sistema

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # --- Schemas reutilizaveis ---

    SuccessResponse:
      type: object
      required: [success, data]
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
        meta:
          $ref: '#/components/schemas/PaginationMeta'

    ErrorResponse:
      type: object
      required: [success, error]
      properties:
        success:
          type: boolean
          example: false
        error:
          $ref: '#/components/schemas/ErrorDetail'

    ErrorDetail:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          example: VALIDATION_ERROR
        message:
          type: string
          example: Invalid input
        details:
          type: array
          items:
            $ref: '#/components/schemas/FieldError'

    FieldError:
      type: object
      required: [field, message]
      properties:
        field:
          type: string
          example: email
        message:
          type: string
          example: Invalid email format

    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 20
        total:
          type: integer
          example: 100

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [admin, manager, user, api_client]
        status:
          type: string
          enum: [pending_email, active, suspended, deleted]

    Agent:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        model:
          type: string
        provider:
          type: string
        status:
          type: string
          enum: [draft, active, paused, archived]
        created_at:
          type: string
          format: date-time

    Subscription:
      type: object
      properties:
        plan:
          type: string
          enum: [free, pro, enterprise]
        status:
          type: string
          enum: [active, past_due, canceled]
        tokens_used:
          type: integer
          format: int64
        tokens_limit:
          type: integer
          format: int64

    Transaction:
      type: object
      properties:
        id:
          type: string
          format: uuid
        amount:
          type: number
          example: 49.90
        currency:
          type: string
          example: BRL
        status:
          type: string
          enum: [pending, approved, rejected, refunded, chargeback]
        payment_method:
          type: string
          enum: [pix, credit_card, boleto]
        created_at:
          type: string
          format: date-time

    ExecutionResult:
      type: object
      properties:
        execution_id:
          type: string
          format: uuid
        status:
          type: string
          enum: [completed, failed]
        output:
          type: string
        tokens_used:
          type: integer
        cost:
          type: number

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1
    LimitParam:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
    AgentIdParam:
      name: id
      in: path
      required: true
      schema:
        type: string
        format: uuid
    UserIdParam:
      name: id
      in: path
      required: true
      schema:
        type: string
        format: uuid
```

## 4. Rotas (Exemplos Completos)

### Auth - Registro

```yaml
paths:
  /auth/register:
    post:
      tags: [Auth]
      summary: Registrar novo usuario
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  minLength: 8
                  description: Min 8 chars, 1 maiuscula, 1 numero
                  example: MyPassword1
                name:
                  type: string
                  minLength: 2
                  maxLength: 100
                  example: Joao Silva
      responses:
        '201':
          description: Usuario criado
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          id: { type: string, format: uuid }
                          email: { type: string, format: email }
                          name: { type: string }
                          status: { type: string, example: pending_email }
        '400':
          description: Validacao falhou
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Email ja existe
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ErrorResponse'
                  - type: object
                    properties:
                      error:
                        type: object
                        properties:
                          code: { type: string, example: EMAIL_EXISTS }
```

### Auth - Login

```yaml
  /auth/login:
    post:
      tags: [Auth]
      summary: Login
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string }
      responses:
        '200':
          description: Login com sucesso
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          access_token: { type: string }
                          refresh_token: { type: string }
                          expires_in: { type: integer, example: 900 }
                          user: { $ref: '#/components/schemas/User' }
        '401':
          description: Credenciais invalidas
        '429':
          description: Rate limit (muitas tentativas)
```

### Agent - Execucao

```yaml
  /agents/{id}/run:
    post:
      tags: [Agents]
      summary: Executar agent
      security: [{ BearerAuth: [] }]
      parameters:
        - $ref: '#/components/schemas/../../../../parameters/AgentIdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [input]
              properties:
                input:
                  type: string
                  maxLength: 4000
                config_override:
                  type: object
                  properties:
                    temperature:
                      type: number
                      minimum: 0
                      maximum: 2
      responses:
        '200':
          description: Execucao concluida
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessResponse'
                  - type: object
                    properties:
                      data:
                        $ref: '#/components/schemas/ExecutionResult'
        '401': { description: Nao autenticado }
        '403': { description: Sem permissao (run_agent) }
        '422':
          description: Regra de negocio violada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                agent_not_active:
                  value:
                    success: false
                    error:
                      code: AGENT_NOT_ACTIVE
                      message: Agent is not active
                credits_insufficient:
                  value:
                    success: false
                    error:
                      code: CREDITS_INSUFFICIENT
                      message: Insufficient tokens
        '503':
          description: Provider indisponivel
```

### Agent - Execucao (Streaming)

```yaml
  /agents/{id}/run:
    post:
      x-stream: true
      summary: Executar agent (streaming)
      parameters:
        - $ref: '#/components/schemas/../../../../parameters/AgentIdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [input]
              properties:
                input: { type: string }
      responses:
        '200':
          description: SSE stream
          content:
            text/event-stream:
              schema:
                type: string
                description: |
                  Eventos SSE:
                  - event: token    data: {"content":"word"}
                  - event: usage    data: {"tokens":150,"cost":0.003}
                  - event: error    data: {"code":"...","message":"..."}
                  - event: done     data: {"execution_id":"uuid"}
```

## 5. Integracao com Fastify

### @fastify/swagger + @fastify/swagger-ui

```typescript
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

await app.register(swagger, {
  openapi: {
    openapi: '3.1.0',
    info: { title: 'SaaS API', version: '1.0.0' },
    servers: [
      { url: 'https://api.dominio.com/v1', description: 'Production' },
      { url: 'http://localhost:3000/v1', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ BearerAuth: [] }],
  },
})

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list', deepLinking: true },
  staticCSP: true,
})
```

### Rotas com Schema Inline

```typescript
app.post('/register', {
  schema: {
    tags: ['Auth'],
    summary: 'Registrar novo usuario',
    security: [],
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        name: { type: 'string', minLength: 2 },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
      409: { $ref: 'ErrorResponse#' },
    },
  },
}, async (req, reply) => { ... })
```

## 6. Geracao de SDK

A partir da spec OpenAPI, gerar SDKs automaticamente:

```bash
# TypeScript client
npx openapi-typescript https://api.dominio.com/v1/openapi.json -o src/client/types.ts

# React hooks
npx openapi-fetch https://api.dominio.com/v1/openapi.json -o src/client/sdk.ts
```

## 7. Testes de Contrato

Validar que a API real corresponde a spec:

```typescript
import { matchers } from 'openapi-mock-validator'

describe('API Contract', () => {
  it('POST /auth/register matches spec', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: validPayload,
    })
    expect(response.statusCode).toBe(201)
    await matchers.validateResponse(spec, '/auth/register', 'post', 201, response.json())
  })
})
```

## 8. Checklist

- [ ] OpenAPI spec 3.1.0 completa
- [ ] Todos os schemas reutilizaveis em components
- [ ] Todas as rotas documentadas com request/response
- [ ] Exemplos em cada schema/response
- [ ] Error responses documentados (400, 401, 403, 404, 409, 422, 429, 500, 503)
- [ ] @fastify/swagger + @fastify/swagger-ui configurados
- [ ] Schema inline em cada rota do Fastify
- [ ] Swagger UI acessivel em /docs
- [ ] Validacao de response automatica (Fastify)
- [ ] Spec servida em /openapi.json
- [ ] SDK gerado a partir da spec (optional)
- [ ] Testes de contrato (optional)