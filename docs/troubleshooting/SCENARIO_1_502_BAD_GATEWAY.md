# Incident Post-Mortem & Runbook: Scenario 1 - Application Returns HTTP 502 Bad Gateway

## 1. Executive Summary & Symptoms
- **Alert Triggered**: `HighHttpErrorRate` on Slack/PagerDuty; Prometheus shows a sudden surge in HTTP 502 responses.
- **User Impact**: End users browsing `https://store.retailcorp.io` receive:
  ```
  502 Bad Gateway
  nginx/1.25.4
  ```
- **Symptom Observation**: The Nginx ingress reverse proxy is up and accepting incoming TCP connections on port 80/443, but cannot complete the upstream HTTP request.

---

## 2. Investigation Commands & Diagnosis (Step-by-Step)

### Step 1: Check Nginx Error Logs
Execute inside the Nginx container or on the EC2 host:
```bash
docker logs ecommerce-frontend --tail 50
# Or inspecting Nginx error log:
docker exec -it ecommerce-frontend cat /var/log/nginx/error.log
```
*Diagnostic Log Signature:*
```
2026/11/16 12:15:30 [error] 31#31: *12 connect() failed (111: Connection refused) while connecting to upstream, client: 172.20.0.1, server: localhost, request: "GET /api/products HTTP/1.1", upstream: "http://172.20.0.3:5000/api/products", host: "localhost"
```

### Step 2: Verify Upstream Service State
Check whether the upstream backend container is running:
```bash
docker compose ps backend
```
*Findings:*
- If the backend container is in `Exited` or not listening on port 5000:
```bash
docker inspect ecommerce-backend --format='{{.State.Status}} (ExitCode: {{.State.ExitCode}})'
```

### Step 3: Test TCP Connectivity from Proxy to Upstream
```bash
docker exec -it ecommerce-frontend nc -zv backend 5000
# Or using wget:
docker exec -it ecommerce-frontend wget -qO- --timeout=2 http://backend:5000/healthz
```

---

## 3. Root Cause Analysis
1. **Network Disconnect or Misnamed Upstream**: Nginx `proxy_pass http://backend:5000` cannot establish a TCP handshake because the backend process crashed or is listening on `127.0.0.1` instead of `0.0.0.0`.
2. **Container Crash on Deployment**: The backend failed on startup due to a missing environment variable, causing port 5000 to be closed when Nginx forwards traffic.

---

## 4. Resolution Procedure
1. If backend crashed, inspect container logs:
   ```bash
   docker logs ecommerce-backend --tail 100
   ```
2. Correct the missing variable in `.env` (e.g. `HOST=0.0.0.0`, `PORT=5000`, `DB_PASSWORD`).
3. Re-start the backend container:
   ```bash
   docker compose up -d backend
   ```
4. Verify Nginx proxy connectivity:
   ```bash
   curl -I http://localhost/healthz
   ```
   *Expected Output: HTTP/1.1 200 OK*

---

## 5. Prevention Strategy
- Implement Kubernetes/Compose `depends_on: { condition: service_healthy }` so Nginx never accepts client traffic until the upstream backend passes its `/healthz` and `/ready` probes.
- Configure pre-traffic warm-up and automated smoke checks in the CI/CD pipeline before traffic routing.
