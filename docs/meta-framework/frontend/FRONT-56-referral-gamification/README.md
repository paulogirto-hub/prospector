# FRONT-56 - Sistema de Indicação e Gamificação

> **Prioridade:** MEDIO
> **Depende de:** FRONT-30, FRONT-55
> **É dependência de:** BIZ-57
> **Categoria:** frontend

## 1. Sistema de Indicação (Referral)

### 1.1 Mecânica do Loop
```
1. Usuário ativo recebe convite para indicar
2. Copia link único ou convida por email
3. Amigo se cadastra pelo link
4. Ambos recebem recompensa
5. Usuário vê progresso e ranking
```

### 1.2 Recompensas
| Acao | Quem Recebe | Recompensa |
|------|-----------|-----------|
| Amigo se cadastra | Indicador | +500 créditos |
| Amigo faz upgrade | Indicador | +2.000 créditos |
| Amigo ativo 7 dias | Ambos | +1.000 créditos |
| Top 10 do mes | Indicador | Badge + destaque |

### 1.3 Tracking
- Link único por usuário: `?ref=USER_ID`
- Cookie de 30 dias
- Atribuição first-touch
- Fraud detection (multi-conta, VPN)

## 2. Gamificação

### 2.1 Sistema de Níveis
| Nível | XP Necessário | Titulo | Benefício |
|-------|--------------|--------|-----------|
| 1 | 0 | Novato | - |
| 2 | 100 | Explorador | Acesso a templates |
| 3 | 300 | Colaborador | Suporte prioritário |
| 4 | 600 | Produtor | Badge no perfil |
| 5 | 1.000 | Especialista | Early access |
| 6 | 2.000 | Lider | Destaque na comunidade |
| 7 | 5.000 | Mestre | Consultoria gratuita |

### 2.2 Badges
| Badge | Como Ganhar |
|-------|------------|
| 🚀 Primeiro Voo | Criar primeiro agente |
| 🔥 Em Chamas | 7 dias consecutivos de uso |
| 💰 Economista | Economizar R$ 100 com cache |
| 🧠 Inteligente | Usar 5+ modelos diferentes |
| 🤝 Conector | Indicar 10+ amigos |
| 🏆 Campeão | Top 10 do ranking mensal |

### 2.3 Ranking
```
🏆 Ranking Mensal de Indicadores

1.  João Silva      45 indicações  🥇
2.  Maria Santos    32 indicações  🥈
3.  Pedro Costa     28 indicações  🥉
...

Você: 12 indicações  (Posição #42)
Sua meta para o Top 10: +16 indicações
```

## 3. Interface

### 3.1 Referral Widget
```
┌───────────────────────────────────┐
│  🤝 Indique e Ganhe              │
│                                   │
│  Convide amigos e ganhe créditos  │
│  para usar na plataforma!         │
│                                   │
│  [Seu link de indicação] [Copiar] │
│                                   │
│  Compartilhar: [Email] [Whats]    │
│                [LinkedIn] [X]     │
│                                   │
│  Você já indicou: 5 amigos        │
│  Créditos ganhos: R$ 25,00        │
│                                   │
│  [Ver Ranking Completo →]         │
└───────────────────────────────────┘
```

### 3.2 Gamification Dashboard
```
┌───────────────────────────────────┐
│  🎮 Seu Progresso                │
│                                   │
│  Nível 3: Colaborador            │
│  [██████░░░░] 340/600 XP         │
│                                   │
│  Badges: 🚀 🔥 💰 🧠              │
│  [Ver todos (4)]                  │
│                                   │
│  Proximos desafios:              │
│  □ Indicar 5 amigos (+100 XP)   │
│  □ Usar AI-10 por 3 dias (+75 XP)│
│  □ Completar onboarding (+200 XP)│
└───────────────────────────────────┘
```

## 4. Anti-fraude

- 1 conta por email verificado
- Bloquear indicações de mesmo IP
- Cooldown de 24h entre indicações
- Manual review para top 10 mensal

## 5. Checklist

- [ ] Link de indicação único por usuário
- [ ] Cookie de atribuição (30 dias)
- [ ] Recompensa automática ao amigo ativar
- [ ] Ranking mensal com badges
- [ ] Sistema de níveis com XP
- [ ] Widget embedável em email e UI
- [ ] Anti-fraude implementado
- [ ] Taxa de indicação > 10%

## 6. AI-First Notes

> A IA que gera o referral widget deve personalizar a copy com base no progresso do usuário e evitar spam. Cada indicação é um "micro-transaction" que deve ser rastreável.
