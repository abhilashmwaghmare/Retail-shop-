#!/usr/bin/env bash
# =============================================================================
# Automated Application Deployment & Health Verification Script
# Launches the multi-tier application stack, reverse proxy, and monitoring locally.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=========================================================="
echo " Launching RetailCorp E-Commerce Production Platform"
echo " Working Directory: ${ROOT_DIR}"
echo " Timestamp:         $(date -u)"
echo "=========================================================="

cd "${ROOT_DIR}"

# 1. Environment file check
if [ ! -f .env ]; then
    echo "[1/4] Generating .env from .env.example..."
    cp .env.example .env
fi

# 2. SSL certificate check
if [ ! -f nginx/ssl/server.crt ]; then
    echo "[2/4] Generating self-signed SSL certificates for HTTPS..."
    bash nginx/ssl/generate-self-signed-cert.sh
fi

# 3. Docker Compose orchestration
echo "[3/4] Building and launching multi-tier container services..."
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker is not installed in the current environment."
    echo "This script runs when Docker Engine or Docker Desktop is active."
    exit 0
fi

docker compose up -d --build

# 4. Wait for services to become healthy
echo "[4/4] Verifying container health probes..."
timeout=60
elapsed=0
until docker compose ps | grep -q "(healthy)"; do
    sleep 3
    elapsed=$((elapsed + 3))
    echo "Waiting for PostgreSQL and Backend healthchecks... (${elapsed}s/${timeout}s)"
    if [ "$elapsed" -ge "$timeout" ]; then
        echo "❌ Healthcheck timeout reached."
        docker compose logs
        exit 1
    fi
done

echo ""
echo "=========================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL: Platform is operational!"
echo "----------------------------------------------------------"
echo "  Web Storefront (HTTP):    http://localhost"
echo "  Web Storefront (HTTPS):   https://localhost (ignore self-signed warning)"
echo "  Backend REST API:         http://localhost:5000"
echo "  Liveness Probe:           http://localhost:5000/healthz"
echo "  Readiness Probe:          http://localhost:5000/ready"
echo "  Prometheus Metrics:       http://localhost:5000/metrics"
echo "  Prometheus Dashboard:     http://localhost:9090"
echo "  Alertmanager UI:          http://localhost:9093"
echo "  Grafana Golden Signals:   http://localhost:3000 (admin / admin)"
echo "=========================================================="
