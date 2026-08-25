#!/usr/bin/env npx tsx
/**
 * Extract Omada site/device data for Delphius + NewGenMC.
 *
 * Usage:
 *   set -a && source .env.local && source .env.production.local && set +a
 *   npx tsx scripts/extract-omada-sites.ts
 *
 * Requires OMADA_BASE_URL, OMADA_ID, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET.
 * If unset, writes manual snapshot fallback from inventory JSON.
 */

import { config } from 'dotenv'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { getOmadaClient } from '../lib/omada'

config({ path: '.env.production.local' })
config({ path: '.env.local' })

const TARGET_SITES = ['Delphius', 'NewGenMC']
const OUT_DIR = join(process.cwd(), '.docs', 'ops')

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 10)
  const outPath = join(OUT_DIR, `${stamp}-omada-extract.json`)

  const client = getOmadaClient()
  if (!client.isConfigured()) {
    const inventoryPath = join(OUT_DIR, '2026-08-02-dual-site-service-inventory.json')
    const fallback = existsSync(inventoryPath)
      ? JSON.parse(readFileSync(inventoryPath, 'utf8'))
      : { error: 'Omada not configured and inventory JSON missing' }

    const payload = {
      status: 'omada_api_not_configured',
      tplinkIdLoginPresent: client.hasTplinkIdLogin(),
      message:
        client.hasTplinkIdLogin()
          ? 'OMADA_USERNAME/PASSWORD are set, but Open API still needs OMADA_ID, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET from Omada Cloud → Settings → Platform Integration → Open API (Client Credentials).'
          : 'Set OMADA_BASE_URL, OMADA_ID, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET after creating Open API app (Client Credentials) in Omada Cloud Settings → Platform Integration → Open API.',
      docs: 'https://omada-northbound-docs.tplinkcloud.com/#/versions/default-access-guard',
      manualSnapshot: {
        sites: (fallback.sites || []).map((s: { key: string; omada?: unknown }) => ({
          key: s.key,
          omada: s.omada,
        })),
      },
    }
    writeFileSync(outPath, JSON.stringify(payload, null, 2))
    console.log('Omada API not configured — wrote manual snapshot fallback to', outPath)
    process.exitCode = 2
    return
  }

  const sites = await client.findSitesByName(TARGET_SITES)
  const allSites = sites.length ? sites : await client.listSites()
  const selected = allSites.filter((s) =>
    TARGET_SITES.some((n) => n.toLowerCase() === (s.name || '').toLowerCase())
  )

  const dump: Record<string, unknown> = {
    status: 'ok',
    omadaId: client.omadaId,
    extractedAt: new Date().toISOString(),
    sites: [] as unknown[],
  }

  for (const site of selected) {
    const siteId = String(site.siteId || site.id || '')
    const devices = siteId ? await client.listDevices(siteId) : []
    let clients: unknown[] = []
    try {
      clients = siteId ? await client.listClients(siteId) : []
    } catch (e) {
      clients = [{ error: e instanceof Error ? e.message : String(e) }]
    }
    ;(dump.sites as unknown[]).push({ site, devices, clients })
  }

  if (selected.length === 0) {
    dump.warning = `No sites named ${TARGET_SITES.join(', ')}. Listed all site names.`
    dump.allSiteNames = allSites.map((s) => s.name)
  }

  writeFileSync(outPath, JSON.stringify(dump, null, 2))
  console.log(`Wrote ${outPath} (${selected.length} sites)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
