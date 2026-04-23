<div align="center">

# 🔍 Prospector

**B2B Lead Prospecting Platform Powered by AI**

**Plataforma de Prospecção B2B com Inteligência Artificial**

[![Versão](https://img.shields.io/badge/v2.0.0-blue.svg)](https://github.com/)
[![Licença](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-yellow.svg)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)

*Find, enrich, qualify, and analyze B2B leads automatically with AI.*
*Encontre, enriqueça, qualifique e analise leads B2B automaticamente com IA.*

[🌐 Landing Page](https://prospector.haasgrow.cloud) · [📖 Documentação da API](./docs/API.md) · [📊 Benchmark](./BENCHMARK.md) · [🚀 Começando](#-instalação-e-configuração)

</div>

---

## 📸 Screenshots

<div align="center">

| Homepage — Dashboard principal | Busca — Discovery de empresas por nicho e cidade |
|:---:|:---:|
| ![Homepage](./docs/screenshots/01-homepage.png) | ![Busca](./docs/screenshots/02-search-form.png) |

| Resultados — Leads enriquecidos com score | Detalhes — Dados completos de cada lead |
|:---:|:---:|
| ![Resultados](./docs/screenshots/03-results.png) | ![Detalhes](./docs/screenshots/04-lead-detail.png) |

| Diagnóstico IA — Análise completa com pontos fortes, fracos e abordagem |
|:---:|
| ![Diagnóstico](./docs/screenshots/05-diagnosis.png) |

</div>

---

## 🎯 O que é o Prospector?

O Prospector é uma plataforma de prospecção B2B que automatiza o processo de encontrar e qualificar potenciais clientes. A partir de um nicho e localização, a plataforma descobre empresas via Google, enriquece os dados com scraping de sites, Instagram, Google Maps e BrasilAPI (CNPJ), qualifica cada lead com um score de presença digital de 0-100 e gera diagnósticos acionáveis com IA — tudo em pipeline assíncrona, com circuit breaker para resiliência e rate limiting para proteção.

**Em resumo:** De horas de busca manual a minutos de prospecção inteligente.

## 👥 Público-Alvo / Target Audience

- 🏢 **Agências de marketing digital** — que precisam prospectar clientes para SEO, Ads e Social Media
- 🏥 **Clínicas e consultórios** — que querem aumentar pacientes e analisar a concorrência local
- 💼 **Empresas B2B** — que vendem serviços digitais e precisam de dados reais para prospecção
- 📱 **Vendedores independentes** — que prospectam por WhatsApp e precisam de leads qualificados
- 🚀 **Startups** — que precisam validar mercado rapidamente com dados reais

## 😤 Problemas que Resolve / Pain Points

- ⏰ **Horas buscando leads no Google** — Busca automática por nicho e cidade elimina trabalho manual
- 🤷 **Não sabe quais empresas precisam do seu serviço** — Score de presença digital prioriza os melhores leads
- 🗑️ **Perder tempo com leads que nunca vão comprar** — Qualificação por IA filtra leads sem potencial
- 📞 **Sem dados de contato** — Enriquecimento automático com CNPJ, site, Instagram, telefone e email
- 💬 **Não sabe como abordar** — Diagnóstico com IA sugere a primeira mensagem para WhatsApp
- 🏃 **Concorrência mais rápida** — Pipeline automatizada de Discovery a Diagnosis em minutos
- 📋 **Planilhas desorganizadas** — Dados centralizados, enriquecidos e sempre atualizados
- ⚖️ **Não sabe quem abordar primeiro** — Score 0-100 ordena leads por potencial real

---

## 📋 Sumário

- [O que é o Prospector?](#-o-que-é-o-prospector)
- [Público-Alvo](#-público-alvo--target-audience)
- [Problemas que Resolve](#-problemas-que-resolve--pain-points)
- [Features](#-features)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Uso da API](#-uso-da-api)
- [Pipeline de Prospecção](#-pipeline-de-prospecção)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Meta-Framework](#-meta-framework-universal)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## ✨ Features

| Feature | Descrição |
|---------|-----------|
| 🔎 **Discovery** | Busca automática via Serper API com variações de query e deduplicação fuzzy |
| 🌐 **Web Scraping** | Extração de emails, telefones e redes sociais dos sites dos leads |
| 📍 **Google Maps** | Ratings, reviews, telefone e website via Google Maps |
| 🏢 **CNPJ Lookup** | Razão social, situação cadastral, capital social e CNAE via BrasilAPI |
| 📸 **Instagram** | Detecção de presença e links de Instagram |
| 📊 **Scoring** | Score 0-100 baseado em presença digital (site, redes, Google Ads, Maps) |
| 🤖 **IA Analysis** | Diagnóstico por IA com fallback entre modelos (GLM → MiniMax → DeepSeek) |
| 🔌 **Circuit Breaker** | Resiliência automática — se um modelo falha, troca para o próximo |
| ⚡ **Rate Limiting** | Proteção contra abuso com sliding window por IP |
| 🛡️ **Input Validation** | Schemas Pydantic + sanitização contra XSS/injeção |
| 🐳 **Docker Ready** | Deploy com um comando via docker-compose |
| 📱 **Frontend SPA** | Interface moderna com design system, gráficos e responsividade |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SPA)                    │
│              Nginx · HTML/CSS/JS · :80              │
└──────────────────────┬──────────────────────────────┘
                       │ /api/*
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Backend (Flask)                     │
│              Gunicorn · 4 workers · :5000            │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Routes  │  │Middleware │  │     Models       │  │
│  │ search  │──│ rate_limit│──│ schemas (Pydantic)│ │
│  │ lead    │  │ validation│  │ errors           │  │
│  │ health  │  └──────────┘  └──────────────────┘  │
│  └────┬────┘                                         │
│       │                                              │
│  ┌────▼────────────────────────────────────────┐    │
│  │            Services (Core)                   │    │
│  │                                              │    │
│  │  pipeline.py  ← Orquestração dos steps      │    │
│  │  external_api ← Serper, AI (circuit breaker)│    │
│  │  scraper.py   ← Web scraping + parsing     │    │
│  │  persistence.py ← JSON file storage         │    │
│  └──────────────────────────────────────────────┘    │
│                                                     │
│  config/settings.py ← Env vars e constantes         │
│  app_factory.py     ← Flask app factory             │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌────────────┐
    │  Serper  │ │ BrasilAPI│ │   AI API   │
    │ (Search) │ │  (CNPJ)  │ │ (Analysis) │
    └──────────┘ └──────────┘ └────────────┘
```

### Estrutura de Arquivos (Backend)

```
backend/
├── app/
│   ├── __init__.py          # Package init
│   ├── main.py              # Entry point (gunicorn)
│   ├── app_factory.py       # Flask app factory + blueprints
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py      # Env vars, constantes, blacklists
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py       # Pydantic models (validação)
│   │   └── errors.py        # Erros estruturados (catálogo)
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── rate_limit.py    # Sliding window rate limiter
│   │   └── validation.py    # Sanitização de inputs
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py        # GET /api/health
│   │   ├── search.py        # CRUD + pipeline steps
│   │   └── lead.py          # CRUD de leads individuais
│   ├── services/
│   │   ├── __init__.py
│   │   ├── pipeline.py      # Lógica de negócio (730+ linhas)
│   │   ├── external_api.py  # Serper + AI + circuit breaker
│   │   ├── scraper.py       # Web scraping + extração
│   │   └── persistence.py   # JSON file storage
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
├── Dockerfile
├── requirements.txt
└── data/                    # Volume (JSON dos searches)
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Backend** | Python + Flask | 3.11 / 3.1 |
| **WSGI** | Gunicorn | 23.0 |
| **Validação** | Pydantic | 2.x |
| **Scraping** | BeautifulSoup4 | 4.12 |
| **HTTP** | Requests | 2.32 |
| **CORS** | Flask-CORS | 5.0 |
| **Frontend** | HTML/CSS/JS (SPA) | — |
| **Web Server** | Nginx (Alpine) | — |
| **Container** | Docker + Compose | 3.8 |
| **AI** | GLM-5.1 / MiniMax-M2.7 / DeepSeek | — |
| **Search API** | Serper (Google) | — |
| **CNPJ API** | BrasilAPI | — |

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Docker e Docker Compose
- Chave de API do [Serper](https://serper.dev/) (busca Google)
- Chave de API do [Ollama Cloud](https://ollama.com/) (análise IA) — ou modelo local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/prospector.git
cd prospector
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas chaves de API
nano .env
```

### 3. Suba os containers

```bash
docker-compose up -d
```

### 4. Acesse

- **Frontend**: http://localhost:8088
- **API Health**: http://localhost:8088/api/health

---

## 📡 Uso da API

### Health Check

```bash
curl http://localhost:8088/api/health
```

### Criar uma busca (Discovery)

```bash
curl -X POST http://localhost:8088/api/search \
  -H "Content-Type: application/json" \
  -d '{"niche": "restaurante", "city": "Curitiba", "state": "PR", "max_results": 30}'
```

### Acompanhar status

```bash
curl http://localhost:8088/api/search/{search_id}
```

### Pipeline Steps (executar sequencialmente)

```bash
# Enriquecer leads (scraping + CNPJ)
curl -X POST http://localhost:8088/api/search/{id}/enrich

# Calcular scores
curl -X POST http://localhost:8088/api/search/{id}/score

# Análise de mercado por IA
curl -X POST http://localhost:8088/api/search/{id}/analyze-market

# Análise individual de leads por IA
curl -X POST http://localhost:8088/api/search/{id}/analyze-leads

# Pipeline completa (enrich + score + analyze)
curl -X POST http://localhost:8088/api/search/{id}/analyze
```

### Histórico de buscas

```bash
curl http://localhost:8088/api/history
```

### Gerenciar leads

```bash
# Buscar lead específico
curl http://localhost:8088/api/search/{id}/lead/{lead_id}

# Atualizar lead
curl -X PUT http://localhost:8088/api/search/{id}/lead/{lead_id} \
  -H "Content-Type: application/json" \
  -d '{"score": 85}'

# Deletar lead
curl -X DELETE http://localhost:8088/api/search/{id}/lead/{lead_id}

# Diagnóstico individual de lead
curl -X POST http://localhost:8088/api/search/{id}/diagnose/{lead_id}
```

### Deletar busca

```bash
curl -X DELETE http://localhost:8088/api/search/{id}
```

> 📖 Documentação completa da API: [docs/API.md](./docs/API.md)

---

## 🔄 Pipeline de Prospecção

```
┌───────────┐     ┌──────────┐     ┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Discovery │────▶│  Enrich  │────▶│  Score  │────▶│ Analyze Mkt  │────▶│Analyze Leads│
│ (Serper)  │     │(Scraping)│     │ (0-100) │     │  (IA: visão  │     │ (IA: cada  │
│           │     │ + CNPJ   │     │         │     │   mercado)   │     │   lead)     │
└───────────┘     └──────────┘     └─────────┘     └──────────────┘     └─────────────┘
     │                 │                                                  │
     ▼                 ▼                                                  ▼
 Busca Google     Sites, Maps,                                    Diagnóstico
 + variação       Instagram,                                      acionável
 + deduplicação   BrasilAPI                                       por lead
```

### Detalhes de cada etapa

| Step | O que faz | APIs usadas |
|------|-----------|-------------|
| **Discovery** | Busca empresas no Google com variações de query, deduplica por similaridade fuzzy, filtra spam | Serper API |
| **Enrich** | Para cada lead: faz scraping do site, busca Instagram, consulta Google Maps e BrasilAPI (CNPJ) | HTTP scraping, BrasilAPI |
| **Score** | Calcula score 0-100 baseado em: presença de site (15pts), Instagram (10pts), Google Maps (10pts), CNPJ (15pts), ratings, emails, etc | Interno |
| **Analyze Market** | Gera análise macro do mercado/nicho com IA | Ollama Cloud (GLM-5.1) |
| **Analyze Leads** | Gera diagnóstico individual para cada lead com IA | Ollama Cloud (GLM-5.1) |

---

## ⚙️ Variáveis de Ambiente

Veja [.env.example](./.env.example) para o template completo.

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `SERPER_KEY` | Chave da API Serper (obrigatória) | — |
| `OLLAMA_KEY` | Chave da API Ollama Cloud (obrigatória) | — |
| `OLLAMA_BASE` | URL base da API de IA | `https://ollama.com/v1` |
| `OLLAMA_MODEL` | Modelo primário de IA | `glm-5.1` |
| `OLLAMA_FALLBACKS` | Modelos fallback (comma-separated) | `minimax-m2.7,deepseek-v3.2` |
| `DATA_DIR` | Diretório de dados persistentes | `/app/data` |
| `ALLOWED_ORIGINS` | Origens CORS permitidas | — |
| `RATE_LIMIT_GLOBAL` | Limite global (req/min) | `100` |
| `RATE_LIMIT_SEARCH` | Limite para buscas (req/min) | `10` |
| `RATE_LIMIT_AI` | Limite para IA (req/min) | `5` |
| `AI_TIMEOUT` | Timeout para chamadas IA (seg) | `90` |
| `CB_FAILURE_THRESHOLD` | Falhas para abrir circuit breaker | `5` |
| `CB_RECOVERY_TIMEOUT` | Tempo de recuperação do CB (seg) | `30` |
| `GUNICORN_WORKERS` | Workers do Gunicorn | `4` |
| `GUNICORN_TIMEOUT` | Timeout do Gunicorn (seg) | `300` |

---

## 📚 Meta-Framework Universal

O Prospector foi construído usando a **Meta-Framework Universal de Engenharia de Sistemas** — um framework agnóstico com **71 módulos** organizados em hierarquia para criar sistemas de alta complexidade.

A documentação completa do Meta-Framework está disponível em [`docs/meta-framework/`](./docs/meta-framework/):

| Categoria | Módulos | Descrição |
|-----------|---------|----------|
| **Core** | CORE-01 a CORE-52 | Fundamentos: regras, modelagem, arquitetura, fluxos |
| **Backend** | BACK-04 a BACK-48 | API, segurança, testes, versionamento |
| **Frontend** | FRONT-30 a FRONT-46 | Componentes, UX, performance, PWA |
| **Infra** | INFRA-18 a INFRA-60 | Deploy, migrations, disaster recovery, SLOs |
| **Business** | BIZ-08 a BIZ-52 | Pagamentos, templates, growth, posicionamento |
| **AI** | AI-09 a AI-59 | Gestão de APIs, streaming, RAG, orquestração |
| **Ops** | OPS-22 a OPS-50 | Observabilidade, incidentes, performance, auto-cura |
| **Advanced** | ADV-06 a ADV-27 | Integrações, multi-tenant, feature flags, DLQ |

> **Comece por:** [`docs/meta-framework/MASTER.md`](./docs/meta-framework/MASTER.md) — visão estratégica e pipeline de execução.

### Módulos aplicados no Prospector

| Meta-Framework | Prospector |
|---------------|------------|
| CORE-01 (Regras de Negócio) | Pipeline de estados, validação, anti-abuso |
| CORE-02 (Modelagem) | Schema de leads, searches, summary |
| CORE-03 (Arquitetura) | Flask modular com Blueprints + App Factory |
| BACK-04 (API) | REST endpoints com envelope `{success, data}` |
| BACK-05 (Segurança) | Rate limiting, CORS, security headers |
| AI-09 (Gestão APIs) | Circuit breaker, retry, fallback Ollama |
| AI-12 (Streaming) | SSE para progresso de enriquecimento |
| INFRA-19 (Deploy) | Docker Compose com nginx SSL |
| OPS-22 (Observabilidade) | Health check, logging estruturado |
| ADV-13 (Feature Flags) | Flags para etapas do pipeline |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push na branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrões de código

- **Backend**: Seguir a arquitetura em camadas (routes → services → models)
- **Validação**: Usar schemas Pydantic para input
- **Erros**: Usar as classes em `models/errors.py` (catálogo de erros)
- **Rate limiting**: Decorar rotas sensíveis com `@rate_limit`
- **Novos endpoints**: Criar no blueprint apropriado (search/lead/health)

---

## 📊 Benchmark

Veja [BENCHMARK.md](./BENCHMARK.md) para análise comparativa detalhada antes/depois da refatoração.

**Resumo rápido:**

| Métrica | Antes (Monolito) | Depois (Modular) |
|---------|------------------|------------------|
| Arquivos | 1 | 11+ |
| Linhas backend | 1.924 | 2.731 |
| Tempo refatoração | ~15.5h (original) | ~10min (meta-framework) |
| Circuit breaker | ❌ | ✅ |
| Rate limiting | ❌ | ✅ |
| Schemas Pydantic | ❌ | ✅ |
| Error catalog | ❌ | ✅ |

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](./LICENSE) para detalhes.

---

<div align="center">

**Feito com 💜 e ☕ no Brasil**

</div>