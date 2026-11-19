# ==============================================================================
# Package Project for AWS EC2 Deployment
# ==============================================================================

$sourceDir = "c:\Users\Greamio\OneDrive\Desktop\devops-projects\projects\01-ecommerce-production-deployment\ecommerce-devops-project"
$outputZip = "$sourceDir\retailcorp-ec2-deployment.zip"

Write-Host "Creating deployment package for EC2..." -ForegroundColor Cyan

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

# Create zip excluding git, node_modules, and temporary files
$filesToZip = Get-ChildItem -Path $sourceDir -Recurse | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\\.git\\" -and
    $_.FullName -notmatch "\\\.terraform\\" -and
    $_.FullName -notmatch "\\dist\\" -and
    $_.FullName -notmatch "\\retailcorp-ec2-deployment\.zip$"
}

Compress-Archive -Path $filesToZip.FullName -DestinationPath $outputZip -CompressionLevel Optimal

Write-Host "✅ Deployment package created successfully: $outputZip" -ForegroundColor Green
Write-Host "File size: $((Get-Item $outputZip).Length / 1KB) KB" -ForegroundColor Green
