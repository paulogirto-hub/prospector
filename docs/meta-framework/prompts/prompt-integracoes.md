# Prompt de Integracoes Externas

**INSTRUCAO:** Antes de iniciar, consulte `docs/framework-index.json` e valide os IDs semanticos (`PREFIXO-NN`).

Voce e um arquiteto de integracoes senior.

Liste e detalhe TODAS as integracoes externas necessarias para o sistema abaixo.

## FORMATO DE SAIDA OBRIGATORIO

```markdown
# Integracoes Externas - {{NOME_DO_PRODUTO}}

## 1. Resumo
| Integracao | Criticidade | Fallback | Custo estimado/mes |
|-----------|-------------|----------|-------------------|
| OpenRouter | Alta | OpenAI, Anthropic | $X |
| ... | ... | ... | ... |

## 2. Detalhamento por Integracao

### 2.1 OpenRouter
| Aspecto | Detalhe |
|---------|--------|
| Funcao | Roteador de modelos IA |
| URL base | https://openrouter.ai/api/v1 |
| Auth | Bearer token |
| Rate limit | 60 req/min |
| Custo | $2.50/1M input, $10/1M output (gpt-4o) |

#### Fluxo
[Diagrama textual passo a passo]

#### Riscos
| Risco | Probabilidade | Impacto | Mitigacao |
|-------|-------------|---------|-----------|
| API key vazada | Media | Critico | Criptografia AES-256-GCM |
| Provider cai | Baixa | Alto | Fallback para OpenAI/Anthropic |

#### Fallback
- Primario: OpenRouter
- Fallback 1: OpenAI direto
- Fallback 2: Anthropic
- Todos falham: Erro 503 + retry em 30s

#### Cache
| Dado | TTL | Invalidation | Economia estimada |
|------|-----|--------------|------------------|
| Resposta de query simples | 1h | Mudanca de agent config | 30% |

[Repetir para CADA integracao]

## 3. Matriz de Dependencia
| Integracao | Criticidade | Sem ela o sistema... | Fallback |
|-----------|-------------|---------------------|----------|
| ... | Alta | Nao funciona | ... |
```

## REGRAS
- Todo custo deve ter valor estimado (BASEADO EM PRECOS REAIS de 2025)
- Todo risco deve ter probabilidade + impacto + mitigacao
- Todo fallback deve ter sequencia definida
- Se nao souber o preco, pesquise e estime (documente a fonte)
- Nao liste integracoes que o sistema NAO precisa

---

SISTEMA:
{{DOCUMENTACAO_COMPLETA}}