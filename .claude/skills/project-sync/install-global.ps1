<#
.SYNOPSIS
    Install the project-sync skill globally for all Claude Code projects.

.DESCRIPTION
    Copies the project-sync skill to ~/.claude/skills/ so it's available
    in any project directory.

.EXAMPLE
    .\install-global.ps1
#>

$SourceDir = $PSScriptRoot
$GlobalSkillsDir = Join-Path $env:USERPROFILE ".claude\skills\project-sync"

# Create global skills directory
if (-not (Test-Path $GlobalSkillsDir)) {
    New-Item -ItemType Directory -Path $GlobalSkillsDir -Force | Out-Null
    Write-Host "Created: $GlobalSkillsDir" -ForegroundColor Green
}

# Copy skill files
$filesToCopy = @("SKILL.md", "check-sync.ps1")

foreach ($file in $filesToCopy) {
    $source = Join-Path $SourceDir $file
    $dest = Join-Path $GlobalSkillsDir $file

    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "Installed: $file" -ForegroundColor Green
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "project-sync skill installed globally!" -ForegroundColor Cyan
Write-Host "Location: $GlobalSkillsDir" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Usage in any project:" -ForegroundColor White
Write-Host "  powershell -File ~/.claude/skills/project-sync/check-sync.ps1 -FetchRemote" -ForegroundColor DarkGray
