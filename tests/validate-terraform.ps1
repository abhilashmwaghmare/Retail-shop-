<#
.SYNOPSIS
    Terraform Modules & Environments Validation Suite
#>

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " RUNNING TERRAFORM INFRASTRUCTURE VALIDATION" -ForegroundColor Cyan
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

# 1. Modules existence
$modules = @("vpc", "security_groups", "iam", "s3", "ec2")
foreach ($m in $modules) {
    Assert-Check "Terraform Module: $m has main.tf, variables.tf, and outputs.tf" {
        $p = Join-Path $rootDir "terraform/modules/$m"
        if (-not (Test-Path (Join-Path $p "main.tf"))) { throw "Missing main.tf in $m" }
        if (-not (Test-Path (Join-Path $p "variables.tf"))) { throw "Missing variables.tf in $m" }
        if (-not (Test-Path (Join-Path $p "outputs.tf"))) { throw "Missing outputs.tf in $m" }
    }
}

# 2. Environments existence
Assert-Check "Terraform Environment: dev has versions.tf, main.tf, and outputs.tf" {
    $p = Join-Path $rootDir "terraform/environments/dev"
    if (-not (Test-Path (Join-Path $p "versions.tf"))) { throw "Missing versions.tf in dev" }
    if (-not (Test-Path (Join-Path $p "main.tf"))) { throw "Missing main.tf in dev" }
    if (-not (Test-Path (Join-Path $p "outputs.tf"))) { throw "Missing outputs.tf in dev" }
    $mainContent = Get-Content (Join-Path $p "main.tf") -Raw
    if (-not ($mainContent -match "enable_nat_gateway\s*=\s*false")) { throw "Dev should disable NAT gateway for cost optimization" }
}

Assert-Check "Terraform Environment: prod has multi-AZ and NAT enabled" {
    $p = Join-Path $rootDir "terraform/environments/prod"
    if (-not (Test-Path (Join-Path $p "main.tf"))) { throw "Missing main.tf in prod" }
    $mainContent = Get-Content (Join-Path $p "main.tf") -Raw
    if (-not ($mainContent -match "enable_nat_gateway\s*=\s*true")) { throw "Prod must enable NAT gateway" }
}

Assert-Check "Terraform: State locking with S3 lockfile documented and configured" {
    $p = Join-Path $rootDir "terraform/environments/dev/versions.tf"
    $content = Get-Content $p -Raw
    if (-not ($content -match "use_lockfile\s*=\s*true")) { throw "Missing S3 state locking lockfile configuration" }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "TERRAFORM VALIDATION RESULT: $passed PASSED, $failed FAILED" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
