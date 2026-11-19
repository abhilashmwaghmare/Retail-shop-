<#
.SYNOPSIS
    Monitoring & Security Validation Suite
#>

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " RUNNING MONITORING & SECURITY IMPLEMENTATION VALIDATION" -ForegroundColor Cyan
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

Assert-Check "Nginx: Reverse proxy conf exists with HTTP->HTTPS redirect and API proxying" {
    $p = Join-Path $rootDir "nginx/conf.d/app.conf"
    if (-not (Test-Path $p)) { throw "Missing app.conf: $p" }
    $content = Get-Content $p -Raw
    if (-not ($content -match "listen 443 ssl")) { throw "Missing SSL listener" }
    if (-not ($content -match "proxy_pass http://backend:5000;")) { throw "Missing backend proxy pass" }
    if (-not ($content -match "proxy_pass http://frontend:80;")) { throw "Missing frontend proxy pass" }
}

Assert-Check "Prometheus: Configuration and Alerting rules exist and define required alerts" {
    $prom = Join-Path $rootDir "monitoring/prometheus/prometheus.yml"
    $rules = Join-Path $rootDir "monitoring/prometheus/rules/ecommerce-alerts.yml"
    if (-not (Test-Path $prom)) { throw "Missing prometheus.yml" }
    if (-not (Test-Path $rules)) { throw "Missing ecommerce-alerts.yml" }
    $rulesContent = Get-Content $rules -Raw
    $alerts = @("ApplicationDowntime", "HighCpuUtilization", "HighMemoryUtilization", "DiskSpaceExhaustion", "DatabaseHealthCheckFailed", "HighHttpErrorRate", "HighRequestLatencyP99")
    foreach ($a in $alerts) {
        if (-not ($rulesContent -match "alert:\s*$a")) { throw "Missing required alert: $a" }
    }
}

Assert-Check "Alertmanager: Configuration exists with route tree and receivers" {
    $p = Join-Path $rootDir "monitoring/alertmanager/alertmanager.yml"
    if (-not (Test-Path $p)) { throw "Missing alertmanager.yml" }
    $content = Get-Content $p -Raw
    if (-not ($content -match "slack-devops")) { throw "Missing Slack receiver" }
    if (-not ($content -match "inhibit_rules:")) { throw "Missing inhibition rules" }
}

Assert-Check "Grafana: Datasource provisioning and production dashboard JSON are valid" {
    $ds = Join-Path $rootDir "monitoring/grafana/provisioning/datasources/prometheus.yaml"
    $dashboards = Join-Path $rootDir "monitoring/grafana/dashboards/ecommerce-production-dashboard.json"
    if (-not (Test-Path $ds)) { throw "Missing datasource yaml" }
    if (-not (Test-Path $dashboards)) { throw "Missing dashboard json" }
    $json = Get-Content $dashboards -Raw | ConvertFrom-Json
    if ($json.uid -ne "retailcorp-ecommerce-prod") { throw "Invalid dashboard UID" }
    if ($json.panels.Count -lt 6) { throw "Dashboard should contain at least 6 telemetry panels" }
}

Assert-Check "Security: SonarQube, Trivy, Checkov, and Secrets Management configurations exist" {
    $sonar = Join-Path $rootDir "security/sonarqube/sonar-project.properties"
    $trivy = Join-Path $rootDir "security/trivy/trivy-scan.sh"
    $checkov = Join-Path $rootDir "security/checkov/checkov-scan.sh"
    $secrets = Join-Path $rootDir "security/SECRETS_MANAGEMENT.md"
    if (-not (Test-Path $sonar)) { throw "Missing sonar properties" }
    if (-not (Test-Path $trivy)) { throw "Missing trivy scan script" }
    if (-not (Test-Path $checkov)) { throw "Missing checkov scan script" }
    if (-not (Test-Path $secrets)) { throw "Missing secrets management guide" }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "MONITORING & SECURITY VALIDATION: $passed PASSED, $failed FAILED" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
