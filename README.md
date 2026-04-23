# 🔍 Prospector — AI-Powered B2B Prospection

**Prospector** is a full-stack B2B lead generation and analysis tool that combines Google Search scraping, business data enrichment, AI-powered market analysis, and individual lead diagnosis — all in a single pipeline.

![License](https://img.shields.io/badge/license-MIT-blue) ![Python](https://img.shields.io/badge/python-3.11-blue) ![Docker](https://img.shields.io/badge/docker-ready-brightgreen)

---

## ✨ Features

- **🔍 Discovery** — Search businesses by niche, city, and state using Google (Serper API)
- **📋 Enrichment** — Scrape websites, Instagram, Google Maps, and BrasilAPI (CNPJ) for each lead
- **⭐ Scoring** — Automatic 0-100 presence digital score per lead
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

> Add screenshots to `docs/screenshots/` and update this section.

| Search | Results | Diagnosis |
|--------|---------|-----------|
| *Search form* | *Lead list with filters* | *AI diagnosis modal* |

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

Full API reference available at [`docs/API.md`](docs/API.md).

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Guidelines

- **Frontend**: Keep CSS/JS modular — no inline styles or scripts in HTML
- **Backend**: Follow Flask Blueprint patterns, use type hints, add docstrings
- **API**: Maintain backward compatibility, document changes in `docs/API.md`
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