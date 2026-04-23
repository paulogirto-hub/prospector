# BACK-37 - Quality Gates e Auditoria Automática

> **Prioridade:** ALTO
> **Depende de:** BACK-11, SHRD-33, CORE-34, INFRA-36
> **É dependência de:** Entrega final do sistema.
> **Categoria:** backend

## 1. O Juiz do Sistema

Quality Gates são condições obrigatórias que o código deve satisfazer antes de ser considerado "Pronto para Produção" (Definition of Done).

### Critérios Técnicos (Automáticos)
- **Cobertura de Testes:** Mínimo 70% de cobertura de linhas.
- **Complexidade Ciclomática:** Funções não devem exceder complexidade 10 (manutenibilidade).
- **Security Grade:** Nota A em scans de vulnerabilidades (SAST).
- **Performance:** Latência de P95 < 200ms em rotas críticas.

---

## 2. Auditoria de IA (Self-Auditing)

Como este framework é usado por IAs, incluímos um passo de **Auto-Auditoria**. Antes de entregar um módulo, a IA deve rodar este checklist mental:

1. **Conformidade de Arquitetura:** O código segue os padrões definidos na CORE-34?
2. **Conformidade de Segurança:** Todos os inputs são sanitizados e o RBAC é verificado?
3. **Conformidade de Erros:** As respostas de erro usam os códigos da BACK-25?
4. **Documentação:** O novo código gerou/atualizou as specs OpenAPI necessárias?

---

## 3. Documentação como Código (Self-Documenting)

O sistema deve possuir mecanismos para se auto-documentar:
- **Swagger/OpenAPI:** Gerado automaticamente a partir das definições de rotas e schemas (Zod).
- **Diagramas de Entidade-Relacionamento (ERD):** Gerados a partir do arquivo Prisma/SQL.
- **Dependency Graph:** Visualização de como os serviços e arquivos se conectam.

---

## 4. Gestão de Dívida Técnica

- **TODOs e FIXMEs:** Devem ser rastreados e ter uma "data de expiração". Se não forem resolvidos, o build falha.
- **Depreciação:** Rotas e funções marcadas como `@deprecated` devem ser removidas em no máximo 2 versões.

---

## 5. Auditoria Humana (Spot Checks)

Embora a automação seja forte, auditorias manuais aleatórias devem validar:
- **Design Patterns:** Uso correto de Factory, Singleton, Strategy, etc.
- **UX Writing:** Qualidade e tom de voz das mensagens do sistema.
- **Acessibilidade:** Testes manuais com leitores de tela.

---

## 6. Checklist de Qualidade

- [ ] Arquivo `quality-report.json` gerado a cada build.
- [ ] Bloqueio de merge se o Quality Gate falhar.
- [ ] Revisão de logs de erro em staging antes da promoção para prod.
- [ ] Validação de custos (FinOps) integrada ao relatório de qualidade.
