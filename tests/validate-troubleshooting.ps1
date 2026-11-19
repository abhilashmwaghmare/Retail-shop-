<#
.SYNOPSIS
    Troubleshooting Scenarios & Runbook Validation Suite
#>

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " RUNNING TROUBLESHOOTING RUNBOOKS & INCIDENTS VALIDATION" -ForegroundColor Cyan
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

$scenarios = @(
    "SCENARIO_1_502_BAD_GATEWAY.md",
    "SCENARIO_2_CONTAINER_RESTARTING.md",
    "SCENARIO_3_DB_CONNECTION_FAILURE.md",
    "SCENARIO_4_JENKINS_DOCKER_BUILD_FAIL.md",
    "SCENARIO_5_HIGH_CPU_UNAVAILABLE.md"
)

foreach ($s in $scenarios) {
    Assert-Check "Troubleshooting Runbook: $s contains all 6 required sections" {
        $p = Join-Path $rootDir "docs/troubleshooting/$s"
        if (-not (Test-Path $p)) { throw "Missing runbook: $s" }
        $content = Get-Content $p -Raw
        if (-not ($content -match "Symptoms")) { throw "Missing Symptoms section in $s" }
        if (-not ($content -match "Investigation Commands")) { throw "Missing Investigation section in $s" }
        if (-not ($content -match "Root Cause")) { throw "Missing Root Cause section in $s" }
        if (-not ($content -match "Resolution")) { throw "Missing Resolution section in $s" }
        if (-not ($content -match "Prevention Strategy")) { throw "Missing Prevention section in $s" }
    }
}

Assert-Check "Simulation scripts: simulate-incident.sh and .ps1 exist" {
    $sh = Join-Path $rootDir "scripts/simulate-incident.sh"
    $ps1 = Join-Path $rootDir "scripts/simulate-incident.ps1"
    if (-not (Test-Path $sh)) { throw "Missing simulate-incident.sh" }
    if (-not (Test-Path $ps1)) { throw "Missing simulate-incident.ps1" }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "TROUBLESHOOTING VALIDATION: $passed PASSED, $failed FAILED" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
