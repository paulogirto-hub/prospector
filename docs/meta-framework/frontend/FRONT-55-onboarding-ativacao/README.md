# FRONT-55 - Onboarding e Ativacao de Usuarios

> **Prioridade:** ALTO
> **Depende de:** FRONT-30, FRONT-52
> **É dependência de:** FRONT-56
> **Categoria:** frontend

## 1. Primeiro Valor (Aha Moment)

### 1.1 Definição
> O "Aha Moment" é o momento em que o usuário experimenta o valor real do produto pela primeira vez e compreende por que precisa dele.

### 1.2 Aha Moment por Perfil
| Perfil | Aha Moment | Tempo Alvo |
|--------|-----------|-----------|
| Desenvolvedor | Primeiro agente rodando com sucesso | < 5 min |
| Manager | Dashboard com métricas de uso do time | < 10 min |
| Admin | Configuração completa + primeiro usuário convidado | < 15 min |

## 2. Onboarding Flow

### 2.1 Welcome Screen
```
Bem-vindo, [nome]! 👋

Vamos configurar seu primeiro agente em 3 passos:
[████░░░░░░] 1/3

Passo 1: Escolha um template
[Template 1] [Template 2] [Template 3]
Ou comece do zero →
```

### 2.2 Progressive Onboarding
| Momento | Intervenção | Objetivo |
|---------|-----------|---------|
| T+0 | Welcome modal | Contexto + expectativa |
| T+2min | Tooltip na feature principal | Descoberta |
| T+5min | Primeiro valor entregue | Ativação |
| T+1dia | Email com dica #1 | Engajamento |
| T+3dias | In-app notification: "Descubra X" | Feature adoption |
| T+7dias | Nudge de upgrade (se engajado) | Monetização |

### 2.3 Checklist de Onboarding
```
□ Criar primeiro agente
□ Executar primeiro teste
□ Convidar 1 membro da equipe
□ Explorar dashboard
□ Configurar notificações
```

## 3. Walkthroughs e Tours

### 3.1 Tipos de Tour
| Tipo | Quando Usar | Duração |
|------|-------------|---------|
| Product tour | Primeiro login | 2-3 min |
| Feature spotlight | Nova feature lançada | 30s |
| Contextual tooltip | Ao passar mouse sobre elemento | Instant |
| Video tutorial | Features complexas | 1-2 min |

### 3.2 Regras de Tour
- Sempre permitir skip e replay
- Não bloquear a UI (modal não-obrigatório)
- Highlight visual no elemento relevante
- Progresso claro (barra ou passos)
- CTA ao final: "Começar a usar"

## 4. Gamificacao de Onboarding

### 4.1 Sistema de Pontos
| Acao | Pontos | Badge |
|------|--------|-------|
| Criar primeiro agente | 50 | "Iniciante" |
| Executar 10 vezes | 100 | "Explorador" |
| Convidar 1 membro | 75 | "Colaborador" |
| Completar onboarding | 200 | "Mestre" |
| Upgrade para Pro | 500 | "Profissional" |

### 4.2 Progress Bar
```
Seu progresso: 150/500 XP
[██████░░░░░░░░░░] 30%

Proximos passos:
□ Executar agente 5x (+50 XP)
□ Convidar um colega (+75 XP)
□ Explorar templates (+25 XP)
```

## 5. Reengajamento

### 5.1 Dormant User Flow
| Tempo Inativo | Acao |
|---------------|------|
| 3 dias | Push notification: "Novo template disponível" |
| 7 dias | Email com dica de produtividade |
| 14 dias | Email: "Você está perdendo Y" |
| 30 dias | Oferta especial ou feedback survey |
| 60 dias | "Vamos ajudar você a comecar de novo" |

## 6. Checklist

- [ ] Aha Moment definido e mensurável
- [ ] Onboarding flow com < 5 passos até primeiro valor
- [ ] Progressive disclosure implementado
- [ ] Checklist interativo na dashboard
- [ ] Gamificação com pontos e badges
- [ ] Reengajamento para usuários inativos
- [ ] Taxa de ativação (d0-d7) > 40%

## 7. AI-First Notes

> A IA que conduz o onboarding deve ser personalizada pelo perfil de usuário (detectado pelo signup) e nunca exigir informações já coletadas.
