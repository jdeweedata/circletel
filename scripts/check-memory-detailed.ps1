# CircleTel Detailed Memory Monitor (Windows)
# Optimized for 16GB systems
# Usage: powershell -File scripts/check-memory-detailed.ps1

Write-Host "=== CircleTel Detailed Memory Monitor ===" -ForegroundColor Cyan
Write-Host "System: 16GB RAM (Dell Vostro 16 5640)`n" -ForegroundColor Gray

# 1. System Memory Overview
$os = Get-CimInstance Win32_OperatingSystem
$totalRAM = [math]::Round($os.TotalVisibleMemorySize/1MB, 2)
$freeRAM = [math]::Round($os.FreePhysicalMemory/1MB, 2)
$usedRAM = [math]::Round($totalRAM - $freeRAM, 2)
$usagePercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)

Write-Host "System Memory:" -ForegroundColor Yellow
Write-Host "  Total:    $totalRAM GB" -ForegroundColor White
Write-Host "  Used:     $usedRAM GB ($usagePercent%)" -ForegroundColor White
Write-Host "  Free:     $freeRAM GB`n" -ForegroundColor White

# 2. Memory Pressure for 16GB Systems
Write-Host "Memory Status (16GB System):" -ForegroundColor Yellow

if ($freeRAM -lt 2) {
    Write-Host "  Status: " -NoNewline
    Write-Host "CRITICAL" -ForegroundColor Red
    Write-Host "  Action: Close applications immediately!`n" -ForegroundColor Red
} elseif ($freeRAM -lt 4) {
    Write-Host "  Status: " -NoNewline
    Write-Host "HIGH" -ForegroundColor Red
    Write-Host "  Action: Close Chrome tabs and heavy apps before building.`n" -ForegroundColor Yellow
} elseif ($freeRAM -lt 6) {
    Write-Host "  Status: " -NoNewline
    Write-Host "MODERATE" -ForegroundColor Yellow
    Write-Host "  Action: Safe for development with :memory scripts.`n" -ForegroundColor Yellow
} else {
    Write-Host "  Status: " -NoNewline
    Write-Host "HEALTHY" -ForegroundColor Green
    Write-Host "  Action: Optimal conditions for all operations.`n" -ForegroundColor Green
}

# 3. Top Memory-Consuming Applications
Write-Host "Top 10 Memory Consumers:" -ForegroundColor Yellow

$topProcesses = Get-Process |
    Where-Object { $_.WorkingSet64 -gt 50MB } |
    Sort-Object WorkingSet64 -Descending |
    Select-Object -First 10 |
    Select-Object Name,
        @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64/1MB, 2)}},
        @{Name='ProcessCount';Expression={(Get-Process -Name $_.Name).Count}}

$topProcesses | Format-Table -AutoSize

# 4. Development-Related Processes
Write-Host "`nDevelopment Processes:" -ForegroundColor Yellow

$devProcessNames = @('node', 'chrome', 'code', 'docker', 'postman', 'teams', 'slack', 'discord')
$devProcesses = Get-Process | Where-Object { $devProcessNames -contains $_.Name.ToLower() }

if ($devProcesses) {
    $groupedDevProcesses = $devProcesses |
        Group-Object Name |
        ForEach-Object {
            $totalMem = ($_.Group | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
            [PSCustomObject]@{
                Application = $_.Name
                Instances = $_.Count
                'TotalMemoryMB' = [math]::Round($totalMem, 2)
            }
        } |
        Sort-Object TotalMemoryMB -Descending

    $groupedDevProcesses | Format-Table -AutoSize

    $totalDevMemory = ($devProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
    Write-Host "Total dev tools memory: $([math]::Round($totalDevMemory, 2)) MB`n" -ForegroundColor Cyan
} else {
    Write-Host "No dev processes detected.`n" -ForegroundColor Gray
}

# 5. Chrome-Specific Analysis (often the biggest memory user)
$chromeProcesses = Get-Process chrome -ErrorAction SilentlyContinue
if ($chromeProcesses) {
    $chromeMemTotal = ($chromeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
    $chromeCount = $chromeProcesses.Count
    Write-Host "Chrome Analysis:" -ForegroundColor Yellow
    Write-Host "  Processes:  $chromeCount (each tab/extension is a process)" -ForegroundColor White
    Write-Host "  Total RAM:  $([math]::Round($chromeMemTotal, 2)) MB" -ForegroundColor White
    Write-Host "  Avg/Tab:    $([math]::Round($chromeMemTotal / $chromeCount, 2)) MB`n" -ForegroundColor White

    if ($chromeMemTotal -gt 2000) {
        Write-Host "  ⚠️  Chrome is using >2GB RAM!" -ForegroundColor Red
        Write-Host "  Recommendation: Close unused tabs to free ~1-2GB`n" -ForegroundColor Yellow
    }
}

# 6. Node.js Processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Node.js Processes:" -ForegroundColor Yellow
    $nodeProcesses | Select-Object Id,
        @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64/1MB, 2)}},
        StartTime | Format-Table -AutoSize

    $totalNodeMemory = ($nodeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
    Write-Host "Total Node.js memory: $([math]::Round($totalNodeMemory, 2)) MB`n" -ForegroundColor Cyan
}

# 7. Recommendations Based on 16GB System
Write-Host "Recommendations for 16GB System:" -ForegroundColor Cyan

if ($freeRAM -lt 4) {
    Write-Host "  🎯 Target: Free up $([math]::Round(4 - $freeRAM, 2)) GB more RAM" -ForegroundColor Yellow
    Write-Host "`n  Close these apps (in order of impact):" -ForegroundColor White

    if ($chromeProcesses -and ($chromeMemTotal -gt 1000)) {
        Write-Host "    1. Chrome tabs (can free ~1-2GB)" -ForegroundColor Yellow
    }

    $teams = Get-Process teams -ErrorAction SilentlyContinue
    if ($teams) {
        $teamsMem = [math]::Round(($teams | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
        Write-Host "    2. Microsoft Teams (can free ~$teamsMem MB)" -ForegroundColor Yellow
    }

    $docker = Get-Process docker -ErrorAction SilentlyContinue
    if ($docker) {
        $dockerMem = [math]::Round(($docker | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
        Write-Host "    3. Docker Desktop (can free ~$dockerMem MB)" -ForegroundColor Yellow
    }

    Write-Host "`n  Then run: npm run memory:check`n" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ You have sufficient memory for development!" -ForegroundColor Green
    Write-Host "  Use: npm run dev:memory`n" -ForegroundColor White
}

# 8. Quick Command Reference
Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  Check memory:        npm run memory:check" -ForegroundColor White
Write-Host "  Detailed check:      powershell -File scripts/check-memory-detailed.ps1" -ForegroundColor White
Write-Host "  Clear cache:         npm run clean" -ForegroundColor White
Write-Host "  Start dev (8GB):     npm run dev:memory" -ForegroundColor White
Write-Host "  Start dev (4GB):     npm run dev:low" -ForegroundColor White
Write-Host "  Kill Node:           taskkill /F /IM node.exe`n" -ForegroundColor White

Write-Host "=== End of Report ===" -ForegroundColor Cyan
