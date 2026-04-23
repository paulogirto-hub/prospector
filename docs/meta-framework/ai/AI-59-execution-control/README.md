# AI-59 - Controle de Execução (Stop, Escalate, Rollback)

> **Prioridade:** CRITICO
> **Depende de:** AI-38, AI-58, BACK-05
> **É dependência de:** OPS-23, SHRD-41
> **Categoria:** ai

## 1. O Problema

Agentes de IA podem entrar em loops infinitos, gerar código quebrado em cascata, ou tomar decisões que conflitam com regras de negócio. Sem um sistema de controle, uma IA "perdida" pode destruir horas de trabalho em segundos.

**Este módulo é o "freio de mão" do framework.**

---

## 2. Estados de Execução

### 2.1 Máquina de Estados do Agente

```
 ┌─────────────┐
 │    IDLE     │ ◄────────────────────────┐
 └──────┬──────┘                           │
        │ run                               │
        ▼                                   │
 ┌─────────────┐     fail_soft      ┌──────┴──────┐
 │  EXECUTING  │───────────────────►│   PAUSED    │
 └──────┬──────┘                    └──────┬──────┘
        │                                  │ resume / stop
        │ success                          │
        ▼                                  ▼
 ┌─────────────┐                    ┌─────────────┐
 │  COMPLETED  │                    │   STOPPED   │
 └─────────────┘                    └─────────────┘
        │
        │ review_needed
        ▼
 ┌─────────────┐
 │   REVIEW    │
 └──────┬──────┘
        │ approve / reject
        ▼
 ┌─────────────┐
 │  COMMITTED  │
 └─────────────┘
```

### 2.2 Transições Permitidas

| De | Para | Gatilho | Quem Decide |
|----|------|---------|-------------|
| IDLE → EXECUTING | Start task | Orquestrador (AI-38) |
| EXECUTING → COMPLETED | Sucesso | Próprio agente |
| EXECUTING → PAUSED | Falha soft | Execution Controller (este módulo) |
| PAUSED → EXECUTING | Resume com fix | Human or senior agent |
| PAUSED → STOPPED | Falha hard ou limite | Execution Controller |
| COMPLETED → REVIEW | Requer revisão | Regras de qualidade (BACK-37) |
| REVIEW → COMMITTED | Aprovado | Reviewer |
| REVIEW → PAUSED | Rejeitado | Reviewer |
| COMPLETED → STOPPED | Rollback necessário | Execution Controller |

---

## 3. Gatilhos de Interrupção (Kill Conditions)

### 3.1 Hard Stop (Irreversível)

| Condição | Exemplo | Ação Imediata |
|----------|---------|---------------|
| **Segurança crítica** | Senha ou API key em texto puro no código | Stop + alerta + wipe do output |
| **Dados de produção** | Query acessando DB de produção | Stop + audit log |
| **Limite de tokens** | Execução consumiu 10x o esperado | Stop + snapshot do estado |
| **Conflicto de regras** | Código contradiz DOC-CORE-01 | Stop + report de conflito |
| **Loop detectado** | Mesma ação repetida 5x sem progresso | Stop + análise de causa |

### 3.2 Soft Pause (Reversível)

| Condição | Exemplo | Ação |
|----------|---------|------|
| **Qualidade baixa** | Testes quebrando > 30% | Pausa + request de review |
| **Dependência ausente** | Módulo necessário não implementado | Pausa + enqueue dependency |
| **Ambiguidade** | Requisito contraditório | Pausa + ask for clarification |
| **Recurso caro** | Custo de API excede orçamento | Pausa + solicita aprovação |

---

## 4. Protocolo de Escalation

### 4.1 Níveis de Escalation

```
Nível 1: Próprio agente (auto-correção tentativa)
   ↓ (se falha em 2 tentativas)
Nível 2: Agente sênior do mesmo capability (ex: TypeScript master)
   ↓ (se falha em 1 tentativa)
Nível 3: Arquiteto (AI-38, CORE-34)
   ↓ (se falha ou é decisão de negócio)
Nível 4: Human in the loop
   ↓ (se falha)
Nível 5: STOP + Post-mortem obrigatório
```

### 4.2 Matriz de Escalation

| Problema | Nível 1 | Nível 2 | Nível 3 | Nível 4 |
|----------|---------|---------|---------|---------|
| Bug sintático | Auto-fix | Developer agent | - | - |
| Teste quebrando | Re-run | QA Agent | Arquiteto | Human |
| Conflito de merge | Auto-merge | Senior dev | Arquiteto | Tech Lead |
| Decisão arquitetural | - | - | CORE-34 | Human |
| Vazamento de dado | STOP imediato | Security agent | SHRD-33 | DPO |
| Custo excedido | Budget check | FinOps agent | OPS-35 | CFO |

---

## 5. Sistema de Rollback

### 5.1 Snapshots

Antes de cada execução, o sistema cria um snapshot:
```json
{
  "snapshot_id": "snap-2026-04-22-001",
  "agent_id": "backend-alpha",
  "task_id": "feat-api-007",
  "files_before": ["hash1", "hash2"],
  "db_state": "migration_v12",
  "env_vars": "snapshot_env",
  "timestamp": "2026-04-22T14:00:00Z"
}
```

### 5.2 Tipos de Rollback

| Tipo | Quando | O que reverte | Tempo |
|------|--------|-------------|-------|
| **Task Rollback** | Task falhou | Arquivos da task | < 30s |
| **Feature Rollback** | Feature quebra staging | Feature branch | < 2min |
| **Deployment Rollback** | Produção falha | Último deploy stable | < 5min |
| **Data Rollback** | DB corrompido | Backup + WAL (Write-Ahead Log) | < 15min |

### 5.3 Reversão Automática

```
IF task_status == FAILED AND retry_count >= MAX_RETRIES:
    restore_files(snapshot_id)
    log_incident("AUTO_ROLLBACK", task_id, snapshot_id)
    notify_human("Rollback automático executado", severity="WARNING")
```

---

## 6. Rate Limiting de Agentes

### 6.1 Limites por Agente

| Métrica | Limite Ação | Limite Stop |
|---------|-------------|-------------|
| Tokens/mes | 80% = warn | 100% = pause |
| Custo/task | R$ 5 = aprovação | R$ 20 = stop |
| Execuções/hora | 50 = warn | 100 = throttle |
| Erros consecutivos | 3 = rotate agent | 5 = stop + investigate |
| Latência média | > 30s = degrade | > 2min = kill |

---

## 7. Audit Trail de Controle

Cada decisão de stop, escalate ou rollback é logada:

```json
{
  "event": "STOP_EXECUTION",
  "agent_id": "backend-alpha",
  "task_id": "feat-api-007",
  "reason": "API_KEY_IN_CODE",
  "severity": "CRITICAL",
  "snapshot_id": "snap-2026-04-22-001",
  "escalation_level": 3,
  "human_notified": true,
  "timestamp": "2026-04-22T14:03:12Z"
}
```

---

## 8. Dashboard de Controle

```
┌─────────────────────────────────────────────────────┐
│ 🚨 Execution Control Center                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Agente: backend-alpha    Estado: 🟡 PAUSED          │
│  Task:   feat-api-007                               │
│  Razão:  TEST_FAILURE_RATE 35% (limite 30%)        │
│                                                     │
│  [▶️ Resume] [⏹️ Stop] [⤴️ Escalate] [↩️ Rollback]   │
│                                                     │
│  Logs de Controle (últimos 5):                     │
│  14:03 STOP  security_reason  API_KEY_IN_CODE      │
│  14:02 PAUSE quality_threshold  tests 35% fail     │
│  14:01 WARN  token_usage       85% of budget       │
│  14:00 START task_assigned     feat-api-007         │
│                                                     │
│  [Ver Full Audit Trail →]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 9. Checklist

- [ ] Máquina de estados implementada com transições válidas
- [ ] Hard stops configurados para segurança e dados
- [ ] Soft pausas para qualidade e dependências
- [ ] Protocolo de escalation com 5 níveis
- [ ] Snapshots automáticos antes de cada execução
- [ ] Rollback de task, feature, deploy e dados
- [ ] Rate limiting por tokens, custo e erros
- [ ] Audit trail imutável de todas as decisões de controle
- [ ] Dashboard de controle com ações manuais

## 10. AI-First Notes

> Este módulo é a "camada de segurança ativa" do framework. Sem ele, agents podem causar danos irreversíveis. **Regra de ouro:** Nunca execute código gerado por IA sem passar pelo Execution Controller.
