# SHRD-44 - Guardião Ético e Conformidade Legal Automática

> **Prioridade:** ALTO
> **Depende de:** SHRD-33, BIZ-39-prod
> **É dependência de:** Todas as interações de IA e armazenamento de dados.
> **Categoria:** shared

## 1. O Escudo Ético da IA

Garantir que a inteligência artificial do sistema opere com integridade.

### AI Red Teaming Permanente
- O sistema deve tentar constantemente "quebrar" suas próprias regras éticas para identificar falhas:
  - Tentar extrair PII (Dados Pessoais) de outros usuários.
  - Tentar gerar conteúdo preconceituoso ou perigoso.
  - Tentar burlar filtros de segurança.

### Monitoramento de Bias (Viés)
- Auditoria periódica das respostas da IA para garantir que não haja discriminação por raça, gênero, localização ou classe social.

---

## 2. Motor Legal Multi-Jurisdição

Para sistemas universais, as leis mudam conforme o país.

| Região | Requisito Principal |
|--------|---------------------|
| **Brasil (LGPD)** | Consentimento explícito + DPO (Encarregado). |
| **Europa (GDPR)** | Direito ao esquecimento + Residência de dados local. |
| **EUA (CCPA/HIPAA)** | Opt-out de venda de dados + Regras de saúde (se aplicável). |

### Atribuição e Licenciamento
- Garantir que o sistema rastreie e respeite as licenças de todo código-fonte e bibliotecas utilizadas (evitando infrações de copyright).

---

## 3. Explanabilidade (Transparency)

O sistema deve ser capaz de explicar **por que** tomou uma decisão:
- "Por que este crédito foi negado?"
- "Por que este usuário foi suspenso?"
- A resposta deve ser baseada em fatos registrados no log, sem alucinações.

---

## 4. Governança Humana (Overrule)

A IA nunca deve ter a palavra final em decisões que afetem vidas ou finanças de forma irreversível:
- Todo banimento automático deve ter um botão de "Apelar para um Humano".
- Movimentações financeiras acima de um teto (doc 31) requerem assinatura digital de um Owner.

---

## 5. Checklist Ético-Legal

- [ ] Filtros de toxicidade ativos em todas as camadas.
- [ ] Mapeamento de jurisdições e suas leis de dados.
- [ ] Trilha de auditoria para decisões da IA.
- [ ] Inventário de licenças de software atualizado.
