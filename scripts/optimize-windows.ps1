# Windows Dev Environment Optimizer
# Optimizes Windows services and settings for development
# Dell Vostro 16 5640 (16GB RAM)
# Usage: powershell -File scripts/optimize-windows.ps1

param(
    [switch]$ApplyOptimizations = $false  # Apply optimizations automatically
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Windows Dev Environment Optimizer" -ForegroundColor Cyan
Write-Host "Dell Vostro 16 5640 (16GB RAM)" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[!] Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Some optimizations require admin privileges" -ForegroundColor Gray
    Write-Host "   Run as admin for full optimization`n" -ForegroundColor Gray
}

# 1. Check background apps
Write-Host "[1/6] Analyzing background applications..." -ForegroundColor Yellow

$heavyApps = @()

# OneDrive
$onedrive = Get-Process OneDrive -ErrorAction SilentlyContinue
if ($onedrive) {
    $onedriveMemory = [math]::Round(($onedrive | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
    if ($onedriveMemory -gt 300) {
        $heavyApps += [PSCustomObject]@{
            Name = "OneDrive"
            Memory = $onedriveMemory
            Action = "Pause sync during development"
            Command = "Right-click OneDrive icon > Pause syncing > 2 hours"
        }
    }
}

# Windows Search
$search = Get-Process SearchIndexer -ErrorAction SilentlyContinue
if ($search) {
    $searchMemory = [math]::Round($search.WorkingSet64 / 1MB, 2)
    if ($searchMemory -gt 200) {
        $heavyApps += [PSCustomObject]@{
            Name = "Windows Search Indexer"
            Memory = $searchMemory
            Action = "Exclude development folders from indexing"
            Command = "Settings > Search > Searching Windows > Exclude folders"
        }
    }
}

# Office apps
$outlook = Get-Process OUTLOOK -ErrorAction SilentlyContinue
if ($outlook) {
    $outlookMemory = [math]::Round($outlook.WorkingSet64 / 1MB, 2)
    if ($outlookMemory -gt 200) {
        $heavyApps += [PSCustomObject]@{
            Name = "Outlook"
            Memory = $outlookMemory
            Action = "Close during intensive development"
            Command = "Close Outlook (use web version if needed)"
        }
    }
}

$excel = Get-Process EXCEL -ErrorAction SilentlyContinue
if ($excel) {
    $excelMemory = [math]::Round($excel.WorkingSet64 / 1MB, 2)
    if ($excelMemory -gt 150) {
        $heavyApps += [PSCustomObject]@{
            Name = "Excel"
            Memory = $excelMemory
            Action = "Close if not actively using"
            Command = "Close Excel"
        }
    }
}

if ($heavyApps.Count -gt 0) {
    Write-Host "   Found $($heavyApps.Count) heavy background apps:`n" -ForegroundColor Yellow
    $heavyApps | Format-Table -AutoSize
    Write-Host ""
} else {
    Write-Host "   [OK] No heavy background apps detected`n" -ForegroundColor Green
}

# 2. Check Windows Defender
Write-Host "[2/6] Checking Windows Defender..." -ForegroundColor Yellow

$defenderExclusions = @(
    "$PWD",
    "$PWD\node_modules",
    "$PWD\.next",
    "$PWD\build",
    "$PWD\dist"
)

Write-Host "   Recommended exclusions for faster builds:" -ForegroundColor White
foreach ($path in $defenderExclusions) {
    Write-Host "   - $path" -ForegroundColor Gray
}
Write-Host ""

if ($isAdmin -and $ApplyOptimizations) {
    Write-Host "   Adding Defender exclusions..." -ForegroundColor Cyan
    foreach ($path in $defenderExclusions) {
        try {
            Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
            Write-Host "   [OK] Added: $path" -ForegroundColor Green
        } catch {
            Write-Host "   [!] Failed: $path" -ForegroundColor Yellow
        }
    }
    Write-Host ""
} else {
    Write-Host "   [i] To add exclusions manually:" -ForegroundColor Gray
    Write-Host "   Windows Security > Virus & threat protection > Exclusions > Add folder`n" -ForegroundColor Gray
}

# 3. Check power plan
Write-Host "[3/6] Checking power plan..." -ForegroundColor Yellow

$activePlan = powercfg /getactivescheme

if ($activePlan -match "High performance") {
    Write-Host "   [OK] Using High Performance plan (optimal)" -ForegroundColor Green
} elseif ($activePlan -match "Balanced") {
    Write-Host "   [!] Using Balanced plan" -ForegroundColor Yellow
    Write-Host "   Recommendation: Switch to High Performance for development" -ForegroundColor Yellow

    if ($isAdmin -and $ApplyOptimizations) {
        Write-Host "   Switching to High Performance..." -ForegroundColor Cyan
        powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
        Write-Host "   [OK] Power plan changed" -ForegroundColor Green
    } else {
        Write-Host "   Manual: Control Panel > Power Options > High Performance`n" -ForegroundColor Gray
    }
} else {
    Write-Host "   [i] Using custom power plan" -ForegroundColor Gray
}
Write-Host ""

# 4. Check virtual memory (pagefile)
Write-Host "[4/6] Checking virtual memory..." -ForegroundColor Yellow

$pagefiles = Get-CimInstance -Query "SELECT * FROM Win32_PageFileSetting"
if ($pagefiles) {
    foreach ($pf in $pagefiles) {
        $initialSize = $pf.InitialSize
        $maxSize = $pf.MaxSize

        Write-Host "   Pagefile: $($pf.Name)" -ForegroundColor White
        if ($initialSize -gt 0) {
            Write-Host "   Initial: $initialSize MB" -ForegroundColor Gray
        } else {
            Write-Host "   Initial: System managed" -ForegroundColor Gray
        }

        if ($maxSize -gt 0) {
            Write-Host "   Maximum: $maxSize MB" -ForegroundColor Gray
        } else {
            Write-Host "   Maximum: System managed" -ForegroundColor Gray
        }

        # Recommendations for 16GB system
        $recommendedMin = 16384  # 16GB
        $recommendedMax = 32768  # 32GB

        if ($maxSize -eq 0 -or $maxSize -ge $recommendedMax) {
            Write-Host "   [OK] Pagefile size optimal for 16GB system" -ForegroundColor Green
        } else {
            Write-Host "   [!] Pagefile may be too small" -ForegroundColor Yellow
            Write-Host "   Recommended: $recommendedMin - $recommendedMax MB" -ForegroundColor Yellow
            Write-Host "   Manual: System Properties > Advanced > Performance Settings > Virtual Memory`n" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   [i] Pagefile set to system managed (recommended)" -ForegroundColor Green
}
Write-Host ""

# 5. Check startup programs
Write-Host "[5/6] Analyzing startup programs..." -ForegroundColor Yellow

$startupItems = Get-CimInstance Win32_StartupCommand | Where-Object {
    $_.Location -notlike "*OneDrive*"  # Keep OneDrive
}

$heavyStartup = @()
$startupItems | ForEach-Object {
    # Common heavy startup programs
    if ($_.Command -match "(Teams|Discord|Slack|Steam|Epic)") {
        $heavyStartup += [PSCustomObject]@{
            Name = $_.Name
            Location = $_.Location
            Command = $_.Command
        }
    }
}

if ($heavyStartup.Count -gt 0) {
    Write-Host "   Found $($heavyStartup.Count) heavy startup programs:" -ForegroundColor Yellow
    $heavyStartup | Select-Object Name, Location | Format-Table -AutoSize
    Write-Host "   Recommendation: Disable non-essential startup programs" -ForegroundColor Yellow
    Write-Host "   Task Manager > Startup > Disable`n" -ForegroundColor Gray
} else {
    Write-Host "   [OK] No heavy startup programs detected`n" -ForegroundColor Green
}

# 6. Check Windows services
Write-Host "[6/6] Checking Windows services..." -ForegroundColor Yellow

$servicesChecklist = @(
    @{Name="SysMain"; DisplayName="Superfetch"; Recommendation="Disable (uses RAM for prefetching)"},
    @{Name="WSearch"; DisplayName="Windows Search"; Recommendation="Reduce scope (exclude dev folders)"},
    @{Name="DiagTrack"; DisplayName="Diagnostics Tracking"; Recommendation="Disable (telemetry)"}
)

foreach ($svc in $servicesChecklist) {
    $service = Get-Service -Name $svc.Name -ErrorAction SilentlyContinue

    if ($service) {
        Write-Host "   Service: $($svc.DisplayName)" -ForegroundColor White
        Write-Host "   Status: $($service.Status)" -ForegroundColor Gray
        Write-Host "   Recommendation: $($svc.Recommendation)" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Optimization Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Quick Wins (Do Now):" -ForegroundColor Yellow
Write-Host "  1. Pause OneDrive sync during development" -ForegroundColor White
Write-Host "  2. Close Outlook/Excel if not using" -ForegroundColor White
Write-Host "  3. Switch to High Performance power plan" -ForegroundColor White
Write-Host ""

Write-Host "Medium-Term (This Week):" -ForegroundColor Yellow
Write-Host "  1. Add Defender exclusions (node_modules, .next)" -ForegroundColor White
Write-Host "  2. Disable heavy startup programs (Teams, Discord)" -ForegroundColor White
Write-Host "  3. Exclude dev folders from Windows Search" -ForegroundColor White
Write-Host ""

Write-Host "Long-Term (Optional):" -ForegroundColor Yellow
Write-Host "  1. Disable Superfetch service (saves ~200MB)" -ForegroundColor White
Write-Host "  2. Disable Diagnostics Tracking (privacy + performance)" -ForegroundColor White
Write-Host "  3. Optimize pagefile settings if needed" -ForegroundColor White
Write-Host ""

if (-not $isAdmin) {
    Write-Host "[!] Admin Privileges Required:" -ForegroundColor Red
    Write-Host "   To apply automatic optimizations, run as Administrator:" -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell > Run as administrator" -ForegroundColor Gray
    Write-Host "   Then: powershell -File scripts/optimize-windows.ps1 -ApplyOptimizations`n" -ForegroundColor Gray
}

Write-Host "Expected Memory Savings:" -ForegroundColor Cyan
$totalSavings = 0
if ($heavyApps.Count -gt 0) {
    $totalSavings += ($heavyApps | Measure-Object -Property Memory -Sum).Sum
}
Write-Host "  Background apps: ~$([math]::Round($totalSavings, 0)) MB" -ForegroundColor White
Write-Host "  Defender exclusions: Faster builds (20-30% improvement)" -ForegroundColor White
Write-Host "  Power plan: Better CPU performance" -ForegroundColor White
Write-Host "  Startup programs: Faster boot + more free RAM" -ForegroundColor White
Write-Host ""

Write-Host "========================================`n" -ForegroundColor Cyan
