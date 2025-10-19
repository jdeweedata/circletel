# Comprehensive Dev Environment Optimizer
# Runs all optimization scripts in sequence
# Dell Vostro 16 5640 (16GB RAM) - CircleTel Development
# Usage: powershell -File scripts/optimize-dev-environment.ps1

param(
    [switch]$ApplyAll = $false,     # Apply all optimizations automatically
    [switch]$VSCodeOnly = $false,   # Only optimize VS Code
    [switch]$WindowsOnly = $false,  # Only optimize Windows
    [switch]$BrowserOnly = $false   # Only optimize browser
)

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       DEV ENVIRONMENT OPTIMIZER        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dell Vostro 16 5640 (16GB RAM)" -ForegroundColor Gray
Write-Host "CircleTel Next.js Platform" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# Display menu if no specific option selected
if (-not ($VSCodeOnly -or $WindowsOnly -or $BrowserOnly)) {
    Write-Host "Optimization Modules:" -ForegroundColor Yellow
    Write-Host "  [1] VS Code Memory Optimization" -ForegroundColor White
    Write-Host "  [2] Windows System Optimization" -ForegroundColor White
    Write-Host "  [3] Browser Memory Analysis" -ForegroundColor White
    Write-Host "  [4] Complete System Optimization (All)" -ForegroundColor Cyan
    Write-Host ""

    $choice = Read-Host "Select option (1-4) or press Enter for all"

    switch ($choice) {
        "1" { $VSCodeOnly = $true }
        "2" { $WindowsOnly = $true }
        "3" { $BrowserOnly = $true }
        "4" { }  # Run all (default)
        default { }  # Run all (default)
    }
    Write-Host ""
}

# Track total improvements
$improvements = @{
    VSCode = 0
    Windows = 0
    Browser = 0
}

# 1. VS Code Optimization
if ($VSCodeOnly -or (-not ($WindowsOnly -or $BrowserOnly))) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   VS Code Memory Optimization          " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Check current VS Code memory
    $codeBefore = Get-Process Code -ErrorAction SilentlyContinue
    if ($codeBefore) {
        $codeMemoryBefore = [math]::Round(($codeBefore | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
        Write-Host "Current VS Code Memory: $codeMemoryBefore MB`n" -ForegroundColor White
    }

    # Run VS Code optimizer
    if ($ApplyAll) {
        & powershell -File "$PSScriptRoot\optimize-vscode.ps1" -ApplySettings
    } else {
        & powershell -File "$PSScriptRoot\optimize-vscode.ps1"
    }

    Write-Host ""
    if ($codeBefore -and $codeMemoryBefore -gt 2048) {
        $improvements.VSCode = [math]::Round($codeMemoryBefore * 0.4, 0)
    }
}

# 2. Windows Optimization
if ($WindowsOnly -or (-not ($VSCodeOnly -or $BrowserOnly))) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Windows System Optimization          " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Run Windows optimizer
    if ($ApplyAll) {
        & powershell -File "$PSScriptRoot\optimize-windows.ps1" -ApplyOptimizations
    } else {
        & powershell -File "$PSScriptRoot\optimize-windows.ps1"
    }

    Write-Host ""
    # Estimate Windows improvements
    $onedrive = Get-Process OneDrive -ErrorAction SilentlyContinue
    if ($onedrive) {
        $improvements.Windows += [math]::Round(($onedrive | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 0)
    }
}

# 3. Browser Optimization
if ($BrowserOnly -or (-not ($VSCodeOnly -or $WindowsOnly))) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Browser Memory Analysis              " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Run browser optimizer
    & powershell -File "$PSScriptRoot\optimize-browser.ps1"

    Write-Host ""
    # Estimate browser improvements
    $chrome = Get-Process chrome -ErrorAction SilentlyContinue
    if ($chrome) {
        $chromeMemory = [math]::Round(($chrome | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 0)
        if ($chromeMemory -gt 1000) {
            $improvements.Browser = [math]::Round($chromeMemory * 0.5, 0)
        }
    }
}

# Final Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      OPTIMIZATION SUMMARY              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Current system state
$os = Get-CimInstance Win32_OperatingSystem
$currentFree = [math]::Round($os.FreePhysicalMemory/1MB, 2)

Write-Host "Current System State:" -ForegroundColor Yellow
Write-Host "  Free RAM: $currentFree GB" -ForegroundColor White
Write-Host ""

# Potential improvements
$totalPotentialSavings = $improvements.VSCode + $improvements.Windows + $improvements.Browser

if ($totalPotentialSavings -gt 0) {
    Write-Host "Potential Memory Savings:" -ForegroundColor Yellow
    if ($improvements.VSCode -gt 0) {
        Write-Host "  VS Code:  ~$($improvements.VSCode) MB" -ForegroundColor Green
    }
    if ($improvements.Windows -gt 0) {
        Write-Host "  Windows:  ~$($improvements.Windows) MB" -ForegroundColor Green
    }
    if ($improvements.Browser -gt 0) {
        Write-Host "  Browser:  ~$($improvements.Browser) MB" -ForegroundColor Green
    }
    Write-Host "  -------------------------" -ForegroundColor Gray
    # Calculate and display total in MB and GB
    $totalGB = [math]::Round($totalPotentialSavings/1024, 2)
    $gbUnit = "GB"
    Write-Host "  Total:    ~$totalPotentialSavings MB" -ForegroundColor Cyan
    Write-Host "            $($totalGB) $gbUnit" -ForegroundColor Cyan
    Write-Host ""

    # Calculate and display projected free memory
    $projectedFree = [math]::Round($currentFree + ($totalPotentialSavings / 1024), 2)
    Write-Host "Projected Free RAM: $($projectedFree) $gbUnit" -ForegroundColor Cyan
    Write-Host ""
}

# Status assessment
if ($currentFree -ge 6) {
    $status = "HEALTHY [OK]"
    $statusColor = "Green"
} elseif ($currentFree -ge 4) {
    $status = "MODERATE [!]"
    $statusColor = "Yellow"
} elseif ($currentFree -ge 2) {
    $status = "HIGH [!]"
    $statusColor = "Red"
} else {
    $status = "CRITICAL [X]"
    $statusColor = "Red"
}

Write-Host "Current Status: " -NoNewline
Write-Host "$status" -ForegroundColor $statusColor

if ($totalPotentialSavings -gt 0 -and $projectedFree -ge 4) {
    Write-Host "After Optimization: " -NoNewline
    if ($projectedFree -ge 6) {
        Write-Host "HEALTHY [OK]" -ForegroundColor Green
    } else {
        Write-Host "MODERATE [!]" -ForegroundColor Yellow
    }
}

Write-Host ""

# Next steps
Write-Host "Next Steps:" -ForegroundColor Cyan

if ($ApplyAll) {
    Write-Host "  [OK] Optimizations applied automatically" -ForegroundColor Green
    Write-Host "  1. Restart VS Code to apply settings" -ForegroundColor White
    Write-Host "  2. Close unnecessary browser tabs" -ForegroundColor White
    Write-Host "  3. Pause OneDrive sync during development" -ForegroundColor White
} else {
    Write-Host "  1. Review recommendations above" -ForegroundColor White
    Write-Host "  2. Apply VS Code settings: -ApplySettings" -ForegroundColor White
    Write-Host "  3. Close heavy background apps" -ForegroundColor White
    Write-Host "  4. Optimize browser tabs (<15 tabs)" -ForegroundColor White
}

Write-Host ""
Write-Host "  To apply all optimizations automatically:" -ForegroundColor Yellow
Write-Host "  powershell -File scripts/optimize-dev-environment.ps1 -ApplyAll" -ForegroundColor Gray
Write-Host ""

# Daily workflow
Write-Host "Daily Workflow Integration:" -ForegroundColor Cyan
Write-Host "  Morning: npm run workflow:start" -ForegroundColor White
Write-Host "  Dev:     npm run dev:memory" -ForegroundColor White
Write-Host "  Evening: npm run workflow:cleanup" -ForegroundColor White
Write-Host ""

Write-Host "========================================`n" -ForegroundColor Cyan

# Return exit code based on memory status
if ($currentFree -ge 4) {
    exit 0  # Success
} elseif ($currentFree -ge 2) {
    exit 1  # Warning
} else {
    exit 2  # Critical
}
