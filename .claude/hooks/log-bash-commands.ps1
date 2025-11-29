# Post-Bash Logging Hook for CircleTel Claude Code
# Runs automatically after any Bash tool execution
# Purpose: Create audit log of all shell commands for debugging and accountability

param(
    [string]$Command = "",
    [int]$ExitCode = 0,
    [string]$Output = ""
)

$ErrorActionPreference = "SilentlyContinue"

# Configuration
$LogDir = "C:\Projects\circletel-nextjs\.claude\logs"
$LogFile = Join-Path $LogDir "bash-audit.log"
$MaxLogSizeMB = 10
$MaxLogAgeDays = 30

# Create logs directory if it doesn't exist
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Check log file size and rotate if needed
if (Test-Path $LogFile) {
    $logSize = (Get-Item $LogFile).Length / 1MB
    if ($logSize -gt $MaxLogSizeMB) {
        $archiveFile = Join-Path $LogDir "bash-audit_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
        Move-Item -Path $LogFile -Destination $archiveFile -Force

        # Cleanup old archive files
        Get-ChildItem -Path $LogDir -Filter "bash-audit_*.log" |
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$MaxLogAgeDays) } |
            Remove-Item -Force
    }
}

# Get environment info
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$sessionId = $env:CLAUDE_SESSION_ID
if ([string]::IsNullOrWhiteSpace($sessionId)) {
    $sessionId = "unknown"
}

# Determine command category for easier filtering
$category = "general"
if ($Command -match "^(git|gh)\s") { $category = "git" }
elseif ($Command -match "^npm\s") { $category = "npm" }
elseif ($Command -match "^(node|npx|tsx)\s") { $category = "node" }
elseif ($Command -match "^(ls|dir|cd|pwd|cat|head|tail|grep)\s") { $category = "filesystem" }
elseif ($Command -match "^(mkdir|rm|cp|mv|touch)\s") { $category = "filesystem-modify" }
elseif ($Command -match "^(curl|wget|fetch)\s") { $category = "network" }
elseif ($Command -match "^(docker|docker-compose)\s") { $category = "docker" }
elseif ($Command -match "^(supabase)\s") { $category = "supabase" }

# Determine status
$status = if ($ExitCode -eq 0) { "SUCCESS" } else { "FAILED" }

# Truncate command if too long (for log readability)
$logCommand = $Command
if ($logCommand.Length -gt 500) {
    $logCommand = $logCommand.Substring(0, 497) + "..."
}

# Build log entry
$logEntry = @"
[$timestamp] [$category] [$status]
  Session: $sessionId
  Command: $logCommand
  Exit Code: $ExitCode
---
"@

try {
    # Append to log file
    Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8

    # Silent success
    exit 0
}
catch {
    # If logging fails, don't block anything - just exit silently
    exit 0
}
