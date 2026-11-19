# Incident Post-Mortem & Runbook: Scenario 4 - Jenkins Pipeline Fails During Docker Image Build

## 1. Executive Summary & Symptoms
- **Symptom**: Jenkins CI/CD pipeline fails at **Stage 6: Docker Image Build**.
- **Jenkins Console Output**:
  ```
  [Stage 6/11] Building multi-stage Docker images tagged as 42-a1b2c3d...
  + docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/retailcorp/backend:42-a1b2c3d -f docker/backend.Dockerfile .
  ERROR: permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
  script returned exit code 1
  ```
  *Alternative Failure Signature:*
  ```
  failed to solve with frontend dockerfile.v0: failed to read dockerfile: open docker/backend.Dockerfile: no such file or directory
  ```
  *Or:*
  ```
  write /var/lib/docker/tmp/docker-builder...: no space left on device
  ```

---

## 2. Investigation Commands & Diagnosis (Step-by-Step)

### Step 1: Check Docker Daemon Socket Permissions
On the Jenkins worker node:
```bash
ls -la /var/run/docker.sock
# Expected output: srw-rw---- 1 root docker 0 Nov 16 12:00 /var/run/docker.sock
```
Verify if the `jenkins` system user belongs to the `docker` group:
```bash
id jenkins
# If 'docker' is missing from groups, Jenkins cannot communicate with the Docker daemon.
```

### Step 2: Check Docker Host Disk Capacity
```bash
docker system df
df -h /var/lib/docker
```
If `var/lib/docker` is at 100% capacity:
- Accumulation of orphaned dangling build cache and untagged intermediate layers.

### Step 3: Verify Build Context Path
Check from where `docker build` is executed relative to the Dockerfile:
```bash
pwd
ls -la docker/backend.Dockerfile
```

---

## 3. Root Cause Analysis
1. **Permission Denied**: The `jenkins` service account lacks access to `/var/run/docker.sock`.
2. **Disk Exhaustion**: Jenkins build node accumulated hundreds of untagged images and unused layer caches over time, causing `no space left on device`.
3. **Context Path Discrepancy**: The Jenkinsfile ran `docker build -f docker/backend.Dockerfile .` from inside a subdirectory rather than the project workspace root.

---

## 4. Resolution Procedure
1. Grant Jenkins user access to Docker daemon:
   ```bash
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```
2. Clean up dangling build cache and images:
   ```bash
   docker system prune -af --volumes
   ```
3. Ensure workspace directory alignment in `Jenkinsfile`:
   Always execute `docker build` from the workspace root where `.dockerignore` and source directories reside.

---

## 5. Prevention Strategy
- Implement an automated cron or Jenkins post-stage cleanup:
  ```groovy
  post {
      always {
          sh 'docker builder prune -f --keep-storage 5GB'
      }
  }
  ```
- Use multi-stage Docker builds with `.dockerignore` to keep image build contexts tiny (< 50MB).
