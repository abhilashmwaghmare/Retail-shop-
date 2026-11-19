# Incident Post-Mortem & Runbook: Scenario 3 - Database Connection Fails

## 1. Executive Summary & Symptoms
- **Alert**: `DatabaseHealthCheckFailed` triggered in Alertmanager; Prometheus `ecommerce_db_healthy == 0`.
- **Symptoms**:
  - `GET /healthz` returns 200 OK (process is alive).
  - `GET /ready` returns HTTP 503 Service Unavailable with JSON:
    ```json
    {
      "status": "unhealthy",
      "database": {
        "healthy": false,
        "error": "connect ECONNREFUSED 172.20.0.2:5432"
      }
    }
    ```
  - Customer checkout and catalog browsing fail.

---

## 2. Investigation Commands & Diagnosis (Step-by-Step)

### Step 1: Probe Database Health Endpoint
```bash
curl -i http://localhost:5000/ready
```

### Step 2: Check PostgreSQL Container Health
```bash
docker compose ps postgres
docker logs ecommerce-postgres --tail 50
```
*Run `pg_isready` inside the database container:*
```bash
docker exec -it ecommerce-postgres pg_isready -U ecommerce_user -d ecommerce_db
```
*Possible Outputs:*
- `accepting connections` -> Database is healthy, issue is network/credentials between backend and DB.
- `no response / rejecting connections` -> PostgreSQL crashed or ran out of file descriptors.

### Step 3: Test TCP Handshake & DNS from Backend Container
```bash
docker exec -it ecommerce-backend nc -zv postgres 5432
```
*If connection times out or fails:*
- Check network configuration in `docker-compose.yml`: Is `backend` joined to `db-net`?

### Step 4: Validate Credentials & Pool Statistics
```bash
docker exec -it ecommerce-backend node -e "
  const { Client } = require('pg');
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  client.connect().then(() => console.log('Connected!')).catch(e => console.error(e.message));
"
```

---

## 3. Root Cause Analysis
1. **Network Isolation**: The backend container was accidentally disconnected from `db-net`, preventing DNS resolution of the hostname `postgres`.
2. **Credential Authentication Failure**: `DB_PASSWORD` in `.env` did not match `POSTGRES_PASSWORD` initialized in the persistent PostgreSQL data volume.
3. **Connection Pool Starvation**: Pool capacity was exhausted by unreleased clients during heavy checkout traffic.

---

## 4. Resolution Procedure
1. Verify both `backend` and `postgres` are attached to `db-net` in `docker-compose.yml`.
2. Sync `.env` passwords:
   ```bash
   export DB_PASSWORD=SecretPassword123!
   ```
3. Restart backend with pool timeout enforcement:
   ```bash
   docker compose up -d backend
   ```
4. Confirm `/ready` probe returns HTTP 200:
   ```bash
   curl http://localhost:5000/ready
   ```

---

## 5. Prevention Strategy
- Enforce automated connection pooling with strict `idleTimeoutMillis` and `connectionTimeoutMillis` in `db.js`.
- Always wrap database transactions in `try ... finally { client.release(); }` to prevent connection leaks.
