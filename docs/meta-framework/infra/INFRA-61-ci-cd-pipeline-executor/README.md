# INFRA-61 - Pipeline de Execução Automatizada (Executor)

> **Prioridade:** CRITICO
> **Depende de:** INFRA-36, INFRA-19, AI-59
> **É dependência de:** SHRD-41
> **Categoria:** infra

## 1. Visão Geral

Este módulo descreve o **Executor** — o componente que transforma documentação em código funcional de verdade. Enquanto todos os outros módulos dizem *o que fazer* e *como fazer*, este diz *quem executa* e *como garantir que foi feito*.

**Responsabilidade:**
- Orquestrar agentes de IA com base no `framework-index.json`
- Validar o framework antes de executar qualquer passo
- Executar o pipeline de geração end-to-end (Fase 1 → Fase 9)
- Coletar artefatos (código, testes, docs) em cada etapa
- Gerar relatórios de execução e métricas de qualidade

---

## 2. Arquitetura do Executor

### 2.1 Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    Executor Orchestrator                     │
│                     (claude/v4o/qwen/etc)                     │
└──────────────┬──────────────────────────────────┬───────────┘
               │                                  │
      ┌────────▼────────┐                ┌─────▼────────┐
      │  Pre-flight     │                │  Execution   │
      │   Validator     │                │   Engine    │
      │                 │                │             │
      │ - parse index   │                │ - tasks     │
      │ - check deps    │                │ - agents    │
      │ - lint headers  │                │ - build     │
      │ - cycle detect  │                │ - test      │
      └────────┬────────┘                └─────┬───────┘
               │                                │
               ▼                                ▼
      ┌────────────────┐               ┌────────────────┐
      │   Report Gen   │               │   Artifact     │
      │                │               │   Store        │
      │ - JSON/CSV     │               │                │
      │ - Markdown     │               │ - code/        │
      │ - Dashboard    │               │ - tests/       │
      └────────────────┘               │ - docs/        │
                                     └────────────────┘
```

### 2.2 Estados do Pipeline

| Estado | Significado | Próximo |
|--------|-------------|---------|
| `IDLE` | Aguardando input | VALIDATING |
| `VALIDATING` | Executor roda `validate-framework.py` | READY ou FAIL |
| `READY` | Framework válido | EXECUTING |
| `EXECUTING` | Gerando código por fase | STAGE_COMPLETE ou FAIL |
| `STAGE_COMPLETE` | Fase N finalizada | EXECUTING (N+1) ou REVIEW |
| `REVIEW` | Aguardando aprovação humana | EXECUTING ou ROLLBACK |
| `ROLLBACK` | Revertendo última fase | READY ou FAIL |
| `FAIL` | Erro irrecuperável | Report + STOP |
| `SUCCESS` | Todas as fases OK | DONE |

---

## 3. Fases de Execução (Pipeline Real)

### 3.1 Ordem e Gates

```
Fase 1: VALIDATE
  └── Run scripts/validate-framework.py
  └── Gate: 0 erros, max 5 warnings

Fase 2: PARSE CONTEXT
  └── Ler framework-index.json + MASTER.md
  └── Gerar "context window" comprimido para IA
  └── Gate: index carregado, sem IDs duplicados

Fase 3: SETUP
  └── Criar diretórios de saída (output/)
  └── Instalar dependências se necessário
  └── Gate: ambiente pronto

Fase 4: GENERATE CORE
  └── CORE-01: Regras de Negocio
  └── CORE-02: Modelagem de Dados
  └── CORE-03: Arquitetura
  └── Gate: 3 READMEs gerados, validação cruzada

Fase 5: GENERATE BACKEND
  └── BACK-04: API
  └── BACK-05: Seguranca
  └── BACK-11: Testes
  └── Gate: API contratos definidos, RBAC mapeado

Fase 6: GENERATE AI & ADVANCED
  └── AI-09: Gerenciamento de APIs
  └── AI-10: Seguranca em IA
  └── AI-12: Streaming
  └── ADV-06: Integracoes
  └── Gate: providers configurados, circuit breaker definido

Fase 7: GENERATE FRONTEND
  └── FRONT-30: Design System
  └── FRONT-26: Upload Pipeline
  └── Gate: componentes base mapeados

Fase 8: GENERATE INFRA + OPS
  └── INFRA-19: Deploy
  └── INFRA-36: DevSecOps
  └── OPS-22: Observabilidade
  └── Gate: Docker + CI/CD funcionando

Fase 9: AUDIT & EXPORT
  └── BACK-37: Quality Gates
  └── Auditoria de consistência
  └── Export de artefatos (Jira/GitHub)
  └── Gate: 0 CRITICOS, max 2 ALTOS

Fase 10: COMMIT & REPORT
  └── Gerar CHANGELOG
  └── Atualizar framework-index.json com version
  └── Export CSV/JSON de tasks
```

### 3.2 Regras de Execução

```python
rules = {
    "max_tokens_per_task": 150_000,
    "max_cost_per_run": 50.00,  # USD
    "retry_soft_failures": 3,
    "require_human_review_for": ["BACK-05", "INFRA-19", "BIZ-08"],
    "stop_on": ["security_breach", "data_leak", "infinite_loop"],
    "parallel_stages": False,  # Sequencial por padrao
    "snapshot_every": "stage",   # Snapshot apos cada fase
}
```

---

## 4. Artefatos Gerados

### 4.1 Estrutura de Saída

```
output/
├── run-2026-04-22-143000/
│   ├── report.json              → Metricas da execucao
│   ├── export/
│   │   ├── jira-import.csv      → Para Jira Software
│   │   ├── github-issues.json   → Para GitHub Projects
│   │   └── notion-export.md     → Para Notion
│   ├── artifacts/
│   │   ├── code/                → Codigo gerado (se aplicavel)
│   │   ├── tests/               → Testes gerados
│   │   ├── openapi-spec.yaml    → Spec OpenAPI
│   │   └── architecture-diagram.md
│   └── logs/
│       ├── validation.log       → Saida do validate-framework.py
│       ├── execution.log        → Logs de cada fase
│       └── audit.log            → Auditoria completa
```

### 4.2 Export Formats

#### CSV (Jira)

```csv
issue_id,summary,issue_type,labels,priority,component,depends_on,story_points
CORE-01,Regras de Negocio,Story,"core,critical",CRITICAL,Core,,-
CORE-02,Modelagem de Dados,Story,"core,critical",CRITICAL,Core,CORE-01,8
CORE-03,Arquitetura do Sistema,Story,"core,critical",CRITICAL,Core,"CORE-01,CORE-02",13
BACK-04,API Rotas e Contratos,Story,"backend,critical",CRITICAL,Backend,"CORE-01,CORE-02,CORE-03",13
```

#### JSON (GitHub Projects)

```json
{
  "project": "Meta-Framework Execution",
  "url": "https://github.com/org/project-saas/projects/1",
  "issues": [
    {
      "number": 1,
      "title": "CORE-01 - Regras de Negocio",
      "labels": ["core", "critical", "documentation"],
      "milestone": "Phase 1: Foundation",
      "assignee": null,
      "priority": 1
    }
  ]
}
```

---

## 5. Métricas de Execução

### 5.1 KPIs do Pipeline

| Métrica | Alvo | O que Mede |
|---------|------|-----------|
| **Success Rate** | > 90% | % de execuções que chegam a SUCCESS |
| **Mean Time to Stage** | < 5 min | Tempo médio por fase |
| **Rollbacks** | < 5% | Frequência de necessidade de rollback |
| **Human Interventions** | < 20% | % de execuções que precisam de humano |
| **Cost per Run** | < $50 | Custo de tokens de IA |
| **Coverage** | > 80% | % de módulos cobertos com artefatos |

### 5.2 Relatório de Execução (Template)

```markdown
# Relatório de Execução - Run #{RUN_ID}

## Resumo
- **Data:** 2026-04-22
- **Status:** ✅ SUCCESS
- **Versão do Framework:** v1.2.0
- **Módulos Executados:** 45/73
- **Módulos Pulados:** 28 (OPCIONAL/BAIXO)

## Estatísticas
| Métrica | Valor |
|---------|-------|
| Tempo Total | 2h 34min |
| Tokens Consumidos | 890.234 |
| Custo Estimado | $12.40 |
| Rollbacks | 1 |
| Human Reviews | 3 |

## Problemas Encontrados
- [WARN] `FRONT-55` gerado com qualidade abaixo do ideal (SUS score mock < 70)
- [INFO] `ADV-17` pulado (OPCIONAL)

## Artefatos
- Código: `output/run-2026-04-22-143000/artifacts/code/`
- Tests: `output/run-2026-04-22-143000/artifacts/tests/`
- Export Jira: `output/run-2026-04-22-143000/export/jira-import.csv`
```

---

## 6. Checklist

- [ ] `validate-framework.py` passa antes de cada execução
- [ ] Pipeline de execução com 10 fases definidas
- [ ] Snapshots automáticos entre estágios
- [ ] Rollback automático em falha crítica
- [ ] Export para Jira CSV
- [ ] Export para GitHub Projects JSON
- [ ] Relatório de execução com métricas
- [ ] Limite de tokens/custo por run configurado
- [ ] Review humano obrigatório para módulos críticos

## 7. AI-First Notes

> Este módulo é o executor que dá vida ao framework. Sem ele, tudo são apenas documentos. Este pipeline é o que transforma `framework-index.json` + `prompts/` em produto funcional. **Regra de ouro:** nunca execute sem validar primeiro.

> **Execução real:** Um script real de execução está em `scripts/executor.py` (gerado a partir deste módulo).
