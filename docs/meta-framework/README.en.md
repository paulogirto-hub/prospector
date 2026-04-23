# Universal Meta-Framework for Systems Engineering

Agnostic engineering framework for building high-complexity systems (SaaS, Cyber, Fintech, POS, AI) professionally, securely, and at scale.

**71 modules** organized in hierarchy, with dependencies and priorities.

> **Start with:** `MASTER.en.md` — contains the strategic vision, architecture, and execution pipeline.
> **Reference:** `framework-index.json` — neural index for fast AI reading.

## Hierarchical Structure

```
docs/
├── MASTER.md / MASTER.en.md     ← START HERE (central guide)
├── README.md / README.en.md    ← You are here (index)
├── plano-implementacao.md      ← Planning (9 phases)
├── framework-index.json        ← Neural index (for AIs)
│
├── core/                         ← FOUNDATIONS (read first)
│   ├── CORE-01-regras-negocio/        → User types, RBAC, monetization, anti-abuse
│   ├── CORE-02-modelagem-dados/      → Tables, fields, relationships, indexes
│   ├── CORE-03-arquitetura/          → Stack, folders, communication, patterns
│   ├── CORE-07-fluxos/               → Signup, login, agent, payment, LGPD
│   ├── CORE-31-workspaces-teams/     → Organizations, teams, invites, B2B
│   ├── CORE-34-arquitetura-estrategica/ → Pattern decisions (Microservices, Edge, etc)
│   └── CORE-47-resiliencia-web3/ → P2P, Blockchain, immutability, offline
│
├── backend/                      ← API + SECURITY + TESTING
│   ├── BACK-04-api/                   → Endpoints, payloads, responses, errors
│   ├── BACK-05-seguranca/             → JWT, RBAC, rate limit, LGPD, headers
│   ├── BACK-11-testes/                → Unit/integration/e2e, CI, coverage
│   ├── BACK-15-openapi/               → Spec 3.1.0, Swagger UI, SDK gen
│   ├── BACK-24-api-versioning/        → v1→v2, deprecation, sunset
│   ├── BACK-25-catalogo-erros/        → 50+ error codes (AUTH_*, AGENT_*, etc)
│   ├── BACK-37-quality-gates/         → Quality rules and automatic auditing
│   └── BACK-48-ponte-legado/          → Legacy code integration
│
├── infra/                         ← DEPLOY + INFRASTRUCTURE
│   ├── INFRA-18-migrations/            → Prisma migrate, zero downtime, backfill
│   ├── INFRA-19-deploy-infra/          → VPS, Docker, NGINX, SSL, CI/CD, backup
│   ├── INFRA-20-slo-sla/               → SLIs, SLOs, error budget, compensation
│   ├── INFRA-21-disaster-recovery/     → Per-scenario recovery, runbook, RTO/RPO
│   ├── INFRA-36-devsecops/             → Secure CI/CD, SAST/DAST, Canary deploy
│   └── INFRA-60-capacity/              → Capacity and hardware planning
│
├── business/                      ← MONEY + COMMUNICATION + GROWTH
│   ├── BIZ-08-pagamentos/            → Webhooks, states, idempotency, chargeback
│   ├── BIZ-16-custo-real/            → Real API prices, margin, alerts
│   ├── BIZ-28-email-templates/       → 12 templates (verification, payment, etc)
│   ├── BIZ-39/                  → Discovery, Epics, Stories, Roadmaps
│   ├── BIZ-43-simulacao/             → Digital twins and business stress test
│   ├── BIZ-51-cost/                  → Financial viability calculator
│   ├── BIZ-52-brand-posicionamento/  → Niche, UVP, tone of voice, identity
│   ├── BIZ-53-growth-engine/         → AARRR, virality, onboarding, cohort
│   ├── BIZ-54-market-research/       → SWOT analysis, JTBD, trends
│   ├── BIZ-55-pricing-psychology/    → Pricing strategy, anchoring, value-based
│   ├── BIZ-56-sales-crm/             → Sales funnel, lead scoring, CRM
│   └── BIZ-57-metrics-kpi/           → AARRR, LTV, CAC, Churn, dashboards
│
├── advanced/                      ← ADVANCED FEATURES
│   ├── ADV-06-integracoes/           → Providers, risks, fallback, cache
│   ├── ADV-13-feature-flags/         → Canary, kill switch, rollout %
│   ├── ADV-14-dlq/                   → Retry, alerts, admin API
│   ├── ADV-17-multi-tenant/          → Isolation, RLS, BYOK (OPTIONAL)
│   └── ADV-27-notificacoes/          → WebSocket, Redis Pub/Sub, channels
│
├── ai/                            ← ARTIFICIAL INTELLIGENCE
│   ├── AI-09-gerenciamento-apis/    → Provider gateway, circuit breaker, routing
│   ├── AI-10-seguranca-ia/          → Prompt injection, jailbreak, sandbox
│   ├── AI-12-streaming/             → SSE, pre-authorize, typewriter
│   ├── AI-32-rag-memory/            → Vector search, ingestion, long-term memory
│   ├── AI-38-orquestracao/          → Multi-agent/team coordination
│   └── AI-58-agent-capabilities/    → Skills, XP, progression, agent matchmaking
│
├── ops/                           ← PRODUCTION OPERATIONS
│   ├── OPS-22-observabilidade/       → Pino + Prometheus + OpenTelemetry + Jaeger
│   ├── OPS-23-incident-response/     → SEV-1 to 4, runbooks, post-mortem
│   ├── OPS-29-performance/           → Per-route targets, k6 load tests
│   ├── OPS-35-finops/                → Cloud cost management, auto-scaling, AI thrift
│   ├── OPS-50-runbooks/              → Practical troubleshooting guide
│   └── OPS-42-auto-cura/             → AIOps, auto-patching, self-healing systems
│
├── frontend/                      ← UI/UX + ONBOARDING
│   ├── FRONT-26-upload-pipeline/       → Presigned URL, S3, malware scan, CDN
│   ├── FRONT-30-frontend-design/      → Tokens, components, layouts, mobile, dark
│   ├── FRONT-46-design-emocional/     → Nudges, triggers, behavioral economics
│   ├── FRONT-52-ux-research/          → Interviews, personas, journey maps, heuristics
│   ├── FRONT-53-copywriting/          → Landing pages, CTA, UX Writing, AIDA
│   ├── FRONT-54-seo-content/          → Technical SEO, structured data, content marketing
│   ├── FRONT-55-onboarding-ativacao/  → First value, walkthroughs, gamification
│   └── FRONT-56-referral-gamification/→ Referral loops, rewards, ranking, badges
│
├── shared/                        ← CROSS-CUTTING RESOURCES
│   ├── SHRD-33/                       → Zero Trust, LGPD, Cryptography, Auditing
│   ├── SHRD-40-anti-patterns/         → Anti-patterns to avoid
│   ├── SHRD-41-framework-evolutivo/   → Self-updating and continuous learning
│   ├── SHRD-44-guardiao-etico/        → Ethical AI, legal compliance, transparency
│   ├── SHRD-45-engenharia-contexto/     → Context optimization for AIs
│   ├── SHRD-49-adrs/                  → Architecture decisions
│   ├── SHRD-56-threat-model/          → Threat modeling
│   ├── SHRD-57-data-flow/             → Data flow and trust boundaries
│   ├── SHRD-58-onboarding/            → Team onboarding
│   ├── SHRD-59-glossario/             → Project glossary
│   ├── SHRD-61-lgpd/                  → LGPD compliance
│   ├── SHRD-62-accessibility-inclusion/→ Accessibility and digital inclusion
│   └── SHRD-63-compliance-global/      → Global compliance (GDPR, CCPA, HIPAA)
│
└── prompts/                       ← ORCHESTRATOR PROMPTS
    ├── prompt-orquestrador.md    → Coordinates flow + quality gates
    ├── prompt-execucao-global.md → Executes complete system (pipeline)
    ├── prompt-regras-negocio.md  → Generates rules (mandatory format)
    ├── prompt-modelagem-dados.md → Models DB (cross-validation)
    ├── prompt-api.md             → Generates API spec (cross-validation)
    ├── prompt-seguranca.md       → Defines measures (technical detail)
    ├── prompt-integracoes.md    → Maps integrations (real costs)
    ├── prompt-fluxos.md          → Describes flows (diagrams)
    ├── prompt-gerador-sistema.md → Generates code (mandatory stack)
    └── prompt-auditor-critico.md  → Audits (format + severity)
```

## Reading Order

| Domain | Modules | Priority |
|--------|---------|----------|
| 0. Strategy & Product | BIZ-39, BIZ-51, BIZ-43, AI-38 | CRITICAL |
| 1. Foundations | CORE-01 → CORE-02 → CORE-03 → BACK-04 | CRITICAL |
| 2. Security + AI | BACK-05 → AI-09 → AI-10 | CRITICAL |
| 3. Payment + Flows | BIZ-08 → CORE-07 | HIGH |
| 4. Quality | BACK-25 → BACK-11 → AI-12 | HIGH |
| 5. Production | INFRA-18 → INFRA-19 → OPS-22 → INFRA-20 → INFRA-21 → OPS-23 | HIGH |
| 6. Frontend | FRONT-30 → FRONT-26 | HIGH |
| 7. Advanced | ADV-06, ADV-13, ADV-14, BACK-15, BIZ-16, BACK-24, ADV-27, BIZ-28, OPS-29 | MEDIUM |
| 8. Optional | ADV-17 | OPTIONAL |
| 9. Orphan Modules | BACK-15, BACK-48, BIZ-16, SHRD-40, SHRD-41, SHRD-44, SHRD-45, SHRD-49, FRONT-46, CORE-31, CORE-34, CORE-47 | MEDIUM |

## Execution Pipeline (to generate code)

Use `prompts/prompt-execucao-global.md` — it defines the exact implementation order with cross-validation.

## Key Files

| File | Purpose |
|------|---------|
| `MASTER.md` / `MASTER.en.md` | Central guide: vision, connections, dependencies, priorities |
| `plano-implementacao.md` | 9 phases, 10-12 weeks |
| `framework-index.json` | Neural index for fast AI reading |
| `prompts/prompt-orquestrador.md` | Coordinates documentation generation via AI |
| `prompts/prompt-execucao-global.md` | Coordinates code implementation |