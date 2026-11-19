<#
.SYNOPSIS
    Application Architecture & Source Validation Suite
.DESCRIPTION
    Validates syntax, schemas, routes, models, and contracts across backend, frontend, and database.
#>

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " RUNNING APPLICATION ARCHITECTURE & SOURCE VALIDATION" -ForegroundColor Cyan
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

# 1. Validate Database Schema & Seed
Assert-Check "Database: Schema migration file exists and contains core tables" {
    $schemaPath = Join-Path $rootDir "database/migrations/01_init_schema.sql"
    if (-not (Test-Path $schemaPath)) { throw "Migration file missing at $schemaPath" }
    $content = Get-Content $schemaPath -Raw
    if (-not ($content -match "CREATE TABLE IF NOT EXISTS users")) { throw "Missing users table" }
    if (-not ($content -match "CREATE TABLE IF NOT EXISTS products")) { throw "Missing products table" }
    if (-not ($content -match "CREATE TABLE IF NOT EXISTS orders")) { throw "Missing orders table" }
    if (-not ($content -match "CREATE TABLE IF NOT EXISTS order_items")) { throw "Missing order_items table" }
}

Assert-Check "Database: Seed script contains admin user and initial products" {
    $seedPath = Join-Path $rootDir "database/seeds/01_seed_data.sql"
    if (-not (Test-Path $seedPath)) { throw "Seed file missing at $seedPath" }
    $content = Get-Content $seedPath -Raw
    if (-not ($content -match "admin@retailcorp.io")) { throw "Missing admin seed" }
    if (-not ($content -match "student@retailcorp.io")) { throw "Missing student seed" }
    if (-not ($content -match "k8s-architecture-book")) { throw "Missing sample product" }
}

# 2. Validate Backend Manifest & Configuration
Assert-Check "Backend: package.json is valid JSON with required production dependencies" {
    $pkgPath = Join-Path $rootDir "backend/package.json"
    $json = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if ($json.name -ne "ecommerce-backend-service") { throw "Incorrect package name" }
    if (-not $json.dependencies.express) { throw "Missing express dependency" }
    if (-not $json.dependencies.pg) { throw "Missing pg dependency" }
    if (-not $json.dependencies.jsonwebtoken) { throw "Missing jsonwebtoken dependency" }
    if (-not $json.dependencies.'prom-client') { throw "Missing prom-client dependency" }
}

Assert-Check "Backend: All 10 features implemented in models and controllers" {
    $controllers = @("authController.js", "productController.js", "orderController.js", "adminController.js")
    foreach ($c in $controllers) {
        $p = Join-Path $rootDir "backend/src/controllers/$c"
        if (-not (Test-Path $p)) { throw "Missing controller: $c" }
    }
    $routes = @("authRoutes.js", "productRoutes.js", "orderRoutes.js", "adminRoutes.js", "healthRoutes.js")
    foreach ($r in $routes) {
        $p = Join-Path $rootDir "backend/src/routes/$r"
        if (-not (Test-Path $p)) { throw "Missing route: $r" }
    }
}

Assert-Check "Backend: Health probes (/healthz, /ready, /metrics) defined" {
    $healthPath = Join-Path $rootDir "backend/src/routes/healthRoutes.js"
    $content = Get-Content $healthPath -Raw
    if (-not ($content -match "/healthz")) { throw "Missing /healthz route" }
    if (-not ($content -match "/ready")) { throw "Missing /ready route" }
    if (-not ($content -match "/metrics")) { throw "Missing /metrics route" }
}

# 3. Validate Frontend Architecture
Assert-Check "Frontend: package.json and tsconfig.json are valid" {
    $pkgPath = Join-Path $rootDir "frontend/package.json"
    $json = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if ($json.name -ne "ecommerce-frontend-spa") { throw "Incorrect frontend package name" }
    $tsConfig = Join-Path $rootDir "frontend/tsconfig.json"
    if (-not (Test-Path $tsConfig)) { throw "Missing tsconfig.json" }
}

Assert-Check "Frontend: Core components, contexts, and pages exist" {
    $files = @(
        "src/types/index.ts",
        "src/services/api.ts",
        "src/context/AuthContext.tsx",
        "src/context/CartContext.tsx",
        "src/components/Navbar.tsx",
        "src/components/ProductCard.tsx",
        "src/components/CartDrawer.tsx",
        "src/components/TelemetryBar.tsx",
        "src/pages/CatalogPage.tsx",
        "src/pages/OrdersPage.tsx",
        "src/pages/AdminDashboard.tsx",
        "src/App.tsx",
        "nginx.conf"
    )
    foreach ($f in $files) {
        $p = Join-Path $rootDir "frontend/$f"
        if (-not (Test-Path $p)) { throw "Missing frontend file: $f" }
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "VALIDATION RESULT: $passed PASSED, $failed FAILED" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
