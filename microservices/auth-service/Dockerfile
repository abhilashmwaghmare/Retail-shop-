FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -g 10001 appgroup && adduser -u 10001 -G appgroup -s /bin/sh -D appuser
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .
USER appuser
EXPOSE 5001
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:5001/healthz || exit 1
CMD ["node", "src/server.js"]
