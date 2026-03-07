#!/usr/bin/env npx tsx
/**
 * List Interstellio Subscribers
 *
 * Usage: npx tsx scripts/list-interstellio-subscribers.ts [search]
 */

import { config } from 'dotenv'
config({ path: '.env.production.local' })
config({ path: '.env.local' })

import { getInterstellioClient } from '../lib/interstellio/client'

async function listSubscribers(search?: string) {
  const client = getInterstellioClient()

  console.log('\n📋 Listing Interstellio subscribers...\n')

  // Get total count first
  const total = await client.getTotalSubscriberCount()
  console.log(`Total subscribers: ${total}\n`)

  // List subscribers (paginated)
  const params: Record<string, unknown> = { l: 50 }
  if (search) {
    params.username = search
  }

  const result = await client.listSubscribers(params)

  if (!result.payload || result.payload.length === 0) {
    console.log('No subscribers found')
    return
  }

  console.log(`Found ${result.payload.length} subscribers (page ${result.metadata.page}/${result.metadata.pages}):\n`)

  for (const sub of result.payload) {
    const status = sub.enabled ? '✅' : '❌'
    const lastSeen = sub.last_seen ? new Date(sub.last_seen).toLocaleDateString() : 'Never'
    console.log(`${status} ${sub.username.padEnd(40)} | ${sub.name || 'N/A'.padEnd(30)} | Last: ${lastSeen}`)
  }

  // Look for UNJ or Unjani patterns
  if (!search) {
    console.log('\n\n🔍 Searching for UNJ/Unjani patterns...\n')
    const unjani = result.payload.filter(
      (s) =>
        s.username.toLowerCase().includes('unj') ||
        s.username.toLowerCase().includes('unjani') ||
        (s.name && s.name.toLowerCase().includes('unjani'))
    )

    if (unjani.length > 0) {
      console.log('Found Unjani-related subscribers:')
      for (const sub of unjani) {
        console.log(`  - ${sub.username} (${sub.name || 'no name'})`)
      }
    } else {
      console.log('No Unjani-related subscribers found in first page')
    }
  }
}

const search = process.argv[2]
listSubscribers(search).catch(console.error)
