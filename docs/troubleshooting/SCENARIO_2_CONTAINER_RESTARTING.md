# Incident Post-Mortem & Runbook: Scenario 2 - Docker Container Continuously Restarts

## 1. Executive Summary & Symptoms
- **Symptom**: The backend container repeatedly restarts every 10–20 seconds.
- **Terminal Observation**:
  ```
  $ docker compose ps
  NAME                IMAGE                     STATUS                           PORTS
  ecommerce-backend   ecommerce-backend:1.0.0   Restarting (1) 4 seconds ago
  ```
- **Alert**: `ApplicationDowntime` fired by Prometheus.

---

## 2. Investigation Commands & Diagnosis (Step-by-Step)

### Step 1: Inspect Container Termination State & Exit Code
```bash
docker inspect ecommerce-backend --format='Status: {{.State.Status}}, ExitCode: {{.State.ExitCode}}, OOMKilled: {{.State.OOMKilled}}, Error: {{.State.Error}}'
```
*Common Diagnostic Findings:*
- **Case A: Exit Code 1 / 127** -> Application runtime crash (uncaught exception, missing dependency, or file not found).
- **Case B: Exit Code 137 & OOMKilled: true** -> Container exceeded memory limit and was killed by Linux kernel OOM killer (`128 + 9 = 137`).

### Step 2: Extract Crashed Container Logs
Inspect stdout/stderr immediately before process death:
```bash
docker logs ecommerce-backend --tail 100
```
*Sample Log Output (Case A):*
```
[API Server] Initializing PostgreSQL client connection pool...
Error: Database password is null or undefined. Check DB_PASSWORD environment variable.
    at Object.<anonymous> (/usr/src/app/src/config/db.js:28:11)
```

*Sample Log Output (Case B):*
```
dmesg -T | grep -E -i "killed process|oom_reaper|out of memory"
# Output: Memory cgroup out of memory: Killed process 14205 (node) total-vm:482124kB, anon-rss:261840kB
```

---

## 3. Root Cause Analysis
1. **Case A (Configuration Defect)**: Missing or malformed environment variable (`DB_PASSWORD` or `JWT_SECRET`) causes a synchronous fatal throw during server bootstrapping before HTTP listen can bind.
2. **Case B (Resource Starvation)**: Memory reservation in `docker-compose.yml` or Kubernetes deployment was configured with an unrealistically low limit (e.g. `32M`), terminating the Node.js runtime as soon as heap memory allocated during startup.

---

## 4. Resolution Procedure
1. Fix configuration in `.env` or `docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 256M   # Increased from 32M to realistic production size
   ```
2. Re-create and restart container:
   ```bash
   docker compose up -d backend
   ```
3. Confirm container status stays `Up (healthy)`:
   ```bash
   docker compose ps backend
   ```

---

## 5. Prevention Strategy
- Always declare sensible CPU/Memory requests and limits based on load test baselines.
- Implement strict schema validation on process startup (e.g. using `joi` or `zod`) so missing environment variables fail fast with human-readable error descriptions rather than cryptic runtime crashes.
