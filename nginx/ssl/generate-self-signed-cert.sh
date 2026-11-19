#!/usr/bin/env bash
# =============================================================================
# Automated Self-Signed SSL Certificate Generator for Local Testing
# =============================================================================

set -euo pipefail

SSL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "${SSL_DIR}"

echo "Generating 2048-bit RSA self-signed SSL certificate for localhost..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "${SSL_DIR}/server.key" \
  -out "${SSL_DIR}/server.crt" \
  -subj "/C=US/ST=Texas/L=Austin/O=RetailCorp/OU=DevOps/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "${SSL_DIR}/server.key"
chmod 644 "${SSL_DIR}/server.crt"

echo "✅ SSL certificate generated successfully:"
echo "   Private Key: ${SSL_DIR}/server.key"
echo "   Certificate: ${SSL_DIR}/server.crt"
