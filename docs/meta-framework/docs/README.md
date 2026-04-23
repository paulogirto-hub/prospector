# Meta-Framework Universal de Engenharia de Sistemas

Framework de engenharia agnóstico para criar sistemas de alta complexidade (SaaS, Cyber, Fintech, PDV, IA) de forma profissional, segura e escalavel.

**71 modulos** organizados em hierarquia, com dependencias e prioridades.

> **Comece por:** `MASTER.md` — contem a visão estratégica, arquitetura e pipeline de execução.
> **Consulte:** `framework-index.json` — indice neural para leitura rápida por IAs.

## Estrutura Hierarquica

```
docs/
├── MASTER.md                     ← COMECAR AQUI (guia central)
├── README.md                     ← Voce esta aqui (indice)
├── plano-implementacao.md        ← Planejamento (9 fases)
├── framework-index.json          ← Indice neural (para IAs)
│
├── core/                         ← FUNDAMENTOS (ler primeiro)
│   ├── CORE-01-regras-negocio/        → Tipos de usuarios, RBAC, monetizacao, anti-abuso
│   ├── CORE-02-modelagem-dados/      → Tabelas, campos, relacionamentos, indices
│   ├── CORE-03-arquitetura/          → Stack, pastas, comunicacao, padroes
│   ├── CORE-07-fluxos/               → Cadastro, login, agent, pagamento, LGPD
│   ├── CORE-31-workspaces-teams/     → Organizacoes, times, convites, B2B
│   ├── CORE-34-arquitetura-estrategica/ → Decisoes de padroes (Microservices, Edge, etc)
│   └── CORE-47-resiliencia-web3/ → P2P, Blockchain, imutabilidade, offline
│
├── backend/                      ← API + SEGURANCA + TESTES
│   ├── BACK-04-api/                   → Endpoints, payloads, responses, erros
│   ├── BACK-05-seguranca/             → JWT, RBAC, rate limit, LGPD, headers
│   ├── BACK-11-testes/                → Unit/integration/e2e, CI, coverage
│   ├── BACK-15-openapi/               → Spec 3.1.0, Swagger UI, SDK gen
│   ├── BACK-24-api-versioning/        → v1→v2, deprecation, sunset
│   ├── BACK-25-catalogo-erros/        → 50+ codigos (AUTH_*, AGENT_*, etc)
│   ├── BACK-37-quality-gates/         → Regua de qualidade e auditoria automatica
│   └── BACK-48-ponte-legado/          → Integracao com codigo legado
│
├── infra/                         ← DEPLOY + INFRAESTRUTURA
│   ├── INFRA-18-migrations/            → Prisma migrate, zero downtime, backfill
│   ├── INFRA-19-deploy-infra/          → VPS, Docker, NGINX, SSL, CI/CD, backup
│   ├── INFRA-20-slo-sla/               → SLIs, SLOs, error budget, compensacao
│   ├── INFRA-21-disaster-recovery/     → Recovery por cenario, runbook, RTO/RPO
│   ├── INFRA-36-devsecops/             → CI/CD seguro, SAST/DAST, Canary deploy
│   └── INFRA-60-capacity/              → Planejamento de capacidade e hardware
│
├── business/                      ← DINHEIRO + COMUNICACAO + GROWTH
│   ├── BIZ-08-pagamentos/            → Webhooks, estados, idempotencia, chargeback
│   ├── BIZ-16-custo-real/            → Precos reais APIs, margem, alertas
│   ├── BIZ-28-email-templates/       → 12 templates (verificacao, pagamento, etc)
│   ├── BIZ-39/                  → Discovery, Epics, Stories, Roadmaps
│   ├── BIZ-43-simulacao/             → Gemeos digitais e stress test de negocio
│   ├── BIZ-51-cost/                  → Calculadora de viabilidade financeira
│   ├── BIZ-52-brand-posicionamento/  → Nicho, UVP, tom de voz, identidade
│   ├── BIZ-53-growth-engine/         → AARRR, viralizacao, onboarding, cohort
│   ├── BIZ-54-market-research/       → Analise SWOT, JTBD, tendencias
│   ├── BIZ-55-pricing-psychology/    → Estrategia de precos, ancoragem, value-based
│   ├── BIZ-56-sales-crm/             → Funil de vendas, lead scoring, CRM
│   └── BIZ-57-metrics-kpi/           → AARRR, LTV, CAC, Churn, dashboards
│
├── advanced/                      ← FEATURES AVANCADAS
│   ├── ADV-06-integracoes/           → Providers, riscos, fallback, cache
│   ├── ADV-13-feature-flags/         → Canary, kill switch, rollout %
│   ├── ADV-14-dlq/                   → Retry, alertas, admin API
│   ├── ADV-17-multi-tenant/          → Isolamento, RLS, BYOK (OPCIONAL)
│   └── ADV-27-notificacoes/          → WebSocket, Redis Pub/Sub, canais
│
├── ai/                            ← INTELIGENCIA ARTIFICIAL
│   ├── AI-09-gerenciamento-apis/    → Provider gateway, circuit breaker, roteamento
│   ├── AI-10-seguranca-ia/          → Prompt injection, jailbreak, sandbox
│   ├── AI-12-streaming/             → SSE, pre-authorize, typewriter
│   ├── AI-32-rag-memory/            → Busca vetorial, ingestao, memoria longa
│   ├── AI-38-orquestracao/          → Coordenacao de multiplos agentes/times
│   └── AI-58-agent-capabilities/    → Skills, XP, progressao e matchmaking de agentes
│
├── ops/                           ← OPERACOES EM PRODUCAO
│   ├── OPS-22-observabilidade/       → Pino + Prometheus + OpenTelemetry + Jaeger
│   ├── OPS-23-incident-response/     → SEV-1 a 4, runbooks, post-mortem
│   ├── OPS-29-performance/           → Targets por rota, k6 load tests
│   ├── OPS-35-finops/                → Gestao de custos nuvem, auto-scaling, IA thrift
│   ├── OPS-50-runbooks/              → Guia pratico de resolucao
│   └── OPS-42-auto-cura/             → AIOps, auto-patching, sistemas auto-regenerativos
│
├── frontend/                      ← UI/UX + ONBOARDING
│   ├── FRONT-26-upload-pipeline/       → Presigned URL, S3, malware scan, CDN
│   ├── FRONT-30-frontend-design/      → Tokens, componentes, layouts, mobile, dark
│   ├── FRONT-46-design-emocional/     → Nudges, gatilhos, economia comportamental
│   ├── FRONT-52-ux-research/          → Entrevistas, personas, journey maps, heuristicas
│   ├── FRONT-53-copywriting/          → Landing pages, CTA, UX Writing, AIDA
│   ├── FRONT-54-seo-content/          → SEO tecnico, structured data, content marketing
│   ├── FRONT-55-onboarding-ativacao/  → Primeiro valor, walkthroughs, gamificacao
│   └── FRONT-56-referral-gamification/→ Referral loops, recompensas, ranking, badges
│
├── shared/                        ← RECURSOS TRANSVERSAIS
│   ├── SHRD-33/                       → Zero Trust, LGPD, Criptografia, Auditoria
│   ├── SHRD-40-anti-patterns/         → Anti-patterns a evitar
│   ├── SHRD-41-framework-evolutivo/   → Auto-atualizacao e aprendizado continuo
│   ├── SHRD-44-guardiao-etico/        → IA etica, conformidade juridica e transparencia
│   ├── SHRD-45-engenharia-contexto/     → Otimizacao de contexto para IAs
│   ├── SHRD-49-adrs/                  → Decisoes de arquitetura
│   ├── SHRD-56-threat-model/          → Modelagem de ameacas
│   ├── SHRD-57-data-flow/             → Fluxo de dados e trust boundaries
│   ├── SHRD-58-onboarding/            → Onboarding de equipe
│   ├── SHRD-59-glossario/             → Glossario do projeto
│   ├── SHRD-61-lgpd/                  → Compliance LGPD
│   ├── SHRD-62-accessibility-inclusion/→ Acessibilidade e inclusao digital
│   └── SHRD-63-compliance-global/      → Conformidade global (GDPR, CCPA, HIPAA)
│
└── prompts/                       ← PROMPTS ORQUESTRADORES
    ├── prompt-orquestrador.md    → Coordena fluxo + gates de qualidade
    ├── prompt-execucao-global.md → Executa sistema completo (pipeline)
    ├── prompt-regras-negocio.md  → Gera regras (formato obrigator)
    ├── prompt-modelagem-dados.md → Modela DB (validacao cruzada)
    ├── prompt-api.md             → Gere spec API (validacao cruzada)
    ├── prompt-seguranca.md       → Define medidas (detalhe tecnico)
    ├── prompt-integracoes.md     → Mapeia integracoes (custos reais)
    ├── prompt-fluxos.md          → Descreve fluxos (diagramas)
    ├── prompt-gerador-sistema.md → Gera codigo (stack obrigatoria)
    └── prompt-auditor-critico.md  → Audita (formato + severidade)
```

## Ordem de Leitura

| Domínio | Modulos | Prioridade |
|---------|---------|-----------|
| 0. Estratégia e Produto | BIZ-39, BIZ-51, BIZ-43, AI-38 | CRITICO |
| 1. Fundamentacao | CORE-01 → CORE-02 → CORE-03 → BACK-04 | CRITICO |
| 2. Seguranca + IA | BACK-05 → AI-09 → AI-10 | CRITICO |
| 3. Pagamento + Fluxos | BIZ-08 → CORE-07 | ALTO |
| 4. Qualidade | BACK-25 → BACK-11 → AI-12 | ALTO |
| 5. Producao | INFRA-18 → INFRA-19 → OPS-22 → INFRA-20 → INFRA-21 → OPS-23 | ALTO |
| 6. Frontend | FRONT-30 → FRONT-26 | ALTO |
| 7. Avancado | ADV-06, ADV-13, ADV-14, BACK-15, BIZ-16, BACK-24, ADV-27, BIZ-28, OPS-29 | MEDIO |
| 8. Opcional | ADV-17 | OPCIONAL |
| 9. Modulos Orfaos | BACK-15, BACK-48, BIZ-16, SHRD-40, SHRD-41, SHRD-44, SHRD-45, SHRD-49, FRONT-46, CORE-31, CORE-34, CORE-47 | MEDIO |

## Pipeline de Execucao (para gerar codigo)

Use `prompts/prompt-execucao-global.md` — ele define a ordem exata de implementacao com validacao cruzada.

## Arquivos Chave

| Arquivo | Funcao |
|---------|--------|
| `MASTER.md` | Guia central: visao, conexoes, dependencias, prioridades |
| `plano-implementacao.md` | 9 fases, 10-12 semanas |
| `framework-index.json` | Indice neural para leitura rapida por IAs |
| `prompts/prompt-orquestrador.md` | Coordena geracao de documentacao via IA |
| `prompts/prompt-execucao-global.md` | Coordena implementacao do codigo |
