# 📡 Prospector API — Complete Documentation

> Detailed reference for all Prospector API v2.0 endpoints

**Base URL**: `http://localhost:8088/api`

---

## Table of Contents

- [Response Format](#response-format)
- [Errors](#errors)
- [Health Check](#health-check)
- [Search — Create](#search--create)
- [Search — Get](#search--get)
- [Search — Stream (SSE)](#search--stream-sse)
- [Search — Delete](#search--delete)
- [Search — Rediscovery](#search--rediscovery)
- [Search — Enrich](#search--enrich)
- [Search — Scoring](#search--scoring)
- [Search — Market Analysis](#search--market-analysis)
- [Search — Lead Analysis](#search--lead-analysis)
- [Search — Full Pipeline](#search--full-pipeline)
- [History](#history)
- [Lead — Get](#lead--get)
- [Lead — Update](#lead--update)
- [Lead — Delete](#lead--delete)
- [Lead — Edit Analysis](#lead--edit-analysis)
- [Lead — Re-analyze](#lead--re-analyze)
- [Lead — Diagnose](#lead--diagnose)
- [Rate Limiting](#rate-limiting)
- [Circuit Breaker](#circuit-breaker)

---

## Response Format

All responses follow a standard envelope format:

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // optional
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": [ ... ]  // optional
  }
}
```

---

## Errors

| HTTP | Code | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input or missing required fields |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Request rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected internal error |
| 503 | `PROVIDER_UNAVAILABLE` | AI provider temporarily unavailable |

---

## Health Check

### `GET /api/health`

Returns system status, configured AI model, and circuit breaker state.

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

**Circuit breaker states**:
- `closed` — Operating normally
- `open` — Blocked (too many failures)
- `half-open` — Testing recovery

---

## Search — Create

### `POST /api/search`

Creates a new search and starts the discovery pipeline in the background.

**Body**:

```json
{
  "niche": "restaurant",
  "city": "Curitiba",
  "state": "PR",
  "max_results": 30
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `niche` | string | ✅ | — | Market niche (2-200 chars) |
| `city` | string | ✅ | — | City name (2-200 chars) |
| `state` | string | ❌ | `PR` | State abbreviation (2 chars) |
| `max_results` | int | ❌ | `50` | Maximum results (1-200) |

**Response** (201):

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "discovery",
    "niche": "restaurant",
    "city": "Curitiba",
    "state": "PR",
    "max_results": 30
  }
}
```

> ⚡ Discovery runs in the background. Use `GET /api/search/{id}` to track progress.

**Rate limit**: 10 requests/minute per IP.

---

## Search — Get

### `GET /api/search/{search_id}`

Returns complete search data including all leads and their analyses.

**Response**:

```json
{
  "success": true,
  "data": {
    "search_id": "abc123-def456",
    "status": "analyzed",
    "niche": "restaurant",
    "city": "Curitiba",
    "state": "PR",
    "created_at": "2026-04-22T15:30:00",
    "summary": {
      "total_leads": 25,
      "avg_score": 62,
      "status": "analyzed"
    },
    "leads": [
      {
        "id": "lead_1",
        "title": "Restaurant XYZ",
        "snippet": "Italian restaurant in downtown Curitiba...",
        "site_url": "https://restaurant.com.br",
        "instagram_url": "https://instagram.com/restaurant",
        "maps_phone": "(41) 99999-0000",
        "maps_rating": 4.5,
        "maps_reviews": 234,
        "cnpj": "12345678000190",
        "razao_social": "RESTAURANTE XYZ LTDA",
        "situacao": "ATIVA",
        "capital_social": 50000.00,
        "porte": "MICRO EMPRESA",
        "cnae_descricao": "Restaurants and similar",
        "tem_site": true,
        "tem_instagram": true,
        "tem_facebook": false,
        "tem_maps": true,
        "tem_ads": false,
        "score": 72,
        "ia_analise": "Company with good digital presence..."
      }
    ],
    "market_analysis": "The restaurant market in Curitiba..."
  }
}
```

**Status values**:

| Status | Meaning |
|--------|---------|
| `discovery` | Search in progress |
| `discovered` | Search complete, awaiting enrichment |
| `enriching` | Enrichment in progress |
| `enriched` | Enrichment complete |
| `scoring` | Scoring in progress |
| `scored` | Scoring complete |
| `market_analyzed` | Market analysis complete |
| `analyzing_leads` | Individual lead analysis in progress |
| `analyzed` | Pipeline complete |
| `error` | Error during processing |

---

## Search — Stream (SSE)

### `GET /api/search/{search_id}/stream`

Server-Sent Events (SSE) endpoint for real-time search status updates. The server polls search data every second and pushes updates to the client until a final state is reached.

**Event Types**:

| Event | Description |
|-------|-------------|
| `update` | Search state update (status, summary, progress) — sent every second while processing |
| `complete` | Search reached a final state — sent once, then stream closes |
| `error` | Search not found or server error — sent once, then stream closes |

**Final States** (stream closes): `discovery`, `enriched`, `scored`, `market_analyzed`, `analyzed`, `error`, `diagnosed`

**Response** (SSE stream):

```
event: update
data: {"search_id":"abc123","status":"discovering","summary":{"queries_done":3,"queries_total":10,"current_query":"restaurantes curitiba"},"leads_count":0}

event: update
data: {"search_id":"abc123","status":"enriching","summary":{"queries_done":10,"queries_total":10},"leads_count":25}

event: complete
data: {"search_id":"abc123","status":"enriched","summary":{"total_results":25,"com_site":15},"leads_count":25}
```

> 💡 The `leads` array is omitted from SSE events to reduce payload size. Use `GET /api/search/{id}` for full data.

> ⏱️ Maximum stream duration is 10 minutes (600 polls). The client should reconnect if needed.

**Client Example (JavaScript)**:

```javascript
const es = new EventSource('/api/search/abc123/stream');
es.addEventListener('update', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Status: ${data.status}, Leads: ${data.leads_count}`);
});
es.addEventListener('complete', (e) => {
  console.log('Search complete!');
  es.close();
});
es.addEventListener('error', (e) => {
  console.error('SSE error:', e);
  es.close();
  // Fallback to polling: GET /api/search/{id}
});
```

---

## Search — Delete

### `DELETE /api/search/{search_id}`

Removes a search and all its data.

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

Re-executes discovery for an existing search, keeping already enriched leads and merging new results.

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

## Search — Enrich

### `POST /api/search/{search_id}/enrich`

Executes enrichment for all leads in a search: website scraping, Instagram lookup, Google Maps, and BrasilAPI (CNPJ).

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

> ⚡ Runs in the background. May take several minutes depending on the number of leads.

---

## Search — Scoring

### `POST /api/search/{search_id}/score`

Calculates a score (0-100) for each lead based on digital presence.

**Score breakdown**:

| Criterion | Points |
|-----------|--------|
| Has website | 15 |
| Website has email | 10 |
| Website has phone | 5 |
| Has Instagram | 10 |
| Has Facebook | 5 |
| Has Google Maps | 10 |
| Maps rating ≥ 4.0 | 5 |
| Maps reviews ≥ 50 | 5 |
| Has CNPJ | 15 |
| Status ATIVA (active) | 5 |
| Capital > 0 | 5 |
| Has Google Ads | 10 |
| **Maximum total** | **100** |

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

## Search — Market Analysis

### `POST /api/search/{search_id}/analyze-market`

Generates macro market/niche analysis using AI. Includes:
- Market segment overview
- Identified opportunities
- Competitiveness level
- Strategic recommendations

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

## Search — Lead Analysis

### `POST /api/search/{search_id}/analyze-leads`

Generates individual diagnosis for each lead using AI. Includes:
- Lead profile
- Strengths and weaknesses
- Client potential
- Approach recommendations

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

## Search — Full Pipeline

### `POST /api/search/{search_id}/analyze`

Executes the full pipeline in sequence: enrich → score → analyze-market → analyze-leads.

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

> 💡 Use this endpoint to process a search from discovery to final diagnosis in a single command.

---

## History

### `GET /api/history`

Returns a list of all searches (summary only).

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "search_id": "abc123",
      "niche": "restaurant",
      "city": "Curitiba",
      "state": "PR",
      "total_leads": 25,
      "avg_score": 62,
      "status": "analyzed",
      "created_at": "2026-04-22T15:30:00"
    },
    {
      "search_id": "def456",
      "niche": "dentist",
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

## Lead — Get

### `GET /api/search/{search_id}/lead/{lead_id}`

Returns data for a specific lead within a search.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "search_id": "abc123",
    "title": "Restaurant XYZ",
    "snippet": "Italian restaurant in downtown Curitiba",
    "site_url": "https://restaurant.com.br",
    "instagram_url": "https://instagram.com/restaurant",
    "maps_phone": "(41) 99999-0000",
    "maps_rating": 4.5,
    "maps_reviews": 234,
    "cnpj": "12345678000190",
    "razao_social": "RESTAURANTE XYZ LTDA",
    "score": 72,
    "ia_analise": "Company with good digital presence..."
  }
}
```

---

## Lead — Update

### `PUT /api/search/{search_id}/lead/{lead_id}`

Updates fields of a specific lead.

**Body** (partial — only desired fields):

```json
{
  "score": 85,
  "tem_ads": true,
  "site_emails": ["contact@restaurant.com.br"]
}
```

**Updatable fields**: `title`, `snippet`, `site_url`, `instagram_url`, `facebook_url`, `maps_phone`, `maps_rating`, `maps_reviews`, `maps_website`, `site_emails`, `site_phones`, `site_instagram`, `site_facebook`, `site_youtube`, `site_tiktok`, `cnpj`, `cnpj_source`, `razao_social`, `situacao`, `capital_social`, `porte`, `cnae_descricao`, `tem_site`, `tem_instagram`, `tem_facebook`, `tem_maps`, `tem_ads`, `email_receita`, `telefone_receita`, `score`.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "search_id": "abc123",
    "score": 85,
    "tem_ads": true,
    "site_emails": ["contact@restaurant.com.br"]
  }
}
```

---

## Lead — Delete

### `DELETE /api/search/{search_id}/lead/{lead_id}`

Removes a lead from a search.

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

## Lead — Edit Analysis

### `PUT /api/search/{search_id}/lead/{lead_id}/analysis`

Manually edits the AI analysis of a lead.

**Body**:

```json
{
  "ia_analise": "High-potential lead. Recommend approaching via Instagram DM."
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "ia_analise": "High-potential lead. Recommend approaching via Instagram DM."
  }
}
```

---

## Lead — Re-analyze

### `POST /api/search/{search_id}/analyze-leads/{lead_num}`

Re-runs AI analysis for a specific lead (by numeric index, 0-based).

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

## Lead — Diagnose

### `POST /api/search/{search_id}/diagnose/{lead_id}`

Generates a detailed diagnosis for a specific lead via AI, including digital presence analysis and recommendations.

**Response** (200):

```json
{
  "success": true,
  "data": {
    "id": "lead_1",
    "diagnosis": "Lead with moderate digital presence..."
  }
}
```

---

## Rate Limiting

The API implements sliding window rate limiting:

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Global (default) | 100 req | 60s |
| Search creation | 10 req | 60s |
| AI analysis | 5 req | 60s |

When the limit is exceeded:

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

The circuit breaker protects against cascading failures from AI providers:

```
        ┌──────────┐   5+ failures   ┌──────────┐
        │  CLOSED  │──────────────▶│   OPEN   │
        │ (normal) │               │ (blocked) │
        └──────────┘               └────┬─────┘
             ▲                          │
             │     30s timeout          │
             │◀─────────────────────────┤
             │                          ▼
             │                   ┌──────────────┐
             └──── 1 success ───│  HALF-OPEN   │
                                 │  (testing)   │
                                 └──────────────┘
```

**Fallback chain**: GLM-5.1 → MiniMax-M2.7 → DeepSeek-V3.2 → Qwen3-Coder-Next

---

<div align="center">

*Prospector API v2.0 — Documentation generated April 2026*

</div>