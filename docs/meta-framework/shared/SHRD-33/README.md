# SHRD-33 - Cybersecurity & Data Privacy Framework (LGPD/GDPR)

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-01, CORE-03, BACK-05
> **É dependência de:** Todas as implementações de banco de dados e API.
> **Categoria:** shared

## 1. Princípios de Cybersecurity

Este framework estabelece que todo sistema gerado deve ser **Secure by Design**.

### Zero Trust Architecture
- **Nenhum usuário ou serviço é confiável por padrão**, independentemente de estar dentro ou fora da rede.
- **Identidade Verificável:** Todo acesso requer autenticação (MFA para humanos, mTLS ou API Keys rotativas para serviços).
- **Least Privilege (Menor Privilégio):** Acessos são concedidos apenas ao recurso necessário, pelo tempo necessário.

### Proteção de Dados
- **Encryption at Rest:** Todos os dados no banco de dados e storage devem ser criptografados (AES-256).
- **Encryption in Transit:** Uso obrigatório de TLS 1.3 em todas as comunicações.
- **Sensitive Data Masking:** Dados sensíveis (PII) devem ser mascarados em logs e ambientes de staging.

---

## 2. Conformidade LGPD / GDPR

Garantir que o sistema respeite os direitos dos titulares dos dados.

### Ciclo de Vida do Dado
1. **Coleta (Consentimento):** Registro explícito de *quem*, *quando* e *para quê* o dado foi coletado.
2. **Uso:** O dado só pode ser usado para a finalidade consentida.
3. **Retenção:** Definir prazos de validade para cada tipo de dado (ex: logs de acesso por 6 meses, dados financeiros por 5 anos).
4. **Descarte:** Processos automatizados de deleção segura ou anonimização irreversível.

### Direitos do Titular (Automatizados via API)
- **Acesso e Portabilidade:** Endpoint para download de todos os dados do usuário em formato JSON/CSV.
- **Direito ao Esquecimento:** Fluxo de deleção total, incluindo backups e logs (onde permitido por lei).
- **Correção:** Interface para atualização imediata de dados imprecisos.

---

## 3. Threat Modeling (Modelagem de Ameaças)

Para cada novo módulo, deve-se considerar:
- **STRIDE:** Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.
- **Controle de Injeção:** SQL Injection, XSS, NoSQL Injection, Prompt Injection (IA).

---

## 4. Auditoria Imutável

Sistemas críticos devem possuir uma trilha de auditoria que não pode ser alterada nem pelo Admin:
- **O que:** Ação realizada.
- **Quem:** Identidade do ator.
- **Onde:** Recurso afetado.
- **Quando:** Timestamp preciso (NTP sincronizado).
- **Resultado:** Sucesso ou Falha (com código de erro).

---

## 5. Checklist de Segurança para a IA

- [ ] Senhas nunca são salvas em texto limpo (usar Argon2 ou BCrypt).
- [ ] Implementação de Rate Limiting agressivo em rotas de Auth.
- [ ] Headers de segurança ativos (HSTS, CSP, X-Frame-Options).
- [ ] Sanitização de inputs em todas as camadas (Zod + Custom Sanitizers).
- [ ] Scans de vulnerabilidades automáticos no CI/CD.
