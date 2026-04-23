# OPS-23 - Incident Response

> **Prioridade:** ALTO
> **Depende de:** BACK-05, CORE-07, INFRA-21, OPS-22
> **É dependência de:** (nenhum)
> **Categoria:** ops

## 1. Severidade

| Sev | Definicao | Exemplo | Tempo de resposta |
|-----|-----------|---------|-------------------|
| SEV-1 | Sistema fora do ar para todos | API 500, DB caiu | 5 min |
| SEV-2 | Feature critica quebrada para muitos | Pagamento falhando, agents sem responder | 15 min |
| SEV-3 | Feature quebrada para poucos | 1 usuario nao consegue usar agent | 1h |
| SEV-4 | Bug cosmetic, sem urgencia | UI desalinhado, typo | 24h |

## 2. Fluxo de Incidente

```
DETECCAO
   │
   ▼
┌─────────────┐
│  TRIAGEM     │  Classificar severidade
│  (5 min)    │  Comunicar time
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MITIGACAO  │  Estabilizar (nao resolver)
│  (30 min)  │  Reduzir impacto
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  RESOLUCAO  │  Corrigir causa raiz
│  (varios)   │  Deploy fix
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  POST-MORTEM│  Aprender + prevenir
│  (48h)     │  Documentar
└─────────────┘
```

## 3. Runbooks por Cenario

### SEV-1: API Retorna 500

```
1. Verificar /health
   curl http://localhost:3000/health

2. Verificar logs
   docker compose logs -f api --tail 200

3. Verificar DB
   docker exec saas-postgres pg_isready

4. Verificar Redis
   docker exec saas-redis redis-cli -a PASSWORD ping

5. ACOES IMEDIATAS:
   a. Se DB caiu → docker compose restart postgres
   b. Se Redis caiu → docker compose restart redis
   c. Se API crashou → docker compose restart api
   d. Se disco cheio → df -h + docker system prune

6. Se nao resolver:
   - Ativar maintenance mode (feature flag)
   - Comunicar usuarios (status page)
   - Escalar para desenvolvedor senior
```

### SEV-1: DB Indisponível

```
1. Verificar se container esta rodando
   docker compose ps postgres

2. Verificar logs do postgres
   docker compose logs postgres --tail 100

3. Cenarios comuns:
   a. Disco cheio: VACUUM + rm old backups
   b. Muitas conexoes: SELECT count(*) FROM pg_stat_activity; → kill idle
   c. Corrupcao: Restaurar backup (ver doc 21)

4. Acao:
   - Parar API (nao adianta retry infinito)
   - Restaurar DB
   - Reiniciar API
   - Verificar /health
```

### SEV-2: Providor IA Caiu

```
1. Verificar: todos providers ou so 1?
   curl -H "Authorization: Bearer $KEY" https://openrouter.ai/api/v1/models

2. Se 1 provider:
   - Sistema ja deveria ter fallback automatico (circuit breaker)
   - Verificar se fallback funcionou: provider_logs
   - Se nao funcionou: verificar circuit breaker state

3. Se todos os providers:
   - Ativar feature flag: agent_streaming = false (reduz tentativas)
   - Comunicar: "Servico de IA temporariamente indisponivel"
   - Monitorar: tentar a cada 5 min
   - Quando voltar: desligar flag
```

### SEV-2: Webhooks de Pagamento Falhando

```
1. Verificar DLQ
   SELECT source, count(*) FROM dead_letter_queue WHERE status = 'pending' GROUP BY source;

2. Verificar se gateway esta mandando webhooks
   - Verificar logs com event = "webhook_received"
   - Verificar URL do webhook no painel do gateway

3. Se gateway parou de mandar:
   - Verificar configuracao no painel
   - Verificar se IP nao foi bloqueado

4. Se processamento falha:
   - Verificar erro especifico (log da DLQ)
   - Corrigir bug
   - Retry manual via admin API: POST /admin/dlq/:id/retry

5. Se muitos webhooks atrasados:
   - Processar em paralelo (aumentar workers BullMQ)
   - Priorizar por valor (transacoes maiores primeiro)
```

### SEV-2: Vazamento de API Key

```
1. IMEDIATAMENTE (em paralelo):
   a. Revogar key no console do provider
   b. Gerar nova key
   c. Atualizar no DB: UPDATE providers SET api_key_encrypted = encrypt('new_key') WHERE name = 'provider_name'
   d. Limpar cache Redis: DEL provider:name:api_key

2. Investigar:
   a. Onde estava a chave? (DB, .env, log, codigo)
   b. Quem teve acesso?
   c. Verificar logs: chamadas fora do padrao
   d. Estimar consumo indevido

3. Prevenir:
   a. Auditoria de acesso
   b. Rotacao periodica de chaves
   c. Alerta de uso anomalamente alto
```

## 4. Comunicacao

### Canais

| Canal | Uso |
|-------|-----|
| Slack #incidents | Comunicacao em tempo real |
| Status page (statuspage.io) | Comunicacao para usuarios |
| Email | Notificacao para clientes enterprise |
| PagerDuty | Escalacao automatica (SEV-1) |

### Templates de Comunicacao

**Investigando:**
```
[SEV-X] Titulo - INVESTIGATING
Impacto: [quem esta afetado, o que nao funciona]
Inicio: [timestamp]
Acao: Estamos investigando. Atualizacao em 15min.
```

**Mitigado:**
```
[SEV-X] Titulo - MITIGATED
Impacto: [o que foi afetado]
Causa: [se souber]
Acao: Sistema estabilizado. Monitorando.
```

**Resolvido:**
```
[SEV-X] Titulo - RESOLVED
Duracao: [inicio ate agora]
Causa: [causa raiz]
Correcao: [o que foi feito]
Post-mortem: sera publicado em 48h
```

## 5. Post-Mortem

### Template

```markdown
# Post-Mortem: [Titulo]

**Data:** DD/MM/AAAA
**Duracao:** X horas Y minutos
**Severidade:** SEV-X
**Impacto:** N usuarios afetados, $X de receita perdida

## Timeline (UTC)
- HH:MM - Incidente detectado (alerta/mensagem)
- HH:MM - Triagem completa, SEV-X declarado
- HH:MM - Mitigacao aplicada (oque fez)
- HH:MM - Sistema estabilizado
- HH:MM - Resolucao completa

## Causa Raiz
[Descricao tecnica detalhada do PORQUE aconteceu]

## Acoes Corretivas
| # | Acao | Owner | Prazo | Status |
|---|------|-------|-------|--------|
| 1 | ... | @dev | 1 semana | PENDING |

## Licoes Aprendidas
1. O que funcionou bem
2. O que nao funcionou
3. O que faria diferente

## Metricas
- Tempo de deteccao: X min
- Tempo de mitigacao: X min
- Tempo de resolucao: X min
- Error budget consumido: X%
```

### Regras do Post-Mortem
- Obrigatorio para SEV-1 e SEV-2
- Sem culpar pessoas (blameless)
- Entregue em 48h
- Compartilhado com time
- Acoes com owner + prazo

## 6. Escalacao

```
Detectado (5min)
  │
  ├── SEV-1 → PagerDuty → Dev on-call (5min)
  │   ├── Nao resolveu em 30min → Tech Lead
  │   └── Nao resolveu em 1h → CTO
  │
  ├── SEV-2 → Slack #incidents → Dev disponivel (15min)
  │   └── Nao resolveu em 2h → Tech Lead
  │
  ├── SEV-3 → Slack #incidents → Proximo sprint
  │
  └── SEV-4 → GitHub Issue → Backlog
```

## 7. Checklist

- [ ] Severidades definidas e documentadas
- [ ] Runbooks para cada cenario SEV-1 e SEV-2
- [ ] Canais de comunicacao configurados (Slack + status page)
- [ ] Templates de comunicacao prontos
- [ ] Post-mortem template pronto
- [ ] Processo de escalacao definido
- [ ] PagerDuty ou alternativa configurada
- [ ] On-call rotation definida
- [ ] Post-mortem obligatorio para SEV-1 e SEV-2
- [ ] Review mensal de incidentes