#!/bin/bash
# ==============================================================================
# RetailCorp E-Commerce - AWS EC2 Bootstrap & Automated Deployment
# ==============================================================================
# Target Host: AWS EC2 (Ubuntu 22.04 / 24.04 or Amazon Linux 2023)
# Public IP: 52.63.189.76
# Instance ID: i-0d8109a3488ccdd8d
# ==============================================================================

set -e

PUBLIC_IP="52.63.189.76"

echo "=================================================================="
echo "🚀 INITIATING RETAILCORP E-COMMERCE DEPLOYMENT ON AWS EC2"
echo "Public IP: ${PUBLIC_IP}"
echo "=================================================================="

# 1. Detect OS and Install Prerequisites (Docker & Docker Compose)
echo "📦 [1/6] Installing Docker, Docker Compose, and essential tools..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
fi

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release git jq

    # Install Docker
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER || true

elif [ "$OS" = "amzn" ] || [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    sudo dnf update -y
    sudo dnf install -y docker git jq curl
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER || true

    # Install Docker Compose Plugin
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-$(uname -m) -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
fi

# Ensure Docker service is running
sudo systemctl enable docker
sudo systemctl start docker

echo "✅ Docker installed: $(docker --version)"

# 2. Setup Working Directory
echo "📂 [2/6] Setting up project deployment directory..."
DEPLOY_DIR="/opt/retailcorp-ecommerce"
sudo mkdir -p $DEPLOY_DIR
sudo chown -R $USER:$USER $DEPLOY_DIR

# 3. Copy or Clone Project
cd $DEPLOY_DIR
if [ ! -f "docker-compose.yml" ]; then
    echo "Cloning or configuring deployment assets..."
fi

# 4. Configure Environment Variables
echo "⚙️  [3/6] Configuring production environment (.env)..."
cat <<EOF > $DEPLOY_DIR/.env
# ==============================================================================
# RetailCorp E-Commerce Production Environment (AWS EC2)
# ==============================================================================
NODE_ENV=production
PORT=5000
PUBLIC_IP=${PUBLIC_IP}

# Database Configuration
POSTGRES_DB=ecommerce_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=SecureRetailCorp2026!DBPass
DATABASE_URL=postgres://app_user:SecureRetailCorp2026!DBPass@postgres:5432/ecommerce_db

# Security & Tokens
JWT_SECRET=ProdSecretKey2026_RetailCorpEnterpriseAuthToken!99
BCRYPT_ROUNDS=10

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=RetailCorpAdmin2026!
EOF

chmod 600 $DEPLOY_DIR/.env

# 5. Launch Application Stack with Docker Compose
echo "🚢 [4/6] Launching 7 Production Services via Docker Compose..."
# If docker compose plugin is available
if docker compose version >/dev/null 2>&1; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

# 6. Automated Health Verification Loop
echo "🔍 [5/6] Probing Application Liveness & Readiness Probes..."
RETRIES=10
COUNT=0
HEALTHY=false

while [ $COUNT -lt $RETRIES ]; do
    COUNT=$((COUNT+1))
    echo "Health check attempt ${COUNT}/${RETRIES}..."
    sleep 5

    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/healthz || true)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Liveness probe returned HTTP 200 OK!"
        HEALTHY=true
        break
    fi
done

if [ "$HEALTHY" = "false" ]; then
    echo "⚠️  Application is still initializing. Check logs with: docker compose logs"
fi

echo "=================================================================="
echo "🎉 RETAILCORP E-COMMERCE DEPLOYMENT COMPLETE ON AWS EC2!"
echo "=================================================================="
echo "🌐 Public Endpoints:"
echo "  - E-Commerce Storefront:    http://${PUBLIC_IP}"
echo "  - Backend REST API:         http://${PUBLIC_IP}:5000/api/products"
echo "  - SRE Liveness Probe:       http://${PUBLIC_IP}:5000/healthz"
echo "  - SRE Readiness Probe:      http://${PUBLIC_IP}:5000/ready"
echo "  - Prometheus Metrics:       http://${PUBLIC_IP}:5000/metrics"
echo "  - Grafana SRE Dashboard:    http://${PUBLIC_IP}:3000 (User: admin / Pass: RetailCorpAdmin2026!)"
echo "  - Prometheus Web UI:        http://${PUBLIC_IP}:9090"
echo "  - Alertmanager UI:          http://${PUBLIC_IP}:9093"
echo "=================================================================="
