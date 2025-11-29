# Pre-Edit Backup Hook for CircleTel Claude Code
# Runs automatically before any Edit tool use
# Purpose: Create timestamped backups of files before modification

param(
    [Parameter(Position=0)]
    [string]$FilePath
)

$ErrorActionPreference = "SilentlyContinue"

# Configuration
$BackupDir = "C:\Projects\circletel-nextjs\.claude\backups"
$MaxBackupsPerFile = 10
$ProjectRoot = "C:\Projects\circletel-nextjs"

# Skip if no file path provided
if ([string]::IsNullOrWhiteSpace($FilePath)) {
    exit 0
}

# Normalize the path
$FilePath = $FilePath.Trim('"', "'", ' ')

# Skip if file doesn't exist (new file being created)
if (-not (Test-Path $FilePath)) {
    exit 0
}

# Skip certain file types that don't need backup
$skipExtensions = @('.log', '.tmp', '.bak', '.lock')
$extension = [System.IO.Path]::GetExtension($FilePath)
if ($skipExtensions -contains $extension) {
    exit 0
}

# Skip files outside project (e.g., node_modules, .git)
$skipPaths = @('node_modules', '.git', '.next', 'dist', 'build', '.claude\backups', '.claude\logs')
foreach ($skipPath in $skipPaths) {
    if ($FilePath -like "*\$skipPath\*" -or $FilePath -like "*/$skipPath/*") {
        exit 0
    }
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Generate backup filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$fileName = [System.IO.Path]::GetFileName($FilePath)
$relativePath = $FilePath.Replace($ProjectRoot, "").TrimStart('\', '/').Replace('\', '_').Replace('/', '_')
$backupFileName = "${timestamp}_${relativePath}"
$backupPath = Join-Path $BackupDir $backupFileName

try {
    # Copy the file to backup location
    Copy-Item -Path $FilePath -Destination $backupPath -Force

    # Create a metadata file for the backup
    $metaPath = "$backupPath.meta"
    @{
        OriginalPath = $FilePath
        BackupTime = $timestamp
        FileSize = (Get-Item $FilePath).Length
    } | ConvertTo-Json | Set-Content -Path $metaPath

    # Cleanup old backups for this file (keep only last N)
    $pattern = "*_${relativePath}"
    $oldBackups = Get-ChildItem -Path $BackupDir -Filter $pattern |
        Where-Object { $_.Extension -ne '.meta' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip $MaxBackupsPerFile

    foreach ($oldBackup in $oldBackups) {
        Remove-Item -Path $oldBackup.FullName -Force
        $metaFile = "$($oldBackup.FullName).meta"
        if (Test-Path $metaFile) {
            Remove-Item -Path $metaFile -Force
        }
    }

    # Silent success - don't output anything to avoid disrupting Claude
    exit 0
}
catch {
    # Log error silently
    $errorLog = Join-Path $BackupDir "backup_errors.log"
    $errorMsg = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Failed to backup $FilePath - $($_.Exception.Message)"
    Add-Content -Path $errorLog -Value $errorMsg
    exit 0  # Don't block the edit operation
}
