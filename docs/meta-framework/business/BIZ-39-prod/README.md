# BIZ-39 - Gestão de Produto e Agilidade

> **Prioridade:** CRÍTICO (Fase Inicial)
> **Depende de:** CORE-01
> **É dependência de:** Todas as fases de implementação.
> **Categoria:** business

## 1. Product Discovery (Descoberta do Produto)

Antes da primeira linha de código, a IA deve ajudar a validar a ideia.

### Brainstorming e Pesquisa
- **Análise de Competidores:** Mapear os top 3 concorrentes e listar seus pontos fracos.
- **Diferencial Competitivo (Unique Selling Proposition):** O que este sistema faz que nenhum outro faz?
- **Análise de Risco:** Identificar riscos de mercado, técnicos e de conformidade (Cyber/LGPD).

### Definição de Persona e Jobs-to-be-Done (JTBD)
- "Quem é o usuário?" e "Qual 'trabalho' ele está tentando realizar com este software?".

---

## 2. Estrutura de Backlog (Épicos e Stories)

O framework traduz a visão de negócio em tarefas técnicas.

### Épicos (Grandes Temas)
Exemplos: "Sistema de Faturamento", "Portal do Cliente", "Motor de IA".

### User Stories (Histórias de Usuário)
Formato obrigatório:
- **Como** [papel do usuário]
- **Eu quero** [funcionalidade]
- **Para que** [benefício de negócio]
- **Critérios de Aceite:** (Lista técnica para o QA validar).

---

## 3. Roadmapping Evolutivo

Dividir a entrega em ciclos de valor:

1. **MVP (Minimum Viable Product):** O mínimo necessário para o sistema funcionar e resolver o problema principal.
2. **Versão 1.0 (Comercial):** Adição de segurança avançada, billing completo e UX polida.
3. **Versão 2.0+ (Escala):** Multi-region, alta performance, ecossistema de plugins.

---

## 4. Priorização Inteligente (RICE)

Para cada funcionalidade no backlog, calcular a pontuação RICE:
- **Reach (Alcance):** Quantos usuários serão afetados?
- **Impact (Impacto):** Quanto isso ajuda no objetivo principal?
- **Confidence (Confiança):** Quão seguros estamos da nossa estimativa?
- **Effort (Esforço):** Quanto tempo/recurso levará?

`Score = (Reach * Impact * Confidence) / Effort`

---

## 5. Rituais Ágeis para IAs

Mesmo em times de IA, rituais de agilidade são necessários:
- **Refinement:** O Manager e o Arquiteto revisam as Stories antes de irem para o Dev.
- **Sprint Review:** Validação do módulo completo contra os critérios de aceite.
- **Retrospective:** Análise de falhas no processo (ex: por que a cobertura de testes foi baixa?).

---

## 6. Checklist de Produto

- [ ] MVP está claramente definido?
- [ ] O backlog possui Epics e Stories suficientes para a próxima fase?
- [ ] A priorização seguiu critérios de valor de negócio?
- [ ] O roadmap está alinhado com as dependências técnicas do MASTER.md?
