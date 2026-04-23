# FRONT-30 - Frontend Design System (UI/UX)

> **Prioridade:** ALTO
> **Depende de:** BACK-04, AI-12, ADV-27
> **É dependência de:** (nenhum)
> **Categoria:** frontend

## 1. Stack Frontend

| Tecnologia | Versao | Funcao |
|-----------|--------|--------|
| Next.js | 14 (App Router) | Framework React SSR |
| React | 18 | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Utility-first CSS |
| shadcn/ui | Latest | Component library |
| Radix UI | Latest | Primitives (acessibilidade) |
| TanStack Query | 5 | Data fetching + cache |
| Zustand | 4+ | Client state |
| React Hook Form | 7+ | Forms |
| Zod | 3+ | Validation (shared com backend) |
| Framer Motion | 11+ | Animacoes |
| Lucide Icons | Latest | Icones |

## 2. Design Tokens

### Cores

```css
:root {
  /* Slate (base) */
  --slate-50:  #F8FAFC;
  --slate-100: #F1F5F9;
  --slate-200: #E2E8F0;
  --slate-300: #CBD5E1;
  --slate-400: #94A3B8;
  --slate-500: #64748B;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1E293B;
  --slate-900: #0F172A;
  --slate-950: #020617;

  /* Brand (primary) */
  --brand-50:  #EFF6FF;
  --brand-100: #DBEAFE;
  --brand-200: #BFDBFE;
  --brand-300: #93C5FD;
  --brand-400: #60A5FA;
  --brand-500: #3B82F6;  /* Primary */
  --brand-600: #2563EB;
  --brand-700: #1D4ED8;
  --brand-800: #1E40AF;
  --brand-900: #1E3A8A;

  /* Semantic */
  --success: #10B981;
  --success-light: #D1FAE5;
  --warning: #F59E0B;
  --warning-light: #FEF3C7;
  --error: #EF4444;
  --error-light: #FEE2E2;
  --info: #3B82F6;
  --info-light: #DBEAFE;
}
```

### Tipografia

| Token | Valor | Uso |
|-------|-------|-----|
| font-sans | Inter, system-ui, sans-serif | Body text |
| font-mono | JetBrains Mono, monospace | Code, tokens |
| text-xs | 0.75rem (12px) | Badges, meta |
| text-sm | 0.875rem (14px) | Labels, helper text |
| text-base | 1rem (16px) | Body |
| text-lg | 1.125rem (18px) | Card titles |
| text-xl | 1.25rem (20px) | Section titles |
| text-2xl | 1.5rem (24px) | Page titles |
| text-3xl | 1.875rem (30px) | Hero titles |
| font-normal | 400 | Body |
| font-medium | 500 | Labels |
| font-semibold | 600 | Titles, buttons |
| font-bold | 700 | Headings |

### Espacamento

| Token | Valor | Uso |
|-------|-------|-----|
| space-0.5 | 2px | Inline gaps |
| space-1 | 4px | Icon gaps |
| space-2 | 8px | Tight padding |
| space-3 | 12px | Input padding |
| space-4 | 16px | Card padding |
| space-6 | 24px | Section gaps |
| space-8 | 32px | Section padding |
| space-12 | 48px | Page sections |
| space-16 | 64px | Hero spacing |

### Bordas

| Token | Valor | Uso |
|-------|-------|-----|
| radius-sm | 6px | Badges, tags |
| radius-md | 8px | Buttons, inputs |
| radius-lg | 12px | Cards, modals |
| radius-xl | 16px | Feature cards |
| radius-full | 9999px | Avatars, pills |

### Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Cards |
| shadow-md | 0 4px 6px rgba(0,0,0,0.07) | Dropdowns |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.1) | Modals |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.1) | Overlays |

## 3. Componentes Base

### Button

| Variante | Clasees Tailwind | Uso |
|---------|-----------------|-----|
| primary | bg-brand-600 text-white hover:bg-brand-700 | Acao principal |
| secondary | bg-slate-100 text-slate-900 hover:bg-slate-200 | Acao alternativa |
| destructive | bg-error text-white hover:bg-red-600 | Deletar, cancelar |
| outline | border border-slate-300 hover:bg-slate-50 | Opcao terciaria |
| ghost | hover:bg-slate-100 | Icon buttons, menus |

| Tamanho | Padding | Font |
|---------|---------|------|
| sm | 8px 12px | text-sm |
| md | 10px 16px | text-sm |
| lg | 12px 24px | text-base |

### Input

```
┌──────────────────────────────────────┐
│ Label                                │
│ ┌──────────────────────────────────┐  │
│ │ Placeholder text                │  │  ← 40px height, radius-md
│ └──────────────────────────────────┘  │
│ Helper text / Error message           │
└──────────────────────────────────────┘

States: default → focus (ring-2 brand) → error (border-error) → disabled (opacity-50)
```

### Card

```
┌──────────────────────────────────────┐
│  ┌────┐                              │
│  │Icon│  Title                Action │  ← 16px padding, radius-lg
│  └────┘  Description                   shadow-sm
│                                       │
│  Content area                         │
│                                       │
│  ┌────────────────────────────────┐   │
│  │  Footer / Actions             │   │
│  └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

### Toast / Notification

| Tipo | Cor | Icone | Uso |
|------|-----|-------|-----|
| success | green | CheckCircle | Operacao bem sucedida |
| error | red | XCircle | Erro |
| warning | yellow | AlertTriangle | Atencao |
| info | blue | Info | Informacao |

### Status Badge

| Status | Cor | Texto |
|--------|-----|-------|
| active | green | Ativo |
| paused | yellow | Pausado |
| draft | gray | Rascunho |
| archived | gray | Arquivado |
| pending | blue | Pendente |
| approved | green | Aprovado |
| rejected | red | Recusado |
| running | blue (pulse) | Executando |

## 4. Layout

### App Shell

```
┌─────────────────────────────────────────────────┐
│  ┌─────┐  Logo  SaaS Platform    [Search]  [🔔] [Avatar] │
│  ├─────┤────────────────────────────────────────┤
│  │     │                                        │
│  │ S   │  Main Content Area                     │
│  │ I   │                                        │
│  │ D   │  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ E   │  │ Card │ │ Card │ │ Card │            │
│  │ B   │  └──────┘ └──────┘ └──────┘            │
│  │ A   │                                        │
│  │ R   │  [Content]                              │
│  │     │                                        │
│  │     │                                        │
│  └─────┤────────────────────────────────────────┘
│                                                  │
└──────────────────────────────────────────────────┘
```

### Sidebar Items

```
🏠 Dashboard        → /dashboard
🤖 Agents           → /agents
💳 Billing           → /billing
👥 Team              → /team (admin/manager only)
⚙️ Settings          → /settings
📊 Analytics         → /analytics (admin only)
🔧 Admin             → /admin (admin only)
```

### Responsive Breakpoints

| Breakpoint | Largura | Layout |
|-----------|---------|--------|
| Mobile | < 640px | Sidebar escondida, bottom nav |
| Tablet | 640-1024px | Sidebar colapsada (icons only) |
| Desktop | > 1024px | Sidebar expandida |

## 5. Paginas Principais

### 5.1 Login

```
┌──────────────────────────────────────────┐
│                                          │
│         ┌────────────────────┐           │
│         │   LOGO              │           │
│         │                    │           │
│         │   Email            │           │
│         │   [____________]    │           │
│         │                    │           │
│         │   Senha             │           │
│         │   [____________]    │           │
│         │                    │           │
│         │   [ ENTRAR ]       │           │
│         │                    │           │
│         │   Esqueceu a senha?│           │
│         │   Criar conta      │           │
│         └────────────────────┘           │
│                                          │
└──────────────────────────────────────────┘

Largura card: 400px
Centrado verticalmente
Background: slate-50 com pattern sutil
```

### 5.2 Dashboard

```
┌─────────────────────────────────────────────────┐
│  Bem-vindo, {{name}}                    [Notifs]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐│
│  │ Agents   │ │ Execucoes│ │ Creditos │ │Plano││
│  │    5     │ │   142    │ │ 45k/500k │ │ Pro ││
│  │  +2 este │ │  +12 hoje│ │  9% usado │ │     ││
│  │   mes    │ │          │ │          │ │     ││
│  └──────────┘ └──────────┘ └──────────┘ └─────┘│
│                                                  │
│  Execucoes Recentes                              │
│  ┌──────────────────────────────────────────────┐│
│  │ Agent        Input           Status  Tokens  ││
│  │ Support Bot  "How to..."    ✓ Comp  250     ││
│  │ Code Review  "Refactor..."  ✓ Comp  1200    ││
│  │ Writer Bot   "Blog post..." ◌ Run   —       ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  [Criar Novo Agent]                              │
└─────────────────────────────────────────────────┘
```

### 5.3 Agent Detail (Chat Interface)

```
┌──────────────────────────────────────────────────┐
│  ← Voltar    Agent: Support Bot    [Edit] [Pause]│
├──────────────────────────────────────────────────┤
│                                                   │
│  Chat Area (scroll)                               │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🤖 Support Bot                              │ │
│  │ Olá! Como posso ajudar?                     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│          ┌──────────────────────────────────────┐ │
│          │ 👤 Você                               │ │
│          │ Como resetar minha senha?            │ │
│          └──────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 🤖 Support Bot                              │ │
│  │ Para resetar sua senha, siga os passos...    │ │
│  │                                             │ │
│  │ ⚡ 350 tokens · $0.003 · 1.2s             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
├──────────────────────────────────────────────────┤
│  [Digite sua mensagem...              ] [Enviar] │
│                                                   │
│  Tokens restantes: 449.650          Modelo: gpt-4o│
└──────────────────────────────────────────────────┘
```

### 5.4 Billing

```
┌──────────────────────────────────────────────────┐
│  Planos                                           │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Free    │  │   Pro    │  │Enterprise│        │
│  │  R$ 0    │  │ R$ 49,90 │  │ Sob dem. │        │
│  │          │  │          │  │          │        │
│  │ 5k tok  │  │ 500k tok │  │ Ilimitado│        │
│  │ 1 agent │  │ 10 agents│  │ Ilimitado│        │
│  │          │  │ Priority │  │ SLA 99.9%│        │
│  │          │  │          │  │ Suporte  │        │
│  │ [Atual] │  │ [Upgrade]│  │ [Contato]│        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                   │
│  Historico de Transacoes                          │
│  ┌──────────────────────────────────────────────┐│
│  │ Data       Descricao    Valor   Status       ││
│  │ 22/04      Pro Mensal   R$49,90 Aprovado    ││
│  │ 15/04      100k tokens  R$9,90  Aprovado    ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### 5.5 Agents List

```
┌──────────────────────────────────────────────────┐
│  Meus Agents                        [+ Novo Agent]│
│                                                   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────┐│
│  │ 🤖            │ │ 🤖            │ │ 🤖        ││
│  │ Support Bot   │ │ Code Review  │ │ Writer    ││
│  │ gpt-4o-mini   │ │ claude-3.5   │ │ gpt-4o   ││
│  │ ● Ativo       │ │ ● Ativo      │ │ ○ Pausado ││
│  │ 142 exec      │ │ 38 exec      │ │ 0 exec   ││
│  │ [Chat] [Edit] │ │ [Chat] [Edit]│ │ [Edit]   ││
│  └───────────────┘ └───────────────┘ └───────────┘│
│                                                   │
│  Criar Agent (Modal)                              │
│  ┌──────────────────────────────────────────────┐│
│  │ Nome: [____________]                         ││
│  │ Modelo: [Select ▼]                          ││
│  │ Provider: [Select ▼]                        ││
│  │ System Prompt:                               ││
│  │ [____________________________________]       ││
│  │ [____________________________________]       ││
│  │ Temperatura: ──●─────── 0.7                 ││
│  │ Max tokens: ──●─────── 4000                 ││
│  │                                              ││
│  │          [Cancelar]  [Criar Agent]           ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

## 6. Animacoes (Framer Motion)

| Elemento | Animacao | Duracao |
|----------|---------|---------|
| Page transition | fade + slide up | 200ms |
| Card hover | translateY(-2px) + shadow | 150ms |
| Modal open | scale(0.95→1) + fade | 200ms |
| Toast | slide from right | 300ms |
| Token stream | typewriter effect | instant |
| Loading dots | pulse | 1.4s loop |
| Status change | color crossfade | 300ms |

### Streaming Typewriter

```tsx
function StreamingText({ content }: { content: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.05 }}
    >
      {content}
      <span className="animate-pulse">▌</span>
    </motion.span>
  )
}
```

## 7. Acessibilidade (a11y)

| Regra | Implementacao |
|-------|--------------|
| Contraste | WCAG AA minimo (4.5:1 texto, 3:1 large) |
| Focus visible | Ring azul em todos os interativos |
| Keyboard nav | Tab order logico, Escape fecha modals |
| Screen reader | aria-label em icones, aria-live em toasts |
| Reduced motion | `prefers-reduced-motion: reduce` desliga animacoes |
| Color blind | Nunca usar so cor para indicar status (usar icone + texto) |
| Font scale | Layout funciona ate 200% zoom |

## 8. Dark Mode

### Implementacao

```tsx
// next-themes
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### Cores Dark

```css
.dark {
  --background: var(--slate-950);
  --foreground: var(--slate-50);
  --card: var(--slate-900);
  --border: var(--slate-800);
  --muted: var(--slate-800);
  --muted-foreground: var(--slate-400);
  --primary: var(--brand-500);
  --primary-foreground: white;
  --destructive: var(--error);
  --success: var(--success);
}
```

## 9. Mobile

### Bottom Navigation (Mobile)

```
┌──────────────────────────────────┐
│                                  │
│       [Content Area]            │
│                                  │
├──────┬──────┬──────┬────────────┤
│  🏠  │  🤖  │  💳  │  ⚙️       │
│ Home │Agents│Billing│ Settings  │
└──────┴──────┴──────┴────────────┘
```

### Adaptacoes Mobile

| Componente | Desktop | Mobile |
|-----------|---------|--------|
| Sidebar | Expandida 240px | Bottom nav |
| Cards | Grid 3 colunas | Stack vertical |
| Table | Tabela completa | Card list |
| Modal | Centrado, 500px | Full screen bottom sheet |
| Chat input | Barra fixa bottom | Barra fixa bottom (maior) |
| Agent run | Sidebar de historico | Swipe para historico |

## 10. Estrutura de Pastas (Frontend)

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout (providers, fonts)
│   ├── page.tsx               # Landing / redirect
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard shell (sidebar + header)
│   │   ├── page.tsx            # Dashboard home
│   │   ├── agents/
│   │   │   ├── page.tsx        # List
│   │   │   ├── new/page.tsx    # Create
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Detail/Settings
│   │   │       └── chat/page.tsx  # Chat interface
│   │   ├── billing/
│   │   │   ├── page.tsx        # Plans
│   │   │   └── transactions/page.tsx
│   │   ├── team/page.tsx      # Team management
│   │   ├── settings/page.tsx  # Profile settings
│   │   └── admin/
│   │       ├── users/page.tsx
│   │       ├── providers/page.tsx
│   │       ├── analytics/page.tsx
│   │       └── audit-logs/page.tsx
│   └── api/                    # API routes (webhook proxy etc)
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── mobile-nav.tsx
│   │   └── app-shell.tsx
│   ├── agents/
│   │   ├── agent-card.tsx
│   │   ├── agent-form.tsx
│   │   ├── agent-chat.tsx
│   │   ├── streaming-text.tsx
│   │   └── token-counter.tsx
│   ├── billing/
│   │   ├── plan-card.tsx
│   │   ├── transaction-table.tsx
│   │   └── credits-bar.tsx
│   └── shared/
│       ├── loading.tsx
│       ├── error-boundary.tsx
│       ├── empty-state.tsx
│       └── confirm-dialog.tsx
├── hooks/
│   ├── use-auth.ts
│   ├── use-websocket.ts
│   ├── use-agents.ts
│   ├── use-subscription.ts
│   └── use-feature-flag.ts
├── lib/
│   ├── api-client.ts           # Fetch wrapper
│   ├── auth.ts                 # Token management
│   ├── utils.ts                # cn(), formatCurrency(), etc
│   └── validations.ts          # Shared Zod schemas
├── stores/
│   ├── auth-store.ts
│   └── ui-store.ts             # Sidebar state, theme
└── public/
    ├── logo.svg
    └── favicon.ico
```

## 11. Checklist

- [ ] Design tokens definidos (cores, fonte, spacing, radius, shadow)
- [ ] shadcn/ui componentes instalados
- [ ] Dark mode implementado
- [ ] Layout responsivo (mobile + tablet + desktop)
- [ ] Sidebar + bottom nav mobile
- [ ] Paginas: login, dashboard, agents, chat, billing
- [ ] Chat interface com streaming typewriter
- [ ] Formularios com React Hook Form + Zod
- [ ] TanStack Query para data fetching + cache
- [ ] WebSocket hook para notificacoes
- [ ] Acessibilidade (WCAG AA)
- [ ] Animacoes sutis (Framer Motion)
- [ ] Error boundary nas paginas
- [ ] Loading states (skeleton + spinner)
- [ ] Empty states (informative)