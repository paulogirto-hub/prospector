# 📡 Prospector API — Documentação Completa

> Referência detalhada de todos os endpoints da API Prospector v2.0

**Base URL**: `http://localhost:8088/api`

---

## Sumário

- [Formato de Resposta](#formato-de-resposta)
- [Erros](#erros)
- [Health Check](#health-check)
- [Search — Criar](#search--criar)
- [Search — Consultar](#search--consultar)
- [Search — Deletar](#search--deletar)
- [Search — Rediscovery](#search--rediscovery)
- [Search — Enriquecer](#search--enriquecer)
- [Search — Scoring](#search--scoring)
- [Search — Análise de Mercado](#search--análise-de-mercado)
- [Search — Análise de Leads](#search--análise-de-leads)
- [Search — Pipeline Completa](#search--pipeline-completa)
- [Histórico](#histórico)
- [Lead — Consultar](#lead--consultar)
- [Lead — Atualizar](#lead--atualizar)
- [Lead — Deletar](#lead--deletar)
- [Lead — Editar Análise](#lead--editar-análise)
- [Lead — Reanalisar](#lead--reanalisar)
- [Lead — Diagnosticar](#lead--diagnosticar)
- [Rate Limiting](#rate-limiting)
- [Circuit Breaker](#circuit-breaker)

---

## Formato de Resposta

Todas as respostas seguem o formato:

### Sucesso

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // opcional
}
```

### Erro

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição legível do erro",
    "details": [ ... ]  // opcional
  }
}
```

---

## Erros

| HTTP | Code | Descrição |
|------|------|-----------|
| 400 | `VALIDATION_ERROR` | Input inválido ou campos obrigatórios faltando |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 429 | `RATE_LIMIT_EXCEEDED` | Limite de requisições excedido |
| 500 | `INTERNAL_ERROR` | Erro interno inesperado |
| 503 | `PROVIDER_UNAVAILABLE` | Provedor de IA temporariamente indisponível |

---

## Health Check

### `GET /api/health`

Retorna o status do sistema, modelo de IA configurado e estado do circuit breaker.

**Response**:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "model": "glm-5.1",
    "circuit_breaker": "closed",
    "version": "2.0.0",
    "pipeline": [
      "discovery", "enriching", "enriched",
      "scoring", "scored",
      "market_analyzed", "analyzing_leads", "analyzed"
    ]
  }
}
```

**Estados do circuit breaker**:
- `closed` — Funcionando normalmente
- `open` — Bloqueado (muitas falhas)
- `half-open` — Testando recuperação

---

## Search — Criar

### `POST /api/search`

Cria uma nova busca e inicia o pipeline de discovery em background.

**Body**:

```json
{
  "niche": "restaurante",
  "city": "Curitiba",
  "state": "PR",
  "max_results": 30
}
```

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `niche` | string | ✅ | — | Nicho de mercado (2-200 chars) |
| `city` | string | ✅ | — | Cidade (2-200 chars) |
| `state` | string | ❌ | `PR` | Estado (sigla, 2 chars) |
| `max_results` | int | ❌ | `50` | Máximo de resultados (1-200) |

**Response** (201):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "discovery",
    "niche": "restaurante",
    "city": "Curitiba",
    "state": "PR",
    "max_results": 30
  }
}
```

> ⚡ O discovery roda em background. Use `GET /api/search/{id}` para acompanhar.

**Rate limit**: 10 requisições/minuto por IP.

---

## Search — Consultar

### `GET /api/search/{search_id}`

Retorna os dados completos de uma busca, incluindo todos os leads e suas análises.

**Response**:

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "analyzed",
    "niche": "restaurante",
    "city": "Curitiba",
    "state": "PR",
    "created_at": "2026-04-22T15:30:00",
    "summary": {
      "total_leads": 25,
      "avg_score": 62,
      "status": "analyzed",
      ...
    },
    "leads": [
      {
        "id": "lead_1",
        "title": "Restaurante XYZ",
        "snippet": "Restaurante italiano...",
        "site_url": "https://restaurante.com.br",
        "instagram_url": "https://instagram.com/restaurante",
        "maps_phone": "(41) 99999-0000",
        "maps_rating": 4.5,
        "maps_reviews": 234,
        "cnpj": "12345678000190",
        "razao_social": "RESTAURANTE XYZ LTDA",
        "situacao": "ATIVA",
        "capital_social": 50000.00,
        "porte": "MICRO EMPRESA",
        "cnae_descricao": "Restaurantes e similares",
        "tem_site": true,
        "tem_instagram": true,
        "tem_facebook": false,
        "tem_maps": true,
        "tem_ads": false,
        "score": 72,
        "ia_analise": "Empresa com boa presença digital..."
      }
    ],
    "market_analysis": "O mercado de restaurantes em Curitiba..."
  }
}
```

**Status possíveis**:

| Status | Significado |
|--------|------------|
| `discovery` | Busca em andamento |
| `discovered` | Busca concluída, aguardando enrichment |
| `enriching` | Enriquecimento em andamento |
| `enriched` | Enriquecimento concluído |
| `scoring` | Scoring em andamento |
| `scored` | Scoring concluído |
| `market_analyzed` | Análise de mercado concluída |
| `analyzing_leads` | Análise individual em andamento |
| `analyzed` | Pipeline completa |
| `error` | Erro durante processamento |

---

## Search — Deletar

### `DELETE /api/search/{search_id}`

Remove uma busca e todos os seus dados.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Search 'abc123-def456' deleted"
  }
}
```

---

## Search — Rediscovery

### `POST /api/search/{search_id}/rediscover`

Re-executa o discovery para uma busca existente, mantendo os leads já enriquecidos e fazendo merge dos novos resultados.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "discovery",
    "message": "Rediscovery started"
  }
}
```

---

## Search — Enriquecer

### `POST /api/search/{search_id}/enrich`

Executa o enrichment para todos os leads de uma busca: scraping de site, busca de Instagram, Google Maps e BrasilAPI (CNPJ).

**Response** (200):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "enriching",
    "message": "Enrichment started for 25 leads"
  }
}
```

> ⚡ Executa em background. Pode levar vários minutos dependendo do número de leads.

---

## Search — Scoring

### `POST /api/search/{search_id}/score`

Calcula o score (0-100) de cada lead baseado em presença digital.

**Score breakdown**:

| Critério | Pontos |
|----------|--------|
| Tem site | 15 |
| Site tem email | 10 |
| Site tem telefone | 5 |
| Tem Instagram | 10 |
| Tem Facebook | 5 |
| Tem Google Maps | 10 |
| Maps rating ≥ 4.0 | 5 |
| Maps reviews ≥ 50 | 5 |
| Tem CNPJ | 15 |
| Situação ATIVA | 5 |
| Capital social > 0 | 5 |
| Tem Google Ads | 10 |
| **Total máximo** | **100** |

**Response** (200):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "scoring",
    "message": "Scoring started"
  }
}
```

---

## Search — Análise de Mercado

### `POST /api/search/{search_id}/analyze-market`

Gera análise macro do mercado/nicho usando IA. Inclui:
- Visão geral do segmento
- Oportunidades identificadas
- Nível de competitividade
- Recomendações estratégicas

**Response** (200):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "analyzing_market",
    "message": "Market analysis started"
  }
}
```

---

## Search — Análise de Leads

### `POST /api/search/{search_id}/analyze-leads`

Gera diagnóstico individual para cada lead usando IA. Inclui:
- Perfil do lead
- Pontos fortes e fracos
- Potencial como cliente
- Recomendações de abordagem

**Response** (200):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "analyzing_leads",
    "message": "Lead analysis started for 25 leads"
  }
}
```

---

## Search — Pipeline Completa

### `POST /api/search/{search_id}/analyze`

Executa a pipeline completa em sequência: enrich → score → analyze-market → analyze-leads.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "enriching",
    "message": "Full pipeline started"
  }
}
```

> 💡 Use esta rota para processar uma busca do descoberta ao diagnóstico final em um único comando.

---

## Histórico

### `GET /api/history`

Retorna lista de todas as buscas realizadas (apenas resumo).

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "search_id": "abc123",
      "niche": "restaurante",
      "city": "Curitiba",
      "state": "PR",
      "total_leads": 25,
      "avg_score": 62,
      "status": "analyzed",
      "created_at": "2026-04-22T15:30:00"
    },
    {
      "search_id": "def456",
      "niche": "dentista",
      "city": "São Paulo",
      "state": "SP",
      "total_leads": 40,
      "avg_score": 55,
      "status": "scored",
      "created_at": "2026-04-21T10:00:00"
    }
  ]
}
```

---

## Lead — Consultar

### `GET /api/search/{search_id}/lead/{lead_id}`

Retorna os dados de um lead específico dentro de uma busca.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "search_id": "abc123",
    "title": "Restaurante XYZ",
    "snippet": "Restaurante italiano no centro de Curitiba",
    "site_url": "https://restaurante.com.br",
    "instagram_url": "https://instagram.com/restaurante",
    "maps_phone": "(41) 99999-0000",
    "maps_rating": 4.5,
    "maps_reviews": 234,
    "cnpj": "12345678000190",
    "razao_social": "RESTAURANTE XYZ LTDA",
    "score": 72,
    "ia_analise": "Empresa com boa presença digital..."
  }
}
```

---

## Lead — Atualizar

### `PUT /api/search/{search_id}/lead/{lead_id}`

Atualiza campos de um lead específico.

**Body** (parcial — apenas campos desejados):

```json
{
  "score": 85,
  "tem_ads": true,
  "site_emails": ["contato@restaurante.com.br"]
}
```

**Campos atualizáveis**: `title`, `snippet`, `site_url`, `instagram_url`, `facebook_url`, `maps_phone`, `maps_rating`, `maps_reviews`, `maps_website`, `site_emails`, `site_phones`, `site_instagram`, `site_facebook`, `site_youtube`, `site_tiktok`, `cnpj`, `cnpj_source`, `razao_social`, `situacao`, `capital_social`, `porte`, `cnae_descricao`, `tem_site`, `tem_instagram`, `tem_facebook`, `tem_maps`, `tem_ads`, `email_receita`, `telefone_receita`, `score`.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "search_id": "abc123",
    "score": 85,
    "tem_ads": true,
    "site_emails": ["contato@restaurante.com.br"]
  }
}
```

---

## Lead — Deletar

### `DELETE /api/search/{search_id}/lead/{lead_id}`

Remove um lead de uma busca.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Lead 'lead_1' deleted from search 'abc123'"
  }
}
```

---

## Lead — Editar Análise

### `PUT /api/search/{search_id}/lead/{lead_id}/analysis`

Edita manualmente a análise de IA de um lead.

**Body**:

```json
{
  "ia_analise": "Lead com alto potencial. Recomendo abordagem via Instagram DM."
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "ia_analise": "Lead com alto potencial. Recomendo abordagem via Instagram DM."
  }
}
```

---

## Lead — Reanalisar

### `POST /api/search/{search_id}/analyze-leads/{lead_num}`

Re-executa a análise de IA para um lead específico (por índice numérico, 0-based).

**Response** (200):

```json
{
  "success": true,
  "data": {
    "message": "Re-analysis started for lead 0"
  }
}
```

---

## Lead — Diagnosticar

### `POST /api/search/{search_id}/diagnose/{lead_id}`

Gera um diagnóstico detalhado de um lead específico via IA, incluindo análise de presença digital e recomendações.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "diagnosis": "Lead com presença digital moderada..."
  }
}
```

---

## Rate Limiting

A API implementa rate limiting com sliding window:

| Endpoint Group | Limite | Janela |
|---------------|--------|--------|
| Global (padrão) | 100 req | 60s |
| Search creation | 10 req | 60s |
| AI analysis | 5 req | 60s |

Quando o limite é excedido:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": [{"retry_after": 45}]
  }
}
```

---

## Circuit Breaker

O circuit breaker protege contra falhas cascata nos provedores de IA:

```
        ┌──────────┐   5+ falhas   ┌──────────┐
        │  CLOSED  │──────────────▶│   OPEN   │
        │ (normal) │               │ (bloq.)  │
        └──────────┘               └────┬─────┘
             ▲                          │
             │     30s timeout         │
             │◀─────────────────────────┤
             │                          ▼
             │                   ┌──────────────┐
             └──── 1 sucesso ───│  HALF-OPEN   │
                                 │  (testando)  │
                                 └──────────────┘
```

**Fallback chain**: GLM-5.1 → MiniMax-M2.7 → DeepSeek-V3.2 → Qwen3-Coder-Next

---

<div align="center">

*Prospector API v2.0 — Documentação gerada em Abril/2026*

</div>