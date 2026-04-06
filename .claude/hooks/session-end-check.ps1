# Session-End Check Hook for Claude.md Guardian
# Fires when Claude session stops (Stop hook).
# Runs 3 fast signal checks — no git scan, no file writes.
# If signals detected: nudges user to run /claude-md-guardian.

param(
    [string]$ProjectPath = "/home/circletel"
)

$ErrorActionPreference = "SilentlyContinue"

$signals = @()

# Signal 1: Corrections in compound-learnings older than 7 days with no rule extracted
$correctionsDir = Join-Path $ProjectPath ".claude/skills/compound-learnings/corrections"
if (Test-Path $correctionsDir) {
    $staleCorrections = Get-ChildItem $correctionsDir -Filter "*.md" |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
    if ($staleCorrections.Count -gt 0) {
        $signals += "$($staleCorrections.Count) correction(s) not yet extracted to rules"
    }
}

# Signal 2: Last guardian run older than 7 days (check git log for guardian commits)
$lastGuardianDate = & git -C $ProjectPath log --format="%ci" --all --grep="fix(claude-md)" -1 2>/dev/null
if ($lastGuardianDate) {
    $daysSince = ((Get-Date) - [DateTime]::Parse($lastGuardianDate)).Days
    if ($daysSince -gt 7) {
        $signals += "guardian last ran $daysSince days ago"
    }
} else {
    $signals += "guardian has never been run"
}

# Signal 3: CLAUDE.md updated date vs most recent rule file change
$claudeMd = Join-Path $ProjectPath "CLAUDE.md"
$rulesDir = Join-Path $ProjectPath ".claude/rules"
if ((Test-Path $claudeMd) -and (Test-Path $rulesDir)) {
    $latestRule = Get-ChildItem $rulesDir -Filter "*.md" |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $claudeMdDate = (Get-Item $claudeMd).LastWriteTime
    if ($latestRule -and $latestRule.LastWriteTime -gt $claudeMdDate) {
        $signals += "rule files updated since CLAUDE.md was last touched"
    }
}

# Output
if ($signals.Count -gt 0) {
    Write-Host ""
    Write-Host "⚡ Session check: $($signals -join ' + ')" -ForegroundColor Yellow
    Write-Host "   Run /claude-md-guardian for full audit." -ForegroundColor DarkYellow
    Write-Host ""
}
# If no signals: silent exit
