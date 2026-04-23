# INFRA-19 - Deploy e Infraestrutura

> **Prioridade:** CRÍTICO
> **Depende de:** CORE-03, BACK-05, INFRA-18
> **É dependência de:** 20, 21, 22
> **Categoria:** infra

## 1. Arquitetura de Producao

```
Internet
    │
    ▼
┌──────────────────────────────────────────────┐
│  Cloudflare / CDN                             │
│  - DDoS protection                            │
│  - SSL termination (edge)                     │
│  - Static assets cache                        │
│  - WAF rules                                  │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│  VPS (Hetzner / DigitalOcean / AWS EC2)       │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  NGINX (reverse proxy)                    │ │
│  │  - SSL termination (certbot)              │ │
│  │  - Rate limiting (global)                 │ │
│  │  - Static files (/dist)                   │ │
│  │  - Proxy pass → :3000 (API)              │ │
│  │  - Proxy pass → :3001 (Frontend SSR)     │ │
│  └──────────────┬───────────────────────────┘ │
│                 │                               │
│  ┌──────────────▼───────────────────────────┐ │
│  │  Docker Compose                           │ │
│  │                                           │ │
│  │  ┌─────────┐  ┌─────────┐  ┌───────────┐ │ │
│  │  │ API     │  │ Frontend│  │ Redis     │ │ │
│  │  │ :3000   │  │ :3001   │  │ :6379     │ │ │
│  │  └────┬────┘  └─────────┘  └─────┬─────┘ │ │
│  │       │                             │      │ │
│  │  ┌────▼─────────────────────────────▼───┐ │ │
│  │  │  PostgreSQL :5432                     │ │ │
│  │  │  (data volume + backup cron)          │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

## 2. Requisitos Minimos de VPS

| Recurso | Minimo (MVP) | Recomendado (100+ users) |
|---------|-------------|-------------------------|
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 4 GB | 8 GB |
| Disco | 40 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Bandwidth | 1 TB/mes | 5 TB/mes |

### Custos Estimados

| Provider | Spec | Preco/mes |
|----------|------|----------|
| Hetzner CX22 | 2 vCPU, 4GB, 40GB | EUR 6.90 (~R$ 42) |
| DigitalOcean Basic | 2 vCPU, 4GB, 80GB | US$ 24 (~R$ 135) |
| AWS Lightsail | 2 vCPU, 4GB, 80GB | US$ 32 (~R$ 180) |
| Vultr | 2 vCPU, 4GB, 80GB | US$ 24 (~R$ 135) |

**Recomendacao:** Hetzner para comecar (melhor custo). AWS se precisar de escalabilidade depois.

## 3. Setup da VPS (Passo a Passo)

### 3.1 Acesso Inicial

```bash
# 1. Acessar VPS
ssh root@IP_DA_VPS

# 2. Criar usuario deploy (nunca rodar como root)
adduser deploy
usermod -aG sudo deploy
su - deploy

# 3. Configurar SSH com chave (desabilitar senha)
# No seu computador local:
ssh-keygen -t ed25519 -f ~/.ssh/saas-deploy
ssh-copy-id -i ~/.ssh/saas-deploy.pub deploy@IP_DA_VPS

# 4. Hardening SSH (no servidor)
sudo nano /etc/ssh/sshd_config
# Mudar:
#   PermitRootLogin no
#   PasswordAuthentication no
#   Port 2222  (outra porta)
sudo systemctl restart sshd
```

### 3.2 Firewall

```bash
# UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp    # SSH (sua porta)
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

### 3.3 Fail2ban

```bash
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.local
```

```ini
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3.4 Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### 3.5 Certbot (SSL)

```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d api.dominio.com -d dominio.com
# Certificados salvos em /etc/letsencrypt/live/dominio.com/

# Auto-renovacao
sudo crontab -e
# Adicionar:
0 3 * * * certbot renew --quiet --deploy-hook "docker compose -f /home/deploy/app/docker/docker-compose.yml restart nginx"
```

## 4. Docker Compose (Producao)

```yaml
# docker/docker-compose.prod.yml
version: "3.9"

services:
  api:
    build:
      context: ../
      dockerfile: docker/Dockerfile
    container_name: saas-api
    restart: always
    env_file: ../.env
    environment:
      NODE_ENV: production
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "1.0"

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: saas-frontend
    restart: always
    ports:
      - "127.0.0.1:3001:3000"
    depends_on:
      - api
    deploy:
      resources:
        limits:
          memory: 512M

  postgres:
    image: postgres:16-alpine
    container_name: saas-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: saas-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: saas-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ../frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - api
      - frontend

volumes:
  postgres_data:
  redis_data:
```

## 5. Dockerfile

```dockerfile
# docker/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

## 6. NGINX (Producao)

```nginx
# nginx/nginx.prod.conf
worker_processes auto;
events { worker_connections 1024; }

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection 0 always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=global:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 256;

    # Upstreams
    upstream api {
        server api:3000;
    }

    upstream frontend {
        server frontend:3001;
    }

    # HTTP → HTTPS redirect
    server {
        listen 80;
        server_name dominio.com api.dominio.com;
        return 301 https://$host$request_uri;
    }

    # API
    server {
        listen 443 ssl http2;
        server_name api.dominio.com;

        ssl_certificate /etc/letsencrypt/live/api.dominio.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.dominio.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        client_max_body_size 1M;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # SSE support
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 86400s;
        }

        location /v1/agents/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_buffering off;
            proxy_cache off;
        }

        # API docs (public)
        location /docs {
            proxy_pass http://api;
        }

        location /health {
            proxy_pass http://api;
        }
    }

    # Frontend
    server {
        listen 443 ssl http2;
        server_name dominio.com;

        ssl_certificate /etc/letsencrypt/live/dominio.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/dominio.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Static assets cache
        location /_next/static/ {
            proxy_pass http://frontend;
            expires 365d;
            add_header Cache-Control "public, immutable";
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 7. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_IP }}
          username: deploy
          port: ${{ secrets.VPS_PORT }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/deploy/app
            git pull origin main
            docker compose -f docker/docker-compose.prod.yml build --no-cache api
            docker compose -f docker/docker-compose.prod.yml up -d api
            sleep 10
            curl -f http://localhost:3000/health || exit 1
            docker image prune -f
```

## 8. Backup Automatico

```bash
# Cron no servidor (crontab -e)

# Backup PostgreSQL todo dia as 3am
0 3 * * * docker exec saas-postgres pg_dump -U saas saas_db | gzip > /home/deploy/backups/db_$(date +\%Y\%m\%d).sql.gz

# Manter 30 dias de backup
0 4 * * * find /home/deploy/backups -name "db_*.sql.gz" -mtime +30 -delete

# Upload backup para S3 (opcional)
0 5 * * * aws s3 cp /home/deploy/backups/db_$(date +\%Y\%m\%d).sql.gz s3://saas-backups/db/
```

## 9. DNS

| Registro | Tipo | Valor | TTL |
|----------|------|-------|-----|
| dominio.com | A | IP_DA_VPS | 300 |
| api.dominio.com | A | IP_DA_VPS | 300 |
| www.dominio.com | CNAME | dominio.com | 300 |

## 10. Checklist de Deploy

- [ ] VPS provisionada (2 vCPU, 4GB min)
- [ ] Usuario deploy criado (nao root)
- [ ] SSH com chave (senha desabilitada)
- [ ] Firewall UFW ativo (80, 443, SSH)
- [ ] Fail2ban ativo
- [ ] Docker + Docker Compose instalados
- [ ] .env configurado com todos os valores
- [ ] SSL certbot configurado
- [ ] NGINX configurado com security headers
- [ ] Docker compose prod rodando
- [ ] Health check respondendo (/health)
- [ ] Backup automatico (cron)
- [ ] CI/CD deploy automatico
- [ ] DNS apontando para VPS
- [ ] Cloudflare ativo (CDN + WAF)