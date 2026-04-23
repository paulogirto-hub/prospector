# Prompt de Modelagem de Dados

**INSTRUCAO:** Antes de modelar, consulte `docs/framework-index.json` e valide os IDs semanticos (`PREFIXO-NN`).

Voce e um arquiteto de dados senior.

Com base nas regras de negocio abaixo, modele o banco de dados completo.

## FORMATO DE SAIDA OBRIGATORIO

```markdown
# Modelagem de Dados - {{NOME_DO_PRODUTO}}

## 1. Diagrama de Relacionamentos
[ASCII art ou mermaid mostrando entidades e cardinalidade]

## 2. Tabelas

### {{tabela_nome}}
| Campo | Tipo | Constraint | Descricao |
|-------|------|-----------|-----------|
| id | UUID | PK, DEFAULT gen_random_uuid() | ... |
| ... | ... | ... | ... |

**Indices:**
- `idx_{{tabela}}_campo` on campo (motivo: "busca frequente por X")

**Relacionamentos:**
- N:1 → users (um usuario tem N {{tabela}}s)

[Repetir para cada tabela]

## 3. Regras de Integridade
| Tabela | Regra | Implementacao |
|--------|-------|--------------|
| ... | "saldo nunca negativo" | CHECK (saldo >= 0) |
| ... | "email unico" | UNIQUE constraint |

## 4. JSONB vs Tabela Propria
| Dado | Decisao | Justificativa |
|------|---------|---------------|
| config | JSONB | schema flexivel, raramente consultado isoladamente |
| ... | Tabela propria | ... |

## 5. Particionamento
| Tabela | Crescimento estimado | Estrategia |
|--------|----------------------|-----------|
| provider_logs | ~1M/mes | Particionar por mes (created_at) |
```

## VALIDACAO CRUZADA OBRIGATORIA

Antes de finalizar, verifique:

- [ ] Toda permissao do RBAC (secao 2 da doc de regras) tem tabela que a suporta?
- [ ] Todo limite de uso (secao 3) tem campo na tabela correta?
- [ ] Todo estado (secao 5) tem campo status com os valores corretos?
- [ ] Todo fluxo (secao 6) pode ser executado com as tabelas propostas?
- [ ] Toda regra de monetizacao (secao 4) tem tabela(s) para suportar?
- [ ] Toda regra de excecao (secao 8) tem log/tabela para rastrear?

Se encontrar alguma regra de negocio que nao pode ser implementada com o modelo proposto, ADICIONE a tabela/campo necessario e documente a decisao.

## REGRAS
- UUID para todas as PKs
- Soft delete (deleted_at) em tabelas principais
- JSONB para dados flexiveis (config, metadata)
- Timestamps com timezone
- PostgreSQL
- Indice em todo campo usado em WHERE frequente
- Nenhum campo sensivel em texto puro

---

REGRAS DE NEGOCIO:
{{REGRAS_DE_NEGOCIO}}