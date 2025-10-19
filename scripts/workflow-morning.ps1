# CircleTel Morning Workflow
# Automated memory optimization for 16GB systems
# Usage: powershell -File scripts/workflow-morning.ps1

param(
    [switch]$AutoCleanup = $false,  # Automatically clean without prompts
    [switch]$Verbose = $false        # Show detailed output
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CircleTel Morning Startup Workflow" -ForegroundColor Cyan
Write-Host "Dell Vostro 16 5640 (16GB RAM)" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Initial memory check
Write-Host "[1/6] Checking current memory state..." -ForegroundColor Yellow

$beforeCheck = & npm run memory:check 2>&1
$beforeMemory = @{
    TotalRAM = 15.69
    FreeRAM = 0
    NodeCount = 0
    NodeMemory = 0
}

# Parse memory output
if ($beforeCheck -match "Free:\s+([0-9.]+)\s+GB") {
    $beforeMemory.FreeRAM = [math]::Round([decimal]$matches[1], 2)
}

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $beforeMemory.NodeCount = $nodeProcesses.Count
    $beforeMemory.NodeMemory = [math]::Round(($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
}

Write-Host "   Free RAM: $($beforeMemory.FreeRAM) GB" -ForegroundColor White
Write-Host "   Node processes: $($beforeMemory.NodeCount) ($($beforeMemory.NodeMemory) MB)`n" -ForegroundColor White

# 2. Node.js cleanup check
Write-Host "[2/6] Checking Node.js processes..." -ForegroundColor Yellow

$needsNodeCleanup = $false
if ($nodeProcesses) {
    if ($beforeMemory.NodeCount -gt 6 -or $beforeMemory.NodeMemory -gt 800) {
        $needsNodeCleanup = $true
        Write-Host "   ⚠️  Found $($beforeMemory.NodeCount) Node processes using $($beforeMemory.NodeMemory) MB" -ForegroundColor Red
        Write-Host "   Recommendation: Clean up Node processes" -ForegroundColor Yellow

        if ($AutoCleanup) {
            Write-Host "   Auto-cleanup enabled, killing Node processes..." -ForegroundColor Cyan
            taskkill /F /IM node.exe 2>&1 | Out-Null
            Start-Sleep -Seconds 2
            Write-Host "   ✅ Node processes cleaned up`n" -ForegroundColor Green
        } else {
            $response = Read-Host "   Kill all Node processes? (y/n)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                taskkill /F /IM node.exe 2>&1 | Out-Null
                Start-Sleep -Seconds 2
                Write-Host "   ✅ Node processes cleaned up`n" -ForegroundColor Green
            } else {
                Write-Host "   Skipped Node cleanup`n" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   ✅ Node processes normal ($($beforeMemory.NodeCount) processes, $($beforeMemory.NodeMemory) MB)`n" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ No Node processes running`n" -ForegroundColor Green
}

# 3. VS Code check
Write-Host "[3/6] Checking VS Code memory..." -ForegroundColor Yellow

$codeProcesses = Get-Process Code -ErrorAction SilentlyContinue
if ($codeProcesses) {
    $codeMemory = [math]::Round(($codeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
    Write-Host "   VS Code memory: $codeMemory MB ($($codeProcesses.Count) processes)" -ForegroundColor White

    if ($codeMemory -gt 2048) {
        Write-Host "   ⚠️  VS Code using >2GB RAM!" -ForegroundColor Red
        Write-Host "   Recommendation: Close extra VS Code windows and restart" -ForegroundColor Yellow
        Write-Host "   - Keep only CircleTel workspace" -ForegroundColor Gray
        Write-Host "   - Apply: .vscode/settings.memory.json`n" -ForegroundColor Gray
    } elseif ($codeMemory -gt 1500) {
        Write-Host "   ⚠️  VS Code memory elevated" -ForegroundColor Yellow
        Write-Host "   Consider restarting VS Code if issues occur`n" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ VS Code memory normal`n" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️  VS Code not running`n" -ForegroundColor Gray
}

# 4. Other app checks
Write-Host "[4/6] Checking other applications..." -ForegroundColor Yellow

$recommendations = @()

# OneDrive
$onedrive = Get-Process OneDrive -ErrorAction SilentlyContinue
if ($onedrive) {
    $onedriveMemory = [math]::Round(($onedrive | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
    if ($onedriveMemory -gt 500) {
        Write-Host "   OneDrive: $onedriveMemory MB" -ForegroundColor White
        $recommendations += "Pause OneDrive sync (right-click icon → Pause → 2 hours)"
    }
}

# Outlook
$outlook = Get-Process OUTLOOK -ErrorAction SilentlyContinue
if ($outlook) {
    $outlookMemory = [math]::Round($outlook.WorkingSet64 / 1MB, 2)
    if ($outlookMemory -gt 200) {
        Write-Host "   Outlook: $outlookMemory MB" -ForegroundColor White
        $recommendations += "Close Outlook if not actively using email"
    }
}

# Excel
$excel = Get-Process EXCEL -ErrorAction SilentlyContinue
if ($excel) {
    $excelMemory = [math]::Round($excel.WorkingSet64 / 1MB, 2)
    if ($excelMemory -gt 200) {
        Write-Host "   Excel: $excelMemory MB" -ForegroundColor White
        $recommendations += "Close Excel if not actively using"
    }
}

if ($recommendations.Count -eq 0) {
    Write-Host "   ✅ No heavy background apps detected`n" -ForegroundColor Green
} else {
    Write-Host ""
}

# 5. Cache check
Write-Host "[5/6] Checking Next.js cache..." -ForegroundColor Yellow

$nextCacheExists = Test-Path ".\.next"
if ($nextCacheExists) {
    $cacheSize = [math]::Round((Get-ChildItem -Recurse .\.next -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    if ($cacheSize -gt 500) {
        Write-Host "   Next.js cache: $cacheSize MB (LARGE)" -ForegroundColor Yellow

        if ($AutoCleanup) {
            Write-Host "   Auto-cleanup enabled, clearing cache..." -ForegroundColor Cyan
            & npm run clean 2>&1 | Out-Null
            Write-Host "   ✅ Cache cleared`n" -ForegroundColor Green
        } else {
            $response = Read-Host "   Clear cache? (y/n)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                & npm run clean 2>&1 | Out-Null
                Write-Host "   ✅ Cache cleared`n" -ForegroundColor Green
            } else {
                Write-Host "   Skipped cache cleanup`n" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   ✅ Cache size normal ($cacheSize MB)`n" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ No cache found (first build will be slower)`n" -ForegroundColor Green
}

# 6. Final check
Write-Host "[6/6] Final memory status..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$afterCheck = & npm run memory:check 2>&1
$afterMemory = @{
    FreeRAM = 0
    NodeCount = 0
}

if ($afterCheck -match "Free:\s+([0-9.]+)\s+GB") {
    $afterMemory.FreeRAM = [math]::Round([decimal]$matches[1], 2)
}

$nodeProcessesAfter = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcessesAfter) {
    $afterMemory.NodeCount = $nodeProcessesAfter.Count
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Startup Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Summary table
Write-Host "Before:" -ForegroundColor Yellow
Write-Host "  Free RAM:       $($beforeMemory.FreeRAM) GB" -ForegroundColor White
Write-Host "  Node processes: $($beforeMemory.NodeCount)" -ForegroundColor White
Write-Host ""
Write-Host "After:" -ForegroundColor Yellow
Write-Host "  Free RAM:       $($afterMemory.FreeRAM) GB" -ForegroundColor White
Write-Host "  Node processes: $($afterMemory.NodeCount)" -ForegroundColor White
Write-Host ""

$memoryChange = [math]::Round($afterMemory.FreeRAM - $beforeMemory.FreeRAM, 2)
if ($memoryChange -gt 0) {
    Write-Host "Memory freed: +$memoryChange GB ✅" -ForegroundColor Green
} elseif ($memoryChange -lt 0) {
    Write-Host "Memory used: $memoryChange GB" -ForegroundColor Gray
} else {
    Write-Host "Memory unchanged" -ForegroundColor Gray
}
Write-Host ""

# Status and recommendations
if ($afterMemory.FreeRAM -ge 6) {
    Write-Host "Status: HEALTHY ✅" -ForegroundColor Green
    Write-Host "Ready to start: npm run dev:memory" -ForegroundColor White
} elseif ($afterMemory.FreeRAM -ge 4) {
    Write-Host "Status: MODERATE ⚠️" -ForegroundColor Yellow
    Write-Host "Ready to start: npm run dev:memory" -ForegroundColor White
} elseif ($afterMemory.FreeRAM -ge 2) {
    Write-Host "Status: HIGH ⚠️" -ForegroundColor Red
    Write-Host "Action needed: Close more applications" -ForegroundColor Yellow
    Write-Host "Then use: npm run dev:memory" -ForegroundColor White
} else {
    Write-Host "Status: CRITICAL 🔴" -ForegroundColor Red
    Write-Host "Action required: Close applications immediately!" -ForegroundColor Red
    Write-Host "Cannot start development safely" -ForegroundColor Yellow
}

if ($recommendations.Count -gt 0) {
    Write-Host "`nRecommendations:" -ForegroundColor Yellow
    foreach ($rec in $recommendations) {
        Write-Host "  - $rec" -ForegroundColor White
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Exit code based on status
if ($afterMemory.FreeRAM -ge 4) {
    exit 0  # Success
} elseif ($afterMemory.FreeRAM -ge 2) {
    exit 1  # Warning
} else {
    exit 2  # Critical
}
