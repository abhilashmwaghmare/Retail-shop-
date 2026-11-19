# =============================================================================
# Production Multi-Stage Dockerfile for E-Commerce Backend Service
# Security Standards: Non-root user (UID 10001), minimal Alpine base,
# dumb-init signal handling, built-in health check probe.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependency Installation & Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /build

# Install build dependencies for potential native bindings
RUN apk add --no-cache python3 make g++

# Copy package manifests first for optimal layer caching
COPY backend/package*.json ./

# Install only production dependencies using clean install
RUN npm ci --only=production --ignore-scripts || npm install --production

# Copy backend source code
COPY backend/src/ ./src/

# -----------------------------------------------------------------------------
# Stage 2: Hardened Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install dumb-init for proper PID 1 signal forwarding (SIGTERM / SIGINT)
RUN apk add --no-cache dumb-init wget \
    && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Security: Create non-root user and group (UID 10001)
RUN addgroup -g 10001 appgroup && \
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser

# Set runtime production environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Copy application artifacts from builder stage with strict ownership
COPY --from=builder --chown=appuser:appgroup /build/ ./

# Drop all root privileges
USER 10001:10001

EXPOSE 5000

# Container Healthcheck targeting Kubernetes-aligned /healthz endpoint
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/healthz || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
