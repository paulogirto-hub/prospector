# SHRD-59 - Glossario

> **Prioridade:** MEDIO
> **Depende de:** (nenhum)
> **É dependência de:** 34
> **Categoria:** shared

## A

| Termo | Significado |
|-------|------------|
| ADR | Architecture Decision Record — registro de decisao arquitetural |
| AES-256-GCM | Algoritmo de criptografia simetrica com autenticacao |
| Audit Log | Registro de acoes importantes para rastreabilidade |
| Auth | Autenticacao — verificar QUEM e o usuario |

## B

| Termo | Significado |
|-------|------------|
| Backfill | Popular dados em colunas novas em batches (evitar lock) |
| bcrypt | Algoritmo de hash de senha (cost factor ajustavel) |
| BullMQ | Fila de jobs baseada em Redis |
| BYOK | Bring Your Own Key — tenant traz propria API key |

## C

| Termo | Significado |
|-------|------------|
| Canary Release | Liberar feature para % dos usuarios antes de todos |
| CD | Continuous Delivery/Deployment — deploy automatico |
| Chargeback | Contestacao de pagamento pelo banco do comprador |
| CI | Continuous Integration — testes + lint a cada push |
| Circuit Breaker | Padrão que "desliga" chamadas a servico com falha |
| CLS | Cumulative Layout Shift — metrica de estabilidade visual |
| CORS | Cross-Origin Resource Sharing — quem pode chamar sua API |
| CSP | Content Security Policy — header que previne XSS |
| CRITICO | Prioridade: obrigatorio no MVP |

## D

| Termo | Significado |
|-------|------------|
| DLQ | Dead Letter Queue — fila para mensagens que falharam |
| DDoS | Distributed Denial of Service — ataque de volume |
| Docker | Containerizacao de aplicacoes |

## E

| Termo | Significado |
|-------|------------|
| E2E | End-to-End — teste que cobre fluxo completo |
| Error Budget | Quanto tempo o sistema PODE falhar sem violar SLO |
| ES256 | ECDSA com SHA-256 — algoritmo JWT assimetrico |
| Event Loop Lag | Atraso no loop do Node.js (indica sobrecarga) |

## F

| Termo | Significado |
|-------|------------|
| Fail2ban | Servico que bane IPs com tentativas suspeitas |
| Feature Flag | Toggle que liga/desliga features sem deploy |
| FCP | First Contentful Paint — quando algo aparece na tela |

## G

| Termo | Significado |
|-------|------------|
| Grace Period | Periodo de tolerancia antes de aplicar penalidade |

## H

| Termo | Significado |
|-------|------------|
| HSTS | HTTP Strict Transport Security — forca HTTPS |
| httpOnly | Cookie que JavaScript nao pode acessar (anti-XSS) |
| HMAC | Hash-based Message Authentication Code — assinatura de webhook |

## I

| Termo | Significado |
|-------|------------|
| IDOR | Insecure Direct Object Reference — acessar recurso de outro |
| INP | Interaction to Next Paint — responsividade de interacao |
| Idempotencia | Mesma operacao executada N vezes = mesmo resultado |
| ISR | Incremental Static Regeneration — Next.js revalida paginas |

## J

| Termo | Significado |
|-------|------------|
| Jailbreak | Tentativa de contornar restricoes do modelo de IA |
| JWT | JSON Web Token — token de autenticacao padrao |

## K

| Termo | Significado |
|-------|------------|
| Kill Switch | Feature flag que desliga feature instantaneamente |

## L

| Termo | Significado |
|-------|------------|
| LCP | Largest Contentful Paint — quando conteudo principal aparece |
| LGPD | Lei Geral de Protecao de Dados (Brasil) |
| Loki | Sistema de logs da Grafana |

## M

| Termo | Significado |
|-------|------------|
| Mermaid | Linguagem de diagramas em texto (renderiza no GitHub/GitLab) |
| Middleware | Camada que intercepta requests antes do handler |
| Multi-tenant | Um sistema servindo multiplos clientes isolados |

## O

| Termo | Significado |
|-------|------------|
| OPCIONAL | Prioridade: so quando escalar |
| ORM | Object-Relational Mapping — Prisma, TypeORM |

## P

| Termo | Significado |
|-------|------------|
| p50/p95/p99 | Percentis de latencia (50%, 95%, 99% das requests) |
| PgBouncer | Pool de conexoes PostgreSQL |
| PII | Personally Identifiable Information — dados pessoais |
| Post-mortem | Analise apos incidente (blameless) |
| Presigned URL | URL temporaria para upload/download em S3 |
| Prompt Injection | Manipular input para alterar comportamento do LLM |
| Prisma | ORM TypeScript-first para Node.js |

## R

| Termo | Significado |
|-------|------------|
| Race Condition | Dois processos acessando mesmo dado simultaneamente |
| RLS | Row Level Security — isolamento no nivel do banco |
| RBAC | Role-Based Access Control — permissoes por papel |
| Redis | Banco in-memory para cache, sessoes, filas |
| RPO | Recovery Point Objective — quanto dado pode perder |
| RTO | Recovery Time Objective — quanto tempo ate voltar |
| Rollback | Reverter deploy/changes |
| RS256 | RSA com SHA-256 — algoritmo JWT assimetrico |

## S

| Termo | Significado |
|-------|------------|
| SaaS | Software as a Service |
| Sanitizacao | Limpar input do usuario (remover tags, patterns) |
| SEV-1/2/3/4 | Severidade de incidente (1=critico, 4=cosmetic) |
| SLA | Service Level Agreement — contrato com penas |
| SLI | Service Level Indicator — metrica medida |
| SLO | Service Level Objective — meta para SLI |
| SSR | Server-Side Rendering |
| SSE | Server-Sent Events — streaming server→client |
| STRIDE | Modelo de ameacas (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation) |

## T

| Termo | Significado |
|-------|------------|
| TTFB | Time to First Byte — tempo ate primeiro byte da resposta |
| Trust Boundary | Fronteira entre areas de confianca do sistema |

## W

| Termo | Significado |
|-------|------------|
| WAL | Write-Ahead Log — log do PostgreSQL para recovery |
| Webhook | Notificacao HTTP de sistema externo |
| WebSocket | Conexao bidirecional persistente |