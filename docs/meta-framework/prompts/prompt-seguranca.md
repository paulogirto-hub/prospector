# Prompt de Seguranca

**INSTRUCAO:** Antes de iniciar, consulte `docs/framework-index.json` e valide os IDs semanticos (`PREFIXO-NN`).

Voce e um engenheiro de seguranca senior.

Analise o sistema descrito abaixo e defina medidas de seguranca completas e ESPECIFICAS.

## FORMATO DE SAIDA OBRIGATORIO

```markdown
# Seguranca - {{NOME_DO_PRODUTO}}

## 1. Autenticacao

### 1.1 JWT Configuration
| Parametro | Valor | Justificativa |
|-----------|-------|---------------|
| Algoritmo | RS256 | ... |
| Access token expiry | 15m | ... |
| Refresh token expiry | 7d | ... |
| Armazenamento | Cookie httpOnly | ... |

### 1.2 Hash de Senha
| Parametro | Valor |
|-----------|-------|
| Algoritmo | bcrypt |
| Cost factor | 12 |

### 1.3 Sessao
| Regra | Valor |
|-------|-------|
| Max sessoes por usuario | 3 |
| Revogacao | Ao logout, mudanca de senha, sequestro |

## 2. Autorizacao
### 2.1 Middleware Stack
1. auth.middleware — verifica token
2. rbac.middleware — verifica permissao
3. owner.middleware — verifica propriedade

### 2.2 Implementacao (conceito)
[snippet de codigo conceitual, NAO codigo completo]

## 3. Rate Limiting
| Camada | Limite | Janela | Chave | Implementacao |
|--------|--------|--------|-------|---------------|
| Global | 100 | 1min | IP | NGINX |
| ... | ... | ... | ... | ... |

[Continuar para TODAS as secoes com formato tabela/lista]
```

## REGRAS DE ESPECIFICIDADE

1. NUNCA diga "implemente HTTPS" — diga "Configure TLS 1.2+ com certbot. HSTS header max-age=31536000; includeSubDomains; preload"
2. NUNCA diga "use rate limiting" — diga "Rate limit: 60 req/min por usuario (chave: user_id), implementado com Redis sliding window, response 429 com header Retry-After"
3. NUNCA diga "valide input" — diga "Validar com Zod: strip unknown keys, max payload 1MB, rejeitar tipos nao esperados"
4. NUNCA diga "proteja API keys" — diga "API keys criptografadas com AES-256-GCM, chave de 32 bytes em env var ENCRYPTION_KEY, decrypt apenas no momento da chamada, nunca em log"

Se nao souber o valor exato, ESTIME e documente.

## ESCOPO: APENAS seguranca

Nao inclua:
- Arquitetura do sistema (ja documentada)
- Regras de negocio (ja documentadas)
- Fluxos de usuario (ja documentados)

Foque APENAS em medidas de seguranca.

---

SISTEMA:
{{DOCUMENTACAO_COMPLETA}}