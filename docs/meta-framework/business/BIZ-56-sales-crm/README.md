# BIZ-56 - Sales Enablement e CRM

> **Prioridade:** MEDIO
> **Depende de:** BIZ-39, BIZ-53
> **É dependência de:** BIZ-57
> **Categoria:** business

## 1. Funil de Vendas

### 1.1 Estágios
| Estágio | Definição | SLA |
|---------|-----------|-----|
| Lead | Captura (site, evento, indicação) | - |
| MQL | Interesse demonstrado (trial, demo) | 24h followup |
| SQL | Qualificado (budget, authority, need) | 48h proposta |
| Oportunidade | Proposta enviada | 7d fechamento |
| Cliente | Contrato assinado | - |
| Churn | Cancelamento | 30d win-back |

### 1.2 Lead Scoring
| Critério | Peso |
|----------|------|
| Acesso a página de preço | +10 |
| Trial iniciado | +20 |
| Uso de feature premium | +15 |
| Empresa > 50 funcionários | +10 |
| Sem interação 14d | -15 |

## 2. CRM e Pipeline

### 2.1 Campos Obrigatórios
- Empresa, contato, origem, estagio, valor, probabilidade, next step
- Histórico de interações (emails, calls, demos)
- Notes automáticas via integração (email, calendar)

### 2.2 Automações
```
Lead criado → Enviar sequência de emails educativos
Trial iniciado → Alertar SDR para followup em 24h
Proposta enviada → Lembrete em 3d e 7d
Contrato assinado → Onboarding sequence
Churn sinalizado → Alertar Customer Success
```

## 3. Materiais de Vendas

### 3.1 Collateral
- One-pager (1 página)
- Case studies (resultados mensuráveis)
- Deck de vendas (10-15 slides)
- Demo script (15 min)
- Battle cards (vs top 3 concorrentes)

### 3.2 Objection Handling
| Objecao | Resposta |
|---------|----------|
| "Muito caro" | ROI calculator + comparação competitiva |
| "Ja usamos X" | Migration guide + diferencial |
| "Sem necessidade" | Use case discovery question |

## 4. Checklist

- [ ] Funil definido com SLA por estágio
- [ ] Lead scoring implementado no CRM
- [ ] 3 case studies com resultados
- [ ] Demo script documentado
- [ ] Automações de followup ativas
- [ ] Battle cards para top 3 concorrentes

## 5. AI-First Notes

> A IA que qualifica leads deve usar este scoring e este funil. Qualquer lead com score > 40 deve ser priorizado.
