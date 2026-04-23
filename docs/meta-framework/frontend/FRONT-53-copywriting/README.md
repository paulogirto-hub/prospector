# FRONT-53 - Copywriting e Microcopy de Conversao

> **Prioridade:** ALTO
> **Depende de:** FRONT-30, BIZ-52
> **É dependência de:** FRONT-54
> **Categoria:** frontend

## 1. Principios de Copywriting

### 1.1 AIDA para SaaS
| Estágio | Objetivo | Exemplo no Produto |
|---------|----------|-------------------|
| Attention | Captar | Headline hero, notificação push |
| Interest | Engajar | Social proof, stats, benefício |
| Desire | Querer | Case study, testimonial, demo |
| Action | Converter | CTA clara, sem atrito |

### 1.2 Tom de Voz por Contexto
| Contexto | Tom | Exemplo |
|----------|-----|---------|
| Onboarding | Encorajador | "Vamos começar! Só 3 passos." |
| Erro | Empático + solução | "Ops, algo deu errado. Aqui está o que fazer..." |
| Sucesso | Celebrativo | "Parabéns! Seu primeiro agente está ativo." |
| Cobrança | Transparente | "Próxima cobrança: R$ 49,90 em 5 dias." |
| Suporte | Direto e humano | "Entendi. Vou te ajudar com isso agora." |

## 2. Landing Page Copy

### 2.1 Estrutura Hero Section
```
Headline (H1): [Resultado desejado] em [tempo] sem [dor]
Subheadline: Como [público] alcança [resultado] usando [produto]
CTA Primário: [Ação clara] → Ex: "Começar grátis"
CTA Secundário: [Ação alternativa] → Ex: "Ver demo"
Social Proof: "+1.200 empresas confiam"
```

### 2.2 Body Copy
- Foco no benefício, não na feature
- Bullet points com provas sociais
- FAQ para objeções comuns
- CTA repetida a cada 2-3 seções

## 3. Microcopy de Produto

### 3.1 Tipos de Microcopy
| Tipo | Exemplo | Onde |
|------|---------|------|
| Placeholder | "Ex: joão@empresa.com" | Input |
| Hint | "Mínimo 8 caracteres com 1 número" | Field help |
| Success | "Configuração salva com sucesso" | Toast |
| Error | "Senha incorreta. Tentativa 2 de 5." | Inline error |
| Empty state | "Nenhum agente ainda. Crie o primeiro!" | List vazia |
| Loading | "Carregando seus dados..." | Skeleton |

### 3.2 Regras de Microcopy
1. Curto: máximo 40 caracteres para toasts
2. Específico: "Email inválido" → "Insira um email no formato nome@dominio.com"
3. Orientado a ação: sempre sugira o próximo passo
4. Sem jargão: evite termos técnicos para usuários finais
5. Sem culpa: "Ops, não encontramos" em vez de "Você digitou errado"

## 4. Email Copy

### 4.1 Sequência de Onboarding
| Email | Assunto | Objetivo |
|-------|---------|----------|
| 1 | Bem-vindo, [nome]! | Confirmar email + primeiro valor |
| 2 | Dica #1: [Feature] | Mostrar valor rápido |
| 3 | Como [empresa similar] usa X | Social proof |
| 4 | Você está quase lá | Nudge de ativação |
| 5 | Upgrade: desbloqueie Y | Receita |

## 5. Checklist

- [ ] Tom de voz documentado e aprovado
- [ ] Headlines da landing page testadas (A/B)
- [ ] Microcopy de todos os estados (vazio, erro, carregando)
- [ ] Emails de lifecycle configurados
- [ ] Copy revisado por nativo/locutor
- [ ] Taxa de conversão da landing > 15%

## 6. AI-First Notes

> A IA que gera copy deve seguir o tom de voz e a estrutura AIDA. Todo microcopy deve ter versão curta e longa, priorizando a curta.
