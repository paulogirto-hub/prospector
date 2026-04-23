# OPS-35 - FinOps e Otimização de Recursos

> **Prioridade:** ALTO
> **Depende de:** CORE-03, INFRA-19, OPS-22
> **É dependência de:** 29
> **Categoria:** ops

## 1. Cultura FinOps

Garantir que o sistema seja economicamente eficiente, tratando o custo de nuvem como uma métrica de engenharia de primeira classe.

### Estratégia de Tagging (Rastreabilidade)
Todos os recursos criados (EC2, RDS, Buckets) devem possuir tags obrigatórias:
- `Project`: Nome do sistema.
- `Environment`: dev, staging, prod.
- `Owner`: Time ou responsável.
- `CostCenter`: Departamento ou cliente (essencial para SaaS multi-tenant).

---

## 2. Otimização de Custos em IA

O custo de LLMs pode ser o maior gasto do sistema. Estratégias obrigatórias:

- **Prompt Caching:** Usar recursos de cache de providers (como Anthropic ou OpenAI) para prompts de sistema longos.
- **Model Routing:** Usar modelos menores/baratos (ex: GPT-4o-mini, Haiku) para tarefas simples como classificação ou resumo, reservando modelos grandes (Opus, GPT-4o) para lógica complexa.
- **Token Budgeting:** Definir limites rígidos de `max_tokens` por requisição e por usuário/dia.

---

## 3. Infraestrutura Inteligente

### Auto-scaling Preditivo
- Escalar recursos baseando-se em métricas de negócio (ex: número de conexões ativas ou tamanho da fila do Redis) e não apenas em CPU/Memória.
- **Scheduled Scaling:** Aumentar a capacidade 10 minutos antes de horários de pico conhecidos e reduzir drasticamente em horários de baixa (madrugadas).

### Armazenamento em Camadas (Storage Tiering)
- **Hot Data (S3 Standard):** Dados acessados frequentemente.
- **Cold Data (S3 Glacier):** Logs e backups antigos. Política automática de transição após 30 dias.

---

## 4. Performance que Economiza

Código eficiente gasta menos CPU e menos dinheiro.
- **Caching Agressivo (Redis):** Resultados de computação pesada ou consultas lentas ao banco devem ser persistidos no Redis.
- **Database Indexing:** Auditoria semanal de consultas lentas (Slow Query Log) para criação de índices, reduzindo o tempo de processamento do RDS.

---

## 5. Checklist de Otimização Mensal

- [ ] Revisão de recursos ociosos (Zombie instances/volumes).
- [ ] Upgrade de tipos de instâncias para gerações mais novas e baratas.
- [ ] Verificação de taxas de acerto do Cache (Cache Hit Rate).
- [ ] Ajuste de quotas de IA baseado no uso real.
- [ ] Relatório de "Custo por Cliente" para validar margens.
