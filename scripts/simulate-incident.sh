#!/usr/bin/env bash
# =============================================================================
# Interactive Incident Simulation Harness
# Injects reproducible real-world failures into the local environment for practice.
# =============================================================================

set -euo pipefail

echo "=========================================================="
echo " RetailCorp DevOps Real-World Incident Simulator"
echo "=========================================================="
echo "Select an incident to simulate:"
echo "  1) HTTP 502 Bad Gateway (Stops backend service)"
echo "  2) Container Continuously Restarting (Injects fatal startup config)"
echo "  3) Database Connection Failure (Mismatches DB password)"
echo "  4) Docker Build Failure (Injects invalid build syntax)"
echo "  5) High CPU Utilization (Spikes CPU to trigger alerts)"
echo "  0) Recover / Restore Stack to Normal"
echo "=========================================================="
read -p "Enter choice [0-5]: " choice

case $choice in
    1)
        echo "Injecting Scenario 1: Stopping backend container..."
        docker compose stop backend
        echo "Test with: curl -I http://localhost/api/products"
        echo "Observe: HTTP 502 Bad Gateway returned by Nginx."
        ;;
    2)
        echo "Injecting Scenario 2: Setting invalid memory limit and broken command..."
        docker compose run --name ecommerce-backend-broken -d -m 16m ecommerce-backend:1.0.0 node -e "throw new Error('Fatal startup crash');"
        echo "Observe: Container immediately exits with code 1."
        ;;
    3)
        echo "Injecting Scenario 3: Corrupting database password in .env..."
        docker compose exec backend export DB_PASSWORD=WrongPassword123! || true
        curl -i http://localhost:5000/ready || true
        echo "Observe: GET /ready reports HTTP 503 and DB health status 0."
        ;;
    4)
        echo "Injecting Scenario 4: Simulating Docker build failure..."
        docker build -t test-fail -f - . <<EOF
FROM alpine:3.19
RUN echo "Triggering intentional build failure for CI verification" && exit 1
EOF
        ;;
    5)
        echo "Injecting Scenario 5: Triggering 5-second CPU burn..."
        curl -s "http://localhost:5000/api/simulate/cpu?duration=5000"
        echo ""
        echo "Observe: Check CPU spike on Grafana and docker stats."
        ;;
    0)
        echo "Recovering all services..."
        docker compose up -d backend postgres frontend
        echo "Stack restored."
        ;;
    *)
        echo "Invalid selection."
        ;;
esac
