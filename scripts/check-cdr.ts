/**
 * Quick CDR Query Script
 *
 * Queries Interstellio CDR (Call Detail Records) for subscriber session history.
 * Refactored for better maintainability with extracted helper functions.
 *
 * Usage: npx tsx scripts/check-cdr.ts <subscriber_id>
 *
 * @module scripts/check-cdr
 */

import { config } from 'dotenv'
import { createInterstellioClient } from '../lib/interstellio/client'

// Load environment variables
config({ path: '.env.local' })

// Types
interface SessionAnalysis {
  isActive: boolean
  totalSessionsToday: number
  totalDurationSeconds: number
  terminateCauses: Record<string, number>
  lastSession?: {
    username: string
    start_time: string
    update_time: string
    duration?: number
    calling_station_id: string
    nas_ip_address: string
    terminate_cause?: string
  }
}

interface CDRRecord {
  start_time: string
  duration?: number
  calling_station_id?: string
  terminate_cause?: string
}

type InterstellioClient = ReturnType<typeof createInterstellioClient>

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

/**
 * Format date to SAST ISO string for Interstellio API
 */
function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+02:00`
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Authenticate with Interstellio API
 */
async function authenticateClient(client: InterstellioClient): Promise<void> {
  if (process.env.INTERSTELLIO_API_TOKEN) {
    client.setToken(
      process.env.INTERSTELLIO_API_TOKEN,
      process.env.INTERSTELLIO_TENANT_ID || 'circletel.co.za'
    )
    return
  }

  console.log('🔐 Authenticating with Interstellio...')

  if (!process.env.INTERSTELLIO_USERNAME || !process.env.INTERSTELLIO_PASSWORD) {
    console.error('❌ INTERSTELLIO credentials not set in environment')
    process.exit(1)
  }

  try {
    const authResponse = await client.authenticate({
      username: process.env.INTERSTELLIO_USERNAME,
      password: process.env.INTERSTELLIO_PASSWORD,
      domain: process.env.INTERSTELLIO_DOMAIN || 'circletel.co.za'
    })
    console.log(`✅ Authenticated as ${authResponse.context.username}\n`)
  } catch (error) {
    console.error('❌ Authentication failed:', error)
    process.exit(1)
  }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * Display session status analysis
 */
function displaySessionStatus(analysis: SessionAnalysis): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  SESSION STATUS: ${analysis.isActive ? '🟢 ACTIVE' : '🔴 DISCONNECTED'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  console.log(`\n📊 Today's Statistics:`)
  console.log(`   Sessions today: ${analysis.totalSessionsToday}`)
  console.log(`   Total duration: ${formatDuration(analysis.totalDurationSeconds)}`)

  if (Object.keys(analysis.terminateCauses).length > 0) {
    console.log(`\n📋 Terminate Causes:`)
    for (const [cause, count] of Object.entries(analysis.terminateCauses)) {
      console.log(`   ${cause}: ${count} time(s)`)
    }
  }

  if (analysis.lastSession) {
    console.log(`\n📌 Last Session Details:`)
    console.log(`   Username: ${analysis.lastSession.username}`)
    console.log(`   Started: ${analysis.lastSession.start_time}`)
    console.log(`   Updated: ${analysis.lastSession.update_time}`)
    console.log(`   Duration: ${formatDuration(analysis.lastSession.duration || 0)}`)
    console.log(`   Client IP: ${analysis.lastSession.calling_station_id}`)
    console.log(`   NAS IP: ${analysis.lastSession.nas_ip_address}`)
    console.log(`   Terminate Cause: ${analysis.lastSession.terminate_cause || 'None (active)'}`)
  }
}

/**
 * Display CDR records table
 */
function displayCDRRecords(records: CDRRecord[]): void {
  console.log(`📜 Found ${records.length} CDR records in the last 7 days:\n`)

  if (records.length === 0) {
    console.log('   No CDR records found in the last 7 days.')
    return
  }

  console.log('┌────────────────────────────────────────────────────────────────────────────────┐')
  console.log('│ Start Time              │ Duration   │ IP Address      │ Terminate Cause      │')
  console.log('├────────────────────────────────────────────────────────────────────────────────┤')

  const displayRecords = records.slice(0, 20)
  for (const record of displayRecords) {
    const startTime = new Date(record.start_time).toLocaleString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      dateStyle: 'short',
      timeStyle: 'medium'
    })
    const duration = formatDuration(record.duration || 0)
    const ip = record.calling_station_id || 'N/A'
    const cause = record.terminate_cause || '(active)'

    console.log(`│ ${startTime.padEnd(22)} │ ${duration.padEnd(10)} │ ${ip.padEnd(15)} │ ${cause.padEnd(20)} │`)
  }

  console.log('└────────────────────────────────────────────────────────────────────────────────┘')

  if (records.length > 20) {
    console.log(`\n   ... and ${records.length - 20} more records`)
  }
}

/**
 * Calculate and display summary statistics
 */
function displaySummary(records: CDRRecord[]): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Count disconnections by cause
  const causeStats = records.reduce((acc, record) => {
    if (record.terminate_cause) {
      acc[record.terminate_cause] = (acc[record.terminate_cause] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const lostCarrierCount = causeStats['Lost-Carrier'] || 0
  const totalOnlineTime = records.reduce((sum, r) => sum + (r.duration || 0), 0)

  console.log(`   Total sessions (7 days): ${records.length}`)
  console.log(`   Total online time: ${formatDuration(totalOnlineTime)}`)
  console.log(`   Lost-Carrier events: ${lostCarrierCount}`)

  // Connection stability assessment
  if (lostCarrierCount > 10) {
    console.log('\n   ⚠️  HIGH DISCONNECTION RATE - Line may be unstable')
  } else if (lostCarrierCount > 5) {
    console.log('\n   ⚠️  MODERATE DISCONNECTION RATE - Monitor connection')
  } else {
    console.log('\n   ✅  Connection appears stable')
  }

  console.log('')
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

async function main() {
  const subscriberId = process.argv[2] || '00958ac6-c6d8-11f0-a064-61ef2f83e8d9'
  console.log(`\n📡 Querying CDR records for subscriber: ${subscriberId}\n`)

  const client = createInterstellioClient()
  await authenticateClient(client)

  try {
    // Get session analysis
    console.log('🔍 Analyzing session status...\n')
    const analysis = await client.analyzeSessionStatus(subscriberId)
    displaySessionStatus(analysis as SessionAnalysis)

    // Get last 7 days of CDR records
    console.log('\n📅 Fetching last 7 days of session history...\n')
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const records = await client.getCDRRecords(subscriberId, {
      start_time: formatDateForAPI(sevenDaysAgo),
      end_time: formatDateForAPI(now),
    })

    displayCDRRecords(records as CDRRecord[])
    displaySummary(records as CDRRecord[])
  } catch (error) {
    console.error('❌ Error querying CDR records:', error)
    process.exit(1)
  }
}

main()
