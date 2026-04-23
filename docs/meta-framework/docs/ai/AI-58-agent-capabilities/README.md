# AI-58 - Capabilities, Skills e Progressão de Agentes

> **Prioridade:** ALTO
> **Depende de:** AI-38, CORE-01, CORE-02
> **É dependência de:** AI-59, AI-60, OPS-42
> **Categoria:** ai

## 1. Visão Geral

Este módulo define como cada agente de IA dentro do sistema possui **skills**, **capabilities**, **níveis de proficiência** e **progressão de tarefas**. Ele transforma agentes de "caixas-pretas genéricas" em **personas técnicas evolutivas** com trajetória de crescimento, similar a personagens RPG ou profissionais de carreira.

**Diferencial:** Agents não são apenas configurações — são entidades que evoluem, especializam-se e colaboram com base em competências documentadas.

---

## 2. Modelo de Capabilities

### 2.1 Hierarquia

```
Capability (Domínio amplo)
  └── Skill (Competência específica)
        └── Proficiency Level (1-5)
              └── Task Pattern (Tarefas que pode executar)
```

### 2.2 Domínios de Capability (Top-Level)

| ID | Capability | Descrição | Categoria |
|----|-----------|-----------|-----------|
| `CAP-CODE` | Code Generation | Gerar, revisar, refatorar código | backend |
| `CAP-SEC` | Security Analysis | Analisar vulnerabilidades, aplicar padrões seguros | security |
| `CAP-ARCH` | Architecture Design | Projetar sistemas, escolher padrões | core |
| `CAP-DATA` | Data Modeling | Modelar banco de dados, otimizar queries | backend |
| `CAP-TEST` | Test Engineering | Escrever testes, mockar, cobertura | quality |
| `CAP-DEV` | DevOps & Infra | Configurar pipelines, deploy, observabilidade | infra |
| `CAP-UX` | UX & Frontend | Criar interfaces, design system, acessibilidade | frontend |
| `CAP-BIZ` | Business Analysis | Regras de negócio, precificação, modelos | business |
| `CAP-OPS` | Operations | Incident response, runbooks, auto-cura | ops |
| `CAP-DOC` | Documentation | Gerar docs, ADRs, glossários, traduções | shared |
| `CAP-REVIEW` | Code Review | Auditar código, encontrar bugs, sugerir melhorias | quality |
| `CAP-OPT` | Performance Optimization | Otimizar latência, memória, throughput | ops |

### 2.3 Skills Específicas (Exemplos por Capability)

#### CAP-CODE: Code Generation
| Skill | Nível 1 | Nível 3 | Nível 5 |
|-------|---------|---------|---------|
| `SKILL-TYPESCRIPT` | Script simples | API REST completa | Arquitetura modular com DI |
| `SKILL-FASTIFY` | Rotas básicas | Middleware stack | Plugin architecture |
| `SKILL-PRISMA` | Schema simples | Relações + índices | Particionamento + tuning |
| `SKILL-ZOD` | Validação básica | Schemas complexos | Schema composition + transforms |

#### CAP-SEC: Security Analysis
| Skill | Nível 1 | Nível 3 | Nível 5 |
|-------|---------|---------|---------|
| `SKILL-AUTH` | JWT básico | RBAC completo | Zero Trust architecture |
| `SKILL-CRYPTO` | Hash bcrypt | AES-256-GCM | Key rotation + HSM |
| `SKILL-INJECTION` | Input sanitization | Prompt injection detection | Adversarial hardening |

#### CAP-ARCH: Architecture Design
| Skill | Nível 1 | Nível 3 | Nível 5 |
|-------|---------|---------|---------|
| `SKILL-MICRO` | Monolito simples | Modular monolith | Distributed microservices |
| `SKILL-EVENT` | Pub/sub simples | Event sourcing | CQRS + saga patterns |
| `SKILL-EDGE` | CDN básico | Edge functions | Globally distributed edge |

---

## 3. Progressão de Proficiência (1-5)

### 3.1 Níveis Globais

| Nível | Título | Descrição | Confiança | Autonomia |
|-------|--------|-----------|-----------|-----------|
| 1 | Novice | Conhece conceitos, precisa de orientação | 40% | Assistida |
| 2 | Apprentice | Executa tarefas simples com review | 60% | Supervisionada |
| 3 | Journeyman | Trabalha independentemente | 75% | Autônoma |
| 4 | Expert | Resolve problemas complexos, mentora | 85% | Líder |
| 5 | Master | Inova, define padrões, arquiteta | 95% | Estratégica |

### 3.2 Progressão por Experiência (XP)

```
Nível 1 → 2:  500 XP (completar 10 tarefas simples)
Nível 2 → 3:  1.500 XP (completar 20 tarefas médias, 0 erros críticos)
Nível 3 → 4:  4.000 XP (completar 30 tarefas complexas, mentorar 3x)
Nível 4 → 5:  10.000 XP (arquitetar 5 sistemas, definir 3 padrões)
```

### 3.3 Fórmula de XP por Tarefa

```
xp_ganho = base_xp * dificuldade_multiplier * qualidade_multiplier * novelty_bonus

- base_xp: 50 (simples), 150 (média), 300 (complexa), 500 (arquitetural)
- dificuldade: 0.8-1.5 (calibrado pela complexidade ciclomática)
- qualidade: 0.5 (rejeitada) → 1.2 (excelente review)
- novelty_bonus: 1.0 (repetida) → 1.5 (primeira vez no domínio)
```

---

## 4. Configuração de Agentes

### 4.1 Schema de Configuração (JSON/YAML)

```json
{
  "agent_id": "agent-backend-alpha",
  "name": "Backend Architect",
  "personality": "meticulous",
  "capabilities": [
    {
      "cap_id": "CAP-CODE",
      "skills": {
        "SKILL-TYPESCRIPT": { "level": 5, "xp": 12400 },
        "SKILL-FASTIFY": { "level": 4, "xp": 8200 },
        "SKILL-PRISMA": { "level": 4, "xp": 7800 }
      }
    },
    {
      "cap_id": "CAP-SEC",
      "skills": {
        "SKILL-AUTH": { "level": 3, "xp": 3200 },
        "SKILL-CRYPTO": { "level": 2, "xp": 1200 }
      }
    }
  ],
  "task_history": [
    {
      "task_id": "task-001",
      "domain": "backend",
      "success": true,
      "xp_earned": 180,
      "quality_score": 0.95,
      "timestamp": "2026-04-22T14:00:00Z"
    }
  ],
  "limitations": ["nao_executa_frontend", "nao_trata_pagamentos"],
  "preferences": {
    "code_style": "strict_typescript",
    "review_depth": "deep",
    "communication": "concise"
  }
}
```

### 4.2 Personality Traits

| Trait | Impacto | Exemplos |
|-------|---------|----------|
| `meticulous` | Revisa 3x antes de entregar, mais lento, menos bugs | "Verificando edge cases..." |
| `agile` | Entrega rápido, aceita retrabalho, itera | "Vou iterar rapidamente!" |
| `teacher` | Explica o que faz, documenta inline | "A razão para esta escolha é..." |
| `minimalist` | Código enxuto, sem comentários desnecessários | "Menos é mais." |
| `defensive` | Foco em segurança, validações redundantes | "Validando input em 3 camadas." |
| `visionary` | Sugere arquiteturas futuras, experimental | "E se usarmos CRDTs aqui?" |

### 4.3 Restrições de Escopo

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `hard_limits` | Nunca executa | Não toca em produção |
| `soft_limits` | Pode com supervisão | Alterar schema de DB |
| `preferred_domains` | Prioriza | Backend > Frontend |
| `avoid_patterns` | Evita | Callback hell, any types |

---

## 5. Sistema de Tarefas (Task Patterns)

### 5.1 Tipos de Tarefa

| Tipo | Complexidade | Requer Review | XP Base |
|------|-------------|---------------|---------|
| `quick_fix` | Simples | Não | 50 |
| `feature_impl` | Média | Sim (nível ≥3) | 150 |
| `refactor` | Média-Alta | Sim (nível ≥4) | 200 |
| `architecture` | Alta | Sim, com múltiplos agents | 500 |
| `audit` | Variável | Sim, por agent diferente | 300 |
| `doc_gen` | Simples | Não | 30 |

### 5.2 Pipeline de Execução

```
1. ORQUESTRADOR recebe tarefa
   └── Consulta AI-38 (Orquestração)

2. MATCHMAKER seleciona agente
   └── Filtra por: capabilities necessárias, nível mínimo, disponibilidade
   └── Fallback: agente com nível inferior + supervisão

3. AGENTE executa tarefa
   └── Respeita: personality, limitations, preferences
   └── Atualiza: task_history (em tempo real)

4. REVIEWER avalia entrega
   └── Se nível < 3: sempre review humano ou agente nível ≥4
   └── Se qualidade < 0.7: retrabalho com feedback

5. XP é atribuído
   └── Se success: xp_ganho calculado
   └── Se fail: xp_earned = 0, task marcada para análise

6. LEVEL UP verificado
   └── Se xp ≥ threshold: nível incrementado
   └── Notificação enviada ao dashboard
```

### 5.3 Exemplo de Task Assignment

```
Tarefa: "Implementar autenticação OAuth2 com refresh token rotation"

Requirements:
  - CAP-CODE ≥ nível 3
  - SKILL-AUTH ≥ nível 4
  - SKILL-CRYPTO ≥ nível 2

Agentes disponíveis:
  - backend-alpha: CAP-CODE(5), SKILL-AUTH(3), SKILL-CRYPTO(2) ← MATCH
  - security-beta: CAP-SEC(5), SKILL-AUTH(5), SKILL-CRYPTO(5) ← OVERQUALIFIED

Match escolhido: backend-alpha (adequado, mais rápido)
Reviewer obrigatório: security-beta (nível 5 em SKILL-AUTH)
```

---

## 6. Colaboração entre Agentes

### 6.1 Formações de Equipe

| Formação | Composição | Quando Usar |
|----------|-----------|-------------|
| `solo` | 1 agente | Tarefas simples, domínio único |
| `pair` | 2 agents (implementa + revisa) | Features médias |
| `squad` | 3-5 agents (multi-capability) | Arquiteturas complexas |
| `swarm` | N agents (divide tarefas) | Sprints paralelas |

### 6.2 Handoff Protocol

```
Agente A (CAP-CODE):
  "Tarefa parcial concluída: API REST criada.
  Próximo passo: CAP-SEC precisa adicionar RBAC.
  Estado: { schema, routes, tests }
  Dependências: BIZ-39 (regras de permissão)"

→ Handoff →

Agente B (CAP-SEC):
  Recebe estado + contexto
  Valida contra SHRD-33 (LGPD)
  Implementa RBAC + rate limiting
  Retorna para review do Agente A
```

---

## 7. Dashboard de Agentes

### 7.1 Visualização Sugerida

```
┌───────────────────────────────────────────────────────┐
│ 🎮 Agent Academy Dashboard                            │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Top Performers (este mês)                            │
│  🥇 backend-alpha   2,340 XP   12 tasks   98% success  │
│  🥈 security-beta   1,890 XP    8 tasks   95% success  │
│  🥉 ux-gamma        1,560 XP   15 tasks   92% success  │
│                                                       │
│  ┌─ backend-alpha ───────┐  ┌─ security-beta ──────┐  │
│  │ Level 5 Code Gen      │  │ Level 5 Security     │  │
│  │ ████████████ 12.4k XP │  │ ██████░░░░  8.9k XP  │  │
│  │                       │  │                       │  │
│  │ Skills:               │  │ Skills:               │  │
│  │ TypeScript    ████████│  │ Auth         ████████│  │
│  │ Fastify       ██████░░│  │ Crypto       ██████░░│  │
│  │ Prisma        ██████░░│  │ Injection    ████░░░░│  │
│  │                       │  │                       │  │
│  │ Recent: 3 audits,     │  │ Recent: 5 security    │  │
│  │ 1 bug fix, 1 feature  │  │ reviews, 2 patches    │  │
│  └───────────────────────┘  └───────────────────────┘  │
│                                                       │
│  Active Tasks: 4 running, 2 queued, 12 completed      │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 8. Checklist

- [ ] Schema de capabilities e skills definido
- [ ] Sistema de XP e progressão implementado
- [ ] Task matcher por capability + nível
- [ ] Review obrigatório para níveis < 3
- [ ] Personality traits configuráveis por agente
- [ ] Handoff protocol entre agents documentado
- [ ] Dashboard de progressão operacional
- [ ] Anti-gaming: detecção de tarefas "farmáveis"
- [ ] Fallback: agente nível inferior + supervisão

---

## 9. AI-First Notes

> Este módulo é a "alma" do sistema multi-agente. Sem capabilities definidas, agents são apenas prompts. Com este sistema, cada agente tem identidade, trajetória e responsabilidade. A IA que orquestra deve consultar este módulo ANTES de qualquer task assignment.

> **Regra de ouro:** Nunca atribua uma tarefa de nível N a um agente de nível < N-1, a menos que haja reviewer de nível ≥ N.
