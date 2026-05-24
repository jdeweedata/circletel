/**
 * Probe TMQ v2 endpoints to discover request/response format.
 * Run: set -a && source .env.local && set +a && npx tsx scripts/probe-tmq-v2.ts
 */
import { getSessionCookies } from '../lib/tarana/auth';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';
const MTN_OPERATOR_ID = 219;
const SA_REGION_IDS = [1073, 1071];

const TARANA_BASE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.tcs.taranawireless.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};

async function probe(label: string, endpoint: string, method: string, body?: any) {
  const cookies = await getSessionCookies();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PROBE: ${label}`);
  console.log(`${method} ${endpoint}`);
  if (body) console.log(`Body: ${JSON.stringify(body, null, 2).slice(0, 500)}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${TARANA_API_BASE}${endpoint}`, {
      method,
      headers: {
        ...TARANA_BASE_HEADERS,
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2).slice(0, 300)}`);

    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log(`Response (first 2000 chars): ${JSON.stringify(json, null, 2).slice(0, 2000)}`);
      if (json.radios) console.log(`\nRadio count: ${json.radios.length}`);
      if (json.totalCount !== undefined) console.log(`Total count: ${json.totalCount}`);
      if (json.data) console.log(`Data count: ${Array.isArray(json.data) ? json.data.length : 'not array'}`);
      // Show first radio shape if present
      const firstRadio = json.radios?.[0] || json.data?.[0];
      if (firstRadio) {
        console.log(`\nFirst item keys: ${Object.keys(firstRadio).join(', ')}`);
        console.log(`First item: ${JSON.stringify(firstRadio, null, 2).slice(0, 1000)}`);
      }
    } catch {
      console.log(`Raw text (first 500 chars): ${text.slice(0, 500)}`);
    }
  } catch (error) {
    console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  console.log('Authenticating with Tarana portal...');
  await getSessionCookies();
  console.log('Authenticated.\n');

  // V1 query format (for reference — this is what's broken)
  const v1Body = {
    query: {
      deviceType: 'BN',
      pagination: { offset: 0, limit: 10 },
      sort: [{ field: 'deviceId', direction: 'ASC' }],
      conditions: [{
        logicalOperator: 'AND',
        conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
      }],
    },
  };

  // 1. Confirm v1 is still broken
  await probe('TMQ v1 search (expected broken)', '/api/tmq/v1/radios/search', 'POST', v1Body);

  // 2. Try v2 search with same body format
  await probe('TMQ v2 search (v1 body format)', '/api/tmq/v2/radios/search', 'POST', v1Body);

  // 3. Try v2 search with adapted body (no wrapper)
  const v2BodyFlat = {
    deviceType: 'BN',
    pagination: { offset: 0, limit: 10 },
    sort: [{ field: 'deviceId', direction: 'ASC' }],
    conditions: [{
      logicalOperator: 'AND',
      conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
    }],
  };
  await probe('TMQ v2 search (flat body)', '/api/tmq/v2/radios/search', 'POST', v2BodyFlat);

  // 4. Try v2 with operator ID in path
  await probe('TMQ v2 operator search', `/api/tmq/v2/operators/${MTN_OPERATOR_ID}/radios/search`, 'POST', v1Body);

  // 5. Try v2 count endpoint
  const countBody = {
    query: {
      conditions: [{
        logicalOperator: 'AND',
        conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
      }],
    },
  };
  await probe('TMQ v2 count', '/api/tmq/v2/radios/count', 'POST', countBody);

  // 6. Try v5 count (confirmed working from earlier session)
  await probe('TMQ v5 count', '/api/tmq/v5/radios/count', 'POST', countBody);

  // 7. Try TMQ v2 alarm distribution (confirmed working from portal inspection)
  const alarmBody = {
    query: {
      conditions: [{
        logicalOperator: 'AND',
        conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
      }],
    },
  };
  await probe('TMQ v2 alarm distribution', '/api/tmq/v2/radios/alarm/distribution', 'POST', alarmBody);

  // 8. Try NQS v1 devices listing (alternative approach)
  await probe('NQS v1 devices list', `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/devices?type=BN&limit=10`, 'GET');

  // 9. Try TNI v2 hierarchy (to get sites, then devices per site)
  await probe('TNI v2 network hierarchy', `/api/tni/v2/operators/${MTN_OPERATOR_ID}/network-hierarchy`, 'GET');

  // 10. Try different TMQ versions
  for (const ver of ['v3', 'v4', 'v5']) {
    await probe(`TMQ ${ver} search`, `/api/tmq/${ver}/radios/search`, 'POST', v1Body);
  }

  console.log('\n\nDone. Review output to find working v2 endpoint and format.');
}

main().catch(console.error);
