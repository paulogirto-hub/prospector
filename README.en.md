# 🔍 Prospector — AI-Powered B2B Prospection

**Prospector** is a full-stack B2B lead generation and analysis tool that combines Google Search scraping, business data enrichment, AI-powered market analysis, and individual lead diagnosis — all in a single pipeline.

![License](https://img.shields.io/badge/license-MIT-blue) ![Python](https://img.shields.io/badge/python-3.11-blue) ![Docker](https://img.shields.io/badge/docker-ready-brightgreen)

**🇧🇷 [Leia em Português](README.md)**

---

## ✨ Features

- **🔍 Discovery** — Search businesses by niche, city, and state using Google (Serper API)
- **📋 Enrichment** — Scrape websites, Instagram, Google Maps, and BrasilAPI (CNPJ) for each lead
- **⭐ Scoring** — Automatic 0-100 digital presence score per lead
- **📊 Market Analysis** — AI-generated macro market insights (opportunities, competition, entry strategy)
- **🧠 Lead Analysis** — Individual AI diagnosis per lead (weaknesses, strengths, WhatsApp approach, revenue estimates)
- **🔬 Full Diagnosis** — Deep-dive diagnostic per lead with urgency rating, suggested services, and WhatsApp message template
- **📱 PWA** — Installable Progressive Web App with offline caching
- **⚡ Real-time Updates** — SSE streaming with automatic polling fallback
- **🎯 Filters & Sort** — Filter leads by presence flags, search by name, sort by score/name
- **🛡️ XSS-safe** — Tagged template literal rendering prevents XSS injection
- **🎨 Modular Frontend** — CSS/JS separated into modules (state, API, components, app)

---

## 📸 Screenshots

### 🔍 Search Dashboard

<p align="center">
  <img src="docs/screenshots/01-homepage.png" alt="Homepage — Dashboard with search history" width="700">
</p>

Main dashboard with recent search history and quick access to previous research.

### 📋 Search Form

<p align="center">
  <img src="docs/screenshots/02-search-form.png" alt="Search form by niche and city" width="700">
</p>

Search by niche (e.g., restaurant, dentist) and city — the pipeline completes automatically.

### 📊 Filtered Results

<p align="center">
  <img src="docs/screenshots/03-results.png" alt="Lead list with score, filters, and sorting" width="700">
</p>

Leads ranked by digital presence score (0-100) with platform filters and sorting.

### 🏢 Lead Detail

<p align="center">
  <img src="docs/screenshots/04-lead-detail.png" alt="Complete lead detail with enriched data" width="700">
</p>

Enriched data: website, Instagram, Maps, CNPJ, score, and detailed digital presence.

### 🧠 AI Diagnosis

<p align="center">
  <img src="docs/screenshots/05-diagnosis.png" alt="AI diagnosis with analysis, urgency, and WhatsApp template" width="700">
</p>

Individual AI diagnosis: weaknesses, opportunities, urgency rating, and WhatsApp approach message.

---

## 🎯 Target Audience

| Profile | Use Case |
|---------|----------|
| **Marketing Agencies** | B2B client prospecting to offer digital services |
| **Sales Consultants** | Lead enrichment and approach diagnosis |
| **SDRs / Pre-sales** | Automatic company search by niche and location |
| **Local Business Owners** | Competitor analysis and market opportunities |
| **B2B Startups** | Market validation and automated outbound |

## 💔 Pain Points Solved

| Pain Point | How Prospector Solves It |
|------------|--------------------------|
| **Finding qualified leads** | Automatic search via Google, Maps, and CNPJ |
| **Incomplete data** | Enrichment with website, Instagram, phone, email, CNPJ |
| **No prioritization** | 0-100 digital presence score — focus on leads that need you most |
| **Generic outreach** | AI diagnosis with personalized WhatsApp message |
| **Wasting time on bad leads** | Filters by platform, score, and presence flags |
| **Blind to competition** | AI market analysis showing opportunities and gaps |
| **Slow manual process** | Full pipeline: search → enrich → score → analyze in minutes |
| **No individual diagnosis** | Each lead gets a weakness, opportunity, and urgency analysis |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│   nginx:alpine — Static files + reverse proxy    │
│   ├─ index.html (shell)                          │
│   ├─ css/styles.css (design system)              │
│   ├─ js/state.js (reactive state)                │
│   ├─ js/api.js (fetch + SSE client)              │
│   ├─ js/components.js (XSS-safe rendering)        │
│   ├─ js/app.js (orchestrator)                    │
│   ├─ manifest.json + sw.js (PWA)                 │
│   └─ icons/ (192px + 512px)                      │
├─────────────────────────────────────────────────┤
│                   Backend                         │
│   Python 3.11 + Flask + Gunicorn                 │
│   ├─ /api/search (CRUD + pipeline)               │
│   ├─ /api/search/<id>/stream (SSE)               │
│   ├─ /api/history                                │
│   ├─ /api/search/<id>/lead/<id> (CRUD)           │
│   └─ /api/health (circuit breaker status)        │
├─────────────────────────────────────────────────┤
│              External Services                    │
│   ├─ Serper API (Google Search)                  │
│   ├─ BrasilAPI (CNPJ lookup)                     │
│   ├─ Google Maps (business info)                 │
│   └─ Ollama Cloud (GLM-5.1 / MiniMax)            │
└─────────────────────────────────────────────────┘
```

### Pipeline Flow

```
Discovery → Enrich → Score → Analyze Market → Analyze Leads → Diagnose
```

Each step can be re-run independently. The frontend supports running the full pipeline or individual steps.

---

## 🚀 Quick Start

### Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/paulogirto-hub/prospector.git
cd prospector

# Set your API keys
cp .env.example .env
# Edit .env with your SERPER_KEY and OLLAMA_KEY

# Start everything
docker compose up -d --build

# Access at http://localhost:8088
```

### Manual Setup

<details>
<summary>Backend (Python)</summary>

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set environment variables
export SERPER_KEY=your_serper_api_key
export OLLAMA_KEY=your_ollama_api_key
export OLLAMA_BASE=https://ollama.com/v1
export OLLAMA_MODEL=glm-5.1
export DATA_DIR=./data

# Run
gunicorn app.main:app --bind 0.0.0.0:5000 --workers 4 --timeout 300
```

</details>

<details>
<summary>Frontend (nginx)</summary>

```bash
# Copy frontend files to nginx serve directory
# Or serve with any static file server that proxies /api/ to the backend
```

</details>

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERPER_KEY` | ✅ | — | Serper API key (Google Search) |
| `OLLAMA_KEY` | ✅ | — | Ollama Cloud API key (AI) |
| `OLLAMA_BASE` | ❌ | `https://ollama.com/v1` | Ollama API base URL |
| `OLLAMA_MODEL` | ❌ | `glm-5.1` | AI model for analysis/diagnosis |
| `DATA_DIR` | ❌ | `./data` | Directory for persistent search data |

---

## 📡 API Documentation

Full API reference available at:

| File | Language |
|------|----------|
| [`docs/API.md`](docs/API.md) | 🇧🇷 Português |
| [`docs/API.en.md`](docs/API.en.md) | 🇺🇸 English |

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/search` | Create new search (starts discovery) |
| `GET` | `/api/search/{id}` | Get search data + leads |
| `GET` | `/api/search/{id}/stream` | SSE stream for real-time updates |
| `DELETE` | `/api/search/{id}` | Delete search |
| `POST` | `/api/search/{id}/enrich` | Enrich leads (CNPJ, site, Instagram) |
| `POST` | `/api/search/{id}/score` | Calculate scores |
| `POST` | `/api/search/{id}/analyze-market` | AI market analysis |
| `POST` | `/api/search/{id}/analyze-leads` | AI individual lead analysis |
| `POST` | `/api/search/{id}/analyze` | Run full pipeline |
| `GET` | `/api/history` | List all searches |
| `PUT` | `/api/search/{id}/lead/{lid}` | Update lead fields |
| `DELETE` | `/api/search/{id}/lead/{lid}` | Delete a lead |
| `POST` | `/api/search/{id}/diagnose/{lid}` | Generate AI diagnosis |

---

## 🧪 Development

### Frontend Architecture

The frontend uses a modular architecture with ES modules:

```
frontend/
├── index.html          # HTML shell (no inline CSS/JS)
├── css/styles.css      # Design system + all styles (~31KB)
├── js/
│   ├── state.js        # Reactive Proxy-based state management
│   ├── api.js          # Fetch wrapper + SSE client with polling fallback
│   ├── components.js   # XSS-safe rendering (html`` tagged template)
│   └── app.js          # Main orchestrator + event handlers
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (cache-first for static, network for API)
└── icons/              # PWA icons (192px, 512px)
```

### Key Design Decisions

1. **XSS Safety** — `html` tagged template auto-escapes `${}` interpolations. Use `rawHtml()` only for trusted content.
2. **SSE + Polling** — `connectSSE()` tries EventSource first, falls back to 3s polling. The backend `/stream` endpoint is optional — the app works with polling alone.
3. **Reactive State** — `AppState` uses JavaScript Proxy to notify subscribers on change. Components re-render on state updates.
4. **Skeleton Screens** — `showSkeleton*()` functions display placeholder UI during loading.
5. **Error Handling** — `safeFetch()` wraps all API calls with retry support. `renderErrorCard()` shows actionable error messages.

### Backend Architecture

```
backend/
├── app/
│   ├── main.py           # Flask app factory + error handlers
│   ├── config/settings.py  # Configuration + env vars
│   ├── middleware/
│   │   └── rate_limit.py # Sliding window rate limiter
│   ├── models/
│   │   └── errors.py      # Error classes + response helpers
│   ├── routes/
│   │   └── search.py      # All API endpoints + SSE
│   └── services/
│       ├── persistence.py # JSON file storage
│       ├── pipeline.py    # Pipeline orchestration
│       ├── external_api.py # Serper, BrasilAPI, Maps
│       └── scraper.py     # Website scraping
├── requirements.txt
└── Dockerfile
```

---

## 🏛️ Meta-Framework

Prospector includes a **Systems Engineering Meta-Framework** with 74 modules covering the entire product lifecycle.

### Current Implementation Status

| Layer | Modules | Implemented | Status |
|-------|---------|-------------|--------|
| **Core** (rules, data, architecture) | 8 | 3 | 🟡 Partial |
| **Backend** (API, security, testing) | 8 | 4 | 🟡 Partial |
| **Frontend** (design, upload, UX) | 8 | 3 | 🟡 Partial |
| **AI** (providers, streaming, RAG) | 6 | 2 | 🔴 Basic |
| **Infra** (deploy, CI/CD, SLO) | 7 | 2 | 🔴 Basic |
| **Business** (payments, growth) | 12 | 0 | ⚪ Planned |
| **Ops** (observability, FinOps) | 6 | 1 | 🔴 Basic |
| **Advanced** (feature flags, DLQ) | 5 | 0 | ⚪ Planned |
| **Shared** (security, glossary) | 13 | 0 | ⚪ Planned |

> **Summary:** The MVP covers the Happy Path (discovery → enrich → score → analyze → diagnose). The meta-framework defines the enterprise roadmap — authentication, multi-tenant, payments, observability, self-healing, and compliance are planned but **not yet implemented**.

### Validation

```bash
python3 scripts/validate-framework.py --path docs/meta-framework -v
```

### Documentation

| File | Language |
|------|----------|
| [`docs/API.md`](docs/API.md) | 🇧🇷 Português |
| [`docs/API.en.md`](docs/API.en.md) | 🇺🇸 English |
| [`docs/meta-framework/README.md`](docs/meta-framework/README.md) | 🇧🇷 Português |
| [`docs/meta-framework/README.en.md`](docs/meta-framework/README.en.md) | 🇺🇸 English |
| [`docs/meta-framework/MASTER.md`](docs/meta-framework/MASTER.md) | 🇧🇷 Português |
| [`docs/meta-framework/MASTER.en.md`](docs/meta-framework/MASTER.en.md) | 🇺🇸 English |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Guidelines

- **Frontend**: Keep CSS/JS modular — no inline styles or scripts in HTML
- **Backend**: Follow Flask Blueprint patterns, use type hints, add docstrings
- **API**: Maintain backward compatibility, document changes in `docs/API.en.md`
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

- **Serper API** — Google Search results
- **BrasilAPI** — Brazilian CNPJ data
- **Ollama Cloud** — AI analysis and diagnosis (GLM-5.1, MiniMax-M2.7)
- **Flask** — Python web framework
- **nginx** — Static serving and reverse proxy

---

<div align="center">

**[Prospector](https://github.com/paulogirto-hub/prospector)** — Built with 🔍 and 🧠

</div>