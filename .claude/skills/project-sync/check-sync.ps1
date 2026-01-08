<#
.SYNOPSIS
    Check alignment between local project and git remote repository.

.DESCRIPTION
    Analyzes the full synchronization status including:
    - Uncommitted changes (modified, staged, untracked)
    - Unpushed commits (local ahead of remote)
    - Unpulled commits (remote ahead of local)
    - Branch tracking status
    - Divergence detection

.PARAMETER Branch
    The branch to check. Defaults to current branch.

.PARAMETER FetchRemote
    Fetch from remote before checking (recommended for accurate results).

.PARAMETER Quick
    Show only summary status, no details.

.PARAMETER Json
    Output results as JSON for programmatic use.

.EXAMPLE
    .\check-sync.ps1
    Basic sync check for current branch.

.EXAMPLE
    .\check-sync.ps1 -FetchRemote
    Fetch latest and check sync status.

.EXAMPLE
    .\check-sync.ps1 -Branch "feature/my-feature" -FetchRemote
    Check specific branch after fetching.

.EXAMPLE
    .\check-sync.ps1 -Quick
    Quick status summary only.
#>

param(
    [string]$Branch = "",
    [switch]$FetchRemote,
    [switch]$Quick,
    [switch]$Json
)

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error   = "Red"
    Info    = "Cyan"
    Muted   = "DarkGray"
}

function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-GitRoot {
    $root = git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }
    return $root
}

function Get-CurrentBranch {
    $branch = git branch --show-current 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($branch)) {
        # Might be in detached HEAD
        $branch = git rev-parse --short HEAD 2>$null
        if ($LASTEXITCODE -eq 0) {
            return "(detached: $branch)"
        }
        return $null
    }
    return $branch
}

function Get-UpstreamBranch {
    param([string]$LocalBranch)
    $upstream = git rev-parse --abbrev-ref "$LocalBranch@{upstream}" 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }
    return $upstream
}

function Get-AheadBehind {
    param([string]$LocalBranch, [string]$Upstream)

    if ([string]::IsNullOrEmpty($Upstream)) {
        return @{ Ahead = -1; Behind = -1 }
    }

    $result = git rev-list --left-right --count "$Upstream...$LocalBranch" 2>$null
    if ($LASTEXITCODE -ne 0) {
        return @{ Ahead = -1; Behind = -1 }
    }

    $parts = $result -split '\s+'
    return @{
        Behind = [int]$parts[0]
        Ahead  = [int]$parts[1]
    }
}

function Get-UncommittedChanges {
    $status = git status --porcelain 2>$null
    if ($LASTEXITCODE -ne 0) {
        return @{ Modified = @(); Staged = @(); Untracked = @() }
    }

    $modified = @()
    $staged = @()
    $untracked = @()

    foreach ($line in ($status -split "`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }

        $indexStatus = $line.Substring(0, 1)
        $workStatus = $line.Substring(1, 1)
        $file = $line.Substring(3)

        # Staged changes (index has changes)
        if ($indexStatus -match '[MADRC]') {
            $staged += $file
        }

        # Working directory changes
        if ($workStatus -match '[MD]') {
            $modified += $file
        }

        # Untracked files
        if ($indexStatus -eq '?' -and $workStatus -eq '?') {
            $untracked += $file
        }
    }

    return @{
        Modified  = $modified
        Staged    = $staged
        Untracked = $untracked
    }
}

function Get-UnpushedCommits {
    param([string]$Upstream)

    if ([string]::IsNullOrEmpty($Upstream)) {
        return @()
    }

    $commits = git log "$Upstream..HEAD" --oneline 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($commits)) {
        return @()
    }

    return $commits -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

function Get-UnpulledCommits {
    param([string]$Upstream)

    if ([string]::IsNullOrEmpty($Upstream)) {
        return @()
    }

    $commits = git log "HEAD..$Upstream" --oneline 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($commits)) {
        return @()
    }

    return $commits -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

function Get-StashCount {
    $stashes = git stash list 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrEmpty($stashes)) {
        return 0
    }
    return ($stashes -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }).Count
}

function Get-LastRemoteCommit {
    param([string]$Upstream)

    if ([string]::IsNullOrEmpty($Upstream)) {
        return $null
    }

    $commit = git log -1 --format="%h - %s (%cr)" $Upstream 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }
    return $commit
}

function Get-SyncStatus {
    param(
        [int]$Ahead,
        [int]$Behind,
        [bool]$HasUncommitted,
        [bool]$HasUntracked,
        [bool]$HasUpstream
    )

    if (-not $HasUpstream) {
        return "UNTRACKED"
    }

    $status = @()

    if ($Ahead -gt 0 -and $Behind -gt 0) {
        $status += "DIVERGED"
    }
    elseif ($Ahead -gt 0) {
        $status += "AHEAD"
    }
    elseif ($Behind -gt 0) {
        $status += "BEHIND"
    }

    if ($HasUncommitted) {
        $status += "DIRTY"
    }

    if ($HasUntracked) {
        $status += "UNTRACKED-FILES"
    }

    if ($status.Count -eq 0) {
        return "SYNCED"
    }

    return $status -join " | "
}

function Get-StatusColor {
    param([string]$Status)

    switch -Regex ($Status) {
        "SYNCED" { return $Colors.Success }
        "DIVERGED|CONFLICT" { return $Colors.Error }
        "AHEAD|BEHIND|DIRTY|UNTRACKED" { return $Colors.Warning }
        default { return $Colors.Info }
    }
}

function Get-Recommendations {
    param(
        [int]$Ahead,
        [int]$Behind,
        [bool]$HasUncommitted,
        [bool]$HasStaged,
        [bool]$HasUntracked,
        [bool]$HasUpstream,
        [int]$StashCount
    )

    $recommendations = @()

    if (-not $HasUpstream) {
        $recommendations += "Set upstream: git push -u origin <branch>"
    }

    if ($HasUncommitted -or $HasStaged) {
        $recommendations += "Commit changes: git add . && git commit -m 'message'"
    }

    if ($Behind -gt 0 -and $Ahead -gt 0) {
        $recommendations += "Resolve divergence: git pull --rebase && git push"
    }
    elseif ($Behind -gt 0) {
        $recommendations += "Pull changes: git pull origin <branch>"
    }
    elseif ($Ahead -gt 0) {
        $recommendations += "Push commits: git push origin <branch>"
    }

    if ($StashCount -gt 0) {
        $recommendations += "Review stashes: git stash list (found $StashCount)"
    }

    if ($recommendations.Count -eq 0) {
        $recommendations += "Ready to work - local and remote are synchronized"
    }

    return $recommendations
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Check if in a git repository
$gitRoot = Get-GitRoot
if ($null -eq $gitRoot) {
    Write-Status "ERROR: Not in a git repository" $Colors.Error
    exit 1
}

$projectName = Split-Path $gitRoot -Leaf

# Get current or specified branch
if ([string]::IsNullOrEmpty($Branch)) {
    $Branch = Get-CurrentBranch
    if ($null -eq $Branch) {
        Write-Status "ERROR: Could not determine current branch" $Colors.Error
        exit 1
    }
}

# Fetch from remote if requested
if ($FetchRemote) {
    Write-Status "Fetching from remote..." $Colors.Muted
    git fetch origin --prune 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Status "WARNING: Failed to fetch from remote" $Colors.Warning
    }
}

# Gather all information
$upstream = Get-UpstreamBranch $Branch
$aheadBehind = Get-AheadBehind $Branch $upstream
$uncommitted = Get-UncommittedChanges
$unpushed = Get-UnpushedCommits $upstream
$unpulled = Get-UnpulledCommits $upstream
$stashCount = Get-StashCount
$lastRemoteCommit = Get-LastRemoteCommit $upstream

# Calculate status
$hasUncommitted = ($uncommitted.Modified.Count -gt 0) -or ($uncommitted.Staged.Count -gt 0)
$hasUntracked = $uncommitted.Untracked.Count -gt 0
$hasUpstream = -not [string]::IsNullOrEmpty($upstream)

$syncStatus = Get-SyncStatus `
    -Ahead $aheadBehind.Ahead `
    -Behind $aheadBehind.Behind `
    -HasUncommitted $hasUncommitted `
    -HasUntracked $hasUntracked `
    -HasUpstream $hasUpstream

$statusColor = Get-StatusColor $syncStatus

$recommendations = Get-Recommendations `
    -Ahead $aheadBehind.Ahead `
    -Behind $aheadBehind.Behind `
    -HasUncommitted $hasUncommitted `
    -HasStaged ($uncommitted.Staged.Count -gt 0) `
    -HasUntracked $hasUntracked `
    -HasUpstream $hasUpstream `
    -StashCount $stashCount

# Build result object
$result = @{
    Project         = $projectName
    Branch          = $Branch
    Upstream        = if ($upstream) { $upstream } else { "(none)" }
    Status          = $syncStatus
    Timestamp       = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    LocalState      = @{
        Modified       = $uncommitted.Modified.Count
        Staged         = $uncommitted.Staged.Count
        Untracked      = $uncommitted.Untracked.Count
        Stashes        = $stashCount
    }
    RemoteComparison = @{
        Ahead          = $aheadBehind.Ahead
        Behind         = $aheadBehind.Behind
        LastRemote     = $lastRemoteCommit
    }
    UnpushedCommits = $unpushed
    UnpulledCommits = $unpulled
    Recommendations = $recommendations
}

# Output based on format
if ($Json) {
    $result | ConvertTo-Json -Depth 10
    exit 0
}

if ($Quick) {
    # Quick summary output
    Write-Host ""
    Write-Status "[$syncStatus] " $statusColor -NoNewline
    Write-Status "$projectName " $Colors.Info -NoNewline
    Write-Status "($Branch" $Colors.Muted -NoNewline
    if ($hasUpstream) {
        Write-Status " -> $upstream" $Colors.Muted -NoNewline
    }
    Write-Status ")" $Colors.Muted

    if ($aheadBehind.Ahead -gt 0 -or $aheadBehind.Behind -gt 0) {
        Write-Status "  Ahead: $($aheadBehind.Ahead) | Behind: $($aheadBehind.Behind)" $Colors.Warning
    }

    $totalChanges = $uncommitted.Modified.Count + $uncommitted.Staged.Count + $uncommitted.Untracked.Count
    if ($totalChanges -gt 0) {
        Write-Status "  Changes: $totalChanges files" $Colors.Warning
    }

    Write-Host ""
    exit 0
}

# Full report
Write-Host ""
Write-Host "============================================================" -ForegroundColor $Colors.Muted
Write-Status "           PROJECT SYNC STATUS REPORT" $Colors.Info
Write-Host "============================================================" -ForegroundColor $Colors.Muted
Write-Host ""

# Header
Write-Status "Project:    " $Colors.Muted -NoNewline
Write-Status $projectName $Colors.Info

Write-Status "Branch:     " $Colors.Muted -NoNewline
Write-Status "$Branch -> $($result.Upstream)" $Colors.Info

Write-Status "Status:     " $Colors.Muted -NoNewline
Write-Status "[$syncStatus]" $statusColor

Write-Status "Checked:    " $Colors.Muted -NoNewline
Write-Status $result.Timestamp $Colors.Muted

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor $Colors.Muted
Write-Status "LOCAL STATE" $Colors.Info
Write-Host "------------------------------------------------------------" -ForegroundColor $Colors.Muted

Write-Status "  Modified files:    $($uncommitted.Modified.Count)" $(if ($uncommitted.Modified.Count -gt 0) { $Colors.Warning } else { $Colors.Success })
Write-Status "  Staged files:      $($uncommitted.Staged.Count)" $(if ($uncommitted.Staged.Count -gt 0) { $Colors.Warning } else { $Colors.Success })
Write-Status "  Untracked files:   $($uncommitted.Untracked.Count)" $(if ($uncommitted.Untracked.Count -gt 0) { $Colors.Warning } else { $Colors.Success })
Write-Status "  Stashed changes:   $stashCount" $(if ($stashCount -gt 0) { $Colors.Info } else { $Colors.Muted })

# Show file details if there are changes
if ($uncommitted.Modified.Count -gt 0) {
    Write-Host ""
    Write-Status "  Modified:" $Colors.Warning
    $uncommitted.Modified | Select-Object -First 10 | ForEach-Object {
        Write-Status "    M $_" $Colors.Muted
    }
    if ($uncommitted.Modified.Count -gt 10) {
        Write-Status "    ... and $($uncommitted.Modified.Count - 10) more" $Colors.Muted
    }
}

if ($uncommitted.Staged.Count -gt 0) {
    Write-Host ""
    Write-Status "  Staged for commit:" $Colors.Success
    $uncommitted.Staged | Select-Object -First 10 | ForEach-Object {
        Write-Status "    + $_" $Colors.Muted
    }
    if ($uncommitted.Staged.Count -gt 10) {
        Write-Status "    ... and $($uncommitted.Staged.Count - 10) more" $Colors.Muted
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor $Colors.Muted
Write-Status "REMOTE COMPARISON" $Colors.Info
Write-Host "------------------------------------------------------------" -ForegroundColor $Colors.Muted

$aheadColor = if ($aheadBehind.Ahead -gt 0) { $Colors.Warning } else { $Colors.Success }
$behindColor = if ($aheadBehind.Behind -gt 0) { $Colors.Warning } else { $Colors.Success }

Write-Status "  Commits ahead:     $($aheadBehind.Ahead) (need to push)" $aheadColor
Write-Status "  Commits behind:    $($aheadBehind.Behind) (need to pull)" $behindColor

if ($lastRemoteCommit) {
    Write-Host ""
    Write-Status "  Last remote commit:" $Colors.Muted
    Write-Status "    $lastRemoteCommit" $Colors.Muted
}

# Show unpushed commits if any
if ($unpushed.Count -gt 0) {
    Write-Host ""
    Write-Status "  Unpushed commits:" $Colors.Warning
    $unpushed | Select-Object -First 5 | ForEach-Object {
        Write-Status "    -> $_" $Colors.Muted
    }
    if ($unpushed.Count -gt 5) {
        Write-Status "    ... and $($unpushed.Count - 5) more" $Colors.Muted
    }
}

# Show unpulled commits if any
if ($unpulled.Count -gt 0) {
    Write-Host ""
    Write-Status "  Unpulled commits:" $Colors.Warning
    $unpulled | Select-Object -First 5 | ForEach-Object {
        Write-Status "    <- $_" $Colors.Muted
    }
    if ($unpulled.Count -gt 5) {
        Write-Status "    ... and $($unpulled.Count - 5) more" $Colors.Muted
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor $Colors.Muted
Write-Status "RECOMMENDATIONS" $Colors.Info
Write-Host "------------------------------------------------------------" -ForegroundColor $Colors.Muted

$i = 1
foreach ($rec in $recommendations) {
    $recColor = if ($rec -like "*Ready*" -or $rec -like "*synchronized*") { $Colors.Success } else { $Colors.Warning }
    Write-Status "  $i. $rec" $recColor
    $i++
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor $Colors.Muted
Write-Host ""

# Exit with appropriate code
if ($syncStatus -eq "SYNCED") {
    exit 0
} else {
    exit 1
}
