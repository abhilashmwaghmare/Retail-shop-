# ApexCloud Commerce: Enterprise 7-Microservices Cloud DevOps & SRE Platform

[![DevSecOps CI/CD](https://github.com/abhilashmwaghmare/Retail-shop-/actions/workflows/ci.yml/badge.svg)](https://github.com/abhilashmwaghmare/Retail-shop-/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security: Trivy](https://img.shields.io/badge/Security-Trivy_Audited-emerald.svg)](https://aquasecurity.github.io/trivy/)
[![IaC: Checkov](https://img.shields.io/badge/IaC_Security-Checkov_Passed-brightgreen.svg)](https://www.checkov.io/)
[![Observability: Prometheus](https://img.shields.io/badge/Metrics-Prometheus_Enabled-orange.svg)](https://prometheus.io)
[![GitOps: ArgoCD](https://img.shields.io/badge/GitOps-ArgoCD_v2-red.svg)](https://argo-cd.readthedocs.io/)
[![Helm: v3](https://img.shields.io/badge/Kubernetes-Helm_v3-326CE5.svg)](https://helm.sh/)

> **An enterprise-grade, event-driven e-commerce microservices platform** engineered to showcase production cloud architectures, distributed resilience patterns (Circuit Breaker, Dead Letter Queue), multi-tenant Kubernetes Helm charts, GitOps automation with ArgoCD, full-spectrum SRE observability (Prometheus/Grafana/Alertmanager), and shift-left DevSecOps security auditing.

---

## Table of Contents
1. [Architecture Topology & Microservices Mesh](#1-architecture-topology--microservices-mesh)
2. [Resilience Engineering & Circuit Breaker](#2-resilience-engineering--circuit-breaker)
3. [Prerequisites & System Requirements](#3-prerequisites--system-requirements)
4. [Step 1: Clone Repository & Configure Environment](#step-1-clone-repository--configure-environment)
5. [Step 2: Local Deployment via Docker Compose](#step-2-local-deployment-via-docker-compose)
6. [Step 3: End-to-End API Testing & Verification](#step-3-end-to-end-api-testing--verification)
7. [Step 4: Observability & SRE Monitoring Access](#step-4-observability--sre-monitoring-access)
8. [Step 5: Automated Testing & Validation Execution](#step-5-automated-testing--validation-execution)
9. [Step 6: Shift-Left DevSecOps & Security Scans](#step-6-shift-left-devsecops--security-scans)
10. [Step 7: Cloud Infrastructure Provisioning (Terraform on AWS)](#step-7-cloud-infrastructure-provisioning-terraform-on-aws)
11. [Step 8: AWS EC2 Bootstrap & Remote Production Deployment](#step-8-aws-ec2-bootstrap--remote-production-deployment)
12. [Step 9: CI/CD Pipeline Automation (Jenkins & GitHub Actions)](#step-9-cicd-pipeline-automation-jenkins--github-actions)
13. [Step 10: Kubernetes & GitOps Orchestration (Helm & ArgoCD)](#step-10-kubernetes--gitops-orchestration-helm--argocd)
14. [Step 11: Production Chaos Simulation & Troubleshooting](#step-11-production-chaos-simulation--troubleshooting)
15. [Step 12: Platform Teardown & Cleanup](#step-12-platform-teardown--cleanup)
16. [Port 80 Routing Table & Live Endpoints](#16-port-80-routing-table--live-endpoints)
17. [Senior DevOps Interview Defense Q&A](#17-senior-devops-interview-defense-qa)

---

## 1. Architecture Topology & Microservices Mesh

```mermaid
flowchart TD
    Client["Client / Web Browser"] -->|Port 80 HTTP| Ingress["Nginx Edge Reverse Proxy (Port 80)"]

    subgraph INGRESS_LAYER ["Unified Ingress Layer (Port 80)"]
        Ingress -->|"Path: /"| SPA["Storefront UI (Tailwind SPA)"]
        Ingress -->|"Path: /api/*"| Gateway["API Gateway (Port 8000)"]
        Ingress -->|"Path: /grafana/*"| Grafana["Grafana SRE Dashboard (3000)"]
        Ingress -->|"Path: /prometheus/*"| Prom["Prometheus Server (9090)"]
        Ingress -->|"Path: /alertmanager/*"| Alert["Alertmanager UI (9093)"]
        Ingress -->|"Path: /rabbitmq/*"| RMQ_UI["RabbitMQ Management (15672)"]
    end

    subgraph RESILIENCE_TIER ["Resilience & Gateway Layer"]
        Gateway --> CB["Circuit Breaker Machine\n(CLOSED -> OPEN -> HALF-OPEN)"]
    end

    subgraph MICROSERVICES_MESH ["Decoupled Microservices Mesh"]
        Gateway -->|HTTP/REST| Auth["Auth Service\n(Port 5001)"]
        Gateway -->|HTTP/REST| Product["Product Service\n(Port 5002)"]
        Gateway -->|HTTP/REST| Cart["Cart Service\n(Port 5003)"]
        Gateway -->|HTTP/REST| Order["Order Service\n(Port 5004)"]
        CB -->|Protected Call| Payment["Payment Service\n(Port 5005)"]
        Order -->|Async Event| RMQ[("RabbitMQ 3.13 Broker\n(Port 5672)")]
        RMQ -->|Topic: order.created.*| Notify["Notification Service\n(Port 5006)"]
        RMQ -->|Failure Fallback| DLQ[("Dead Letter Queue\n(orders.dlq)")]
    end

    subgraph DATA_TIER ["Stateful Persistence Tier"]
        Auth -->|ACID SQL| PG[("PostgreSQL 15 DB\necommerce_db")]
        Product -->|ACID SQL| PG
        Order -->|ACID SQL| PG
        Payment -->|Audit Ledger| PG
        Cart -->|Sub-millisecond| Redis[("Redis 7 Cache\nSession Store")]
    end

    subgraph OBSERVABILITY ["Observability & SRE Tier"]
        Prom -->|Scrape /metrics| Gateway
        Prom -->|Scrape /metrics| Auth
        Prom -->|Scrape /metrics| Product
        Prom -->|Scrape /metrics| Cart
        Prom -->|Scrape /metrics| Order
        Prom -->|Scrape /metrics| Payment
        Prom -->|Scrape /metrics| Notify
        Prom -->|Scrape :9100| NodeExp["Node Exporter"]
        Prom -->|Fire Alerts| Alert
        Grafana -->|Query TSDB| Prom
    end
```

### Microservices Catalog
| Service | Internal Port | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8000` | Node.js / Express | Central request router, rate limiter, Circuit Breaker |
| **Auth & Identity** | `5001` | Node.js / JWT / bcrypt | User registration, authentication, RBAC token generation |
| **Product Catalog** | `5002` | Node.js / PostgreSQL | Inventory catalog management, search, categories |
| **Cart Cache** | `5003` | Node.js / Redis 7 | High-performance in-memory customer shopping cart |
| **Order Processing**| `5004` | Node.js / PostgreSQL | Order lifecycle orchestration, checkout transactions |
| **Payment Gateway** | `5005` | Node.js / Express | Payment audit ledger, mock transaction processor |
| **Notification** | `5006` | Node.js / RabbitMQ | Event-driven customer alerts (email/SMS simulation) |

---

## 2. Resilience Engineering & Circuit Breaker

The API Gateway protects downstream checkout dependencies using an automated Circuit Breaker state machine (Netflix Hystrix / Resilience4j specification):

```mermaid
stateDiagram-v2
    [*] --> CLOSED: Normal Operation

    CLOSED --> OPEN: Failure Threshold Exceeded (>= 3 consecutive 5xx/timeouts)
    note right of CLOSED
      All requests routed to Payment Service.
      Failures increment failure counter.
    end note

    OPEN --> HALF_OPEN: Recovery Timeout Expired (12 seconds)
    note right of OPEN
      Fast-fail immediately with HTTP 503.
      Zero latency penalty for clients.
      Message diverted to Dead Letter Queue (DLQ).
    end note

    HALF_OPEN --> CLOSED: Probe Request Succeeds
    HALF_OPEN --> OPEN: Probe Request Fails (Reset recovery timer)
    note right of HALF_OPEN
      Single trial request permitted.
      Validates downstream health.
    end note
```

---

## 3. Prerequisites & System Requirements

Before starting, ensure the following utilities are installed on your machine or target server:

| Tool | Recommended Version | Verify Command |
| :--- | :--- | :--- |
| **Git** | `>= 2.30` | `git --version` |
| **Docker Engine & Compose** | `>= 24.0` / Compose `v2` | `docker --version && docker compose version` |
| **Node.js & npm** (optional for local dev) | `>= 18.x LTS` | `node -v && npm -v` |
| **AWS CLI** (for cloud provisioning) | `v2.x` | `aws --version` |
| **Terraform** (for IaC) | `>= 1.5.0` | `terraform version` |
| **kubectl** (for Kubernetes) | `>= 1.28` | `kubectl version --client` |
| **Helm** (for Kubernetes packaging) | `>= v3.12` | `helm version` |
| **Trivy** (for container security audit) | `>= 0.49` | `trivy --version` |

---

## Step 1: Clone Repository & Configure Environment

### 1.1 Clone the Repository
```bash
# Clone via HTTPS
git clone https://github.com/abhilashmwaghmare/Retail-shop-.git

# Navigate into the project root
cd Retail-shop-
```

### 1.2 Initialize Production Environment Variables
Generate the local `.env` configuration from the provided template:
```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Review or customize values inside `.env`:
```ini
NODE_ENV=production
PORT=5000
PUBLIC_IP=localhost

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
```

### 1.3 Generate Local SSL Certificates (Optional for HTTPS)
```bash
# Linux / macOS
bash nginx/ssl/generate-self-signed-cert.sh

# Windows PowerShell
sh nginx/ssl/generate-self-signed-cert.sh
```

---

## Step 2: Local Deployment via Docker Compose

Launch the complete stack (7 microservices, PostgreSQL, Redis, RabbitMQ, Nginx, Prometheus, Grafana, Alertmanager, and Node Exporter) with a single command.

### 2.1 Build and Launch Containers in Detached Mode
```bash
docker compose up -d --build
```

### 2.2 Verify Container Status & Health Probes
```bash
# List all running containers and their health status
docker compose ps

# Follow container startup logs in real time
docker compose logs -f api-gateway postgres rabbitmq
```

Expected healthy containers:
```text
NAME                         IMAGE                           STATUS
retailcorp-postgres          postgres:15-alpine              Up (healthy)
retailcorp-redis             redis:7-alpine                  Up (healthy)
retailcorp-rabbitmq          rabbitmq:3.13-management-alpine Up
retailcorp-auth-service      retail-shop-auth-service        Up
retailcorp-product-service   retail-shop-product-service     Up
retailcorp-cart-service      retail-shop-cart-service        Up
retailcorp-order-service     retail-shop-order-service       Up
retailcorp-payment-service   retail-shop-payment-service     Up
retailcorp-notification-svc  retail-shop-notification       Up
retailcorp-api-gateway       retail-shop-api-gateway         Up
retailcorp-frontend          nginx:alpine                    Up
retailcorp-prometheus        prom/prometheus:v2.51.0         Up
retailcorp-alertmanager      prom/alertmanager:v0.27.0       Up
retailcorp-grafana           grafana/grafana:10.4.2          Up
retailcorp-node-exporter     prom/node-exporter:v1.7.0       Up
```

---

## Step 3: End-to-End API Testing & Verification

Execute live functional tests through the unified Port 80 Nginx ingress.

### 3.1 Check Microservices Mesh Health
```bash
curl -s http://localhost/api/mesh/health | jq .
```
*Expected response: HTTP 200 with all 7 services reporting `status: "healthy"` and round-trip latency.*

### 3.2 Register a Customer Account
```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "CustomerSecurePass2026!",
    "full_name": "DevOps Engineer"
  }' | jq .
```

### 3.3 Authenticate & Acquire JWT Bearer Token
```bash
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "CustomerSecurePass2026!"
  }' | jq -r '.token')

echo "Acquired Bearer Token: $TOKEN"
```

### 3.4 Retrieve Product Catalog
```bash
curl -s http://localhost/api/products | jq .
```

### 3.5 Add Item to In-Memory Redis Cart
```bash
curl -X POST http://localhost/api/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "k8s-architecture-book",
    "quantity": 2
  }' | jq .
```

### 3.6 Submit Order (Asynchronous Saga & RabbitMQ Event)
```bash
curl -X POST http://localhost/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": "123 Cloud Way, AWS Region East",
    "paymentMethod": "credit_card"
  }' | jq .
```
*Expected outcome: Order is stored in PostgreSQL, and an `order.created` event is published to RabbitMQ.*

### 3.7 Verify Circuit Breaker & RabbitMQ Queue Telemetry
```bash
curl -s http://localhost/api/events/status | jq .
```

---

## Step 4: Observability & SRE Monitoring Access

All SRE telemetry tools are routed through Port 80 Nginx reverse proxy:

| Dashboard | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Web Storefront SPA** | `http://localhost/` | Interactive UI with real-time latency dials |
| **Grafana Dashboards** | `http://localhost/grafana/` | Username: `admin` \| Password: `RetailCorpAdmin2026!` |
| **Prometheus TSDB** | `http://localhost/prometheus/` | Scrape targets: `Status > Targets` |
| **Alertmanager UI** | `http://localhost/alertmanager/` | View active firing alerts & notification silences |
| **RabbitMQ Management** | `http://localhost/rabbitmq/` | Username: `guest` \| Password: `guest` |
| **Raw Prometheus Metrics** | `http://localhost/metrics` | Golden signals scraped every 15s |

### Sample PromQL Queries to Try in Prometheus
```promql
# Rate of HTTP requests across the API Gateway
rate(http_requests_total[1m])

# 95th Percentile Latency across microservices
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Container Memory Usage (Bytes)
container_memory_usage_bytes{name=~"retailcorp-.*"}
```

---

## Step 5: Automated Testing & Validation Execution

Run the built-in testing suites to validate syntax, architectural contracts, and system components.

### 5.1 Run Application Unit & Integration Tests
```bash
# Execute standalone Node.js unit tests
node tests/unit/api.test.js
```

### 5.2 Execute PowerShell Comprehensive Validation Suites
```powershell
# 1. Architecture & Source Code Validation
powershell -ExecutionPolicy Bypass -File tests/validate-application.ps1

# 2. Docker & Container Validation
powershell -ExecutionPolicy Bypass -File tests/validate-docker.ps1

# 3. Terraform Infrastructure Validation
powershell -ExecutionPolicy Bypass -File tests/validate-terraform.ps1

# 4. CI/CD Pipeline Manifest Validation
powershell -ExecutionPolicy Bypass -File tests/validate-cicd.ps1

# 5. Monitoring & Security Policy Validation
powershell -ExecutionPolicy Bypass -File tests/validate-monitoring-security.ps1

# 6. Production Troubleshooting Runbooks Validation
powershell -ExecutionPolicy Bypass -File tests/validate-troubleshooting.ps1
```

---

## Step 6: Shift-Left DevSecOps & Security Scans

Execute automated static security and container image audits locally before pushing code.

### 6.1 Container & Dependency Vulnerability Scan (Trivy)
```bash
# Linux / macOS
bash security/trivy/trivy-scan.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File security/trivy/trivy-scan.ps1
```

Or scan directly with Trivy CLI:
```bash
# Scan backend microservice Dockerfile
trivy config ./microservices/api-gateway

# Scan local container image for HIGH and CRITICAL CVEs
trivy image --severity HIGH,CRITICAL retail-shop-api-gateway
```

### 6.2 Infrastructure as Code (IaC) Security Scan (Checkov)
```bash
# Linux / macOS
bash security/checkov/checkov-scan.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File security/checkov/checkov-scan.ps1
```

Or run Checkov directly across Terraform modules:
```bash
checkov -d ./terraform --framework terraform
```

---

## Step 7: Cloud Infrastructure Provisioning (Terraform on AWS)

Provision AWS cloud infrastructure (VPC, Subnets, Security Groups, IAM Roles, S3 State, and EC2 instances) using modular Terraform.

### 7.1 Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and Default Region (e.g., us-east-1)
```

### 7.2 Provision Development Infrastructure
```bash
cd terraform/environments/dev

# 1. Initialize provider plugins and backend modules
terraform init

# 2. Review execution plan
terraform plan

# 3. Provision cloud resources
terraform apply -auto-approve
```

### 7.3 Inspect Infrastructure Outputs
```bash
terraform output
```
Key outputs returned:
* `ec2_public_ip`: Public IP address of the provisioned compute instance
* `vpc_id`: AWS VPC Identifier
* `s3_bucket_name`: Artifact and state storage bucket name

---

## Step 8: AWS EC2 Bootstrap & Remote Production Deployment

Deploy the platform onto an AWS EC2 instance (Ubuntu 22.04 / 24.04 or Amazon Linux 2023).

### 8.1 SSH into the EC2 Instance
```bash
chmod 400 your-keypair.pem
ssh -i your-keypair.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### 8.2 Run One-Click Bootstrap & Deployment Script
```bash
# Clone the repository onto the EC2 host
git clone https://github.com/abhilashmwaghmare/Retail-shop-.git /opt/retailcorp-ecommerce
cd /opt/retailcorp-ecommerce

# Execute the bootstrap script (installs Docker, Docker Compose, sets up .env, starts services)
sudo chmod +x scripts/ec2-bootstrap-and-deploy.sh
sudo bash scripts/ec2-bootstrap-and-deploy.sh
```

### 8.3 Verify Live Deployment over Port 80
```bash
# Replace with your EC2 public IP
curl -s http://<YOUR_EC2_PUBLIC_IP>/api/mesh/health | jq .
```
Open `http://<YOUR_EC2_PUBLIC_IP>/` in any browser to see the live application.

---

## Step 9: CI/CD Pipeline Automation (Jenkins & GitHub Actions)

### 9.1 Jenkins Declarative Pipeline (11 Production Stages)
The included `Jenkinsfile` automates:
1. **Git Checkout**: Pulls `main` branch with checkout metadata.
2. **Dependency Installation**: Runs `npm ci` across backend and frontend.
3. **Application Build**: Bundles frontend assets and transpiles code.
4. **Unit Testing**: Executes `node tests/unit/api.test.js`.
5. **SonarQube Quality Gate**: Static code analysis (`security/sonarqube/sonar-project.properties`).
6. **Docker Multi-Stage Build**: Builds production container images.
7. **Trivy Vulnerability Scan**: Asserts zero `CRITICAL` CVE regressions.
8. **ECR Push**: Publishes tagged images to Amazon Elastic Container Registry.
9. **EC2 Rolling Deployment**: Zero-downtime container replacement on target host.
10. **Health Check Probes**: Validates `/healthz` and `/ready` endpoints.
11. **Verification & Notification**: Triggers Slack webhook alerts with commit metadata.

#### Configuring Jenkins Credentials:
* `aws-account-id`: AWS Account Number for ECR registry URL.
* `ec2-deploy-host`: Remote EC2 public IP or DNS name.
* `slack-webhook-url`: Webhook URL for Slack build status notifications.

### 9.2 GitHub Actions Automated CI/CD
The repository includes `.github/workflows/ci.yml` running on every push or pull request to `main`:
* Lints source code and Dockerfiles.
* Executes unit and integration test suites.
* Runs Trivy security vulnerability scans on container images.
* Runs Checkov IaC security scans across Terraform configurations.

---

## Step 10: Kubernetes & GitOps Orchestration (Helm & ArgoCD)

Deploy the platform to a Kubernetes cluster (Minikube, Kind, or Amazon EKS).

### 10.1 Package and Deploy with Helm v3
```bash
# 1. Lint the Helm chart
helm lint helm/retailcorp

# 2. Dry-run installation to verify rendered manifests
helm install retailcorp ./helm/retailcorp --dry-run --debug

# 3. Deploy to Kubernetes cluster under the 'production' namespace
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install retailcorp ./helm/retailcorp \
  --namespace production \
  --set ingress.enabled=true \
  --set replicaCount=2
```

### 10.2 Verify Kubernetes Workloads & Autoscalers
```bash
# View Deployments, Pods, Services, and Ingress
kubectl get all,ingress,hpa -n production

# View pod logs
kubectl logs -l app.kubernetes.io/name=api-gateway -n production -f
```

### 10.3 Deploy GitOps Self-Healing Application with ArgoCD
```bash
# Apply ArgoCD Application manifest
kubectl apply -f argocd/application.yaml -n argocd

# Check ArgoCD sync status
argocd app get retailcorp-production
```
*ArgoCD continuously reconciles cluster state against Git. Any manual changes or drift will be auto-healed within 3 minutes.*

---

## Step 11: Production Chaos Simulation & Troubleshooting

The repository contains real-world incident simulations and step-by-step resolution runbooks in `docs/troubleshooting/`.

### 11.1 Run Chaos Engineering Simulation Script
```bash
# Linux / macOS
bash scripts/simulate-incident.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/simulate-incident.ps1
```

### 11.2 Incident Runbook Catalog
| Scenario | Problem Signature | Troubleshooting Runbook Guide |
| :--- | :--- | :--- |
| **Scenario 1** | `502 Bad Gateway` (Upstream connection dropped) | [`docs/troubleshooting/SCENARIO_1_502_BAD_GATEWAY.md`](docs/troubleshooting/SCENARIO_1_502_BAD_GATEWAY.md) |
| **Scenario 2** | `CrashLoopBackOff` (Memory leak / OOMKill) | [`docs/troubleshooting/SCENARIO_2_CONTAINER_RESTARTING.md`](docs/troubleshooting/SCENARIO_2_CONTAINER_RESTARTING.md) |
| **Scenario 3** | `Database Connection Refused` (Pool exhaustion) | [`docs/troubleshooting/SCENARIO_3_DB_CONNECTION_FAILURE.md`](docs/troubleshooting/SCENARIO_3_DB_CONNECTION_FAILURE.md) |
| **Scenario 4** | `Jenkins Docker Build Failure` (Disk saturation / EPERM) | [`docs/troubleshooting/SCENARIO_4_JENKINS_DOCKER_BUILD_FAIL.md`](docs/troubleshooting/SCENARIO_4_JENKINS_DOCKER_BUILD_FAIL.md) |
| **Scenario 5** | `High CPU Saturation & Latency Spike` | [`docs/troubleshooting/SCENARIO_5_HIGH_CPU_UNAVAILABLE.md`](docs/troubleshooting/SCENARIO_5_HIGH_CPU_UNAVAILABLE.md) |

---

## Step 12: Platform Teardown & Cleanup

When finished testing, clean up all local and cloud resources to prevent unintended resource utilization.

### 12.1 Stop and Remove Local Containers & Volumes
```bash
# Stop containers and destroy persisted volumes
docker compose down -v
```

### 12.2 Uninstall Kubernetes Helm Release
```bash
helm uninstall retailcorp -n production
kubectl delete namespace production
```

### 12.3 Destroy Cloud Infrastructure (Terraform)
```bash
cd terraform/environments/dev
terraform destroy -auto-approve
```

---

## 16. Port 80 Routing Table & Live Endpoints

All services are accessible through standard HTTP Port 80:

| Service / Component | Live Endpoint URI | Purpose / Default Authentication |
| :--- | :--- | :--- |
| **Storefront Web SPA** | `http://localhost/` | Real-time reactive UI with live latency telemetry |
| **Mesh Health Probe** | `http://localhost/api/mesh/health` | Live cluster health status for all 7 microservices |
| **Event & Circuit Status** | `http://localhost/api/events/status` | Real-time Circuit Breaker state & RabbitMQ depth |
| **Grafana SRE Dashboard** | `http://localhost/grafana/` | Pre-provisioned dashboards (`admin` / `RetailCorpAdmin2026!`) |
| **Prometheus TSDB** | `http://localhost/prometheus/` | Scrape targets, rules, and live PromQL query engine |
| **Alertmanager UI** | `http://localhost/alertmanager/` | Alert routing, grouping, and notification silences |
| **RabbitMQ Management** | `http://localhost/rabbitmq/` | Exchange bindings, queue depths, DLQ (`guest` / `guest`) |
| **Raw Prometheus Metrics**| `http://localhost/metrics` | RED and USE Golden Signals scraped by Prometheus |

---

## 17. Senior DevOps Interview Defense Q&A

### Q: Why did you choose an event-driven architecture with RabbitMQ instead of purely synchronous REST?
> **Answer**: *"In e-commerce, order processing must remain resilient even if third-party services like email providers or payment processors experience lag. By using RabbitMQ with a Topic Exchange (`retailcorp.events`), the Order Service publishes an `order.created` event and immediately returns an order confirmation to the customer in under 15ms. The Notification and Payment audit services consume events asynchronously. If a consumer crashes, messages persist safely in RabbitMQ or route to our Dead Letter Queue (`orders.dlq`), eliminating data loss."*

### Q: How does your Circuit Breaker protect the platform during downstream outages?
> **Answer**: *"A common failure mode in microservices is thread starvation caused by slow or unresponsive dependencies. Our API Gateway implements a 3-state Circuit Breaker (`CLOSED`, `OPEN`, `HALF-OPEN`). If the Payment Service experiences 3 consecutive failures or timeouts, the circuit trips to `OPEN`. For the next 12 seconds, subsequent payment attempts fail-fast with HTTP 503 fallback in under 1ms, preventing connection pooling exhaustion and saving compute resources. After 12 seconds, it transitions to `HALF-OPEN` to send a single probe request. If successful, it automatically resets to `CLOSED`."*

### Q: How did you solve AWS Security Group port restrictions for observability tools?
> **Answer**: *"AWS security best practices recommend keeping high ports (3000, 9090, 9093, 15672) closed to the public internet. Instead of opening multiple high-risk ingress rules in our security group, we engineered Nginx as an edge reverse-proxy terminating on standard Port 80. By configuring Grafana with `GF_SERVER_SERVE_FROM_SUB_PATH=true` and Prometheus with `--web.route-prefix=/prometheus/`, our SRE dashboards, alert managers, and message brokers are securely reachable under unified URI subpaths."*

### Q: How is your GitOps deployment structured with Helm and ArgoCD?
> **Answer**: *"We packaged all 7 microservices, stateful sets, and ingress rules into a parameterized Helm v3 chart (`helm/retailcorp`). The chart defines resource requests/limits, HorizontalPodAutoscalers based on CPU utilization, and RollingUpdate zero-downtime deployment strategies (`maxSurge: 1, maxUnavailable: 0`). ArgoCD continuously reconciles the live Kubernetes cluster state against the Git repository, automatically pruning dead objects and healing any manual configuration drift within 3 minutes."*

---

## 📜 License
This project is open-source and distributed under the [MIT License](LICENSE).
