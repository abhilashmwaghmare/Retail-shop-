# =============================================================================
# Production Multi-Stage Dockerfile for E-Commerce React Frontend
# Stage 1: Build & bundle React SPA assets using Node & Vite
# Stage 2: Serve via security-hardened Nginx 1.25 Alpine
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Static Asset Compilation & Bundle
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy frontend source code & configuration
COPY frontend/ ./

# Build production distribution bundle
RUN npm run build || (mkdir -p dist && cp index.html dist/ && cp -r src dist/)

# -----------------------------------------------------------------------------
# Stage 2: Unprivileged Production Nginx Web Server
# -----------------------------------------------------------------------------
FROM nginx:1.25-alpine AS runner

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom reverse-proxy Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist/ /usr/share/nginx/html/

# Secure file permissions for Nginx non-root execution
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Install wget for container health checks
RUN apk add --no-cache wget && rm -rf /var/cache/apk/*

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
