#!/usr/bin/env npx tsx
/**
 * Find MikroTik Router PPPoE Session via Interstellio API
 *
 * Usage: npx tsx scripts/find-mikrotik-session.ts [username]
 * Default username: CT-UNJ-015@circletel.co.za
 */

import { config } from 'dotenv'
config({ path: '.env.production.local' })
config({ path: '.env.local' })
config({ path: '.env' })

import { getInterstellioClient } from '../lib/interstellio/client'

async function findRouterSession(pppoeUsername: string) {
  const client = getInterstellioClient()

  console.log(`\n🔍 Searching for subscriber: ${pppoeUsername}\n`)

  // Step 1: Find subscriber by username
  const subscribers = await client.listSubscribers({ username: pppoeUsername, l: 10 })

  if (!subscribers.payload || subscribers.payload.length === 0) {
    console.log('❌ No subscriber found with that username')
    console.log('\nTrying partial match...')

    // Try without domain
    const usernameOnly = pppoeUsername.split('@')[0]
    const partialMatch = await client.listSubscribers({ username: usernameOnly, l: 10 })

    if (partialMatch.payload?.length > 0) {
      console.log('\n📋 Found subscribers with partial match:')
      for (const sub of partialMatch.payload) {
        console.log(`  - ${sub.username} (ID: ${sub.id})`)
      }
    }
    return
  }

  const subscriber = subscribers.payload[0]
  console.log('✅ Found subscriber:')
  console.log(`   ID: ${subscriber.id}`)
  console.log(`   Username: ${subscriber.username}`)
  console.log(`   Name: ${subscriber.name || 'N/A'}`)
  console.log(`   Enabled: ${subscriber.enabled}`)
  console.log(`   Static IP: ${subscriber.static_ip4 || 'None (dynamic)'}`)
  console.log(`   Last Seen: ${subscriber.last_seen || 'Never'}`)
  console.log(`   Profile: ${subscriber.profile}`)
  console.log(`   Service: ${subscriber.service}`)

  // Step 2: Get active sessions
  console.log('\n📡 Fetching active sessions...\n')

  const sessions = await client.listSessions(subscriber.id, { l: 10 })

  if (!sessions.payload || sessions.payload.length === 0) {
    console.log('❌ No active sessions found')

    // Check session status via CDR
    console.log('\n📊 Checking session history...')
    const analysis = await client.analyzeSessionStatus(subscriber.id)
    console.log(`   Sessions today: ${analysis.totalSessionsToday}`)
    console.log(`   Currently active: ${analysis.isActive}`)
    if (analysis.lastSession) {
      console.log(`   Last session NAS: ${analysis.lastSession.nas_ip_address}`)
      console.log(`   Last terminate cause: ${analysis.lastSession.terminate_cause || 'Still active'}`)
    }
    return
  }

  console.log(`✅ Found ${sessions.payload.length} active session(s):\n`)

  for (const session of sessions.payload) {
    console.log('━'.repeat(50))
    console.log(`Session ID: ${session.id}`)
    console.log(`  Framed IP: ${session.framed_ip_address || 'N/A'}`)
    console.log(`  NAS IP: ${session.nas_ip_address}`)
    console.log(`  NAS Port: ${session.nas_port}`)
    console.log(`  Calling Station: ${session.calling_station_id || 'N/A'}`)
    console.log(`  Start Time: ${session.start_time}`)
    console.log(`  Updated: ${session.updated_time}`)
    console.log(`  Context: ${session.ctx}`)

    if (session.framed_ip_address) {
      console.log('\n' + '='.repeat(50))
      console.log(`🎯 ROUTER PUBLIC IP: ${session.framed_ip_address}`)
      console.log('='.repeat(50))
      console.log(`\nTo test Winbox connectivity:`)
      console.log(`  nc -zv ${session.framed_ip_address} 8291`)
      console.log(`\nWinbox connection:`)
      console.log(`  winbox://${session.framed_ip_address}`)
    }
  }
}

// Main
const username = process.argv[2] || 'CT-UNJ-015@circletel.co.za'
findRouterSession(username).catch(console.error)
