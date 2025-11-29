<#
.SYNOPSIS
    PM Agent - Autonomous spec generation from natural language feature requests.

.DESCRIPTION
    Wrapper script for the PM Agent that generates Agent-OS specifications.
    Analyzes codebase, assesses impact, and creates comprehensive specs.

.PARAMETER Action
    The action to perform: 'generate' for full spec, 'analyze' for quick analysis.

.PARAMETER Description
    Natural language description of the feature to build.

.PARAMETER Priority
    Optional priority level: low, medium, high, critical. Default: medium.

.PARAMETER OutputDir
    Optional output directory. Default: agent-os/specs.

.PARAMETER Verbose
    Enable verbose output for debugging.

.EXAMPLE
    .\run-pm-agent.ps1 -Action generate -Description "Add user dashboard with usage tracking"

.EXAMPLE
    .\run-pm-agent.ps1 -Action analyze -Description "Add SMS notifications" -Priority high

.EXAMPLE
    .\run-pm-agent.ps1 generate "Add referral system"

.NOTES
    Version: 1.0.0
    Requires: Node.js 18+, TypeScript
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('generate', 'analyze', 'help')]
    [string]$Action = 'help',

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$DescriptionArgs,

    [ValidateSet('low', 'medium', 'high', 'critical')]
    [string]$Priority = 'medium',

    [string]$OutputDir = 'agent-os/specs',

    [switch]$VerboseOutput
)

# Configuration
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\..\..").FullName
$CLIScript = Join-Path $ProjectRoot "scripts\agents\pm-cli.ts"

# Colors
function Write-ColorOutput {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "================================" "Cyan"
    Write-ColorOutput " $Title" "Cyan"
    Write-ColorOutput "================================" "Cyan"
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Status = 'pending')
    $icon = switch ($Status) {
        'pending' { "[..]" }
        'running' { "[>>]" }
        'success' { "[OK]" }
        'error'   { "[!!]" }
        default   { "[--]" }
    }
    $color = switch ($Status) {
        'pending' { 'Gray' }
        'running' { 'Yellow' }
        'success' { 'Green' }
        'error'   { 'Red' }
        default   { 'White' }
    }
    Write-ColorOutput "$icon $Step" $color
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host ""
    Write-ColorOutput "ERROR: $Message" "Red"
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host ""
    Write-ColorOutput "SUCCESS: $Message" "Green"
    Write-Host ""
}

function Show-Help {
    Write-Header "PM Agent - Spec Generator"

    Write-ColorOutput "USAGE:" "Yellow"
    Write-Host "  .\run-pm-agent.ps1 <action> <description> [options]"
    Write-Host ""

    Write-ColorOutput "ACTIONS:" "Yellow"
    Write-Host "  generate    Generate a full Agent-OS specification"
    Write-Host "  analyze     Quick impact analysis (no files created)"
    Write-Host "  help        Show this help message"
    Write-Host ""

    Write-ColorOutput "OPTIONS:" "Yellow"
    Write-Host "  -Priority   low | medium | high | critical (default: medium)"
    Write-Host "  -OutputDir  Output directory (default: agent-os/specs)"
    Write-Host "  -Verbose    Enable verbose output"
    Write-Host ""

    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-Host '  .\run-pm-agent.ps1 generate "Add user dashboard with usage tracking"'
    Write-Host '  .\run-pm-agent.ps1 analyze "Add SMS notifications" -Priority high'
    Write-Host '  .\run-pm-agent.ps1 generate "Critical security fix" -Priority critical'
    Write-Host ""

    Write-ColorOutput "OUTPUT:" "Yellow"
    Write-Host "  Specs are saved to: agent-os/specs/YYYYMMDD-feature-name/"
    Write-Host "    - README.md       Quick overview"
    Write-Host "    - SPEC.md         Full specification"
    Write-Host "    - TASKS.md        Task breakdown by agent"
    Write-Host "    - PROGRESS.md     Progress tracking"
    Write-Host "    - architecture.md Technical architecture"
    Write-Host ""
}

function Test-Prerequisites {
    Write-Step "Checking prerequisites..." "running"

    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if (-not $nodeVersion) {
            throw "Node.js not found"
        }
        $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($majorVersion -lt 18) {
            throw "Node.js 18+ required, found $nodeVersion"
        }
    }
    catch {
        Write-Error-Custom "Node.js 18+ is required. Please install from https://nodejs.org/"
        return $false
    }

    # Check CLI script exists
    if (-not (Test-Path $CLIScript)) {
        Write-Error-Custom "CLI script not found: $CLIScript"
        Write-Host "Run the following to create it:"
        Write-Host "  npx ts-node scripts/agents/pm-cli.ts --help"
        return $false
    }

    # Check PM Agent exists
    $agentPath = Join-Path $ProjectRoot "lib\agents\pm\agent.ts"
    if (-not (Test-Path $agentPath)) {
        Write-Error-Custom "PM Agent not found: $agentPath"
        return $false
    }

    Write-Step "Prerequisites OK (Node.js $nodeVersion)" "success"
    return $true
}

function Invoke-PMAgent {
    param(
        [string]$ActionType,
        [string]$Description,
        [string]$PriorityLevel,
        [string]$Output
    )

    Write-Header "PM Agent - $($ActionType.ToUpper())"

    # Validate description
    if ([string]::IsNullOrWhiteSpace($Description)) {
        Write-Error-Custom "Description is required. Use -Description or provide as second argument."
        Show-Help
        return
    }

    Write-ColorOutput "Feature: $Description" "White"
    Write-ColorOutput "Priority: $PriorityLevel" "Gray"
    Write-ColorOutput "Output: $Output" "Gray"
    Write-Host ""

    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        return
    }

    # Build command arguments
    $args = @($ActionType, "`"$Description`"", "--priority", $PriorityLevel, "--output", $Output)
    if ($VerboseOutput) {
        $args += "--verbose"
    }

    # Progress indicators
    Write-Step "Analyzing codebase..." "running"

    try {
        # Change to project root
        Push-Location $ProjectRoot

        # Run the CLI script with ts-node
        $command = "npx ts-node `"$CLIScript`" $($args -join ' ')"

        if ($VerboseOutput) {
            Write-Host "Executing: $command" -ForegroundColor Gray
        }

        # Execute with output capture
        $output = Invoke-Expression $command 2>&1
        $exitCode = $LASTEXITCODE

        # Display output
        foreach ($line in $output) {
            if ($line -match '^\[OK\]|^SUCCESS|^Spec saved') {
                Write-ColorOutput $line "Green"
            }
            elseif ($line -match '^\[!!\]|^ERROR|^FAILED') {
                Write-ColorOutput $line "Red"
            }
            elseif ($line -match '^\[>>\]|^Analyzing|^Generating') {
                Write-ColorOutput $line "Yellow"
            }
            elseif ($line -match '^\d+\s+points|Risk level:|Estimated') {
                Write-ColorOutput $line "Cyan"
            }
            else {
                Write-Host $line
            }
        }

        if ($exitCode -eq 0) {
            Write-Success "PM Agent completed successfully"
        }
        else {
            Write-Error-Custom "PM Agent failed with exit code $exitCode"
        }
    }
    catch {
        Write-Error-Custom "Failed to execute PM Agent: $_"
    }
    finally {
        Pop-Location
    }
}

# Main execution
$Description = if ($DescriptionArgs) { $DescriptionArgs -join ' ' } else { '' }

switch ($Action.ToLower()) {
    'generate' {
        Invoke-PMAgent -ActionType 'generate' -Description $Description -PriorityLevel $Priority -Output $OutputDir
    }
    'analyze' {
        Invoke-PMAgent -ActionType 'analyze' -Description $Description -PriorityLevel $Priority -Output $OutputDir
    }
    'help' {
        Show-Help
    }
    default {
        Show-Help
    }
}
