# BIZ-55 - Psicologia de Preços

> **Prioridade:** MEDIO
> **Depende de:** BIZ-39, BIZ-51
> **É dependência de:** BIZ-56
> **Categoria:** business

## 1. Estratégias de Precificação

### 1.1 Modelos Suportados
| Modelo | Quando Usar | Exemplo |
|--------|-------------|---------|
| Cost-plus | Commodities | Custo + 30% |
| Value-based | Diferenciado | Valor percebido |
| Competitive | Mercado maduro | Preço do concorrente - 10% |
| Freemium | Aquisição em escala | Grátis → Pro → Enterprise |

### 1.2 Anchor Pricing
- Plano "Enterprise" como âncora (mais caro)
- Plano "Pro" como escolha "inteligente"
- Plano "Free" como porta de entrada

### 1.3 Decoy Pricing
```
Basic    : R$ 29/mes (pouco valor)
Pro      : R$ 49/mes (melhor custo-beneficio) ← Target
Business : R$ 99/mes (decoy, similar ao Pro)
```

## 2. Gatilhos Psicológicos

### 2.1 Perda Aversão
- "Seu desconto de 20% expira em 24h"
- "Você está perdendo X créditos"

### 2.2 Social Proof
- "+1.200 empresas confiam"
- "Planos mais escolhidos" badge no Pro

### 2.3 Mental Accounting
- Preços em parcelas: "R$ 49,90/mes" vs "R$ 598/ano"
- Desconto anual como "2 meses grátis"

## 3. Testes A/B de Preço

### 3.1 Hipóteses
| Hipótese | Variante A | Variante B | Métrica |
|----------|-----------|-----------|---------|
| Preço termina em 9 | R$ 49 | R$ 50 | Conversão |
| Âncora próxima | R$ 99 | R$ 199 | MRR |
| Free trial | 7 dias | 14 dias | Activation |

### 3.2 Regras
- Nunca mostrar preço diferente para o mesmo usuário
- A/B test deve ter tamanho amostral calculado
- Preço nunca menor que CAC + margem mínima

## 4. Checklist

- [ ] Modelo de precificação escolhido e justificado
- [ ] Estrutura de 3 planos com âncora
- [ ] Gatilhos psicológicos mapeados
- [ ] A/B test de preço planejado
- [ ] Margem > 70% no plano Pro
- [ ] Política de desconto documentada

## 5. AI-First Notes

> A IA que gera landing pages deve respeitar a estrutura de âncora e nunca criar preços fora da estratégia definida aqui.
