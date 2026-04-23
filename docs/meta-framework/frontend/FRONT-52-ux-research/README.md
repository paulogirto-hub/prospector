# FRONT-52 - UX Research e User Journey Mapping

> **Prioridade:** ALTO
> **Depende de:** FRONT-30, CORE-01
> **É dependência de:** FRONT-55
> **Categoria:** frontend

## 1. Pesquisa com Usuários

### 1.1 Métodos de Pesquisa
| Método | Quando Usar | Frequência | Custo |
|--------|-------------|-----------|-------|
| Entrevistas em profundidade | Discovery, validação de hipóteses | Mensal | Médio |
| Testes de usabilidade | Validação de protótipos/features | A cada sprint | Baixo |
| Pesquisa quantitativa (survey) | NPS, satisfação, priorização | Trimestral | Baixo |
| Análise de comportamento (heatmaps) | Identificar fricções na UI | Contínuo | Baixo |
| Card sorting | Arquitetura de informação | Anual | Baixo |
| Tree testing | Validação de navegação | Semestral | Baixo |

### 1.2 Roteiro de Entrevista
1. Contexto e background do participante
2. Jobs-to-be-Done atual (sem mencionar o produto)
3. Dores e frustrações com soluções atuais
4. Teste de conceito ou protótipo (se aplicável)
5. Feedback aberto e sugestões

### 1.3 Critérios de Recrutamento
| Perfil | Quantidade | Critérios |
|--------|-----------|-----------|
| Usuário potencial | 5 | Nunca usou, encaixa no ICP |
| Usuário ativo | 5 | Usa > 3x/semana |
| Usuário churned | 3 | Cancelou nos últimos 3 meses |

## 2. User Journey Mapping

### 2.1 Fases da Jornada
| Fase | Emoção | Touchpoint | Pain Point | Oportunidade |
|------|--------|-----------|-----------|-------------|
| Descoberta | Curioso | Landing page, ads | Não entende o valor | Melhorar headline |
| Cadastro | Esperançoso | Form, email | Muitos campos | Social login |
| Primeiro uso | Ansioso | Onboarding | Não sabe por onde começar | Wizard interativo |
| Uso recorrente | Confiante | Dashboard | Acesso lento a features | Atalhos / favoritos |
| Pagamento | Preocupado | Checkout | Dúvida sobre valor | Testimonial, ROI |
| Suporte | Frustrado | Chat/email | Respostas genéricas | Base de conhecimento |
| Renovação | Decidido | Billing page | Preço alto | Desconto anual |

### 2.2 Journey Map Template
```
[Persona] → [Fase 1] → [Fase 2] → [Fase 3]
   Ações:     ...        ...        ...
   Pensamentos: ...      ...        ...
   Emoções:   😊/😟      😊/😟       😊/😟
   Touchpoints: ...      ...        ...
   Pain Points: ...      ...        ...
   Oportunidades: ...    ...        ...
```

## 3. Testes de Usabilidade

### 3.1 Protocolo
| Etapa | Descrição | Duração |
|-------|-----------|---------|
| Briefing | Explicar tarefas, garantir conforto | 2 min |
| Tarefa 1 | [Tarefa core] | 5 min |
| Tarefa 2 | [Tarefa secundária] | 5 min |
| Debrief | Feedback geral | 3 min |

### 3.2 Métricas de Usabilidade
| Métrica | Alvo | Como Medir |
|---------|------|-----------|
| Task success rate | > 80% | Completa sem ajuda |
| Time on task | < 2 min | Cronômetro |
| Error rate | < 10% | Ações incorretas |
| SUS score | > 70 | Questionário pós-teste |
| NPS | > 40 | Padrão |

## 4. Heurísticas de Nielsen

1. Visibilidade do status do sistema
2. Correspondência entre sistema e mundo real
3. Controle e liberdade do usuário
4. Consistência e padrões
5. Prevenção de erros
6. Reconhecer ao invés de lembrar
7. Flexibilidade e eficiência de uso
8. Estética e design minimalista
9. Ajudar usuários a reconhecer e recuperar de erros
10. Ajuda e documentação

## 5. Checklist

- [ ] 5+ entrevistas de usuário realizadas
- [ ] Personas validadas com dados reais
- [ ] Journey map de usuário principal criado
- [ ] Testes de usabilidade com > 5 participantes
- [ ] SUS score calculado e > 70
- [ ] Heatmaps e session recordings analisados
- [ ] Findings documentados e priorizados

## 6. AI-First Notes

> Qualquer mudança na UI deve ser precedida de pesquisa ou hipótese validada. A IA deve sugerir testes A/B baseados nos pain points da jornada.
