# Session Start Hook for CircleTel Claude Code
# Runs automatically when a new Claude Code session begins
# Purpose: Initialize context analysis and display budget status

param(
    [string]$ProjectPath = "C:\Projects\circletel-nextjs"
)

$ErrorActionPreference = "SilentlyContinue"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "  CircleTel Claude Code Session Start  " "Cyan"
Write-ColorOutput "========================================" "Cyan"
Write-Host ""

# 1. Run Context Analyzer (if Python is available)
$pythonScript = Join-Path $ProjectPath ".claude\skills\context-manager\scripts\analyze_tokens.py"

if (Test-Path $pythonScript) {
    Write-ColorOutput "[*] Running context analysis..." "Yellow"

    try {
        $result = python $pythonScript $ProjectPath 2>&1

        # Parse output for budget zone
        if ($result -match "Budget Zone:\s*(\w+)") {
            $zone = $matches[1]
            switch ($zone) {
                "Green" {
                    Write-ColorOutput "[OK] Context Budget: GREEN (<70%) - Normal operation" "Green"
                }
                "Yellow" {
                    Write-ColorOutput "[!] Context Budget: YELLOW (70-85%) - Be selective with file loading" "Yellow"
                }
                "Red" {
                    Write-ColorOutput "[!!] Context Budget: RED (>85%) - Load essentials only!" "Red"
                }
                default {
                    Write-ColorOutput "[?] Context Budget: Unknown" "Gray"
                }
            }
        }

        # Show token usage if available
        if ($result -match "Total.*?(\d+(?:,\d+)?)\s*tokens") {
            Write-ColorOutput "    Estimated tokens in codebase: $($matches[1])" "Gray"
        }
    }
    catch {
        Write-ColorOutput "[!] Context analysis skipped (Python not available)" "Yellow"
    }
}
else {
    Write-ColorOutput "[!] Context analyzer script not found" "Yellow"
}

Write-Host ""

# 2. Check for pending type errors
Write-ColorOutput "[*] Quick health check..." "Yellow"

$packageJson = Join-Path $ProjectPath "package.json"
if (Test-Path $packageJson) {
    Write-ColorOutput "    Project: CircleTel Next.js" "Gray"
    Write-ColorOutput "    Run '/health-check' for full diagnostics" "Gray"
}

Write-Host ""

# 3. Show reminder about mandatory rules
Write-ColorOutput "[i] Reminders:" "Cyan"
Write-ColorOutput "    - Read CLAUDE.md rules before making changes" "White"
Write-ColorOutput "    - Use 'npm run type-check:memory' before commits" "White"
Write-ColorOutput "    - Load files progressively, not entire directories" "White"

Write-Host ""
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "  Ready to assist with CircleTel dev   " "Cyan"
Write-ColorOutput "========================================" "Cyan"
