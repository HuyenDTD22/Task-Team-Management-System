# Deployment Guide — Task & Team Management System

> **Target:** AWS EC2 t3.small (Ubuntu 22.04 LTS) | HTTP only | Docker Compose

---

## Kiến Trúc Production

```
Internet (port 80)
        │
        ▼
┌──────────────────────────────────────┐
│   nginx:1.27-alpine  (reverse proxy) │
│   /api/* → backend:8080              │
│   /      → frontend:80               │
└──────────┬──────────────┬────────────┘
           │              │   task-manager-network
           ▼              ▼
  ┌──────────────┐  ┌──────────────────┐
  │ backend:8080 │  │  frontend:80     │
  │ Spring Boot  │  │  nginx:alpine    │
  │ + Flyway     │  │  serving dist/   │
  └──────┬───────┘  └──────────────────┘
         │
         ▼
  ┌──────────────┐
  │ postgres:5432│
  │ PostgreSQL 16│
  │ /data volume │
  └──────────────┘
```

---

## Bước 1: Tạo EC2 Instance

1. Vào **AWS Console → EC2 → Launch Instance**
2. Cấu hình:
   - **AMI**: Ubuntu Server 22.04 LTS (64-bit x86)
   - **Instance type**: `t3.small` (2 vCPU, 2GB RAM)
   - **Storage**: 20GB GP3
   - **Key pair**: Tạo mới hoặc dùng key có sẵn → lưu file `.pem`
3. **Security Group** — thêm inbound rules:
   | Type | Protocol | Port | Source |
   |------|----------|------|--------|
   | SSH | TCP | 22 | My IP (chỉ cho IP của bạn) |
   | HTTP | TCP | 80 | 0.0.0.0/0 |
4. Launch instance → ghi lại **Public IPv4 address**

---

## Bước 2: Kết Nối SSH

```bash
chmod 400 ~/.ssh/your-key.pem
ssh -i ~/.ssh/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## Bước 3: Cài Docker Engine

```bash
# Cập nhật packages
sudo apt-get update && sudo apt-get upgrade -y

# Cài prerequisite packages
sudo apt-get install -y ca-certificates curl gnupg

# Thêm Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Thêm Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài Docker Engine + Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Thêm user ubuntu vào group docker (không cần sudo khi chạy docker)
sudo usermod -aG docker ubuntu

# Áp dụng group change ngay lập tức
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Bước 4: Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/<YOUR_GITHUB_USERNAME>/Task-Team-Management-System.git task-manager
cd task-manager
```

---

## Bước 5: Tạo File `.env`

```bash
cp .env.example .env
nano .env
```

Điền tất cả giá trị trong file. Các lệnh tạo secret:

```bash
# Tạo mật khẩu database mạnh
openssl rand -base64 24

# Tạo JWT secret (256-bit)
openssl rand -base64 64
```

| Biến | Giá trị |
|------|---------|
| `POSTGRES_DB` | `taskmanager` |
| `POSTGRES_USER` | `taskmanager_user` |
| `POSTGRES_PASSWORD` | Kết quả của `openssl rand -base64 24` |
| `JWT_SECRET` | Kết quả của `openssl rand -base64 64` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Secret |
| `FRONTEND_URL` | `http://<EC2_PUBLIC_IP>` |
| `GHCR_USERNAME` | GitHub username của bạn |
| `IMAGE_TAG` | `latest` |

---

## Bước 6: First Deploy

```bash
# (Nếu repo private) Đăng nhập GHCR để pull images
echo "<GITHUB_PERSONAL_ACCESS_TOKEN>" | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin

# Pull images từ GHCR
docker compose pull

# Khởi động toàn bộ stack
docker compose up -d

# Theo dõi logs (Ctrl+C để thoát)
docker compose logs -f
```

> ⏳ Chờ ~60-90 giây để backend khởi động hoàn toàn (Spring Boot + Flyway migrations).

---

## Bước 7: Verify Deployment

```bash
# Kiểm tra 4 containers đang chạy
docker compose ps

# Test health endpoint
curl http://localhost/api/v1/actuator/health
# Kết quả mong đợi: {"status":"UP",...}

# Test frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost/
# Kết quả mong đợi: 200
```

Mở browser: `http://<EC2_PUBLIC_IP>` → ứng dụng React phải load được.

---

## Thiết Lập GitHub Actions CI/CD

### 1. Thêm Repository Secrets

Vào: `https://github.com/<username>/Task-Team-Management-System/settings/secrets/actions`

Thêm 3 secrets:

| Secret Name | Giá trị | Cách lấy |
|---|---|---|
| `EC2_HOST` | EC2 public IP (vd: `13.215.12.34`) | AWS Console → EC2 → Instance → Public IPv4 |
| `EC2_SSH_KEY` | Toàn bộ nội dung file `.pem` | `cat your-key.pem` rồi copy |
| `GHCR_USERNAME` | GitHub username của bạn | |

> ⚠️ `GITHUB_TOKEN` được GitHub **tự động inject** — KHÔNG cần thêm thủ công.

### 2. Luồng CI/CD

Sau khi thiết lập xong, mỗi lần push lên `main`:

```
push to main
    │
    ├── JOB 1: test (chạy mvn test với PostgreSQL service container)
    │       ↓ pass
    ├── JOB 2: build-and-push
    │       Build backend image  → push ghcr.io/.../backend:sha-xxx + :latest
    │       Build frontend image → push ghcr.io/.../frontend:sha-xxx + :latest
    │       ↓ success
    └── JOB 3: deploy
            SSH vào EC2 → docker compose pull → docker compose up -d
```

---

## Các Lệnh Thường Dùng

```bash
# Xem trạng thái containers
docker compose ps

# Xem logs realtime
docker compose logs -f
docker compose logs -f backend       # chỉ backend
docker compose logs --tail=100       # 100 dòng cuối

# Restart một service
docker compose restart backend

# Pull images mới và redeploy (thủ công, không cần CI)
docker compose pull && docker compose up -d --remove-orphans

# Dừng tất cả
docker compose down

# Dừng VÀ XOÁ database (CẢNH BÁO: mất data!)
docker compose down -v

# Kết nối vào PostgreSQL
docker exec -it taskmanager-db psql -U taskmanager_user -d taskmanager

# Kiểm tra resource usage
docker stats
```

---

## Rollback

```bash
# 1. Tìm SHA tag từ lịch sử GitHub Actions run
# 2. Sửa IMAGE_TAG trong .env:
nano .env
# IMAGE_TAG=sha-abc1234

# 3. Redeploy với version cũ
docker compose up -d --remove-orphans
```

---

## Backup Database

```bash
# Backup
docker exec taskmanager-db pg_dump -U taskmanager_user taskmanager \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore (CẢNH BÁO: ghi đè data hiện tại)
docker exec -i taskmanager-db psql -U taskmanager_user -d taskmanager \
  < backup_20240101_120000.sql
```

---

## Troubleshooting

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Backend container restart liên tục | DB chưa ready | Xem `docker compose logs postgres`, chờ healthcheck pass |
| `502 Bad Gateway` | Backend crash | `docker compose logs backend` → xem lỗi |
| Lỗi CORS khi dùng app | `FRONTEND_URL` sai | Kiểm tra `.env`: `FRONTEND_URL` phải match URL bạn mở trên browser |
| Refresh token không hoạt động | Cookie bị block | Kiểm tra `nginx/nginx.conf` có `proxy_pass_header Set-Cookie` không |
| Login thất bại (401 liên tục) | `APP_COOKIE_SECURE` chưa set | Kiểm tra `docker-compose.yml` backend có `APP_COOKIE_SECURE: "false"` không |
| Không kết nối được EC2 | Security Group sai | AWS Console → Security Group → kiểm tra inbound rule port 80, 22 |
| Pull image bị lỗi 403 | Chưa đăng nhập GHCR | Chạy `docker login ghcr.io` với GitHub PAT |
| Hết disk space | Accumulated images | `docker image prune -a -f` (cẩn thận: xoá tất cả images không dùng) |
| Port 80 đã bị dùng | Process khác chiếm | `sudo lsof -i :80` → `sudo kill <PID>` |
