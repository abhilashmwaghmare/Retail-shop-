<#
.SYNOPSIS
    Automated Application Deployment & Verification (PowerShell)
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Launching RetailCorp E-Commerce Production Platform" -ForegroundColor Cyan
Write-Host " Working Directory: $RootDir"
Write-Host "==========================================================" -ForegroundColor Cyan

Push-Location $RootDir
try {
    # 1. Environment file check
    if (-not (Test-Path ".env")) {
        Write-Host "[1/4] Creating .env from .env.example..." -ForegroundColor Green
        Copy-Item ".env.example" ".env"
    }

    # 2. Check Docker CLI
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Host "⚠️ Docker CLI is not detected in current PATH." -ForegroundColor Yellow
        Write-Host "Please start Docker Desktop on your workstation." -ForegroundColor DarkGray
        exit 0
    }

    # 3. Launch Docker Compose
    Write-Host "[3/4] Orchestrating Docker Compose services..." -ForegroundColor Green
    & docker compose up -d --build

    # 4. Check status
    Write-Host "[4/4] Checking running container statuses..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    & docker compose ps

    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "🎉 Platform services deployed!" -ForegroundColor Green
    Write-Host "  Frontend:    http://localhost" -ForegroundColor White
    Write-Host "  Backend:     http://localhost:5000" -ForegroundColor White
    Write-Host "  Healthz:     http://localhost:5000/healthz" -ForegroundColor White
    Write-Host "  Prometheus:  http://localhost:9090" -ForegroundColor White
    Write-Host "  Grafana:     http://localhost:3000 (admin / admin)" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Cyan
} finally {
    Pop-Location
}
