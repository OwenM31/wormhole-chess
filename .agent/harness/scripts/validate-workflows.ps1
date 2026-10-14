# Coding Harness Workflow Validation Script
# Validates all workflow files for required structure

$ErrorCount = 0
$WarningCount = 0
$WorkflowsChecked = 0

$pointer = [char]0x25BA

Write-Host "-----------------------------------------------------" -ForegroundColor Cyan
Write-Host " HARNESS $pointer VALIDATING WORKFLOWS" -ForegroundColor Cyan
Write-Host "-----------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

$workflowDirs = @(
    "$PSScriptRoot\..\..\workflows",
    "$PSScriptRoot\..\workflows",
    ".agent\workflows",
    "workflows"
)

$targetDir = $null
foreach ($dir in $workflowDirs) {
    if (Test-Path $dir) {
        $targetDir = $dir
        break
    }
}

if (-not $targetDir) {
    Write-Host "[FAIL] Could not locate workflows directory" -ForegroundColor Red
    exit 1
}

$workflows = Get-ChildItem -Path "$targetDir\*.md"

foreach ($file in $workflows) {
    $WorkflowsChecked++
    $content = Get-Content $file.FullName -Raw
    $hasErrors = $false
    
    # Check for frontmatter
    if ($content -notmatch "(?m)^---") {
        Write-Host "[FAIL] $($file.Name): Missing frontmatter" -ForegroundColor Red
        $ErrorCount++
        $hasErrors = $true
    }
    
    # Check for description
    if ($content -notmatch "description:") {
        Write-Host "[FAIL] $($file.Name): Missing description in frontmatter" -ForegroundColor Red
        $ErrorCount++
        $hasErrors = $true
    }
    
    # Check for process tags (optional but recommended)
    if ($content -notmatch "<process>") {
        Write-Host "[WARN] $($file.Name): Missing <process> tag" -ForegroundColor Yellow
        $WarningCount++
    }
    
    if (-not $hasErrors) {
        Write-Host "[OK] $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "-----------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Workflows checked: $WorkflowsChecked"
Write-Host "Errors: $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $WarningCount" -ForegroundColor $(if ($WarningCount -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "[PASS] All workflows valid!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Validation failed" -ForegroundColor Red
    exit 1
}
