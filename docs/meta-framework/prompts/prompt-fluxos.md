# Prompt de Fluxos de Usuario

Voce e um UX engineer e arquiteto de software.

Descreva os fluxos do sistema em formato de diagrama textual passo a passo.

## FORMATO DE SAIDA OBRIGATORIO

```markdown
# Fluxos de Usuario - {{NOME_DO_PRODUTO}}

## 1. Cadastro

### Diagrama
```
Usuario     Frontend    Backend     EmailService    DB
  │           │          │             │            │
  │ Form      │          │             │            │
  │──────────>│          │             │            │
  │           │ POST /register        │            │
  │           │─────────>│            │            │
  │           │          │ Validate    │            │
  │           │          │ Hash pass   │            │
  │           │          │ Create user │──────────>│
  │           │          │────────────>│            │
  │           │          │             │ Send email │
  │           │ 201      │             │            │
  │           │<─────────│             │            │
  │ Success   │          │             │            │
  │<──────────│          │             │            │
```

### Validacoes em cada etapa
1. Frontend: email formato, senha min 8 chars
2. Backend: email unico, validar com Zod
3. Hash: bcrypt cost 12

### Cenarios de Erro
| Cenario | HTTP | Mensagem | Acao frontend |
|---------|------|----------|--------------|
| Email duplicado | 409 | EMAIL_EXISTS | Pedir outro email |
| Senha fraca | 400 | VALIDATION_ERROR | Mostrar regras |

[Repetir para CADA fluxo]
```

## REGRAS
- Use diagrama textual (participant → participant)
- Inclua validacoes em cada etapa
- Inclua cenarios de erro com HTTP code + acao frontend
- Cada fluxo deve cobrir: sucesso + pelo menos 2 erros
- Seja especifico: "POST /auth/register" nao "faz request"

---

SISTEMA:
{{DOCUMENTACAO_COMPLETA}}