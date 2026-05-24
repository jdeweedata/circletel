/**
 * Fetch full base station details directly from TCS Portal NQS v1 API
 *
 * Uses NQS v1 (not TMQ v1 which returns 500).
 * NQS pagination: fixed 10 items/page, only `offset` works.
 * RNs are retailer-scoped (~9 visible to CircleTel retailer 221).
 *
 * Usage: set -a && source .env.local && set +a && npx tsx scripts/tarana/fetch-base-station-details.ts
 */

import { authenticateTarana, getSessionCookies } from '../../lib/tarana/auth';
import * as fs from 'fs';
import * as path from 'path';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';
const MTN_OPERATOR_ID = 219;

const TARANA_BASE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.tcs.taranawireless.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};

interface NqsDevice {
  serialNumber: string;
  deviceType: string;
  connected: boolean;
  sectorId?: number;
  ancestry: {
    region?: { id?: number; name?: string };
    market?: { id?: number; name?: string };
    site?: { id?: number; name?: string };
    cell?: { id?: number; name?: string };
    cellDetails?: { name?: string; id?: number };
    sector?: { id?: number };
    sectorDetails?: { name?: string; id?: number };
  };
  installParams?: {
    latitude?: number;
    longitude?: number;
    height?: number;
    azimuth?: number;
  };
  losRange?: number;
  band?: string;
  linkState?: string;
  ip?: string;
  softwareVersion?: string;
  modelName?: string;
  uptimeSeconds?: number;
  reachable?: string;
}

async function nqsFetch(endpoint: string): Promise<any> {
  const cookies = await getSessionCookies();
  const response = await fetch(`${TARANA_API_BASE}${endpoint}`, {
    headers: {
      ...TARANA_BASE_HEADERS,
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NQS ${response.status}: ${error}`);
  }

  return response.json();
}

async function fetchAllDevices(type: 'BN' | 'RN'): Promise<NqsDevice[]> {
  const all: NqsDevice[] = [];
  let offset = 0;
  const pageSize = 10; // NQS fixed page size

  while (true) {
    const raw = await nqsFetch(
      `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=${type}&offset=${offset}`
    );

    const wrapper = raw.data ?? raw;
    const devices: any[] = Array.isArray(wrapper) ? wrapper : (wrapper.items ?? wrapper.devices ?? []);
    if (devices.length === 0) break;

    for (const d of devices) {
      // NQS v1 response has flat structure with sectorId, not nested ancestry
      // We need to fetch ancestry separately or use the hierarchy endpoint
      all.push({
        serialNumber: d.serialNumber ?? '',
        deviceType: d.type ?? d.deviceType ?? type,
        connected: d.connected === true,
        ancestry: {
          region: d.ancestry?.region ?? {},
          market: d.ancestry?.market ?? {},
          site: d.ancestry?.site ?? {},
          cell: d.ancestry?.cell ?? {},
          cellDetails: d.ancestry?.cellDetails ?? {},
          sector: d.ancestry?.sector ?? { id: d.sectorId },
          sectorDetails: d.ancestry?.sectorDetails ?? {},
        },
        installParams: d.installParams ?? {},
        losRange: d.losRange ?? undefined,
        band: d.band ?? undefined,
        linkState: d.linkState ?? undefined,
        // Extra fields from NQS
        sectorId: d.sectorId,
        ip: d.ip,
        softwareVersion: d.softwareVersion,
        modelName: d.modelName,
        uptimeSeconds: d.uptimeSeconds,
        reachable: d.reachable,
      });
    }

    offset += devices.length;

    if (devices.length < pageSize) break;

    // Rate limit: 100ms between requests
    await new Promise(r => setTimeout(r, 100));

    // Progress every 100 devices
    if (offset % 100 === 0) {
      process.stdout.write(`  ... ${offset} ${type}s fetched\r`);
    }
  }

  return all;
}

interface HierarchyLookup {
  sectorId: number;
  sectorName: string;
  cellId: number;
  cellName: string;
  siteId: number;
  siteName: string;
  marketId: number;
  marketName: string;
  regionId: number;
  regionName: string;
}

async function fetchHierarchy(): Promise<Map<number, HierarchyLookup>> {
  const raw = await nqsFetch(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/network-hierarchy`);
  const data = raw.data ?? raw;
  const lookup = new Map<number, HierarchyLookup>();

  const regions = data.regions ?? [];
  for (const region of regions) {
    const markets = region.markets ?? [];
    for (const market of markets) {
      const sites = market.sites ?? [];
      for (const site of sites) {
        const cells = site.cells ?? [];
        for (const cell of cells) {
          const sectors = cell.sectors ?? [];
          for (const sector of sectors) {
            lookup.set(sector.id, {
              sectorId: sector.id,
              sectorName: sector.name ?? '',
              cellId: cell.id,
              cellName: cell.name ?? '',
              siteId: site.id,
              siteName: site.name ?? '',
              marketId: market.id,
              marketName: market.name ?? '',
              regionId: region.id,
              regionName: region.name ?? '',
            });
          }
        }
      }
    }
  }

  return lookup;
}

async function main() {
  console.log('=== TCS Portal: Base Station Detail Fetch (NQS v1) ===\n');

  // Step 1: Authenticate
  console.log('[1/5] Authenticating with TCS Portal...');
  try {
    await authenticateTarana();
    console.log('  ✓ Authenticated\n');
  } catch (error) {
    console.error('  ✗ Auth failed:', error instanceof Error ? error.message : String(error));
    console.error('  Check TARANA_USERNAME and TARANA_PASSWORD in .env.local');
    process.exit(1);
  }

  // Step 2: Fetch network hierarchy (sectorId → site/market/region names)
  console.log('[2/5] Fetching network hierarchy...');
  const hierarchy = await fetchHierarchy();
  console.log(`  ✓ ${hierarchy.size} sectors mapped\n`);

  // Step 3: Fetch all BNs
  console.log('[3/5] Fetching all Base Nodes (BN) via NQS v1...');
  console.log('  (10 per page, this will take a few minutes for 700+ stations)');
  const startBN = Date.now();
  const baseNodes = await fetchAllDevices('BN');
  console.log(`  ✓ ${baseNodes.length} BNs fetched in ${((Date.now() - startBN) / 1000).toFixed(1)}s\n`);

  // Enrich BNs with hierarchy data
  let enriched = 0;
  for (const bn of baseNodes) {
    if (bn.sectorId) {
      const h = hierarchy.get(bn.sectorId);
      if (h) {
        bn.ancestry = {
          region: { id: h.regionId, name: h.regionName },
          market: { id: h.marketId, name: h.marketName },
          site: { id: h.siteId, name: h.siteName },
          cell: { id: h.cellId, name: h.cellName },
          cellDetails: { id: h.cellId, name: h.cellName },
          sector: { id: h.sectorId },
          sectorDetails: { id: h.sectorId, name: h.sectorName },
        };
        enriched++;
      }
    }
  }
  console.log(`  ✓ ${enriched}/${baseNodes.length} BNs enriched with hierarchy data\n`);

  // Step 4: Fetch all RNs (retailer-scoped, expect ~9)
  console.log('[4/5] Fetching all Remote Nodes (RN) via NQS v1...');
  console.log('  (retailer-scoped: only CircleTel RNs visible)');
  const startRN = Date.now();
  const remoteNodes = await fetchAllDevices('RN');
  console.log(`  ✓ ${remoteNodes.length} RNs fetched in ${((Date.now() - startRN) / 1000).toFixed(1)}s\n`);

  // Enrich RNs with hierarchy data
  for (const rn of remoteNodes) {
    if (rn.sectorId) {
      const h = hierarchy.get(rn.sectorId);
      if (h) {
        rn.ancestry = {
          region: { id: h.regionId, name: h.regionName },
          market: { id: h.marketId, name: h.marketName },
          site: { id: h.siteId, name: h.siteName },
          cell: { id: h.cellId, name: h.cellName },
          cellDetails: { id: h.cellId, name: h.cellName },
          sector: { id: h.sectorId },
          sectorDetails: { id: h.sectorId, name: h.sectorName },
        };
      }
    }
  }

  // Step 5: Build report
  console.log('[5/5] Building report...\n');

  // Map RNs to their BN site
  const rnsBySiteId = new Map<number, { connected: number; disconnected: number; total: number }>();
  for (const rn of remoteNodes) {
    const siteId = rn.ancestry.site?.id;
    if (siteId) {
      const existing = rnsBySiteId.get(siteId) || { connected: 0, disconnected: 0, total: 0 };
      existing.total++;
      if (rn.connected) {
        existing.connected++;
      } else {
        existing.disconnected++;
      }
      rnsBySiteId.set(siteId, existing);
    }
  }

  // Build station reports
  interface StationReport {
    siteName: string;
    serialNumber: string;
    market: string;
    region: string;
    lat: number;
    lng: number;
    height?: number;
    azimuth?: number;
    band?: string;
    connected: boolean;
    siteId?: number;
    sectorName?: string;
    rnConnected: number;
    rnDisconnected: number;
    rnTotal: number;
  }

  const stations: StationReport[] = baseNodes.map(bn => {
    const siteId = bn.ancestry.site?.id;
    const rnData = siteId ? rnsBySiteId.get(siteId) : undefined;

    return {
      siteName: bn.ancestry.site?.name || 'Unknown',
      serialNumber: bn.serialNumber,
      market: bn.ancestry.market?.name || 'Unknown',
      region: bn.ancestry.region?.name || 'Unknown',
      lat: bn.installParams?.latitude || 0,
      lng: bn.installParams?.longitude || 0,
      height: bn.installParams?.height,
      azimuth: bn.installParams?.azimuth,
      band: bn.band,
      connected: bn.connected,
      siteId,
      sectorName: bn.ancestry.sectorDetails?.name || bn.ancestry.cellDetails?.name,
      rnConnected: rnData?.connected ?? 0,
      rnDisconnected: rnData?.disconnected ?? 0,
      rnTotal: rnData?.total ?? 0,
    };
  });

  // Sort by connected status then by RN count
  stations.sort((a, b) => {
    if (a.rnConnected !== b.rnConnected) return b.rnConnected - a.rnConnected;
    return (b.connected ? 1 : 0) - (a.connected ? 1 : 0);
  });

  // === REPORT ===
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           BASE STATION ANALYSIS REPORT (LIVE TCS)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const totalBNs = stations.length;
  const onlineBNs = stations.filter(s => s.connected).length;
  const offlineBNs = totalBNs - onlineBNs;
  const withRNs = stations.filter(s => s.rnTotal > 0).length;
  const zeroRN = stations.filter(s => s.rnTotal === 0).length;
  const totalConnectedRNs = remoteNodes.filter(r => r.connected).length;
  const totalRNs = remoteNodes.length;

  console.log('SUMMARY');
  console.log('─────────────────────────────────────');
  console.log(`  Total BN Stations:     ${totalBNs}`);
  console.log(`  BNs ONLINE:            ${onlineBNs} (${((onlineBNs / totalBNs) * 100).toFixed(1)}%)`);
  console.log(`  BNs OFFLINE:           ${offlineBNs} (${((offlineBNs / totalBNs) * 100).toFixed(1)}%)`);
  console.log(`  BNs with RNs:          ${withRNs}`);
  console.log(`  BNs with 0 RNs:        ${zeroRN} (${((zeroRN / totalBNs) * 100).toFixed(1)}%)`);
  console.log(`  Total RNs (visible):   ${totalRNs}`);
  console.log(`  Connected RNs:         ${totalConnectedRNs}`);
  console.log();

  // Market breakdown
  const byMarket = new Map<string, { total: number; online: number; withRN: number; rnCount: number }>();
  for (const s of stations) {
    const market = s.market;
    const existing = byMarket.get(market) || { total: 0, online: 0, withRN: 0, rnCount: 0 };
    existing.total++;
    if (s.connected) existing.online++;
    if (s.rnTotal > 0) existing.withRN++;
    existing.rnCount += s.rnTotal;
    byMarket.set(market, existing);
  }

  console.log('BY MARKET');
  console.log('──────────────────────────────────────────────────────────────');
  console.log('  Market                  Total  Online  With-RN  RN-Count');
  console.log('  ─────────────────────── ────── ─────── ──────── ────────');
  const marketEntries = [...byMarket.entries()].sort((a, b) => b[1].total - a[1].total);
  for (const [market, data] of marketEntries) {
    console.log(`  ${market.padEnd(25)} ${String(data.total).padStart(4)}   ${String(data.online).padStart(5)}   ${String(data.withRN).padStart(6)}   ${String(data.rnCount).padStart(6)}`);
  }
  console.log();

  // Stations with RNs
  if (withRNs > 0) {
    console.log(`STATIONS WITH RN CONNECTIONS (${withRNs})`);
    console.log('─────────────────────────────────────────────────────────────────────────');
    console.log('  Site Name                        Market              RN-Conn  RN-Tot  BN-Status');
    console.log('  ──────────────────────────────── ──────────────────── ──────── ─────── ─────────');
    for (const s of stations.filter(s => s.rnTotal > 0)) {
      const status = s.connected ? 'ONLINE' : 'OFFLINE';
      console.log(`  ${s.siteName.padEnd(34).slice(0, 34)} ${s.market.padEnd(20).slice(0, 20)} ${String(s.rnConnected).padStart(6)}   ${String(s.rnTotal).padStart(5)}   ${status}`);
    }
    console.log();
  }

  // RN details
  if (remoteNodes.length > 0) {
    console.log(`ALL REMOTE NODES (${remoteNodes.length} visible to CircleTel)`);
    console.log('─────────────────────────────────────────────────────────────────────────');
    console.log('  Serial             Site                    Market         Connected  LOS(m)');
    console.log('  ──────────────── ─────────────────────── ────────────── ────────── ────────');
    for (const rn of remoteNodes) {
      const siteName = rn.ancestry.site?.name || 'Unknown';
      const market = rn.ancestry.market?.name || 'Unknown';
      const connected = rn.connected ? 'YES' : 'NO';
      const los = rn.losRange ? String(Math.round(rn.losRange)) : '-';
      console.log(`  ${rn.serialNumber.padEnd(18).slice(0, 18)} ${siteName.padEnd(23).slice(0, 23)} ${market.padEnd(14).slice(0, 14)} ${connected.padStart(8)}   ${los.padStart(6)}`);
    }
    console.log();
  }

  // Online BNs with zero RNs — geo-campaign potential
  const onlineZeroRN = stations.filter(s => s.connected && s.rnTotal === 0 && s.lat !== 0);
  console.log(`ONLINE BNs WITH ZERO CONNECTIONS (${onlineZeroRN.length} — potential geo-campaign targets)`);
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log('  Site Name                        Market              Lat          Lng');
  console.log('  ──────────────────────────────── ──────────────────── ──────────── ────────────');
  for (const s of onlineZeroRN.slice(0, 30)) {
    console.log(`  ${s.siteName.padEnd(34).slice(0, 34)} ${s.market.padEnd(20).slice(0, 20)} ${s.lat.toFixed(4).padStart(10)}   ${s.lng.toFixed(4).padStart(10)}`);
  }
  if (onlineZeroRN.length > 30) {
    console.log(`  ... and ${onlineZeroRN.length - 30} more`);
  }
  console.log();

  // Save JSON
  const outputPath = path.join(__dirname, '../../data/exports/base-station-details-' + new Date().toISOString().split('T')[0] + '.json');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const exportData = {
    fetchedAt: new Date().toISOString(),
    note: 'RN data is retailer-scoped (CircleTel retailer 221 only). BN data is operator-wide (MTN 219).',
    summary: {
      totalBNs,
      onlineBNs,
      offlineBNs,
      totalRNsVisible: totalRNs,
      connectedRNs: totalConnectedRNs,
      stationsWithRNs: withRNs,
      stationsZeroRN: zeroRN,
    },
    markets: Object.fromEntries(marketEntries),
    stations,
    remoteNodes: remoteNodes.map(rn => ({
      serialNumber: rn.serialNumber,
      connected: rn.connected,
      siteName: rn.ancestry.site?.name,
      market: rn.ancestry.market?.name,
      region: rn.ancestry.region?.name,
      losRange: rn.losRange,
      lat: rn.installParams?.latitude,
      lng: rn.installParams?.longitude,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`Full data saved to: ${outputPath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
