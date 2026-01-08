#!/usr/bin/env npx tsx
/**
 * Session Checker Script
 *
 * Check if an Interstellio/NebularStack subscriber session is active.
 *
 * Usage:
 *   npx tsx .claude/skills/session-checker/check-session.ts <subscriber-id>
 *
 * Environment Variables:
 *   INTERSTELLIO_API_TOKEN - JWT token for authentication
 *   INTERSTELLIO_TENANT_ID - Tenant ID (default: circletel.co.za)
 *
 * Examples:
 *   npx tsx .claude/skills/session-checker/check-session.ts 23ffee86-dbe9-11f0-9102-61ef2f83e8d9
 */

const TELEMETRY_URL = 'https://telemetry-za.nebularstack.com'
const DEFAULT_TENANT = 'circletel.co.za'
const TIMEZONE = 'Africa/Johannesburg'

interface CDRRecord {
  id: string
  start_time: string
  update_time: string
  acct_unique_id: string
  username: string
  calling_station_id: string | null
  called_station_id: string | null
  nas_ip_address: string
  client_ip_address: string | null
  duration: number
  terminate_cause: string | null
}

async function checkSession(subscriberId: string): Promise<void> {
  const token = process.env.INTERSTELLIO_API_TOKEN
  const tenantId = process.env.INTERSTELLIO_TENANT_ID || DEFAULT_TENANT

  if (!token) {
    console.error('\x1b[31mERROR: INTERSTELLIO_API_TOKEN environment variable not set\x1b[0m')
    process.exit(1)
  }

  // Calculate time range (today)
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const formatDate = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+02:00`
  }

  const body = {
    start_time: formatDate(startOfDay),
    end_time: formatDate(now),
  }

  console.log('\n\x1b[36mSession Checker - CircleTel\x1b[0m')
  console.log('\x1b[36m============================\x1b[0m\n')
  console.log(`Subscriber ID: ${subscriberId}`)
  console.log(`Time Range: ${body.start_time} to ${body.end_time}\n`)

  try {
    const response = await fetch(`${TELEMETRY_URL}/v1/subscriber/${subscriberId}/cdr/records`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': token,
        'X-Tenant-ID': tenantId,
        'X-Domain': tenantId,
        'X-Timezone': TIMEZONE,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`\x1b[31mHTTP ${response.status}: ${response.statusText}\x1b[0m`)
      console.error(errorText)
      process.exit(1)
    }

    const data = await response.json()
    const records: CDRRecord[] = Array.isArray(data) ? data : data ? [data] : []

    if (records.length === 0) {
      console.log('\x1b[33mSTATUS: NO SESSIONS FOUND\x1b[0m')
      console.log('No CDR records found for today.\n')
      return
    }

    const lastSession = records[0]
    const isActive = !lastSession.terminate_cause

    if (isActive) {
      console.log('\x1b[42m\x1b[30m STATUS: ACTIVE (Online) \x1b[0m\n')
    } else {
      console.log('\x1b[41m\x1b[37m STATUS: DISCONNECTED (Offline) \x1b[0m\n')
    }

    console.log(`Username:      ${lastSession.username}`)
    console.log(`Session Start: ${lastSession.start_time}`)
    console.log(`Last Update:   ${lastSession.update_time}`)

    const durationMin = Math.round(lastSession.duration / 60)
    const durationHrs = (lastSession.duration / 3600).toFixed(2)
    console.log(`Duration:      ${durationMin} min (${durationHrs} hrs)`)

    if (lastSession.calling_station_id) {
      console.log(`\nIP Address:    ${lastSession.calling_station_id}`)
    }
    console.log(`NAS IP:        ${lastSession.nas_ip_address}`)

    if (!isActive) {
      console.log(`\n\x1b[33mTerminate Cause: ${lastSession.terminate_cause}\x1b[0m`)

      const explanations: Record<string, string> = {
        'Lost-Carrier': 'Connection lost (modem/router issue or line drop)',
        'User-Request': 'User or device initiated disconnect',
        'Session-Timeout': 'Maximum session duration reached',
        'Idle-Timeout': 'Session timed out due to inactivity',
        'Admin-Reset': 'Administratively disconnected',
        'Port-Error': 'NAS/BNG port issue',
      }

      const explanation = explanations[lastSession.terminate_cause || ''] || 'See documentation'
      console.log(`Explanation: ${explanation}`)
    }

    // Statistics
    console.log('\n\x1b[36mSession Statistics (Today):\x1b[0m')
    console.log('----------------------------------------')
    console.log(`Total Sessions: ${records.length}`)

    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0)
    console.log(`Total Online:   ${(totalDuration / 3600).toFixed(2)} hours`)

    // Count terminate causes
    const causes: Record<string, number> = {}
    for (const record of records) {
      if (record.terminate_cause) {
        causes[record.terminate_cause] = (causes[record.terminate_cause] || 0) + 1
      }
    }

    if (Object.keys(causes).length > 0) {
      console.log('\nDisconnect Reasons:')
      for (const [cause, count] of Object.entries(causes)) {
        console.log(`  ${cause}: ${count}`)
      }
    }

    console.log('')
  } catch (error) {
    console.error('\x1b[31mERROR: Failed to check session\x1b[0m')
    console.error(error)
    process.exit(1)
  }
}

// Main
const subscriberId = process.argv[2]

if (!subscriberId) {
  console.error('\x1b[31mUsage: npx tsx check-session.ts <subscriber-id>\x1b[0m')
  console.error('\nExample:')
  console.error('  npx tsx .claude/skills/session-checker/check-session.ts 23ffee86-dbe9-11f0-9102-61ef2f83e8d9')
  process.exit(1)
}

checkSession(subscriberId)
