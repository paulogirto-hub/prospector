# AI-38 - Orquestração de Subagentes e Times de IA

> **Prioridade:** ALTO
> **Depende de:** CORE-01, AI-32, BACK-37
> **É dependência de:** Todas as fases de execução técnica.
> **Categoria:** ai

## 1. Modelo de Colaboração Hierárquica

Para sistemas complexos, uma única IA não é suficiente. O framework utiliza o padrão **Manager-Worker**:

### Papéis Definidos
- **Agent Manager (Orquestrador):** Detém a visão do projeto (Epics/Roadmap). Delega tarefas, valida resultados e mantém a consistência global.
- **Agent Architect:** Toma decisões sobre padrões de projeto, banco de dados e infraestrutura. Valida a CORE-34.
- **Agent Developer:** Focado em implementação pura seguindo os "Quality Gates" (BACK-37).
- **Agent QA/Auditor:** Testa o código contra a SHRD-33 (Cyber) e BACK-25 (Erros). Possui poder de veto sobre o Developer.
- **Agent Ops/DevSecOps:** Gerencia o pipeline (INFRA-36), deploy e monitoramento.

---

## 2. Protocolo de Handover (Passagem de Bastão)

Para evitar perda de contexto, cada troca de turno entre agentes deve incluir:

1. **Objetivo da Task:** O que deve ser feito.
2. **Contexto Atual:** O que já foi feito e quais arquivos foram alterados.
3. **Restrições:** Quais Docs do framework devem ser respeitadas (ex: "Siga a BACK-05 para Auth").
4. **Output Esperado:** Formato da entrega (ex: "PR com testes passando").

---

## 3. Resolução de Conflitos e Loops

Sistemas multi-agentes podem entrar em conflito (ex: QA rejeita o código do Dev 3 vezes seguidas).

### Estratégias de Desempate
- **Consenso:** Um terceiro agente (Arquiteto) é chamado para dar o voto de minerva.
- **Backtrack:** Se o loop persistir, o Manager deve reavaliar a Task original (talvez a instrução esteja ambígua).
- **Human-in-the-loop:** Se o impasse técnico for insolúvel por IA, o sistema deve solicitar intervenção humana com um "Relatório de Impasse".

---

## 4. State Management Compartilhado

Os agentes não devem trabalhar em silos. O "Estado do Projeto" deve ser mantido em um local acessível a todos:
- **Shared Context File:** Um arquivo (ex: `current_state.md`) que é atualizado a cada grande alteração.
- **Vector Memory (AI-32):** Uso de busca vetorial para que novos agentes "leiam" o histórico de decisões passadas do projeto.

---

## 5. Checklist de Orquestração

- [ ] Todos os agentes conhecem a localização da pasta `/docs`.
- [ ] O Manager validou a tarefa antes de delegar.
- [ ] O QA rodou os Quality Gates da BACK-37.
- [ ] O histórico de decisões (ADR) está atualizado.
- [ ] Não há loops de repetição de código sem progresso.
