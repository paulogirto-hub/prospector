# OPS-42 - Auto-Cura e Resiliência Autônoma (AIOps)

> **Prioridade:** ALTO
> **Depende de:** OPS-22, OPS-23, OPS-35
> **É dependência de:** 20, 21
> **Categoria:** ops

## 1. Do Monitoramento à Ação

Enquanto a Observabilidade (OPS-22) diz "há um problema", a Auto-Cura diz "já resolvi".

### Ciclo de Auto-Cura
1. **Detect:** Identificação de anomalia via métricas (Pino/Prometheus).
2. **Analyze:** Agente de Ops analisa o log e o contexto do sistema.
3. **Execute:** Execução de um Runbook (OPS-35) ou correção de código automática.
4. **Verify:** Validação se a métrica voltou ao normal.
5. **Report:** Notificação ao humano com o histórico: Problema -> Causa -> Solução.

---

## 2. Cenários de Auto-Cura Comuns

| Falha | Ação Autônoma |
|-------|---------------|
| **Vazamento de Memória** | Reiniciar pod/container + gerar Heap Dump para análise posterior. |
| **Lentidão no DB** | Identificar Query, sugerir índice ou escalar RDS (Vertical Scaling). |
| **Ataque de Força Bruta** | Adicionar IP ao bloqueio dinâmico no firewall/WAF. |
| **Erro de Provedor IA** | Ativar Fallback (ADV-06) e monitorar status do provedor primário. |
| **Disco Cheio** | Limpeza de logs antigos e arquivos temporários não rotacionados. |

---

## 3. Auto-Patching de Segurança

Ao detectar uma vulnerabilidade crítica (via INFRA-36), o sistema pode:
1. **Criar um branch automático.**
2. **Atualizar a biblioteca vulnerável.**
3. **Rodar o Pipeline de Testes.**
4. **Abrir um PR ou fazer deploy em staging** para aprovação final imediata.

---

## 4. Limites da Autonomia (Safety Gates)

Para evitar que a IA tome decisões desastrosas:
- **Human-in-the-loop:** Ações que envolvam destruição de dados ou custos acima de $100 requerem aprovação manual.
- **Rollback Rate Limit:** O sistema não pode fazer mais de 3 rollbacks automáticos por hora sem travar a pipeline para revisão humana.

---

## 5. Checklist de Resiliência Autônoma

- [ ] Agentes de AIOps com acesso "ReadOnly" aos logs e "Write" controlado à infra.
- [ ] Runbooks técnicos traduzidos para linguagem de máquina acionável.
- [ ] Sistema de alerta "Silencioso" (resolve e avisa depois).
- [ ] Dashboard de "Incidentes Resolvidos Autonomamente".
