/**
 * Get exact counts and pagination info from NQS v1 devices endpoint.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/probe-nqs-counts.ts
 */
import { getSessionCookies } from '../lib/tarana/auth';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';
const MTN_OPERATOR_ID = 219;
const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.tcs.taranawireless.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};

async function fetchJson(url: string) {
  const cookies = await getSessionCookies();
  const res = await fetch(`${TARANA_API_BASE}${url}`, {
    headers: { ...HEADERS, 'Cookie': cookies },
  });
  return res.json();
}

async function main() {
  await getSessionCookies();

  // 1. BN count and pagination
  const bn = await fetchJson(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN`);
  console.log('BN devices:');
  console.log(`  items: ${bn.data?.items?.length}`);
  console.log(`  count: ${bn.data?.count}`);
  console.log(`  offset: ${bn.data?.offset}`);
  console.log(`  totalCount: ${bn.data?.totalCount}`);

  // 2. RN count
  const rn = await fetchJson(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=RN`);
  console.log('\nRN devices:');
  console.log(`  items: ${rn.data?.items?.length}`);
  console.log(`  count: ${rn.data?.count}`);
  console.log(`  offset: ${rn.data?.offset}`);
  console.log(`  totalCount: ${rn.data?.totalCount}`);

  // 3. All devices
  const all = await fetchJson(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices`);
  console.log('\nAll devices:');
  console.log(`  items: ${all.data?.items?.length}`);
  console.log(`  count: ${all.data?.count}`);
  console.log(`  offset: ${all.data?.offset}`);
  console.log(`  totalCount: ${all.data?.totalCount}`);

  // 4. Show first BN device's ancestry and key fields
  const firstBn = bn.data?.items?.[0];
  if (firstBn) {
    console.log('\nFirst BN device sample:');
    console.log(`  serialNumber: ${firstBn.serialNumber}`);
    console.log(`  hostName: ${firstBn.hostName}`);
    console.log(`  type: ${firstBn.type}`);
    console.log(`  sectorId: ${firstBn.sectorId}`);
    console.log(`  sectorName: ${firstBn.sectorName}`);
    console.log(`  connected: ${firstBn.connected}`);
    console.log(`  band: ${firstBn.band}`);
    console.log(`  installParams: ${JSON.stringify(firstBn.installParams)}`);
    console.log(`  ancestry: ${JSON.stringify(firstBn.ancestry)}`);
  }

  // 5. Show first RN device's ancestry
  const firstRn = rn.data?.items?.[0];
  if (firstRn) {
    console.log('\nFirst RN device sample:');
    console.log(`  serialNumber: ${firstRn.serialNumber}`);
    console.log(`  hostName: ${firstRn.hostName}`);
    console.log(`  type: ${firstRn.type}`);
    console.log(`  sectorId: ${firstRn.sectorId}`);
    console.log(`  sectorName: ${firstRn.sectorName}`);
    console.log(`  connected: ${firstRn.connected}`);
    console.log(`  band: ${firstRn.band}`);
    console.log(`  installParams: ${JSON.stringify(firstRn.installParams)}`);
    console.log(`  ancestry: ${JSON.stringify(firstRn.ancestry)}`);
  }

  // 6. Test hierarchy to get site/market/region info
  const hierarchy = await fetchJson(`/api/tni/v2/operators/${MTN_OPERATOR_ID}/network-hierarchy`);
  const regions = hierarchy.data?.regions || [];
  let totalSites = 0;
  let totalSectors = 0;
  for (const region of regions) {
    const markets = region.markets || [];
    for (const market of markets) {
      const sites = market.sites || [];
      totalSites += sites.length;
      for (const site of sites) {
        for (const cell of site.cells || []) {
          totalSectors += (cell.sectors || []).length;
        }
      }
    }
    console.log(`\nRegion: ${region.name} (id=${region.id})`);
    console.log(`  Markets: ${markets.map((m: any) => `${m.name}(${m.id})`).join(', ')}`);
    console.log(`  Sites: ${markets.reduce((acc: number, m: any) => acc + (m.sites?.length || 0), 0)}`);
  }
  console.log(`\nTotal sites: ${totalSites}, Total sectors: ${totalSectors}`);

  // 7. Test TNI v2 sector devices for a known sector with RNs
  // Use sector from hierarchy
  const firstRegion = regions[0];
  const firstMarket = firstRegion?.markets?.[0];
  const firstSite = firstMarket?.sites?.[0];
  const firstCell = firstSite?.cells?.[0];
  const firstSector = firstCell?.sectors?.[0];
  if (firstSector) {
    console.log(`\nTesting sector ${firstSector.name} (id=${firstSector.id}) for RN devices...`);
    const sectorDevices = await fetchJson(`/api/tni/v2/sectors/${firstSector.id}/devices`);
    const items = sectorDevices.data?.items || sectorDevices.data || [];
    console.log(`  Devices in sector: ${Array.isArray(items) ? items.length : 'N/A'}`);
    if (Array.isArray(items)) {
      for (const d of items) {
        console.log(`    ${d.type} ${d.serialNumber} connected=${d.connected}`);
      }
    }

    // Also try RN-only
    const sectorRns = await fetchJson(`/api/tni/v2/sectors/${firstSector.id}/devices?type=RN`);
    const rnItems = sectorRns.data?.items || sectorRns.data || [];
    console.log(`  RN devices in sector: ${Array.isArray(rnItems) ? rnItems.length : 'N/A'}`);
  }
}

main().catch(console.error);
