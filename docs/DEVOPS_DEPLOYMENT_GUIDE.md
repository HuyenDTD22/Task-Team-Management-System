# DevOps & Deployment Guide — Task & Team Management System

> Version: 1.0 | Last updated: 2026-05-12
> Target: AWS EC2 Ubuntu 22.04 LTS với Docker Compose

---

## 1. Production Architecture Overview

```
                        ┌────────────────────────────────────┐
Internet User           │         AWS Cloud                  │
     │                  │                                    │
     │ HTTPS            │  ┌──────────────────────────────┐  │
     ▼                  │  │  EC2: t3.small               │  │
  Browser               │  │  Ubuntu 22.04 LTS            │  │
     │                  │  │  2 vCPU, 2GB RAM             │  │
     ▼                  │  │                              │  │
  Route 53              │  │  ┌────────────────────────┐  │  │
  (DNS A Record)        │  │  │   Docker Engine        │  │  │
     │                  │  │  │                        │  │  │
     ▼                  │  │  │  nginx (:80/:443)      │  │  │
  EC2 Public IP ────────┼──┼──┤   ├─ frontend:3000    │  │  │
                        │  │  │   └─ backend:8080      │  │  │
                        │  │  │                        │  │  │
                        │  │  │  postgres:5432         │  │  │
                        │  │  │  (internal only)       │  │  │
                        │  │  └────────────────────────┘  │  │
                        │  └──────────────────────────────┘  │
                        │                                    │
                        │  Security Group:                   │
                        │    Inbound: 22, 80, 443            │
                        │    Outbound: All                   │
                        └────────────────────────────────────┘
```

---

## 2. AWS EC2 Instance Setup

### 2.1 Instance Configuration

| Setting | Value | Lý do |
|---------|-------|-------|
| Instance type | `t3.small` (2 vCPU, 2GB RAM) | Đủ cho demo/development. Free tier: t2.micro (1GB RAM — có thể OOM với Java) |
| AMI | Ubuntu 22.04 LTS | Stable, long-term support, phổ biến nhất |
| Storage | 20GB gp3 | Đủ cho code, Docker images, và PostgreSQL data |
| Region | ap-southeast-1 (Singapore) | Gần nhất với VN → latency thấp hơn |

### 2.2 Security Group Rules

```
Inbound Rules:
┌──────────────┬──────────┬─────────────────┬────────────────────────────┐
│ Type         │ Protocol │ Port            │ Source                     │
├──────────────┼──────────┼─────────────────┼────────────────────────────┤
│ SSH          │ TCP      │ 22              │ Your IP only (MyIP)        │
│ HTTP         │ TCP      │ 80              │ 0.0.0.0/0 (everyone)       │
│ HTTPS        │ TCP      │ 443             │ 0.0.0.0/0 (everyone)       │
└──────────────┴──────────┴─────────────────┴────────────────────────────┘

Outbound Rules: All traffic (default)
```

**QUAN TRỌNG**: SSH (port 22) chỉ mở cho IP của bạn, không mở cho `0.0.0.0/0`.

### 2.3 SSH Key Setup

```bash
# Download .pem file từ AWS
# Set correct permissions (required by SSH)
chmod 400 ~/.ssh/task-manager-key.pem

# SSH vào EC2
ssh -i ~/.ssh/task-manager-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## 3. Ubuntu Server Setup

### 3.1 Initial Server Hardening

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip htop

# Setup UFW firewall (additional layer)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check firewall status
sudo ufw status
```

### 3.2 Create Deploy User (Best Practice)

```bash
# Không deploy bằng ubuntu user root — tạo user riêng
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

# Copy SSH key cho deploy user
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## 4. Docker Installation

### 4.1 Install Docker Engine

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## 5. Project Docker Architecture

### 5.1 Directory Structure (Production)

```
/home/deploy/task-manager/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf            # Frontend nginx config
├── nginx/
│   └── nginx.conf            # Reverse proxy config
├── docker-compose.yml        # Dev
├── docker-compose.prod.yml   # Production
├── .env                      # ⚠️ NEVER commit this
├── .env.example              # Template (commit this)
└── docs/
```

### 5.2 Backend Dockerfile

```dockerfile
# backend/Dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache dependencies layer (separate from source code)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build application
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Runtime (minimal image)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifact
COPY --from=builder /app/target/*.jar app.jar

# Change ownership
RUN chown appuser:appgroup app.jar
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:8080/api/v1/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:+UseContainerSupport", \
    "-Dspring.profiles.active=prod", \
    "-jar", "app.jar"]
```

### 5.3 Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Cache node_modules layer
COPY package*.json ./
RUN npm ci

# Build React app
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# frontend/nginx.conf (SPA routing support)
server {
    listen 3000;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.4 Nginx Reverse Proxy Config

```nginx
# nginx/nginx.conf
upstream frontend_service {
    server frontend:3000;
}

upstream backend_service {
    server backend:8080;
}

# HTTP → HTTPS redirect (production)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json text/css application/javascript;

    # Frontend
    location / {
        proxy_pass http://frontend_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 5.5 Docker Compose — Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: taskmanager-db
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - task-manager-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: taskmanager-backend
    restart: always
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${DB_USERNAME}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_ACCESS_EXPIRY: ${JWT_ACCESS_EXPIRY:-1800000}
      JWT_REFRESH_EXPIRY: ${JWT_REFRESH_EXPIRY:-604800000}
      FRONTEND_URL: ${FRONTEND_URL}
      SPRING_PROFILES_ACTIVE: prod
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - task-manager-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: /api/v1
    container_name: taskmanager-frontend
    restart: always
    networks:
      - task-manager-network
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: taskmanager-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_certs:/etc/nginx/certs:ro
    depends_on:
      - frontend
      - backend
    networks:
      - task-manager-network

volumes:
  postgres_data:
  nginx_certs:

networks:
  task-manager-network:
    driver: bridge
```

---

## 6. Environment Variables

### 6.1 .env.example (commit this)

```bash
# .env.example — Template cho environment variables
# Copy file này thành .env và điền giá trị thực

# Database
DB_NAME=taskmanager
DB_USERNAME=taskmanager_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# JWT (minimum 32 characters random string)
# Generate: openssl rand -base64 64
JWT_SECRET=CHANGE_ME_AT_LEAST_32_CHARS_RANDOM_STRING
JWT_ACCESS_EXPIRY=1800000    # 30 minutes in ms
JWT_REFRESH_EXPIRY=604800000 # 7 days in ms

# Application
FRONTEND_URL=https://yourdomain.com
SPRING_PROFILES_ACTIVE=prod
```

### 6.2 Generate Secrets

```bash
# Generate strong JWT secret (256-bit = 32 bytes = 44 chars base64)
openssl rand -base64 64

# Generate strong database password
openssl rand -base64 24
```

### 6.3 Secret Management Rules

```
✅ Commit:  .env.example (template, no real values)
✅ Commit:  application.yml (references ${ENV_VAR})
✅ Commit:  application-dev.yml (safe dev defaults only)

❌ Never commit: .env (real secrets)
❌ Never commit: application-prod.yml with hardcoded secrets
❌ Never log: passwords, tokens, secrets
```

---

## 7. Deployment Workflow

### 7.1 First Deployment

```bash
# 1. SSH vào EC2
ssh -i ~/.ssh/key.pem deploy@<EC2_IP>

# 2. Clone repository
cd /home/deploy
git clone https://github.com/your-username/task-manager.git
cd task-manager

# 3. Tạo .env file
cp .env.example .env
nano .env   # Điền giá trị thực

# 4. Build và start (lần đầu — mất 5-10 phút)
docker compose -f docker-compose.prod.yml up -d --build

# 5. Kiểm tra status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f

# 6. Verify
curl http://localhost/api/v1/actuator/health
```

### 7.2 Update Deployment (Re-deploy)

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild và restart (zero-downtime không cần thiết cho MVP)
docker compose -f docker-compose.prod.yml up -d --build

# 3. Clean up old images
docker image prune -f
```

### 7.3 Useful Docker Commands

```bash
# Xem logs realtime
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Restart 1 service
docker compose -f docker-compose.prod.yml restart backend

# Stop tất cả
docker compose -f docker-compose.prod.yml down

# Stop và xóa volumes (⚠️ XÓA DATA)
docker compose -f docker-compose.prod.yml down -v

# Exec vào container
docker exec -it taskmanager-backend sh

# Xem resource usage
docker stats

# Connect tới PostgreSQL
docker exec -it taskmanager-db psql -U taskmanager_user -d taskmanager
```

---

## 8. HTTPS Setup với Let's Encrypt

### 8.1 Certbot Installation

```bash
# Install Certbot
sudo apt install -y certbot

# Stop nginx nếu đang chạy trên port 80
docker compose -f docker-compose.prod.yml stop nginx

# Generate certificate (phải có domain đã trỏ về EC2 IP)
sudo certbot certonly --standalone \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email your@email.com \
    --agree-tos \
    --non-interactive

# Certificates lưu tại:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 8.2 Mount Certificates vào Nginx

```yaml
# docker-compose.prod.yml — update nginx service
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/certs:ro
```

### 8.3 Auto-renewal

```bash
# Certbot auto-renewal cron job
sudo crontab -e

# Thêm dòng này:
0 0 1 * * certbot renew --quiet && docker compose -f /home/deploy/task-manager/docker-compose.prod.yml restart nginx
```

---

## 9. GitHub Actions CI/CD (Suggestion)

### 9.1 Simple Deploy Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Run tests
        run: mvn test -pl backend

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: deploy
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/deploy/task-manager
            git pull origin main
            docker compose -f docker-compose.prod.yml up -d --build
            docker image prune -f
```

### 9.2 GitHub Secrets cần setup

```
EC2_HOST      = EC2 public IP hoặc domain
EC2_SSH_KEY   = Private key SSH (nội dung file .pem)
```

---

## 10. Production Checklist

### Trước khi deploy
- [ ] Tất cả secrets trong `.env`, không hardcode trong code
- [ ] `.env` trong `.gitignore`
- [ ] Spring profile: `prod` (không phải `dev`)
- [ ] `application-prod.yml`: logging level là `INFO`, không phải `DEBUG`
- [ ] CORS config: chỉ allow frontend domain, không dùng `*`
- [ ] Docker images build thành công local
- [ ] `docker compose up` test local thành công

### Sau khi deploy
- [ ] HTTPS hoạt động (`https://yourdomain.com`)
- [ ] API endpoint trả về 200: `https://yourdomain.com/api/v1/actuator/health`
- [ ] Login flow hoạt động end-to-end
- [ ] PostgreSQL data persists (restart docker → data vẫn còn)
- [ ] Logs không chứa ERROR messages
- [ ] Response time acceptable (< 2s cho API calls)

---

## 11. Monitoring & Troubleshooting

### 11.1 Spring Boot Actuator

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics
      base-path: /api/v1/actuator
  endpoint:
    health:
      show-details: when-authorized
```

```bash
# Health check
curl https://yourdomain.com/api/v1/actuator/health

# Response
{"status":"UP","components":{"db":{"status":"UP"},"diskSpace":{"status":"UP"}}}
```

### 11.2 Common Issues & Solutions

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Backend container keeps restarting | DB not ready | Add `depends_on` with healthcheck |
| 502 Bad Gateway | Backend not running | Check `docker logs taskmanager-backend` |
| CORS error in browser | CORS config mismatch | Verify `FRONTEND_URL` env var |
| JWT token invalid | Secret key mismatch | Verify `JWT_SECRET` consistent |
| Database connection refused | Wrong host | Use service name `postgres`, not `localhost` |
| Out of memory | t2.micro không đủ RAM | Upgrade lên t3.small |
| Port already in use | Previous container running | `docker compose down` trước |

### 11.3 Log Analysis

```bash
# Real-time logs
docker compose logs -f backend 2>&1 | grep -E "ERROR|WARN"

# Xem N dòng cuối
docker compose logs --tail=200 backend

# Lọc theo thời gian
docker compose logs --since="2026-05-12T10:00:00" backend
```

---

## 12. Rollback Strategy

```bash
# Option 1: Roll back to previous Docker image (nếu dùng image tags)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Option 2: Roll back code với git
git log --oneline -10           # Xem commit history
git checkout <previous-commit>  # Checkout version cũ
docker compose -f docker-compose.prod.yml up -d --build

# Option 3: Database rollback (nếu có Flyway)
# ⚠️ Flyway KHÔNG tự động rollback. Phải viết migration mới để undo.
# V11__rollback_v10_changes.sql
```

---

## 13. Cách Công Ty Thực Tế Triển Khai

### Starter Startup (tương tự project này)
- EC2 + Docker Compose + Nginx
- Deploy bằng cách SSH và `git pull`
- Secrets: AWS Systems Manager Parameter Store hoặc `.env` file

### Growing Company
- Kubernetes (EKS) thay vì Docker Compose
- AWS RDS thay vì PostgreSQL container
- AWS ELB (Load Balancer) thay vì Nginx
- CI/CD: GitHub Actions → ECR → ECS

### Large Enterprise
- Microservices, Service Mesh (Istio)
- Multi-region deployment
- Blue-green deployment (zero downtime)
- Secrets: HashiCorp Vault hoặc AWS Secrets Manager
- Observability: Prometheus + Grafana + Jaeger

**Điểm quan trọng**: Cách bạn deploy trong project này (Docker Compose + Nginx trên EC2) là **exactly** cách mà nhiều startup thực sự vẫn đang làm trong production. Không phải mọi công ty đều cần Kubernetes.
