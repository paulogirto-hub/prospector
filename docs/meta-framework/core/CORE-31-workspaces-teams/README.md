# CORE-31 - Gestão de Organizações e Times

> **Prioridade:** ALTO
> **Depende de:** CORE-01, CORE-02, BACK-05
> **É dependência de:** 08, 17, 30
> **Categoria:** core

## 1. Conceito de Hierarquia

Para suportar clientes B2B (Enterprise), o sistema utiliza uma hierarquia de três níveis:

```
Organização (Entity) 
  └── Workspace (Ambiente)
        └── Times / Membros
```

### Nivel 1: Organização
- **Definição:** A entidade legal que paga a conta.
- **Propriedades:** CNPJ/Tax ID, Endereço de cobrança, Cartão corporativo principal.
- **Relacionamento:** 1 Organização pode ter N Workspaces.

### Nivel 2: Workspace
- **Definição:** Espaço isolado de trabalho (ex: "Marketing", "RH", "Projeto X").
- **Propriedades:** Agentes próprios, histórico de execuções próprio, limite de créditos específico.
- **Isolamento:** Dados de um Workspace não são visíveis por membros de outro, a menos que o usuário pertença a ambos.

### Nivel 3: Times e Membros
- **Definição:** Usuários reais vinculados a uma Organização ou Workspace específico.

---

## 2. Papéis e Permissões (Enterprise RBAC)

| Papel | Escopo | Permissões Principais |
|-------|--------|-----------------------|
| `Owner` | Organização | Tudo, inclusive deletar a organização e gerenciar Billing. |
| `Org Admin` | Organização | Gerenciar membros, criar/deletar workspaces, ver analytics global. |
| `Workspace Admin` | Workspace | Gerenciar agentes e membros dentro de um workspace específico. |
| `Member` | Workspace | Criar e executar agentes dentro do workspace. |
| `Viewer` | Workspace | Apenas visualizar logs e resultados (ReadOnly). |

---

## 3. Gestão de Convites

1. **Geração:** Admin gera link ou envia e-mail com `invite_token`.
2. **Expiração:** Convites expiram em 48 horas.
3. **Aceite:** 
   - Se o usuário já existe: Vincula ao novo Workspace.
   - Se não existe: Direciona para o fluxo de `/auth/register` com vínculo automático.

---

## 4. Billing Compartilhado (Shared Wallet)

O sistema permite dois modelos de cobrança para times:

### Modelo A: Consolidado (Recomendado)
- A Organização possui um saldo global de créditos.
- Todos os Workspaces consomem do mesmo saldo.
- Admin pode definir **Quotas** por Workspace (ex: Workspace Marketing pode usar no máximo 100k tokens/mês).

### Modelo B: Isolado
- Cada Workspace tem sua própria assinatura e créditos.
- Útil para agências que repassam o custo direto para clientes finais.

---

## 5. Auditoria e Governança

Todas as ações administrativas devem ser registradas no **Audit Log**:

| Ator | Ação | Recurso | Timestamp | IP |
|------|------|---------|-----------|----|
| `user_id` | `invite_sent` | `email@target.com` | `...` | `...` |
| `user_id` | `agent_deleted` | `agent_id` | `...` | `...` |
| `user_id` | `billing_updated` | `card_last_4` | `...` | `...` |

---

## 6. Checklist de Implementação

- [ ] Middleware `checkWorkspaceAccess` em todas as rotas.
- [ ] Interface de "Switch Workspace" no frontend.
- [ ] Dashboard de faturamento consolidado por organização.
- [ ] Sistema de quotas com alertas de 80% e 100% de uso.
- [ ] Exportação de logs de auditoria para CSV/JSON.
