# VS Code Memory Optimizer
# Reduces VS Code memory usage from 3GB+ to ~1.5GB
# Usage: powershell -File scripts/optimize-vscode.ps1

param(
    [switch]$ApplySettings = $false,  # Apply settings automatically
    [switch]$Backup = $true           # Backup existing settings
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VS Code Memory Optimizer" -ForegroundColor Cyan
Write-Host "Target: Reduce memory from 3GB+ to 1.5GB" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Check current VS Code memory usage
Write-Host "[1/5] Analyzing VS Code memory usage..." -ForegroundColor Yellow

$codeProcesses = Get-Process Code -ErrorAction SilentlyContinue
if ($codeProcesses) {
    $totalMemory = [math]::Round(($codeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB, 2)
    $processCount = $codeProcesses.Count

    Write-Host "   Current usage: $totalMemory MB ($processCount processes)" -ForegroundColor White

    if ($totalMemory -gt 2048) {
        Write-Host "   Status: HIGH [!] (Optimization recommended)" -ForegroundColor Red
    } elseif ($totalMemory -gt 1500) {
        Write-Host "   Status: ELEVATED [!] (Optimization beneficial)" -ForegroundColor Yellow
    } else {
        Write-Host "   Status: NORMAL [OK] (Already optimized)" -ForegroundColor Green
    }
} else {
    Write-Host "   VS Code not running" -ForegroundColor Gray
}

Write-Host ""

# 2. Check VS Code workspace folders
Write-Host "[2/5] Checking workspace windows..." -ForegroundColor Yellow

$settingsPath = "$env:APPDATA\Code\User\settings.json"
$workspacePath = "$env:APPDATA\Code\User\workspaceStorage"

if (Test-Path $workspacePath) {
    $workspaceCount = (Get-ChildItem $workspacePath).Count
    Write-Host "   Open workspaces: $workspaceCount" -ForegroundColor White

    if ($workspaceCount -gt 5) {
        Write-Host "   Recommendation: Close unused workspaces" -ForegroundColor Yellow
        Write-Host "   - Keep only CircleTel workspace open" -ForegroundColor Gray
        Write-Host "   - Each workspace uses ~300-500 MB`n" -ForegroundColor Gray
    } else {
        Write-Host "   Workspace count normal [OK]`n" -ForegroundColor Green
    }
} else {
    Write-Host "   No workspace data found`n" -ForegroundColor Gray
}

# 3. Check installed extensions
Write-Host "[3/5] Analyzing extensions..." -ForegroundColor Yellow

$extensionsPath = "$env:USERPROFILE\.vscode\extensions"
if (Test-Path $extensionsPath) {
    $extensionCount = (Get-ChildItem $extensionsPath -Directory).Count
    Write-Host "   Installed extensions: $extensionCount" -ForegroundColor White

    # Heavy extensions to consider disabling
    $heavyExtensions = @(
        @{Name="GitLens"; Impact="High (200-400 MB)"; Suggestion="Disable when not using Git features"},
        @{Name="Live Share"; Impact="Medium (100-200 MB)"; Suggestion="Disable if not collaborating"},
        @{Name="Docker"; Impact="Medium (100-200 MB)"; Suggestion="Disable if not using containers"},
        @{Name="Python"; Impact="High (300-500 MB)"; Suggestion="Disable for JS-only projects"},
        @{Name="Remote"; Impact="Medium (100-200 MB)"; Suggestion="Disable if not using remote dev"}
    )

    Write-Host "`n   Heavy extensions to consider disabling:" -ForegroundColor Yellow
    foreach ($ext in $heavyExtensions) {
        Write-Host "   - $($ext.Name): $($ext.Impact)" -ForegroundColor White
        Write-Host "     $($ext.Suggestion)" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "   No extensions found`n" -ForegroundColor Gray
}

# 4. Memory-optimized settings
Write-Host "[4/5] Preparing memory-optimized settings..." -ForegroundColor Yellow

$optimizedSettings = @"
{
  // ============================================
  // VS Code Memory Optimization Settings
  // Dell Vostro 16 5640 (16GB RAM)
  // Target: Reduce memory from 3GB+ to 1.5GB
  // ============================================

  // TypeScript Server Memory Limit
  "typescript.tsserver.maxTsServerMemory": 2048,

  // File Watching (Reduce monitored files)
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/.cache/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.husky/**": true,
    "**/.vercel/**": true,
    "**/coverage/**": true
  },

  // Search Optimization
  "search.maxResults": 10000,
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/coverage": true
  },

  // IntelliSense Optimization
  "editor.quickSuggestions": {
    "other": true,
    "comments": false,
    "strings": false
  },
  "editor.suggest.maxVisibleSuggestions": 8,
  "editor.suggest.localityBonus": true,
  "editor.suggest.shareSuggestSelections": false,

  // Problems Panel
  "problems.maxNumberOfProblems": 100,

  // Disable Telemetry
  "telemetry.telemetryLevel": "off",

  // Git Optimization
  "git.autorefresh": false,
  "git.untrackedChanges": "hidden",
  "git.ignoreLimitWarning": true,

  // Disable Automatic Updates
  "extensions.autoUpdate": false,
  "extensions.autoCheckUpdates": false,

  // Terminal Optimization
  "terminal.integrated.scrollback": 1000,
  "terminal.integrated.enablePersistentSessions": false,

  // Editor Performance
  "editor.semanticHighlighting.enabled": false,
  "editor.renderWhitespace": "selection",
  "editor.minimap.enabled": false,

  // Breadcrumbs (Disable if not used)
  "breadcrumbs.enabled": true,

  // Outline (Reduce depth)
  "outline.collapseItems": "alwaysCollapse",

  // Exclude from Files Scan
  "files.exclude": {
    "**/.git": true,
    "**/.svn": true,
    "**/.hg": true,
    "**/CVS": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/.next": true
  },

  // Disable Preview Editors (Saves memory)
  "workbench.editor.enablePreview": false,
  "workbench.editor.enablePreviewFromQuickOpen": false,

  // Limit Open Editors
  "workbench.editor.limit.enabled": true,
  "workbench.editor.limit.value": 10,
  "workbench.editor.limit.perEditorGroup": true,

  // Disable Startup Editor
  "workbench.startupEditor": "none",

  // Window Performance
  "window.restoreWindows": "none",

  // Disable Unused Features
  "javascript.suggest.enabled": true,
  "typescript.suggest.enabled": true,
  "css.validate": true,
  "html.validate.scripts": true,

  // Markdown Preview (Disable auto-sync)
  "markdown.preview.scrollPreviewWithEditor": false,
  "markdown.preview.scrollEditorWithPreview": false
}
"@

Write-Host "   Memory-optimized settings prepared [OK]" -ForegroundColor Green
Write-Host "   Location: .vscode/settings.memory.json`n" -ForegroundColor Gray

# 5. Apply settings
Write-Host "[5/5] Settings application..." -ForegroundColor Yellow

$projectSettingsPath = ".vscode\settings.json"
$memorySettingsPath = ".vscode\settings.memory.json"

# Ensure .vscode directory exists
if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Path ".vscode" | Out-Null
    Write-Host "   Created .vscode directory" -ForegroundColor Gray
}

# Always save optimized settings
$optimizedSettings | Out-File -FilePath $memorySettingsPath -Encoding UTF8
Write-Host "   [OK] Saved: $memorySettingsPath" -ForegroundColor Green

if ($ApplySettings) {
    # Backup existing settings
    if ($Backup -and (Test-Path $projectSettingsPath)) {
        $backupPath = ".vscode\settings.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        Copy-Item $projectSettingsPath $backupPath
        Write-Host "   [OK] Backup: $backupPath" -ForegroundColor Green
    }

    # Merge with existing settings
    if (Test-Path $projectSettingsPath) {
        Write-Host "   Merging with existing settings..." -ForegroundColor Cyan

        $existingSettings = Get-Content $projectSettingsPath -Raw | ConvertFrom-Json
        $newSettings = $optimizedSettings | ConvertFrom-Json

        # Merge settings (new settings take precedence)
        foreach ($prop in $newSettings.PSObject.Properties) {
            $existingSettings | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value -Force
        }

        $existingSettings | ConvertTo-Json -Depth 10 | Out-File -FilePath $projectSettingsPath -Encoding UTF8
        Write-Host "   [OK] Applied: $projectSettingsPath" -ForegroundColor Green
    } else {
        # Copy optimized settings
        Copy-Item $memorySettingsPath $projectSettingsPath
        Write-Host "   [OK] Applied: $projectSettingsPath" -ForegroundColor Green
    }
} else {
    Write-Host "   [i] Settings saved but not applied" -ForegroundColor Gray
    Write-Host "   To apply: Run with -ApplySettings flag" -ForegroundColor Yellow
    Write-Host "   Or manually: copy .vscode\settings.memory.json .vscode\settings.json`n" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Optimization Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Settings File:" -ForegroundColor Yellow
Write-Host "  Location: $memorySettingsPath" -ForegroundColor White
if ($ApplySettings) {
    Write-Host "  Status: APPLIED [OK]" -ForegroundColor Green
} else {
    Write-Host "  Status: SAVED (not applied)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Expected Memory Reduction:" -ForegroundColor Yellow
if ($codeProcesses -and $totalMemory -gt 2048) {
    $expectedReduction = [math]::Round($totalMemory * 0.4, 2)
    $expectedFinal = [math]::Round($totalMemory - $expectedReduction, 2)
    Write-Host "  Current:  $totalMemory MB" -ForegroundColor White
    Write-Host "  Expected: $expectedFinal MB (save ~$expectedReduction MB)" -ForegroundColor Green
} else {
    Write-Host "  Typical: 3000 MB to 1500 MB (save ~1500 MB)" -ForegroundColor White
}
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Close all VS Code windows" -ForegroundColor White
Write-Host "  2. Reopen only CircleTel workspace" -ForegroundColor White
if ($ApplySettings) {
    Write-Host "  3. Disable heavy extensions (GitLens, Live Share)" -ForegroundColor White
    Write-Host "  4. Check memory: npm run memory:detail" -ForegroundColor White
} else {
    Write-Host "  3. Apply settings: -ApplySettings flag" -ForegroundColor White
    Write-Host "  4. Disable heavy extensions (GitLens, Live Share)" -ForegroundColor White
    Write-Host "  5. Check memory: npm run memory:detail" -ForegroundColor White
}
Write-Host ""

Write-Host "Manual Application:" -ForegroundColor Cyan
Write-Host "  To apply manually, merge these settings into your .vscode/settings.json" -ForegroundColor White
Write-Host "  File: $memorySettingsPath" -ForegroundColor Gray
Write-Host ""

Write-Host "Rollback:" -ForegroundColor Cyan
if ($Backup -and $ApplySettings -and (Test-Path $projectSettingsPath)) {
    $latestBackup = Get-ChildItem ".vscode\settings.backup.*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestBackup) {
        Write-Host "  Restore from: $($latestBackup.Name)" -ForegroundColor White
    }
} else {
    Write-Host "  No backup created (settings not applied)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================`n" -ForegroundColor Cyan

# Exit code based on memory usage
if ($codeProcesses) {
    if ($totalMemory -gt 2048) {
        exit 1  # Needs optimization
    } else {
        exit 0  # Already optimized
    }
} else {
    exit 0  # Not running
}
