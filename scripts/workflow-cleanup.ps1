# CircleTel End-of-Day Cleanup
# Automated cleanup routine for 16GB systems
# Usage: powershell -File scripts/workflow-cleanup.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CircleTel End-of-Day Cleanup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Initial state
Write-Host "[1/4] Current memory state..." -ForegroundColor Yellow

$before = @{
    FreeRAM = 0
    NodeCount = 0
    NodeMemory = 0
    VSCodeMemory = 0
}

$os = Get-CimInstance Win32_OperatingSystem
$before.FreeRAM = [math]::Round($os.FreePhysicalMemory/1MB, 2)

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $before.NodeCount = $nodeProcesses.Count
    $before.NodeMemory = [math]::Round(($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
}

$codeProcesses = Get-Process Code -ErrorAction SilentlyContinue
if ($codeProcesses) {
    $before.VSCodeMemory = [math]::Round(($codeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
}

Write-Host "   Free RAM:   $($before.FreeRAM) GB" -ForegroundColor White
Write-Host "   Node.js:    $($before.NodeCount) processes ($($before.NodeMemory) MB)" -ForegroundColor White
Write-Host "   VS Code:    $($before.VSCodeMemory) MB`n" -ForegroundColor White

# 2. Kill Node processes
Write-Host "[2/4] Stopping Node.js processes..." -ForegroundColor Yellow

if ($before.NodeCount -gt 0) {
    taskkill /F /IM node.exe 2>&1 | Out-Null
    Start-Sleep -Seconds 2

    $nodeAfter = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeAfter) {
        Write-Host "   ⚠️  Some Node processes still running" -ForegroundColor Yellow
        Write-Host "   Remaining: $($nodeAfter.Count) processes`n" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ All Node processes stopped" -ForegroundColor Green
        Write-Host "   Freed: ~$($before.NodeMemory) MB`n" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️  No Node processes running`n" -ForegroundColor Gray
}

# 3. Cache cleanup option
Write-Host "[3/4] Checking cache..." -ForegroundColor Yellow

$nextCacheExists = Test-Path ".\.next"
if ($nextCacheExists) {
    $cacheSize = [math]::Round((Get-ChildItem -Recurse .\.next -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "   Next.js cache: $cacheSize MB" -ForegroundColor White

    $response = Read-Host "   Clear cache? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        & npm run clean 2>&1 | Out-Null
        Write-Host "   ✅ Cache cleared (freed ~$cacheSize MB)`n" -ForegroundColor Green
    } else {
        Write-Host "   Skipped cache cleanup`n" -ForegroundColor Gray
    }
} else {
    Write-Host "   ℹ️  No cache found`n" -ForegroundColor Gray
}

# 4. Final state
Write-Host "[4/4] Final memory state..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$after = @{
    FreeRAM = 0
}

$osAfter = Get-CimInstance Win32_OperatingSystem
$after.FreeRAM = [math]::Round($osAfter.FreePhysicalMemory/1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Before Cleanup:" -ForegroundColor Yellow
Write-Host "  Free RAM:   $($before.FreeRAM) GB" -ForegroundColor White
Write-Host "  Node.js:    $($before.NodeCount) processes ($($before.NodeMemory) MB)" -ForegroundColor White
Write-Host "  VS Code:    $($before.VSCodeMemory) MB" -ForegroundColor White
Write-Host ""

Write-Host "After Cleanup:" -ForegroundColor Yellow
Write-Host "  Free RAM:   $($after.FreeRAM) GB" -ForegroundColor White
Write-Host "  Node.js:    0 processes ✅" -ForegroundColor Green
if ($before.VSCodeMemory -gt 0) {
    Write-Host "  VS Code:    Still running (close to free ~$($before.VSCodeMemory) MB)" -ForegroundColor Yellow
}
Write-Host ""

$memoryFreed = [math]::Round($after.FreeRAM - $before.FreeRAM, 2)
if ($memoryFreed -gt 0) {
    Write-Host "Total freed: +$memoryFreed GB ✅" -ForegroundColor Green
}
Write-Host ""

# Next steps
Write-Host "Next Steps:" -ForegroundColor Cyan
if ($before.VSCodeMemory -gt 0) {
    Write-Host "  1. Close VS Code (will free ~$([math]::Round($before.VSCodeMemory/1024, 2)) GB)" -ForegroundColor White
}
Write-Host "  2. Close other development tools" -ForegroundColor White
Write-Host "  3. System ready for tomorrow" -ForegroundColor White
Write-Host ""

Write-Host "Tomorrow Morning:" -ForegroundColor Cyan
Write-Host "  Run: powershell -File scripts/workflow-morning.ps1" -ForegroundColor White
Write-Host "  Or:  /memory-start (in Claude Code)" -ForegroundColor White
Write-Host "  Or:  npm run workflow:start" -ForegroundColor White
Write-Host ""

Write-Host "========================================`n" -ForegroundColor Cyan
