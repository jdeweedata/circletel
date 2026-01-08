<#
.SYNOPSIS
    Check if an Interstellio/NebularStack subscriber session is active.

.DESCRIPTION
    Queries the NebularStack Telemetry API to check CDR records and determine
    if a subscriber's PPPoE session is currently active or disconnected.

.PARAMETER SubscriberId
    The Interstellio subscriber UUID (required)

.PARAMETER Token
    The X-Auth-Token for authentication (optional, defaults to env var)

.PARAMETER Days
    Number of days to look back for session history (default: 1)

.PARAMETER Verbose
    Show detailed session information

.EXAMPLE
    .\check-session.ps1 -SubscriberId "23ffee86-dbe9-11f0-9102-61ef2f83e8d9"

.EXAMPLE
    .\check-session.ps1 -SubscriberId "23ffee86-dbe9-11f0-9102-61ef2f83e8d9" -Days 7 -Verbose

.NOTES
    Author: CircleTel Development Team
    Version: 1.0.0
    Requires: PowerShell 5.1+, INTERSTELLIO_API_TOKEN environment variable
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriberId,

    [Parameter(Mandatory=$false)]
    [string]$Token = $env:INTERSTELLIO_API_TOKEN,

    [Parameter(Mandatory=$false)]
    [int]$Days = 1,

    [Parameter(Mandatory=$false)]
    [switch]$ShowDetails
)

# ============================================================================
# Configuration
# ============================================================================

$TelemetryBaseUrl = "https://telemetry-za.nebularstack.com"
$TenantId = "circletel.co.za"
$Domain = "circletel.co.za"
$Timezone = "Africa/Johannesburg"

# ============================================================================
# Validation
# ============================================================================

if (-not $Token) {
    Write-Host "ERROR: No authentication token provided." -ForegroundColor Red
    Write-Host "Set INTERSTELLIO_API_TOKEN environment variable or use -Token parameter." -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# Build Request
# ============================================================================

$headers = @{
    "X-Auth-Token" = $Token
    "X-Tenant-ID" = $TenantId
    "X-Domain" = $Domain
    "X-Timezone" = $Timezone
    "Content-Type" = "application/json"
}

# Calculate time range
$endTime = Get-Date
$startTime = $endTime.AddDays(-$Days).Date

$body = @{
    start_time = $startTime.ToString("yyyy-MM-ddT00:00:00+02:00")
    end_time = $endTime.ToString("yyyy-MM-ddTHH:mm:ss+02:00")
} | ConvertTo-Json

$url = "$TelemetryBaseUrl/v1/subscriber/$SubscriberId/cdr/records"

# ============================================================================
# Make Request
# ============================================================================

Write-Host ""
Write-Host "Session Checker - CircleTel" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Subscriber ID: $SubscriberId" -ForegroundColor Gray
Write-Host "Time Range: $($startTime.ToString('yyyy-MM-dd')) to $($endTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body -ErrorAction Stop

    # Handle single record or array
    if ($response -is [System.Array]) {
        $records = $response
    } elseif ($response) {
        $records = @($response)
    } else {
        $records = @()
    }

    if ($records.Count -eq 0) {
        Write-Host "STATUS: NO SESSIONS FOUND" -ForegroundColor Yellow
        Write-Host "No CDR records found in the specified time range." -ForegroundColor Gray
        Write-Host ""
        exit 0
    }

    # Get most recent session (first in the array)
    $lastSession = $records[0]

    # Determine status
    if ($null -eq $lastSession.terminate_cause -or $lastSession.terminate_cause -eq "") {
        Write-Host "STATUS: ACTIVE (Online)" -ForegroundColor Green -BackgroundColor DarkGreen
        Write-Host ""
        Write-Host "Username:      $($lastSession.username)" -ForegroundColor White
        Write-Host "Connected:     $($lastSession.start_time)" -ForegroundColor White
        Write-Host "Last Update:   $($lastSession.update_time)" -ForegroundColor White

        $durationMinutes = [math]::Round($lastSession.duration / 60, 1)
        $durationHours = [math]::Round($lastSession.duration / 3600, 2)
        Write-Host "Duration:      $durationMinutes min ($durationHours hrs)" -ForegroundColor White
        Write-Host ""
        Write-Host "IP Address:    $($lastSession.calling_station_id)" -ForegroundColor Gray
        Write-Host "NAS IP:        $($lastSession.nas_ip_address)" -ForegroundColor Gray
    } else {
        Write-Host "STATUS: DISCONNECTED (Offline)" -ForegroundColor Red -BackgroundColor DarkRed
        Write-Host ""
        Write-Host "Username:      $($lastSession.username)" -ForegroundColor White
        Write-Host "Last Session:  $($lastSession.start_time)" -ForegroundColor White
        Write-Host "Ended:         $($lastSession.update_time)" -ForegroundColor White
        Write-Host ""
        Write-Host "Terminate Cause: $($lastSession.terminate_cause)" -ForegroundColor Yellow

        # Explain terminate cause
        switch ($lastSession.terminate_cause) {
            "Lost-Carrier" {
                Write-Host "Explanation: Connection lost (modem/router issue or line drop)" -ForegroundColor Gray
            }
            "User-Request" {
                Write-Host "Explanation: User or device initiated disconnect" -ForegroundColor Gray
            }
            "Session-Timeout" {
                Write-Host "Explanation: Maximum session duration reached" -ForegroundColor Gray
            }
            "Idle-Timeout" {
                Write-Host "Explanation: Session timed out due to inactivity" -ForegroundColor Gray
            }
            "Admin-Reset" {
                Write-Host "Explanation: Administratively disconnected" -ForegroundColor Gray
            }
            "Port-Error" {
                Write-Host "Explanation: NAS/BNG port issue" -ForegroundColor Gray
            }
            default {
                Write-Host "Explanation: See Interstellio documentation for details" -ForegroundColor Gray
            }
        }
    }

    # Show session statistics
    Write-Host ""
    Write-Host "Session Statistics (Last $Days Day(s)):" -ForegroundColor Cyan
    Write-Host "----------------------------------------"
    Write-Host "Total Sessions: $($records.Count)" -ForegroundColor White

    # Calculate total duration
    $totalDuration = ($records | Measure-Object -Property duration -Sum).Sum
    $totalHours = [math]::Round($totalDuration / 3600, 2)
    Write-Host "Total Online:   $totalHours hours" -ForegroundColor White

    # Count terminate causes
    $terminateCauses = $records | Where-Object { $_.terminate_cause } | Group-Object -Property terminate_cause
    if ($terminateCauses.Count -gt 0) {
        Write-Host ""
        Write-Host "Disconnect Reasons:" -ForegroundColor Yellow
        foreach ($cause in $terminateCauses) {
            Write-Host "  $($cause.Name): $($cause.Count)" -ForegroundColor Gray
        }
    }

    # Show details if requested
    if ($ShowDetails -and $records.Count -gt 1) {
        Write-Host ""
        Write-Host "Session History:" -ForegroundColor Cyan
        Write-Host "----------------------------------------"

        $records | ForEach-Object {
            $status = if ($null -eq $_.terminate_cause) { "[ACTIVE]" } else { "[ENDED]" }
            $statusColor = if ($null -eq $_.terminate_cause) { "Green" } else { "Red" }

            Write-Host "$status $($_.start_time) - Duration: $([math]::Round($_.duration / 60, 1)) min" -ForegroundColor $statusColor
            if ($_.terminate_cause) {
                Write-Host "         Cause: $($_.terminate_cause)" -ForegroundColor Gray
            }
        }
    }

    Write-Host ""

} catch {
    Write-Host "ERROR: Failed to check session status" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Yellow

        switch ($statusCode) {
            401 { Write-Host "Authentication failed - check your token" -ForegroundColor Yellow }
            403 { Write-Host "Access denied - check tenant permissions" -ForegroundColor Yellow }
            404 { Write-Host "Subscriber not found - check the ID" -ForegroundColor Yellow }
        }
    }

    exit 1
}
