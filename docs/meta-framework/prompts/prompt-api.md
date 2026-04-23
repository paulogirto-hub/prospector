# Prompt de API

**INSTRUCAO:** Antes de gerar a API, consulte `docs/framework-index.json` e valide os IDs semanticos (`PREFIXO-NN`).

Voce e um arquiteto de API senior.

Gere a especificacao completa da API baseada na documentacao abaixo.

## FORMATO DE SAIDA OBRIGATORIO

```markdown
# API Specification - {{NOME_DO_PRODUTO}}

## Base URL
`https://api.dominio.com/v1`

## Autenticacao
Todas rotas protegidas: `Authorization: Bearer <jwt_token>`

## Response Format
### Sucesso
```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 100 } }
```
### Erro
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": [] } }
```

## Rotas Publicas

### POST /auth/register
- **Descricao:** [o que faz]
- **Permissao:** nenhuma (publica)
- **Request:**
```json
{ "email": "user@example.com", "password": "Password123", "name": "Joao" }
```
- **Validacoes:**
  - email: valido, unico
  - password: min 8 chars, 1 maiuscula, 1 numero
- **Response 201:**
```json
{ "success": true, "data": { "id": "uuid", "email": "...", "status": "pending_email" } }
```
- **Erros:**
  - 400 VALIDATION_ERROR — campos invalidos
  - 409 EMAIL_EXISTS — email ja cadastrado

[Repetir para CADA rota]

## Rotas Protegidas

### GET /agents
- **Permissao:** run_agent
- **Query:** ?page=1&limit=20&status=active
- **Response 200:**
```json
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 5 } }
```

[Repetir para CADA rota protegida]

## Erros Especificos
| Codigo | HTTP | Quando |
|--------|------|--------|
| VALIDATION_ERROR | 400 | Input invalido |
| ... | ... | ... |
```

## VALIDACAO CRUZADA OBRIGATORIA

Antes de finalizar, verifique contra a modelagem de dados:

- [ ] Toda tabela principal tem ao menos 1 rota de listagem + 1 de criacao?
- [ ] Todo campo NOT NULL sem default tem validacao no payload de entrada?
- [ ] Toda FK exige que o recurso exista (404 se nao encontrado)?
- [ ] Todo campo UNIQUE retorna 409 se duplicado?
- [ ] Toda acao de RBAC tem middleware de permissao na rota?
- [ ] Toda regra de limite de uso e verificada antes da acao?

## REGRAS
- Separar claramente publicas vs protegidas
- Toda rota protegida: permissao definida
- Todo input: validacao Zod
- Todo erro: codigo especifico
- RESTful conventions (GET=list, POST=create, PUT=update, DELETE=delete)
- Paginacao em todas as rotas de listagem

---

BASE:
{{DATABASE + REGRAS_DE_NEGOCIO}}