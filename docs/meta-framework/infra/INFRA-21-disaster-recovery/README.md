# INFRA-21 - Disaster Recovery

> **Prioridade:** ALTO
> **Depende de:** BACK-05, INFRA-19
> **É dependência de:** 23
> **Categoria:** infra

## 1. Cenarios de Desastre

| Cenario | Probabilidade | Impacto | RTO | RPO |
|---------|-------------|---------|-----|-----|
| VPS cai | Media | Alto | 15min | 0 (sem perda) |
| DB corrompe | Baixa | Critico | 1h | 24h (backup) |
| Redis cai | Media | Medio | 5min | toleravel (cache) |
| Provider IA cai | Alta | Medio | 30s (fallback) | 0 |
| Dados apagados acidentalmente | Baixa | Critico | 4h | 1h (backup incremental) |
| Regiao AWS cai | Muito baixa | Critico | 4h | 24h |
| Ataque ransomware | Baixa | Critico | 24h | 24h |
| Chave API vazada | Media | Alto | 5min | 0 |

**RTO** = Recovery Time Objective (quanto tempo ate voltar)
**RPO** = Recovery Point Objective (quanto dado pode perder)

## 2. Estrategia de Backup

### PostgreSQL

| Tipo | Frequencia | Retencao | Onde |
|------|-----------|---------|------|
| Full dump | Diario (3am) | 30 dias | VPS + S3 |
| WAL archiving | Continuo | 7 dias | S3 |
| Logical backup | Semanal | 90 dias | S3 (outra regiao) |

### Script de Backup

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"
S3_BUCKET="s3://saas-backups"
DB_NAME="saas_db"
DB_USER="saas"

# Full dump
docker exec saas-postgres pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/full_$DATE.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/full_$DATE.sql.gz" "$S3_BUCKET/postgresql/full_$DATE.sql.gz"

# Cleanup local (keep 7 days)
find $BACKUP_DIR -name "full_*.sql.gz" -mtime +7 -delete

# Cleanup S3 (keep 30 days)
aws s3 ls $S3_BUCKET/postgresql/ | awk '{print $4}' | while read f; do
  CREATED=$(echo $f | grep -oP '\d{8}')
  if [ "$CREATED" -lt "$(date -d '-30 days' +%Y%m%d)" ]; then
    aws s3 rm "$S3_BUCKET/postgresql/$f"
  fi
done
```

### Redis

```
Redis = cache. NAO precisa de backup critico.
Config: appendonly yes (persistence basica)
Se perder: repopula com proximas requests (cache miss → DB)
```

## 3. Plano de Recovery por Cenario

### Cenario 1: VPS Cai

```
1. Alerta: health check falha (30s)
2. Acessar painel do provider (Hetzner/DigitalOcean)
3. Se reboot nao resolve:
   a. Provisionar nova VPS
   b. Restaurar codigo (git pull)
   c. Restaurar .env (secure storage)
   d. Restaurar DB (dump mais recente)
   e. docker compose up -d
   f. Verificar /health
   g. atualizar DNS (se IP mudou)
4. RTO estimado: 15-30min
5. RPO: 0 (dados no volume ou no backup)
```

### Cenario 2: PostgreSQL Corrompe

```
1. Detectar: queries falhando, health check DB
2. Parar aplicacao (docker compose stop api)
3. Avaliar nivel de corrompimento:
   a. Uma tabela: restaurar apenas a tabela
   b. DB inteiro: restaurar full backup
4. Restauracao:
   docker exec -i saas-postgres psql -U saas saas_db < backup.sql
5. Verificar integridade:
   docker exec saas-postgres psql -U saas -c "SELECT count(*) FROM users"
6. Reiniciar API
7. RTO: 1h / RPO: 24h (ultimo backup diario)
```

### Cenario 3: Dados Apagados Acidentalmente

```
1. Parar acesso de escrita (feature flag: read_only = true)
2. Nao restaurar backup completo (perde dados novos)
3. Opcoes:
   a. Point-in-time recovery (se WAL archiving ativo)
   b. Restaurar backup em DB separado + migrar dados especificos
4. Script:
   # Restaurar em DB temporario
   createdb saas_recovery
   psql -U saas saas_recovery < backup.sql
   # Exportar dados da tabela afetada
   pg_dump -U saas saas_recovery -t affected_table > recovery.sql
   # Importar no DB principal
   psql -U saas saas_db < recovery.sql
5. Verificar consistencia
6. Desligar read_only
```

### Cenario 4: Chave API Vazada

```
1. IMEDIATAMENTE: revogar chave no provider (console)
2. Gerar nova chave
3. Atualizar no sistema:
   - Atualizar providers.api_key_encrypted
   - Invalidar cache Redis da chave
4. Verificar logs de uso suspeito (hora, IP, volume)
5. Se houve consumo por terceiro: contatar provider para estorno
6. Comunicar usuarios afetados (se houve downtime)
7. Post-mortem: como vazou?
```

## 4. Runbook (Referencia Rapida)

### Comandos de Emergencia

```bash
# Verificar o que esta rodando
docker compose -f docker/docker-compose.prod.yml ps

# Reiniciar servico especifico
docker compose -f docker/docker-compose.prod.yml restart api

# Ver logs em tempo real
docker compose -f docker/docker-compose.prod.yml logs -f api

# Ver logs das ultimas 100 linhas
docker compose -f docker/docker-compose.prod.yml logs --tail 100 api

# Restaurar DB
gunzip -c backups/full_20260422.sql.gz | docker exec -i saas-postgres psql -U saas saas_db

# Health check manual
curl -f http://localhost:3000/health

# Status do SSL
certbot certificates

# Renovar SSL manualmente
certbot renew

# Verificar portas abertas
ss -tulpn

# Verificar uso de disco
df -h

# Verificar uso de memoria
free -h

# Verificar processes pesados
top -o %MEM

# Limpar docker nao usado
docker system prune -af --volumes
```

## 5. Teste de Recovery

Executar mensalmente:

```bash
# 1. Criar backup
./scripts/backup.sh

# 2. Em VPS de staging:
#    - Provisionar VPS limpa
#    - Restaurar backup
#    - docker compose up
#    - Verificar /health
#    - Verificar dados (SELECT count)

# 3. Registro:
#    - Data do teste
#    - Tempo de recovery (RTO real)
#    - Perda de dados (RPO real)
#    - Problemas encontrados
```

## 6. Checklist

- [ ] Backup automatico diario (cron + S3)
- [ ] WAL archiving ativo no PostgreSQL
- [ ] Script de backup testado
- [ ] Runbook acessível (documento impresso ou offline)
- [ ] Teste de recovery mensal
- [ ] RTO/RPO definidos para cada cenario
- [ ] Chaves de API com processo de rotacao
- [ ] .env backup em local seguro (nao no git)
- [ ] DNS com TTL baixo (300s) para failover rapido
- [ ] VPS snapshot semanal (provider feature)
- [ ] S3 em regiao diferente do DB