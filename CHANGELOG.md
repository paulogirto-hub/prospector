# Changelog

All notable changes to Prospector will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-22

### Added
- Full B2B lead pipeline: Discovery → Enrich → Score → Analyze → Diagnose
- Google Search scraping via Serper API
- Business data enrichment (website, Instagram, Google Maps, CNPJ via BrasilAPI)
- AI-powered market analysis (GLM-5.1 with fallback chain)
- Individual lead diagnosis with urgency rating and WhatsApp message template
- 0-100 digital presence scoring system
- SSE streaming for real-time pipeline updates
- PWA support with offline caching and install prompt
- Circuit breaker for AI provider resilience
- Sliding window rate limiting per IP
- XSS-safe rendering with tagged template literals
- Reactive state management with JavaScript Proxy
- Skeleton screens for loading states
- Modular frontend architecture (state, api, components, app)
- Docker Compose deployment
- Traefik reverse proxy with automatic HTTPS
- Landing page at prospector.haasgrow.cloud
- Bilingual documentation (PT/EN)
- Meta-framework with 74 modules for enterprise roadmap
- Framework validation script (`scripts/validate-framework.py`)
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`

### Changed
- Refactored frontend from monolithic to modular ES modules
- Improved error handling with `safeFetch()` and actionable error messages
- Enhanced SSE with automatic polling fallback

### Security
- XSS protection via `html` tagged template literal
- CORS configuration via environment variables
- Rate limiting (100 req/min global, 10 req/min search, 5 req/min AI)
- Circuit breaker protecting AI provider calls

[2.0.0]: https://github.com/paulogirto-hub/prospector/releases/tag/v2.0.0