# SHRD-63 - Conformidade Global (GDPR, CCPA, HIPAA)

> **Prioridade:** ALTO
> **Depende de:** SHRD-33, SHRD-61, CORE-01
> **É dependência de:** (nenhum)
> **Categoria:** shared

## 1. Mapa de Jurisdições

| Regulação | Região | Escopo | Penalidade |
|-----------|--------|--------|-----------|
| LGPD | Brasil | Dados pessoais | Até 2% do faturamento |
| GDPR | União Europeia | Dados pessoais | Até € 20 MM ou 4% |
| CCPA/CPRA | Califórnia | Dados de consumidores | Até US$ 7.500 por violação |
| HIPAA | EUA (saúde) | PHI (dados de saúde) | Até US$ 1.5 MM/ano |
| PIPEDA | Canadá | Dados pessoais | Até CAD 100.000 |
| POPIA | África do Sul | Dados pessoais | Até R 10 MM |

## 2. Direitos do Titular

### 2.1 GDPR / LGPD / CCPA
| Direito | GDPR | LGPD | CCPA | Implementação |
|---------|------|------|------|---------------|
| Acesso | ✅ Art. 15 | ✅ Art. 18 | ✅ | API / Dashboard |
| Retificação | ✅ Art. 16 | ✅ Art. 18 | ✅ | PUT /users/me |
| Exclusão | ✅ Art. 17 | ✅ Art. 18 | ✅ | DELETE /users/me |
| Portabilidade | ✅ Art. 20 | ✅ Art. 18 | ✅ | JSON export |
| Oposição | ✅ Art. 21 | ✅ Art. 18 | ✅ | Opt-out toggle |
| Não-discriminação | - | - | ✅ | Política pública |

### 2.2 Endpoints de Compliance
```
GET    /users/me/data        → Exportar todos os dados (portabilidade)
DELETE /users/me             → Exclusão com confirmação
PUT    /users/me             → Retificação
POST   /users/me/opt-out     → Oposição ao processamento
GET    /users/me/audit-log   → Acesso a logs de processamento
```

## 3. Transferência Internacional de Dados

### 3.1 Mecanismos Legais
| Mecanismo | Jurisdições | Requisitos |
|-----------|------------|-----------|
| Adequacy Decision | UE → Brasil (futuro) | Reconhecimento mútuo |
| SCCs (Standard Contractual Clauses) | UE → EUA | Cláusulas modelo da CE |
| BCRs | Intra-grupo | Aprovado por DPA |
| Consentimento Explícito | Qualquer | Livre, específico, informado |

### 3.2 Infraestrutura por Região
```
Brasil → Datacenter em São Paulo (LGPD)
UE     → Datacenter em Frankfurt (GDPR)
EUA    → Datacenter em Virginia (CCPA/HIPAA)
Canadá → Datacenter em Toronto (PIPEDA)
```

## 4. HIPAA (se aplicável)

### 4.1 Requisitos Técnicos
- Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256)
- Controle de acesso baseado em função (RBAC + PHI-specific)
- Logs de auditoria imutáveis (7 anos)
- Backup e disaster recovery testado anualmente
- Business Associate Agreements (BAAs) com todos os vendors

### 4.2 Dados PHI
| Tipo | Exemplo | Proteção |
|------|---------|----------|
| Identificador | Nome, CPF, email | Criptografado |
| Biométrico | Impressão digital | Nunca armazenado |
| Genético | Perfil genético | Nunca coletado |
| Saúde | Diagnóstico, tratamento | Criptografado + auditoria |

## 5. Checklist de Conformidade

- [ ] Política de privacidade por jurisdição
- [ ] Cookie consent banner com granularidade
- [ ] DPO (Data Protection Officer) designado
- [ ] Registro de processamento de dados (ROPA)
- [ ] DPIA (Data Protection Impact Assessment) para novos features
- [ ] Incident response plan para vazamentos
- [ ] Notificação em 72h (GDPR) / sem razoável (LGPD)
- [ ] Treinamento anual de equipe
- [ ] Auditoria externa anual

## 6. AI-First Notes

> A IA deve sempre solicitar jurisdição antes de configurar processamento de dados. Todo novo módulo passa por DPIA. Nunca assuma que uma única política serve para todas as regiões.
