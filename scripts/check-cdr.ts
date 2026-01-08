/**
 * Quick CDR Query Script
 * Usage: npx tsx scripts/check-cdr.ts <subscriber_id>
 */

import { config } from 'dotenv'
import { createInterstellioClient } from '../lib/interstellio/client'

// Load environment variables
config({ path: '.env.local' })

async function main() {
  const subscriberId = process.argv[2] || '00958ac6-c6d8-11f0-a064-61ef2f83e8d9'

  console.log(`\n📡 Querying CDR records for subscriber: ${subscriberId}\n`)

  const client = createInterstellioClient()

  // Authenticate if token not available
  if (!process.env.INTERSTELLIO_API_TOKEN) {
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
  } else {
    client.setToken(
      process.env.INTERSTELLIO_API_TOKEN,
      process.env.INTERSTELLIO_TENANT_ID || 'circletel.co.za'
    )
  }

  try {
    // Get session analysis (includes today's CDR records)
    console.log('🔍 Analyzing session status...\n')
    const analysis = await client.analyzeSessionStatus(subscriberId)

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

    // Get last 7 days of CDR records for history
    console.log('\n📅 Fetching last 7 days of session history...\n')

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const formatDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+02:00`
    }

    const records = await client.getCDRRecords(subscriberId, {
      start_time: formatDate(sevenDaysAgo),
      end_time: formatDate(now),
    })

    console.log(`📜 Found ${records.length} CDR records in the last 7 days:\n`)

    if (records.length > 0) {
      console.log('┌────────────────────────────────────────────────────────────────────────────────┐')
      console.log('│ Start Time              │ Duration   │ IP Address      │ Terminate Cause      │')
      console.log('├────────────────────────────────────────────────────────────────────────────────┤')

      for (const record of records.slice(0, 20)) { // Show last 20
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
    } else {
      console.log('   No CDR records found in the last 7 days.')
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Count disconnections by cause in last 7 days
    const allCauses: Record<string, number> = {}
    for (const record of records) {
      if (record.terminate_cause) {
        allCauses[record.terminate_cause] = (allCauses[record.terminate_cause] || 0) + 1
      }
    }

    const lostCarrierCount = allCauses['Lost-Carrier'] || 0
    const totalOnlineTime = records.reduce((sum, r) => sum + (r.duration || 0), 0)

    console.log(`   Total sessions (7 days): ${records.length}`)
    console.log(`   Total online time: ${formatDuration(totalOnlineTime)}`)
    console.log(`   Lost-Carrier events: ${lostCarrierCount}`)

    if (lostCarrierCount > 10) {
      console.log('\n   ⚠️  HIGH DISCONNECTION RATE - Line may be unstable')
    } else if (lostCarrierCount > 5) {
      console.log('\n   ⚠️  MODERATE DISCONNECTION RATE - Monitor connection')
    } else {
      console.log('\n   ✅  Connection appears stable')
    }

    console.log('')

  } catch (error) {
    console.error('❌ Error querying CDR records:', error)
    process.exit(1)
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

main()
