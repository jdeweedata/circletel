/**
 * Probe for RN count data — check BN fields for connected RN counts,
 * and try alternative endpoints for operator-level RN visibility.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/probe-rn-counts.ts
 */
import { getSessionCookies } from '../lib/tarana/auth';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';
const MTN_OPERATOR_ID = 219;
const SA_REGION_IDS = [1073, 1071];
const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.tcs.taranawireless.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};

async function fetchJson(url: string, method = 'GET', body?: any) {
  const cookies = await getSessionCookies();
  const opts: any = {
    method,
    headers: { ...HEADERS, 'Content-Type': 'application/json', 'Cookie': cookies },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${TARANA_API_BASE}${url}`, opts);
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text.slice(0, 500) }; }
}

async function main() {
  await getSessionCookies();

  // 1. Check if BN devices have RN count fields
  console.log('=== BN device RN-related fields ===');
  const bn = await fetchJson(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN`);
  const firstBn = bn.data?.data?.items?.[0];
  if (firstBn) {
    const rnFields = Object.entries(firstBn).filter(([k]) =>
      k.toLowerCase().includes('rn') || k.toLowerCase().includes('count') ||
      k.toLowerCase().includes('connected') || k.toLowerCase().includes('client')
    );
    console.log('RN/count/connected-related fields on BN device:');
    for (const [k, v] of rnFields) {
      console.log(`  ${k}: ${JSON.stringify(v)}`);
    }
  }

  // 2. Try NQS v1 markets endpoint (seen in portal network tab)
  console.log('\n=== NQS v1 markets ===');
  const markets = await fetchJson(`/api/nqs/v1/markets`);
  console.log(`Status: ${markets.status}`);
  const mkData = markets.data?.data || markets.data;
  if (Array.isArray(mkData)) {
    for (const m of mkData.slice(0, 3)) {
      console.log(`  Market: ${JSON.stringify(m).slice(0, 200)}`);
    }
  } else {
    console.log(`  Shape: ${JSON.stringify(mkData).slice(0, 500)}`);
  }

  // 3. Try NQS v1 operator markets
  console.log('\n=== NQS v1 operator markets ===');
  const opMarkets = await fetchJson(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/markets`);
  console.log(`Status: ${opMarkets.status}`);
  console.log(`Data: ${JSON.stringify(opMarkets.data).slice(0, 500)}`);

  // 4. Try NQS v1 sectors with device counts
  console.log('\n=== NQS v1 sectors ===');
  const sectors = await fetchJson(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/sectors`);
  console.log(`Status: ${sectors.status}`);
  console.log(`Data (first 500): ${JSON.stringify(sectors.data).slice(0, 500)}`);

  // 5. Try TNI v2 sectors/{id}/stats or similar
  console.log('\n=== TNI v2 sector stats ===');
  const sectorId = firstBn?.sectorId || 13942;
  const sectorStats = await fetchJson(`/api/tni/v2/sectors/${sectorId}/stats`);
  console.log(`Status: ${sectorStats.status}`);
  console.log(`Data: ${JSON.stringify(sectorStats.data).slice(0, 500)}`);

  // 6. Try TNI v2 sector summary
  const sectorSummary = await fetchJson(`/api/tni/v2/sectors/${sectorId}/summary`);
  console.log(`\nSector summary status: ${sectorSummary.status}`);
  console.log(`Data: ${JSON.stringify(sectorSummary.data).slice(0, 500)}`);

  // 7. Try TMQ v5 count with corrected format
  console.log('\n=== TMQ v5 count (various formats) ===');

  // Format A: with filter wrapper
  const countA = await fetchJson('/api/tmq/v5/radios/count', 'POST', {
    filter: {
      conditions: [{
        logicalOperator: 'AND',
        conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
      }],
    },
  });
  console.log(`Format A (filter wrapper): ${countA.status} - ${JSON.stringify(countA.data).slice(0, 300)}`);

  // Format B: with deviceType
  const countB = await fetchJson('/api/tmq/v5/radios/count', 'POST', {
    query: {
      deviceType: 'RN',
      conditions: [{
        logicalOperator: 'AND',
        conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
      }],
    },
  });
  console.log(`Format B (query+deviceType): ${countB.status} - ${JSON.stringify(countB.data).slice(0, 300)}`);

  // Format C: minimal
  const countC = await fetchJson('/api/tmq/v5/radios/count', 'POST', {
    deviceType: 'BN',
    regionIds: SA_REGION_IDS,
  });
  console.log(`Format C (flat): ${countC.status} - ${JSON.stringify(countC.data).slice(0, 300)}`);

  // 8. Try TMQ v2 alarm distribution with proper filter format
  console.log('\n=== TMQ v2 alarm distribution (various formats) ===');
  const alarmA = await fetchJson('/api/tmq/v2/radios/alarm/distribution', 'POST', {
    filter: {
      conditions: [{
        logicalOperator: 'AND',
        conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
      }],
    },
  });
  console.log(`Alarm format A: ${alarmA.status} - ${JSON.stringify(alarmA.data).slice(0, 300)}`);

  const alarmB = await fetchJson('/api/tmq/v2/radios/alarm/distribution', 'POST', {
    query: {
      conditions: [{
        logicalOperator: 'AND',
        conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
      }],
    },
  });
  console.log(`Alarm format B: ${alarmB.status} - ${JSON.stringify(alarmB.data).slice(0, 300)}`);

  // 9. NQS v1 device by known serial (to see full RN detail at operator level)
  console.log('\n=== NQS v1 single device (known BN serial) ===');
  const device = await fetchJson(`/api/nqs/v1/devices/${firstBn?.serialNumber}`);
  console.log(`Status: ${device.status}`);
  // Look for connected RN count
  const devData = device.data?.data || device.data;
  if (devData) {
    const countFields = Object.entries(devData).filter(([k]) =>
      k.toLowerCase().includes('count') || k.toLowerCase().includes('rn') ||
      k.toLowerCase().includes('connected') || k.toLowerCase().includes('client')
    );
    console.log('Count/RN fields on device detail:');
    for (const [k, v] of countFields) {
      console.log(`  ${k}: ${JSON.stringify(v)}`);
    }
  }

  // 10. Try NQS v1 sites endpoint
  console.log('\n=== NQS v1 sites ===');
  const sites = await fetchJson(`/api/nqs/v1/operators/${MTN_OPERATOR_ID}/sites`);
  console.log(`Status: ${sites.status}`);
  console.log(`Data (first 500): ${JSON.stringify(sites.data).slice(0, 500)}`);
}

main().catch(console.error);
