<#
.SYNOPSIS
    Install the filesystem-context skill globally for all Claude Code projects.

.DESCRIPTION
    Copies the filesystem-context skill to ~/.claude/skills/ and creates
    the global context/memory directory structure.

.EXAMPLE
    .\install-global.ps1
#>

$SourceDir = $PSScriptRoot
$GlobalClaudeDir = Join-Path $env:USERPROFILE ".claude"
$GlobalSkillsDir = Join-Path $GlobalClaudeDir "skills\filesystem-context"

Write-Host ""
Write-Host "Installing Filesystem Context Manager globally..." -ForegroundColor Cyan
Write-Host ""

# Create global skills directory
if (-not (Test-Path $GlobalSkillsDir)) {
    New-Item -ItemType Directory -Path $GlobalSkillsDir -Force | Out-Null
    Write-Host "Created: $GlobalSkillsDir" -ForegroundColor Green
}

# Copy skill file
$skillFile = Join-Path $SourceDir "SKILL.md"
if (Test-Path $skillFile) {
    Copy-Item $skillFile (Join-Path $GlobalSkillsDir "SKILL.md") -Force
    Write-Host "Installed: SKILL.md" -ForegroundColor Green
}

# Create global context structure
$directories = @(
    "context",
    "memory",
    "scratch",
    "scratch\tool-outputs"
)

foreach ($dir in $directories) {
    $path = Join-Path $GlobalClaudeDir $dir
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "Created: ~/.claude/$dir" -ForegroundColor Green
    }
}

# Create template files if they don't exist
$memoryPatterns = Join-Path $GlobalClaudeDir "memory\patterns.md"
if (-not (Test-Path $memoryPatterns)) {
    @"
# Global Codebase Patterns

Patterns that apply across all projects.

---

## Add patterns below

"@ | Out-File -FilePath $memoryPatterns -Encoding UTF8
    Write-Host "Created: ~/.claude/memory/patterns.md" -ForegroundColor Green
}

$memoryGotchas = Join-Path $GlobalClaudeDir "memory\gotchas.md"
if (-not (Test-Path $memoryGotchas)) {
    @"
# Global Gotchas & Lessons Learned

Issues and solutions that apply across projects.

---

## Add gotchas below

"@ | Out-File -FilePath $memoryGotchas -Encoding UTF8
    Write-Host "Created: ~/.claude/memory/gotchas.md" -ForegroundColor Green
}

Write-Host ""
Write-Host "Filesystem Context Manager installed globally!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Structure created:" -ForegroundColor White
Write-Host "  ~/.claude/skills/filesystem-context/SKILL.md" -ForegroundColor DarkGray
Write-Host "  ~/.claude/context/     (session state)" -ForegroundColor DarkGray
Write-Host "  ~/.claude/memory/      (persistent learnings)" -ForegroundColor DarkGray
Write-Host "  ~/.claude/scratch/     (temporary outputs)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Usage:" -ForegroundColor White
Write-Host "  - Skill auto-activates on keywords like 'save context', 'resume work'" -ForegroundColor DarkGray
Write-Host "  - Store learnings in ~/.claude/memory/*.md" -ForegroundColor DarkGray
Write-Host "  - Large outputs go to ~/.claude/scratch/" -ForegroundColor DarkGray
Write-Host ""
