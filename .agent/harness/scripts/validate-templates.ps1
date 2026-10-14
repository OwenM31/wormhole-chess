# Coding Harness Template Validation Script
# Validates all template files

$ErrorCount = 0
$WarningCount = 0
$TemplatesChecked = 0

$pointer = [char]0x25BA

Write-Host "-----------------------------------------------------" -ForegroundColor Cyan
Write-Host " HARNESS $pointer VALIDATING TEMPLATES" -ForegroundColor Cyan
Write-Host "-----------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

$templateDirs = @(
    "$PSScriptRoot\..\templates",
    "$PSScriptRoot\..\..\harness\templates",
    ".agent\harness\templates",
    ".agent\templates",
    "templates"
)

$targetDir = $null
foreach ($dir in $templateDirs) {
    if (Test-Path $dir) {
        $targetDir = $dir
        break
    }
}

if (-not $targetDir) {
    Write-Host "[FAIL] Could not locate templates directory" -ForegroundColor Red
    exit 1
}

$templates = Get-ChildItem -Path "$targetDir\*.md"

foreach ($file in $templates) {
    $TemplatesChecked++
    $content = Get-Content $file.FullName -Raw
    $hasErrors = $false
    
    # Check for title (# heading)
    if ($content -notmatch "(?m)^# ") {
        Write-Host "[FAIL] $($file.Name): Missing title (# heading)" -ForegroundColor Red
        $ErrorCount++
        $hasErrors = $true
    }
    
    # Check for Last updated marker
    if ($content -notmatch "Last updated") {
        Write-Host "[WARN] $($file.Name): Missing 'Last updated' marker" -ForegroundColor Yellow
        $WarningCount++
    }
    
    # Check minimum length (templates should have substance)
    if ($content.Length -lt 200) {
        Write-Host "[WARN] $($file.Name): Very short template (<200 chars)" -ForegroundColor Yellow
        $WarningCount++
    }
    
    if (-not $hasErrors) {
        Write-Host "[OK] $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "-----------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Templates checked: $TemplatesChecked"
Write-Host "Errors: $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $WarningCount" -ForegroundColor $(if ($WarningCount -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "[PASS] All templates valid!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Validation failed" -ForegroundColor Red
    exit 1
}
