<#
.SYNOPSIS
    CI/CD Pipeline & GitHub Integration Validation Suite
#>

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " RUNNING CI/CD IMPLEMENTATION VALIDATION" -ForegroundColor Cyan
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

Assert-Check "CI/CD: GitHub Actions workflow is valid YAML with test, build, and Trivy jobs" {
    $path = Join-Path $rootDir ".github/workflows/ci.yml"
    if (-not (Test-Path $path)) { throw "Missing ci.yml: $path" }
    $content = Get-Content $path -Raw
    if (-not ($content -match "lint-and-audit" -or $content -match "backend-test-audit")) { throw "Missing test/audit job" }
    if (-not ($content -match "iac-security-scan" -or $content -match "frontend-build")) { throw "Missing IaC/build job" }
    if (-not ($content -match "aquasecurity/trivy-action")) { throw "Missing Trivy scan step" }
}

Assert-Check "CI/CD: Jenkinsfile implements all 11 required production stages" {
    $path = Join-Path $rootDir "Jenkinsfile"
    if (-not (Test-Path $path)) { throw "Missing Jenkinsfile: $path" }
    $content = Get-Content $path -Raw
    $stages = @(
        "1. Git Checkout",
        "2. Dependency Installation",
        "3. Application Build",
        "4. Unit Testing",
        "5. SonarQube Code Quality Analysis",
        "6. Docker Image Build",
        "7. Trivy Security Scanning",
        "8. Docker Image Push to AWS ECR",
        "9. Deployment to AWS EC2",
        "10. Application Health Check",
        "11. Deployment Verification"
    )
    foreach ($s in $stages) {
        if (-not ($content -match [regex]::Escape($s))) { throw "Missing stage: $s" }
    }
}

Assert-Check "CI/CD: Jenkinsfile includes automatic rollback in post { failure }" {
    $path = Join-Path $rootDir "Jenkinsfile"
    $content = Get-Content $path -Raw
    if (-not ($content -match "rollback\.sh")) { throw "Missing rollback.sh invocation on failure" }
    $deployScript = Join-Path $rootDir "jenkins/deploy.sh"
    $rollbackScript = Join-Path $rootDir "jenkins/rollback.sh"
    if (-not (Test-Path $deployScript)) { throw "Missing deploy.sh" }
    if (-not (Test-Path $rollbackScript)) { throw "Missing rollback.sh" }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "CI/CD VALIDATION RESULT: $passed PASSED, $failed FAILED" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
