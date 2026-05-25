# ─── Stage 1: Build React app ─────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Cache node_modules layer — chỉ reinstall khi package-lock.json thay đổi
COPY package*.json ./
RUN npm ci

# Copy source và build
COPY . .
RUN npm run build
# Output: /app/dist/

# ─── Stage 2: Serve static dist/ bằng Nginx ───────────────────────────────────
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Xoá default nginx static assets
RUN rm -rf ./*

# Copy compiled React app từ stage 1
COPY --from=builder /app/dist .

# Copy SPA-aware nginx config (SPA routing + asset caching)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
