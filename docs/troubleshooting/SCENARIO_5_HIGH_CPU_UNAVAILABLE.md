# Incident Post-Mortem & Runbook: Scenario 5 - Application Unavailable Due to High CPU Utilization

## 1. Executive Summary & Symptoms
- **Alert**: `HighCpuUtilization` (> 80% for 3m) and `HighRequestLatencyP99` (> 500ms for 3m) triggered.
- **User Impact**: Browsing becomes extremely sluggish; requests time out with HTTP 504.
- **Symptom Observation**: The Node.js single-threaded event loop becomes completely blocked by a CPU-intensive operation, preventing incoming I/O requests from being processed.

---

## 2. Investigation Commands & Diagnosis (Step-by-Step)

### Step 1: Real-Time Container Resource Telemetry
Inspect live CPU and memory utilization across active containers:
```bash
docker stats --no-stream
```
*Sample Output:*
```
CONTAINER ID   NAME                 CPU %     MEM USAGE / LIMIT     MEM %     NET I/O           BLOCK I/O
a1b2c3d4e5f6   ecommerce-backend    198.4%    185.4MiB / 256MiB     72.4%     1.2MB / 8.5MB     0B / 0B
b2c3d4e5f6a1   ecommerce-frontend   1.2%      24.1MiB / 128MiB      18.8%     5.4MB / 3.2MB     0B / 0B
c3d4e5f6a1b2   ecommerce-postgres   4.5%      92.3MiB / 512MiB      18.0%     3.2MB / 5.4MB     0B / 0B
```
*Finding:* `ecommerce-backend` is pinning CPU at near 200% (saturating 2 full virtual cores).

### Step 2: Identify Process Threads and Syscall Activity
On the host:
```bash
top -H -p $(pgrep -f "node src/server.js")
# Or inspect top system calls:
pid=$(pgrep -f "node src/server.js" | head -n 1)
sudo strace -c -p $pid
```

### Step 3: Check Prometheus Golden Signals Latency Metrics
Query Prometheus or Grafana:
```promql
histogram_quantile(0.99, sum(rate(ecommerce_http_request_duration_seconds_bucket[2m])) by (le))
```
*Observation:* p99 latency jumped from 25ms to 4.2s.

---

## 3. Root Cause Analysis
1. **Event Loop Starvation**: Node.js operates on a single-threaded event loop for JavaScript execution. A synchronous calculation (such as our `/api/simulate/cpu` endpoint, recursive regex, or synchronous JSON serialization of massive datasets) pinned the thread, blocking all HTTP request handling.
2. **Missing CPU Resource Limits**: The container had no upper bound on CPU utilization, allowing a single rogue worker to consume all available EC2 compute cycles, starving Nginx and system daemons.

---

## 4. Resolution Procedure
1. Terminate or restart the starved backend container:
   ```bash
   docker compose restart backend
   ```
2. Impose strict CPU quota in `docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.75'      # Cap CPU utilization per replica
         memory: 256M
   ```
3. Offload intensive background computation to asynchronous worker queues (e.g. BullMQ / Redis / Celery) or worker threads (`worker_threads` module in Node.js).

---

## 5. Prevention Strategy
- Integrate horizontal scaling: Run at least 2 to 4 backend replicas behind Nginx round-robin load balancing.
- Configure Kubernetes Horizontal Pod Autoscaler (HPA) to automatically scale pods when average CPU exceeds 70%.
- Implement request timeouts in Nginx (`proxy_read_timeout 10s;`) to fail fast rather than holding client connections open indefinitely.
