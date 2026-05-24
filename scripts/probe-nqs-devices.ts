/**
 * Probe NQS v1 devices endpoint — the working alternative to broken TMQ search.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/probe-nqs-devices.ts
 */
import { getSessionCookies } from '../lib/tarana/auth';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';
const MTN_OPERATOR_ID = 219;

const TARANA_BASE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.tcs.taranawireless.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};

async function probe(label: string, url: string) {
  const cookies = await getSessionCookies();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PROBE: ${label}`);
  console.log(`GET ${url}`);
  console.log('='.repeat(60));

  const response = await fetch(`${TARANA_API_BASE}${url}`, {
    headers: { ...TARANA_BASE_HEADERS, 'Cookie': cookies },
  });

  console.log(`Status: ${response.status}`);
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    const items = json.data?.items || json.data || json.items || [];
    const total = json.data?.totalItems ?? json.data?.total ?? json.totalItems ?? '?';
    console.log(`Items: ${Array.isArray(items) ? items.length : 'not array'}, Total: ${total}`);
    if (Array.isArray(items) && items[0]) {
      console.log(`First item keys: ${Object.keys(items[0]).join(', ')}`);
      console.log(`First item (1000 chars): ${JSON.stringify(items[0], null, 2).slice(0, 1000)}`);
    }
    // Show pagination info
    if (json.data?.pagination) console.log(`Pagination: ${JSON.stringify(json.data.pagination)}`);
    if (json.data?.page !== undefined) console.log(`Page info: page=${json.data.page}, size=${json.data.size}, totalItems=${json.data.totalItems}`);
    // Show raw structure keys
    console.log(`Top-level keys: ${Object.keys(json).join(', ')}`);
    if (json.data && typeof json.data === 'object') console.log(`data keys: ${Object.keys(json.data).join(', ')}`);
  } catch {
    console.log(`Raw (500 chars): ${text.slice(0, 500)}`);
  }
}

async function main() {
  console.log('Authenticating...');
  await getSessionCookies();
  console.log('OK\n');

  // BN devices - small page
  await probe('BN devices (limit=5)', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN&limit=5`);

  // BN devices - check total count
  await probe('BN devices (limit=1)', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN&limit=1`);

  // RN devices - see if we can list them
  await probe('RN devices (limit=5)', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=RN&limit=5`);

  // Pagination - offset
  await probe('BN devices page 2 (offset=5,limit=5)', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN&limit=5&offset=5`);

  // Pagination - page-based
  await probe('BN devices page=1,size=5', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN&page=1&size=5`);

  // All devices (no type filter) - to see total fleet
  await probe('All devices (limit=3)', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?limit=3`);

  // Devices per sector (we know sectorId 13942 exists from first probe)
  await probe('Devices for sector 13942', `/api/tni/v2/sectors/13942/devices`);
  await probe('RN devices for sector 13942', `/api/tni/v2/sectors/13942/devices?type=RN`);

  // NQS v1 device count endpoint?
  await probe('NQS device count', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices/count`);

  // NQS with connected filter
  await probe('BN connected only', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN&connected=true&limit=3`);

  console.log('\n\nDone.');
}

main().catch(console.error);
