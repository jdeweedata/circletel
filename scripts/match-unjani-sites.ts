#!/usr/bin/env npx tsx
/**
 * Match Unjani Sites with Interstellio PPPoE, Ruijie, and Hardware Data
 *
 * Sources:
 * - Schedule: .docs/Copy of Unjani clinic Schedule Progress report (002).csv
 * - Interstellio: .docs/export.csv
 * - MTN IPs: .docs/Circle Tel Sa ip.xlsx (parsed inline)
 */

import { config } from 'dotenv'
config({ path: '.env.production.local' })
config({ path: '.env.local' })

import * as fs from 'fs'
import { getInterstellioClient } from '../lib/interstellio/client'

// MTN Router Static IPs from Excel (manually extracted)
const mtnRouterIPs = [
  { sim: '11349665961', msisdn: '27837031410', imei: '862378061527104', ip: '41.119.15.199' },
  { sim: '11349665979', msisdn: '27837034777', imei: '862378060745004', ip: '41.119.16.31' },
  { sim: '11349665987', msisdn: '27837008121', imei: '862378061530355', ip: '41.119.15.149' },
  { sim: '11349665995', msisdn: '27837025476', imei: '862378061530132', ip: '41.119.15.191' },
  { sim: '11349666001', msisdn: '27837028432', imei: '862378060839856', ip: '41.119.15.193' },
  { sim: '11349666019', msisdn: '27837009251', imei: '862378061518947', ip: '41.119.15.151' },
  { sim: '11349666027', msisdn: '27837011465', imei: '862378060760458', ip: '41.119.15.153' },
  { sim: '11349666035', msisdn: '27837018380', imei: '862378060817050', ip: '41.119.15.167' },
  { sim: '11349666043', msisdn: '27837015495', imei: '862378060803159', ip: '41.119.15.166' },
  { sim: '11349666050', msisdn: '27837030586', imei: '862378061405509', ip: '41.119.15.194' },
]

interface ScheduleSite {
  siteName: string
  province: string
  area: string
  technology: string
  address: string
  pppoeUsername: string
  password: string
  routerSN: string
  cpeSN: string
  apSN: string
  status: string
}

interface InterstellioSub {
  username: string
  name: string
  id: string
  lastSeen: string | null
  staticIp: string | null
  enabled: boolean
}

async function parseScheduleCSV(): Promise<ScheduleSite[]> {
  const content = fs.readFileSync('.docs/Copy of Unjani clinic Schedule Progress report (002).csv', 'utf-8')
  const lines = content.split('\n').slice(1) // Skip header
  const sites: ScheduleSite[] = []

  for (const line of lines) {
    const parts = line.split(';')
    if (parts.length < 10 || !parts[0].trim()) continue

    const siteName = parts[0].trim()
    if (!siteName || siteName.startsWith('#')) continue

    sites.push({
      siteName,
      province: parts[1]?.trim() || '',
      area: parts[2]?.trim() || '',
      technology: parts[3]?.trim() || '',
      address: parts[9]?.trim() || '',
      pppoeUsername: parts[11]?.trim() || '',
      password: parts[12]?.trim() || '',
      routerSN: parts[13]?.trim() || '',
      cpeSN: parts[14]?.trim() || '',
      apSN: parts[15]?.trim() || '',
      status: parts[16]?.trim() || '',
    })
  }

  return sites
}

function parseInterstellioCSV(): InterstellioSub[] {
  const content = fs.readFileSync('.docs/export.csv', 'utf-8')
  const lines = content.split('\n').slice(1) // Skip header
  const subs: InterstellioSub[] = []

  for (const line of lines) {
    // CSV with quotes - simple parse
    const match = line.match(/"([^"]*)"/g)
    if (!match || match.length < 35) continue

    const clean = (s: string) => s.replace(/"/g, '')

    subs.push({
      username: clean(match[34] || ''),
      name: clean(match[13] || ''),
      id: clean(match[7] || ''),
      lastSeen: clean(match[11] || '') || null,
      staticIp: clean(match[26] || '') || null,
      enabled: clean(match[4] || '') === 'True',
    })
  }

  return subs.filter(s => s.username)
}

async function main() {
  console.log('\n' + '='.repeat(100))
  console.log('UNJANI CLINIC SITE MATCHING REPORT')
  console.log('='.repeat(100))
  console.log(`Generated: ${new Date().toISOString()}\n`)

  const schedule = await parseScheduleCSV()
  const interstellio = parseInterstellioCSV()
  const client = getInterstellioClient()

  // Get live session data
  console.log('Fetching live session data from Interstellio...\n')

  const sessionMap = new Map<string, { ip: string; active: boolean }>()
  for (const sub of interstellio) {
    if (sub.username.startsWith('CT-UNJ-')) {
      try {
        const sessions = await client.listSessions(sub.id, { l: 1 })
        if (sessions.payload?.[0]) {
          sessionMap.set(sub.username, {
            ip: sessions.payload[0].framed_ip_address || 'N/A',
            active: true,
          })
        }
      } catch {
        // Session fetch failed
      }
    }
  }

  // Print summary table
  console.log('SITE SUMMARY')
  console.log('-'.repeat(100))
  console.log(
    'Site'.padEnd(25) +
    'Technology'.padEnd(15) +
    'PPPoE User'.padEnd(30) +
    'Interstellio'.padEnd(12) +
    'Session IP'.padEnd(18) +
    'Status'
  )
  console.log('-'.repeat(100))

  for (const site of schedule) {
    const inter = interstellio.find(i =>
      i.username.toLowerCase() === site.pppoeUsername.toLowerCase()
    )
    const session = sessionMap.get(site.pppoeUsername)

    const interStatus = inter ? (inter.lastSeen ? '✅ Active' : '⚠️ Never') : '❌ Missing'
    const sessionIp = session?.ip || (inter?.staticIp || '-')

    console.log(
      site.siteName.substring(0, 24).padEnd(25) +
      site.technology.substring(0, 14).padEnd(15) +
      site.pppoeUsername.padEnd(30) +
      interStatus.padEnd(12) +
      sessionIp.padEnd(18) +
      site.status
    )
  }

  // MTN Router IPs section
  console.log('\n\n' + '='.repeat(100))
  console.log('MTN ROUTER STATIC IPs (Tozed 4G LTE)')
  console.log('='.repeat(100))
  console.log('These are pre-assigned static IPs for MTN LTE/5G sites:\n')

  console.log(
    'SIM'.padEnd(15) +
    'MSISDN'.padEnd(15) +
    'Static IP'.padEnd(18) +
    'IMEI'
  )
  console.log('-'.repeat(70))

  for (const router of mtnRouterIPs) {
    console.log(
      router.sim.padEnd(15) +
      router.msisdn.padEnd(15) +
      router.ip.padEnd(18) +
      router.imei
    )
  }

  // 5G/LTE Sites that need MTN IPs
  console.log('\n\n' + '='.repeat(100))
  console.log('5G/LTE/FWA SITES (Need MTN Router Assignment)')
  console.log('='.repeat(100))
  console.log('These sites use MTN LTE/5G and need a router from the MTN IP list:\n')

  const lteSites = schedule.filter(s =>
    s.technology.includes('LTE') ||
    s.technology.includes('5G') ||
    s.technology.includes('FWA')
  )

  for (const site of lteSites) {
    const inter = interstellio.find(i =>
      i.username.toLowerCase() === site.pppoeUsername.toLowerCase()
    )
    console.log(`\n${site.siteName} (${site.province})`)
    console.log(`  Technology: ${site.technology}`)
    console.log(`  PPPoE: ${site.pppoeUsername}`)
    console.log(`  Interstellio: ${inter ? `Found (${inter.name})` : 'NOT PROVISIONED'}`)
    console.log(`  Static IP: ${inter?.staticIp || 'None assigned'}`)
    console.log(`  Status: ${site.status || 'Pending'}`)
  }

  // Missing from Interstellio
  console.log('\n\n' + '='.repeat(100))
  console.log('MISSING FROM INTERSTELLIO')
  console.log('='.repeat(100))
  console.log('These PPPoE accounts need to be created:\n')

  const missing = schedule.filter(site =>
    site.pppoeUsername &&
    !interstellio.find(i => i.username.toLowerCase() === site.pppoeUsername.toLowerCase())
  )

  if (missing.length === 0) {
    console.log('All sites are provisioned in Interstellio.')
  } else {
    for (const site of missing) {
      console.log(`  - ${site.pppoeUsername} (${site.siteName})`)
    }
  }

  // Jabulani specific
  console.log('\n\n' + '='.repeat(100))
  console.log('JABULANI SITE DETAILS (CT-UNJ-015)')
  console.log('='.repeat(100))

  const jabulani = schedule.find(s => s.siteName.includes('Jabulani'))
  const jabulaniInter = interstellio.find(i => i.username === 'CT-UNJ-015@circletel.co.za')

  if (jabulani) {
    console.log(`\nSite: ${jabulani.siteName}`)
    console.log(`Province: ${jabulani.province}`)
    console.log(`Area: ${jabulani.area}`)
    console.log(`Technology: ${jabulani.technology}`)
    console.log(`PPPoE Username: ${jabulani.pppoeUsername}`)
    console.log(`Password: ${jabulani.password}`)
    console.log(`Status: ${jabulani.status || 'Pending'}`)
    console.log(`\nInterstellio Status: ${jabulaniInter ? 'Provisioned' : 'NOT PROVISIONED - Needs creation'}`)
    console.log(`\nMTN Static IPs Available (assign one to Jabulani):`)
    for (const router of mtnRouterIPs) {
      console.log(`  ${router.ip} (SIM: ${router.sim}, MSISDN: 0${router.msisdn.slice(2)})`)
    }
  }
}

main().catch(console.error)
