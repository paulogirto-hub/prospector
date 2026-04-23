# CORE-34 - Estratégia Arquitetural e Seleção de Padrões

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01, CORE-03
> **É dependência de:** Todas as implementações técnicas.
> **Categoria:** core

## 1. Seleção de Macro-Arquitetura

A IA deve escolher o padrão baseado nos requisitos do nicho:

| Padrão | Quando Usar | Vantagem |
|--------|-------------|----------|
| **Monolito Modular** | MVPs, sistemas simples, times pequenos | Velocidade de deploy, simplicidade. |
| **Microservices** | Sistemas de alta escala, times múltiplos | Deploy independente, escalabilidade granular. |
| **Event-Driven** | Real-time, sistemas financeiros, notificações | Baixo acoplamento, alta resiliência. |
| **Edge / Local-First** | PDVs, sistemas de campo, baixa conectividade | Funciona offline, baixa latência. |

---

## 2. Estratégia de Dados (Polyglot Persistence)

Não use a mesma marreta para todos os pregos. Escolha o banco por tipo de dado:

- **Relacional (PostgreSQL):** Dados financeiros, cadastros, ACID compliance.
- **Documento (MongoDB):** Catálogos de produtos, logs flexíveis, payloads dinâmicos.
- **Chave-Valor (Redis):** Sessões, cache, filas, rate limiting.
- **Vetorial (pgvector/Pinecone):** Conhecimento de IA, busca semântica.
- **Séries Temporais (TimescaleDB):** Monitoramento, métricas de sensores, logs de eventos.

---

## 3. Padrões de Resiliência

Sistemas profissionais não podem apenas "quebrar". Devem falhar de forma graciosa.

### Circuit Breaker
- Se uma integração externa (ex: Gateway de Pagamento ou API de IA) falha repetidamente, o sistema "abre o circuito" e para de tentar por um tempo, retornando um erro controlado ou usando um **Fallback**.

### Bulkhead (Anteparas)
- Isolar falhas em um módulo para que não derrubem o sistema inteiro. Se o módulo de "Upload de Fotos" travar, o "Faturamento" deve continuar funcionando.

### Idempotência
- Garantir que a mesma operação realizada múltiplas vezes tenha o mesmo resultado (essencial para pagamentos e webhooks).

---

## 4. Estratégia de Comunicação entre Serviços

- **Síncrona (HTTP/gRPC):** Quando a resposta imediata é necessária.
- **Assíncrona (Message Broker/Redis):** Processamento pesado, notificações, webhooks.

---

## 5. Matriz de Decisão por Mercado

- **Fintech:** Foco em Consistência (ACID) + Audit Log + Event-Sourcing.
- **Saúde (Healthtech):** Foco em Privacidade (doc 33) + Criptografia ponta a ponta.
- **Varejo / PDV:** Foco em Disponibilidade (Offline-first) + Performance na UI.
- **SaaS IA:** Foco em Streaming (SSE) + Gestão de Custo de Tokens.

---

## 6. Checklist de Arquitetura

- [ ] Definir se o sistema será Monolito ou Microservices.
- [ ] Mapear todos os "Single Points of Failure" (Pontos Únicos de Falha).
- [ ] Definir estratégia de Backup e RTO/RPO (doc 21).
- [ ] Validar se a tecnologia escolhida suporta a carga projetada.
