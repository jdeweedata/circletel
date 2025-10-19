# Browser Memory Optimizer
# Analyzes and provides recommendations for Chrome/Edge memory usage
# Usage: powershell -File scripts/optimize-browser.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Browser Memory Optimizer" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Analyze Chrome usage
Write-Host "[1/3] Analyzing Chrome memory usage..." -ForegroundColor Yellow

$chromeProcesses = Get-Process chrome -ErrorAction SilentlyContinue
if ($chromeProcesses) {
    $chromeCount = $chromeProcesses.Count
    $chromeMemory = [math]::Round(($chromeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
    $avgPerTab = [math]::Round($chromeMemory / $chromeCount, 2)

    Write-Host "   Chrome processes: $chromeCount" -ForegroundColor White
    Write-Host "   Total memory:     $chromeMemory MB" -ForegroundColor White
    Write-Host "   Avg per tab:      $avgPerTab MB`n" -ForegroundColor White

    if ($chromeMemory -gt 2000) {
        Write-Host "   Status: CRITICAL ⚠️ (>2GB)" -ForegroundColor Red
        Write-Host "   Action: Close tabs immediately (keeping only essential)`n" -ForegroundColor Yellow
    } elseif ($chromeMemory -gt 1000) {
        Write-Host "   Status: HIGH ⚠️ (>1GB)" -ForegroundColor Yellow
        Write-Host "   Action: Consider closing unused tabs`n" -ForegroundColor Yellow
    } else {
        Write-Host "   Status: NORMAL ✅`n" -ForegroundColor Green
    }
} else {
    Write-Host "   Chrome not running`n" -ForegroundColor Gray
}

# 2. Analyze Edge usage
Write-Host "[2/3] Analyzing Edge memory usage..." -ForegroundColor Yellow

$edgeProcesses = Get-Process msedge -ErrorAction SilentlyContinue
if ($edgeProcesses) {
    $edgeCount = $edgeProcesses.Count
    $edgeMemory = [math]::Round(($edgeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)

    Write-Host "   Edge processes: $edgeCount" -ForegroundColor White
    Write-Host "   Total memory:   $edgeMemory MB`n" -ForegroundColor White

    if ($edgeMemory -gt 1500) {
        Write-Host "   Status: HIGH ⚠️" -ForegroundColor Yellow
        Write-Host "   Action: Close unused tabs`n" -ForegroundColor Yellow
    } else {
        Write-Host "   Status: NORMAL ✅`n" -ForegroundColor Green
    }
} else {
    Write-Host "   Edge not running`n" -ForegroundColor Gray
}

# 3. Browser optimization recommendations
Write-Host "[3/3] Browser optimization recommendations..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Chrome Extensions to Disable/Remove:" -ForegroundColor Cyan
Write-Host "  Heavy extensions (each can use 50-200MB):" -ForegroundColor White
Write-Host "  - AdBlockers (use uBlock Origin instead - lighter)" -ForegroundColor Gray
Write-Host "  - Grammarly (uses 100-300MB)" -ForegroundColor Gray
Write-Host "  - Honey/Shopping extensions (50-150MB each)" -ForegroundColor Gray
Write-Host "  - Video downloaders (100-200MB)" -ForegroundColor Gray
Write-Host "  - Multiple password managers (keep only one)" -ForegroundColor Gray
Write-Host ""

Write-Host "Chrome Settings Optimizations:" -ForegroundColor Cyan
Write-Host "  1. Enable 'Memory Saver'" -ForegroundColor White
Write-Host "     chrome://settings/performance" -ForegroundColor Gray
Write-Host "     → Memory Saver: Enable" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Limit Background Apps" -ForegroundColor White
Write-Host "     chrome://settings/system" -ForegroundColor Gray
Write-Host "     → Continue running background apps: Disable" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Clear Browser Cache (weekly)" -ForegroundColor White
Write-Host "     chrome://settings/clearBrowserData" -ForegroundColor Gray
Write-Host "     → Cached images and files: Clear" -ForegroundColor Gray
Write-Host ""

Write-Host "Tab Management Strategies:" -ForegroundColor Cyan
Write-Host "  1. Use tab suspender extensions:" -ForegroundColor White
Write-Host "     - The Great Suspender (auto-suspend inactive tabs)" -ForegroundColor Gray
Write-Host "     - OneTab (collapse tabs into list)" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Bookmark reading lists instead of keeping tabs open" -ForegroundColor White
Write-Host ""
Write-Host "  3. Target: Keep <15 active tabs (saves 1-2GB)" -ForegroundColor White
Write-Host ""

Write-Host "Alternative Browsers (Lower Memory):" -ForegroundColor Cyan
Write-Host "  - Firefox (30-40% less memory than Chrome)" -ForegroundColor White
Write-Host "  - Edge (20-30% less memory than Chrome)" -ForegroundColor White
Write-Host "  - Brave (similar to Chrome, better ad blocking)" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Browser Memory Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($chromeProcesses -or $edgeProcesses) {
    $totalBrowserMemory = 0
    if ($chromeProcesses) { $totalBrowserMemory += $chromeMemory }
    if ($edgeProcesses) { $totalBrowserMemory += $edgeMemory }

    Write-Host "Total Browser Memory: $([math]::Round($totalBrowserMemory, 2)) MB" -ForegroundColor White
    Write-Host ""

    if ($totalBrowserMemory -gt 2000) {
        Write-Host "Immediate Actions:" -ForegroundColor Red
        Write-Host "  1. Close all but essential tabs (target: <15 tabs)" -ForegroundColor White
        Write-Host "  2. Enable Memory Saver in Chrome" -ForegroundColor White
        Write-Host "  3. Consider using OneTab extension" -ForegroundColor White
        Write-Host ""
        Write-Host "Potential savings: ~1-2 GB" -ForegroundColor Green
    } elseif ($totalBrowserMemory -gt 1000) {
        Write-Host "Recommended Actions:" -ForegroundColor Yellow
        Write-Host "  1. Close unused tabs (target: <20 tabs)" -ForegroundColor White
        Write-Host "  2. Remove heavy extensions" -ForegroundColor White
        Write-Host "  3. Clear cache weekly" -ForegroundColor White
        Write-Host ""
        Write-Host "Potential savings: ~500MB - 1GB" -ForegroundColor Green
    } else {
        Write-Host "✅ Browser memory usage is optimal!" -ForegroundColor Green
        Write-Host "   Continue current tab management practices" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================`n" -ForegroundColor Cyan
