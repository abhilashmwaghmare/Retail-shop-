# Production Secrets Management & Zero-Leakage Architecture

In production cloud engineering, hardcoding credentials, API tokens, or database passwords in source code or Git repositories is a critical Sev-1 security violation.

---

## 1. Secrets Handling Strategy

```
               [Developer / CI Runner]
                         │
                         ▼ (No credentials committed to Git)
+-----------------------------------------------------------------+
| LOCAL / TESTING:                                                |
| - .env (gitignored via .gitignore)                              |
| - Injected via docker-compose.yml environment variables         |
+-----------------------------------------------------------------+
                         │
                         ▼ (Promoting to Cloud)
+-----------------------------------------------------------------+
| AWS EC2 / PRODUCTION:                                           |
| - IAM Instance Profiles (no hardcoded AWS Access/Secret Keys)   |
| - AWS Secrets Manager / SSM Parameter Store                     |
| - Rotated every 90 days automatically                           |
+-----------------------------------------------------------------+
```

---

## 2. CI/CD Secrets Isolation in Jenkins

1. **AWS Credentials**: Managed through the Jenkins `Credentials Binding Plugin` as AWS Secret Text credentials or delegated to IAM Roles for Service Accounts (IRSA).
2. **EC2 SSH Private Key**: Stored in Jenkins Credential Store (`SSH Username with private key`) with ID `ec2-ssh-private-key`.
3. **Database & JWT Secrets**: Injected into the target EC2 `.env` file via secured deployment scripts rather than stored in the repository.

---

## 3. Pre-Commit Secret Scanning (Gitleaks / Trufflehog)

To prevent accidental secret commits, developers and CI pipelines run automated secret scanners:
```bash
# Scan repository for accidental high-entropy strings or private keys
trufflehog git file://. --since-commit HEAD~5
```
