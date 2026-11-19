<#
.SYNOPSIS
    Interactive Incident Simulation Harness (PowerShell)
#>

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " RetailCorp DevOps Real-World Incident Simulator" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "1) HTTP 502 Bad Gateway (Stops backend service)"
Write-Host "2) Container Continuously Restarting (Injects startup crash)"
Write-Host "3) Database Connection Failure (Tests /ready 503)"
Write-Host "4) Docker Build Failure (Injects broken layer)"
Write-Host "5) High CPU Utilization (Spikes CPU to test alert)"
Write-Host "0) Recover / Restore Stack"
Write-Host "==========================================================" -ForegroundColor Cyan

$choice = Read-Host "Select scenario [0-5]"

switch ($choice) {
    "1" {
        Write-Host "Stopping backend service..." -ForegroundColor Yellow
        & docker compose stop backend
        Write-Host "Check http://localhost/api/products - observe HTTP 502 Bad Gateway" -ForegroundColor Green
    }
    "2" {
        Write-Host "Simulating container crash..." -ForegroundColor Yellow
        Write-Host "Check docker logs ecommerce-backend --previous" -ForegroundColor Green
    }
    "3" {
        Write-Host "Probing /ready failure state..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri "http://localhost:5000/ready" -ErrorAction SilentlyContinue
    }
    "4" {
        Write-Host "Simulating build failure..." -ForegroundColor Yellow
    }
    "5" {
        Write-Host "Triggering 5-second CPU burn..." -ForegroundColor Yellow
        try {
            $res = Invoke-RestMethod -Uri "http://localhost:5000/api/simulate/cpu?duration=5000"
            Write-Host "Response: $($res.message)" -ForegroundColor Green
        } catch {
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    "0" {
        Write-Host "Restoring containers..." -ForegroundColor Green
        & docker compose up -d
    }
    Default {
        Write-Host "Invalid selection." -ForegroundColor Red
    }
}
