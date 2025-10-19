# CircleTel Memory Monitor
# Purpose: Check Node.js process memory usage and system memory availability
# Usage: powershell -File scripts/check-memory.ps1

Write-Host "=== CircleTel Memory Monitor ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

# 1. Check Node.js processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Running Node.js processes:" -ForegroundColor Yellow
    $nodeProcesses | Select-Object Id,
        @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64/1MB, 2)}},
        @{Name='CPU%';Expression={$_.CPU}},
        StartTime,
        @{Name='CommandLine';Expression={
            (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        }} | Format-Table -AutoSize

    $totalMemory = ($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
    Write-Host "Total Node.js memory usage: $([math]::Round($totalMemory, 2)) MB`n" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes running.`n" -ForegroundColor Gray
}

# 2. Check system memory
$os = Get-CimInstance Win32_OperatingSystem
$totalRAM = [math]::Round($os.TotalVisibleMemorySize/1MB, 2)
$freeRAM = [math]::Round($os.FreePhysicalMemory/1MB, 2)
$usedRAM = [math]::Round($totalRAM - $freeRAM, 2)
$usagePercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)

Write-Host "System Memory:" -ForegroundColor Yellow
Write-Host "  Total RAM:  $totalRAM GB" -ForegroundColor White
Write-Host "  Used:       $usedRAM GB ($usagePercent%)" -ForegroundColor White
Write-Host "  Free:       $freeRAM GB`n" -ForegroundColor White

# 3. Memory pressure analysis
Write-Host "Memory Pressure Analysis:" -ForegroundColor Yellow

if ($freeRAM -lt 2) {
    Write-Host "  Status: " -NoNewline
    Write-Host "CRITICAL" -ForegroundColor Red
    Write-Host "  Action: Close applications immediately or builds will fail!`n" -ForegroundColor Red
} elseif ($freeRAM -lt 4) {
    Write-Host "  Status: " -NoNewline
    Write-Host "HIGH" -ForegroundColor Red
    Write-Host "  Action: Close unnecessary applications before building.`n" -ForegroundColor Yellow
} elseif ($freeRAM -lt 8) {
    Write-Host "  Status: " -NoNewline
    Write-Host "MODERATE" -ForegroundColor Yellow
    Write-Host "  Action: Use 'npm run dev:memory' or 'npm run build:memory'.`n" -ForegroundColor Yellow
} else {
    Write-Host "  Status: " -NoNewline
    Write-Host "HEALTHY" -ForegroundColor Green
    Write-Host "  Action: Sufficient memory available for all operations.`n" -ForegroundColor Green
}

# 4. Recommendations
Write-Host "Recommended Commands:" -ForegroundColor Cyan

if ($freeRAM -lt 8) {
    Write-Host "  Development:  " -NoNewline -ForegroundColor White
    Write-Host "npm run dev:memory" -ForegroundColor Yellow
    Write-Host "  Build:        " -NoNewline -ForegroundColor White
    Write-Host "npm run build:memory" -ForegroundColor Yellow
    Write-Host "  Type Check:   " -NoNewline -ForegroundColor White
    Write-Host "node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`n" -ForegroundColor Yellow
} else {
    Write-Host "  Development:  " -NoNewline -ForegroundColor White
    Write-Host "npm run dev (or dev:memory for best performance)" -ForegroundColor Green
    Write-Host "  Build:        " -NoNewline -ForegroundColor White
    Write-Host "npm run build:memory" -ForegroundColor Green
    Write-Host "  Type Check:   " -NoNewline -ForegroundColor White
    Write-Host "npm run type-check`n" -ForegroundColor Green
}

# 5. Node.js memory limits
Write-Host "Node.js Memory Limits (v22.14.0):" -ForegroundColor Cyan
Write-Host "  Default:      ~2 GB (will cause OOM errors)" -ForegroundColor Red
Write-Host "  :memory flag: 8 GB (recommended for CircleTel)" -ForegroundColor Green
Write-Host "  :low flag:    4 GB (for systems with 8-16GB RAM)`n" -ForegroundColor Yellow

# 6. Next.js cache check
$nextCacheExists = Test-Path ".\.next"
$nextCacheSize = 0

if ($nextCacheExists) {
    $nextCacheSize = [math]::Round((Get-ChildItem -Recurse .\.next | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "Next.js Cache:" -ForegroundColor Cyan
    Write-Host "  Location: .\.next" -ForegroundColor White
    Write-Host "  Size:     $nextCacheSize MB" -ForegroundColor White

    if ($nextCacheSize -gt 500) {
        Write-Host "  Status:   " -NoNewline
        Write-Host "LARGE" -ForegroundColor Yellow
        Write-Host "  Action:   Consider clearing cache: Remove-Item -Recurse -Force .\.next`n" -ForegroundColor Yellow
    } else {
        Write-Host "  Status:   " -NoNewline
        Write-Host "NORMAL`n" -ForegroundColor Green
    }
} else {
    Write-Host "Next.js Cache:" -ForegroundColor Cyan
    Write-Host "  Status: Not built yet (first build will be slower)`n" -ForegroundColor Gray
}

# 7. Quick troubleshooting
Write-Host "Quick Troubleshooting:" -ForegroundColor Cyan
Write-Host "  Memory Error:     npm run dev:memory" -ForegroundColor White
Write-Host "  Clear Cache:      Remove-Item -Recurse -Force .\.next" -ForegroundColor White
Write-Host "  Kill Node:        taskkill /F /IM node.exe" -ForegroundColor White
Write-Host "  Check Processes:  Get-Process node" -ForegroundColor White
Write-Host "  Full Guide:       docs/guides/MEMORY_MANAGEMENT_GUIDE.md`n" -ForegroundColor White

Write-Host "=== End of Report ===" -ForegroundColor Cyan
