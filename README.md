# ApexCloud Commerce: Enterprise 7-Microservices Cloud DevOps & SRE Platform

[![DevSecOps CI/CD](https://github.com/retailcorp/ecommerce-devops-project/actions/workflows/ci.yml/badge.svg)](https://github.com/retailcorp/ecommerce-devops-project/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security: Trivy](https://img.shields.io/badge/Security-Trivy_Audited-emerald.svg)](https://aquasecurity.github.io/trivy/)
[![IaC: Checkov](https://img.shields.io/badge/IaC_Security-Checkov_Passed-brightgreen.svg)](https://www.checkov.io/)
[![Observability: Prometheus](https://img.shields.io/badge/Metrics-Prometheus_Enabled-orange.svg)](https://prometheus.io)
[![GitOps: ArgoCD](https://img.shields.io/badge/GitOps-ArgoCD_v2-red.svg)](https://argo-cd.readthedocs.io/)
[![Helm: v3](https://img.shields.io/badge/Kubernetes-Helm_v3-326CE5.svg)](https://helm.sh/)

> **An enterprise-grade, event-driven e-commerce microservices platform** engineered to showcase production cloud architectures, distributed resilience patterns (Circuit Breaker, Dead Letter Queue), multi-tenant Kubernetes Helm charts, GitOps automation with ArgoCD, full-spectrum SRE observability (Prometheus/Grafana/Alertmanager), and shift-left DevSecOps security auditing.

---

## 1. Executive Summary & Highlights

- **7 Decoupled Microservices**: API Gateway (Port 8000), Auth & Identity (5001), Product Catalog (5002), Cart Cache (5003), Order Processing (5004), Payment Gateway (5005), Notification Engine (5006).
- **Event-Driven Messaging & DLQ**: RabbitMQ 3.13 AMQP broker with Topic Exchanges (`retailcorp.events`), asynchronous saga event choreography, and Dead Letter Queue (`orders.dlq`).
- **Resilience Engineering**: Netflix Hystrix / Resilience4j Circuit Breaker pattern with 3-failure threshold, fast-fail 503 fallback, and automated `HALF-OPEN` recovery.
- **Relational & In-Memory Persistence**: PostgreSQL 15 (ACID compliance, schema migrations, seed catalog) + Redis 7 (in-memory shopping cart session cache).
- **Unified Port 80 Ingress**: High-performance Nginx reverse-proxy eliminating AWS Security Group high-port blocks by exposing `/`, `/api/`, `/grafana/`, `/prometheus/`, `/alertmanager/`, and `/rabbitmq/` over standard HTTP.
- **Production Kubernetes & GitOps**: Parametric Helm v3 chart (`helm/retailcorp`) with Horizontal Pod Autoscaler (HPA), Ingress TLS annotations, RollingUpdate zero-downtime strategy, and ArgoCD self-healing application.
- **Shift-Left DevSecOps**: GitHub Actions CI/CD with Trivy container/filesystem scanning and Checkov IaC posture auditing.

---

## 2. Microservices Architecture Topology

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

---

## 3. Resilience Engineering: Circuit Breaker State Machine

The API Gateway implements a state machine based on the Netflix Hystrix / Resilience4j specification to guard downstream checkout operations against cascading failures:

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

## 4. Live Endpoints & Port 80 Routing Table

All services are accessible through standard HTTP Port 80:

| Service / Component | Live EC2 Endpoint URL | Purpose / Authentication |
| :--- | :--- | :--- |
| **Storefront Web SPA** | `http://52.63.189.76/` | Real-time reactive UI with live latency and Circuit Breaker telemetry |
| **Mesh Health Probe** | `http://52.63.189.76/api/mesh/health` | Live cluster health status and latency for all 7 microservices |
| **Event & Circuit Status** | `http://52.63.189.76/api/events/status` | Real-time Circuit Breaker state & RabbitMQ queue depth |
| **Grafana SRE Dashboard** | `http://52.63.189.76/grafana/` | Pre-provisioned SRE dashboards (`admin` / `RetailCorpAdmin2026!`) |
| **Prometheus TSDB** | `http://52.63.189.76/prometheus/` | Live metrics queries, scrape targets, and alert evaluation rules |
| **Alertmanager UI** | `http://52.63.189.76/alertmanager/` | Alert grouping, silences, and notification dispatch routing |
| **RabbitMQ Management** | `http://52.63.189.76/rabbitmq/` | Message broker queues, exchanges, and DLQ monitoring (`guest` / `guest`) |
| **Raw Prometheus Metrics** | `http://52.63.189.76/metrics` | RED and USE Golden Signals scraped by Prometheus |

---

## 5. Senior DevOps Interview Talking Points

### Q: Why did you choose an event-driven architecture with RabbitMQ instead of purely synchronous REST?
> **Answer**: *"In e-commerce, order processing must remain resilient even if third-party services like email providers or payment processors experience lag. By using RabbitMQ with a Topic Exchange (`retailcorp.events`), the Order Service publishes an `order.created` event and immediately returns an order confirmation to the customer in under 15ms. The Notification and Payment audit services consume events asynchronously. If a consumer crashes, messages persist safely in RabbitMQ or route to our Dead Letter Queue (`orders.dlq`), eliminating data loss."*

### Q: How does your Circuit Breaker protect the platform during downstream outages?
> **Answer**: *"A common failure mode in microservices is thread starvation caused by slow or unresponsive dependencies. Our API Gateway implements a 3-state Circuit Breaker (`CLOSED`, `OPEN`, `HALF-OPEN`). If the Payment Service experiences 3 consecutive failures or timeouts, the circuit trips to `OPEN`. For the next 12 seconds, subsequent payment attempts fail-fast with HTTP 503 fallback in under 1ms, preventing connection pooling exhaustion and saving EC2 CPU/memory. After 12 seconds, it transitions to `HALF-OPEN` to send a single probe request. If successful, it automatically resets to `CLOSED`."*

### Q: How did you solve AWS Security Group port restrictions for observability tools?
> **Answer**: *"AWS security best practices recommend keeping high ports (3000, 9090, 9093, 15672) closed to the public internet. Instead of opening multiple high-risk ingress rules in our security group, we engineered Nginx as an edge reverse-proxy terminating on standard Port 80. By configuring Grafana with `GF_SERVER_SERVE_FROM_SUB_PATH=true` and Prometheus with `--web.route-prefix=/prometheus/`, our SRE dashboards, alert managers, and message brokers are securely reachable under unified URI subpaths."*

### Q: How is your GitOps deployment structured with Helm and ArgoCD?
> **Answer**: *"We packaged all 7 microservices, stateful sets, and ingress rules into a parameterized Helm v3 chart (`helm/retailcorp`). The chart defines resource requests/limits, HorizontalPodAutoscalers based on CPU utilization, and RollingUpdate zero-downtime deployment strategies (`maxSurge: 1, maxUnavailable: 0`). ArgoCD continuously reconciles the live Kubernetes cluster state against the Git repository, automatically pruning dead objects and healing any manual configuration drift within 3 minutes."*
