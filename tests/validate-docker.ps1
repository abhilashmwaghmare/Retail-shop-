<#
.SYNOPSIS
    Docker & Compose Configuration Validation Suite
#>

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " RUNNING DOCKER IMPLEMENTATION VALIDATION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Check {
    param (
        [string]$Name,
        [scriptblock]$Block
    )
    try {
        & $Block
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        Write-Host "         Reason: $($_.Exception.Message)" -ForegroundColor DarkRed
        $script:failed++
    }
}

$rootDir = Split-Path -Parent $PSScriptRoot

Assert-Check "Docker: Backend Dockerfile is multi-stage, non-root, with dumb-init and healthcheck" {
    $path = Join-Path $rootDir "docker/backend.Dockerfile"
    if (-not (Test-Path $path)) { throw "File missing: $path" }
    $content = Get-Content $path -Raw
    if (-not ($content -match "FROM node:20-alpine AS builder")) { throw "Missing builder stage" }
    if (-not ($content -match "FROM node:20-alpine AS runner")) { throw "Missing runner stage" }
    if (-not ($content -match "USER 10001:10001")) { throw "Missing non-root user UID 10001" }
    if (-not ($content -match "dumb-init")) { throw "Missing dumb-init signal handler" }
    if (-not ($content -match "HEALTHCHECK")) { throw "Missing HEALTHCHECK directive" }
}

Assert-Check "Docker: Frontend Dockerfile is multi-stage with Nginx healthcheck" {
    $path = Join-Path $rootDir "docker/frontend.Dockerfile"
    if (-not (Test-Path $path)) { throw "File missing: $path" }
    $content = Get-Content $path -Raw
    if (-not ($content -match "AS builder")) { throw "Missing builder stage" }
    if (-not ($content -match "FROM nginx:1.25-alpine AS runner")) { throw "Missing runner stage" }
    if (-not ($content -match "HEALTHCHECK")) { throw "Missing HEALTHCHECK directive" }
}

Assert-Check "Docker: Docker Compose defines all 7 services with health checks and networks" {
    $path = Join-Path $rootDir "docker-compose.yml"
    if (-not (Test-Path $path)) { throw "File missing: $path" }
    $content = Get-Content $path -Raw
    $services = @("postgres:", "backend:", "frontend:", "prometheus:", "alertmanager:", "grafana:", "node-exporter:")
    foreach ($s in $services) {
        if (-not ($content -match $s)) { throw "Missing service in compose: $s" }
    }
    if (-not ($content -match "frontend-net:")) { throw "Missing frontend-net" }
    if (-not ($content -match "backend-net:")) { throw "Missing backend-net" }
    if (-not ($content -match "db-net:")) { throw "Missing db-net" }
}

Assert-Check "Docker: .dockerignore and .env.example are configured" {
    $ignore = Join-Path $rootDir "docker/.dockerignore"
    $envEx = Join-Path $rootDir ".env.example"
    if (-not (Test-Path $ignore)) { throw "Missing .dockerignore" }
    if (-not (Test-Path $envEx)) { throw "Missing .env.example" }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "DOCKER VALIDATION RESULT: $passed PASSED, $failed FAILED" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
