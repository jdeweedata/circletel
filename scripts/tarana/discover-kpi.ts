/**
 * TCS KPI Field Discovery Script
 *
 * Probes multiple TCS API endpoints to discover which KPI fields are
 * accessible for RN links. Focuses on:
 *   - Path Loss (dB)
 *   - DL/UL SINR (dB)
 *   - Rx Signal per carrier (dBm)
 *   - DL/UL Rate (Mbps)
 *   - INR per carrier (dB)
 *   - Sensitivity Loss per carrier (dB)
 *   - DL/UL PER (%)
 *   - RF Distance (m)
 *   - Network Profile + Operational Bandwidth (BN)
 *
 * Run: npx tsx scripts/tarana/discover-kpi.ts [rn-serial] [bn-serial]
 *
 * Optional args: provide specific RN and BN serials for targeted probing.
 * Defaults to first live SA RN discovered.
 */

import { taranaFetch, searchRadios, getDeviceBySerial } from '../../lib/tarana/client';
import * as fs from 'fs';
import * as path from 'path';

const SA_REGION_IDS = [1073, 1071];

// =============================================================================
// CANDIDATE KPI FIELD PATHS
// These follow Tarana's documented field path convention used in outputSchema.
// Multiple aliases tried per field in case naming differs across API versions.
// =============================================================================

const KPI_FIELD_PATHS = [
  // Path Loss
  '/link/kpi/state/path-loss',
  '/rf/kpi/state/path-loss',
  '/link/state/path-loss',
  '/rf/state/path-loss',

  // DL / UL SINR
  '/link/kpi/state/dl-sinr',
  '/link/kpi/state/ul-sinr',
  '/link/state/dl-sinr',
  '/link/state/ul-sinr',
  '/rf/state/dl-sinr',
  '/rf/state/ul-sinr',

  // Rx Signal per carrier (RSSI)
  '/link/kpi/state/rx-signal-carrier-0',
  '/link/kpi/state/rx-signal-carrier-1',
  '/rf/carrier/0/state/rx-signal',
  '/rf/carrier/1/state/rx-signal',
  '/rf/state/rx-signal-carrier-0',
  '/rf/state/rx-signal-carrier-1',

  // DL / UL Rate
  '/link/kpi/state/dl-rate',
  '/link/kpi/state/ul-rate',
  '/link/state/dl-rate',
  '/link/state/ul-rate',
  '/throughput/state/dl-rate',
  '/throughput/state/ul-rate',

  // DL / UL Peak Rate
  '/link/kpi/state/dl-peak-rate',
  '/link/kpi/state/ul-peak-rate',

  // INR (Interference-to-Noise Ratio) per carrier
  '/link/kpi/state/inr-carrier-0',
  '/link/kpi/state/inr-carrier-1',
  '/rf/carrier/0/state/inr',
  '/rf/carrier/1/state/inr',
  '/rf/state/inr-carrier-0',
  '/rf/state/inr-max-carrier-0',

  // Sensitivity Loss per carrier
  '/link/kpi/state/sensitivity-loss-carrier-0',
  '/link/kpi/state/sensitivity-loss-carrier-1',
  '/rf/carrier/0/state/sensitivity-loss',
  '/rf/state/sensitivity-loss-carrier-0',

  // DL / UL PER (Packet Error Rate)
  '/link/kpi/state/dl-per',
  '/link/kpi/state/ul-per',
  '/link/state/dl-per',
  '/link/state/ul-per',

  // RF Distance (vs LoS Distance)
  '/link/kpi/state/rf-distance',
  '/link/state/rf-distance',
  '/rf/state/rf-distance',
  '/link/state/rf-range',

  // BN-specific: Network Profile, Operational Bandwidth
  '/network/state/profile',
  '/network/config/profile',
  '/system/state/network-profile',
  '/rf/state/operational-bandwidth',
  '/rf/config/bandwidth',
  '/system/state/bandwidth',
] as const;

// =============================================================================
// PROBE STRATEGIES
// =============================================================================

async function probe_1_nqs_full_device(rnSerial: string): Promise<Record<string, unknown>> {
  console.log('\n[Probe 1] NQS v1 full device response — checking raw fields...');
  try {
    const raw = await taranaFetch<Record<string, unknown>>(
      `/api/nqs/v1/devices/${encodeURIComponent(rnSerial)}`
    );
    const keys = flattenKeys(raw);
    console.log(`  Got ${keys.length} fields. KPI-relevant keys:`);
    const kpiKeys = keys.filter(k =>
      /sinr|path.?loss|rx.?signal|rssi|dl.?rate|ul.?rate|inr|sensitivity|per|rf.?dist|bandwidth|profile|throughput|mcs/i.test(k)
    );
    kpiKeys.forEach(k => console.log(`    ${k}: ${getNestedValue(raw, k)}`));
    if (kpiKeys.length === 0) console.log('  No KPI fields found in NQS v1 response.');
    return { keys, kpiKeys, raw };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  Failed: ${msg}`);
    return { error: msg };
  }
}

async function probe_2_tmq_search_with_kpi_schema(rnSerial: string): Promise<Record<string, unknown>> {
  console.log('\n[Probe 2] TMQ v1 radios/search with KPI outputSchema fields...');
  try {
    const body = {
      query: {
        deviceType: 'RN',
        conditions: [{
          logicalOperator: 'AND',
          conditions: [{
            type: 'identity',
            conditions: [{ field: 'serialNumber', operation: 'IN', values: [rnSerial] }],
          }],
        }],
      },
      outputSchema: {
        deviceFields: [...KPI_FIELD_PATHS],
      },
    };

    const response = await taranaFetch<any>('/api/tmq/v1/radios/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const radios = response.radios || response.data || [];
    if (radios.length === 0) {
      console.log('  No radios returned.');
      return { found: false };
    }

    const radio = radios[0];
    const fields = radio.fields || {};
    const found = Object.entries(fields).filter(([, v]) => v !== null && v !== undefined);
    console.log(`  Fields returned: ${Object.keys(fields).length}, non-null: ${found.length}`);
    found.forEach(([k, v]) => console.log(`    ${k}: ${v}`));
    return { radio, foundFields: Object.fromEntries(found) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  Failed: ${msg.slice(0, 200)}`);
    return { error: msg };
  }
}

async function probe_3_tmq_v5_kpi_aggregate(rnSerial: string): Promise<Record<string, unknown>> {
  console.log('\n[Probe 3] TMQ v5 radios/kpi/aggregate — multiple formats...');
  const formats = [
    {
      name: 'by-serial-list',
      body: {
        query: {
          deviceType: 'RN',
          conditions: [{
            logicalOperator: 'AND',
            conditions: [{
              type: 'identity',
              conditions: [{ field: 'serialNumber', operation: 'IN', values: [rnSerial] }],
            }],
          }],
        },
      },
    },
    {
      name: 'by-region',
      body: {
        query: {
          deviceType: 'RN',
          conditions: [{
            logicalOperator: 'AND',
            conditions: [{
              type: 'hierarchy',
              conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
            }],
          }],
        },
      },
    },
    {
      name: 'by-region-with-fields',
      body: {
        query: {
          deviceType: 'RN',
          conditions: [{
            logicalOperator: 'AND',
            conditions: [{
              type: 'hierarchy',
              conditions: [{ field: 'regionId', operation: 'EXIST', values: SA_REGION_IDS }],
            }],
          }],
        },
        fields: ['pathLoss', 'dlSinr', 'ulSinr', 'rxSignalCarrier0', 'dlRate', 'ulRate',
                 'inrCarrier0', 'sensitivityLossCarrier0', 'dlPer', 'ulPer', 'rfDistance'],
      },
    },
  ];

  const results: Record<string, unknown> = {};
  for (const fmt of formats) {
    try {
      const r = await taranaFetch<any>('/api/tmq/v5/radios/kpi/aggregate', {
        method: 'POST',
        body: JSON.stringify(fmt.body),
      });
      const keys = Object.keys(r?.data || r || {});
      console.log(`  ${fmt.name}: ✅ keys=[${keys.slice(0, 10).join(', ')}]`);
      results[fmt.name] = { success: true, response: r };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ${fmt.name}: ❌ ${msg.slice(0, 120)}`);
      results[fmt.name] = { success: false, error: msg };
    }
  }
  return results;
}

async function probe_4_nqs_kpi_endpoints(rnSerial: string): Promise<Record<string, unknown>> {
  console.log('\n[Probe 4] Potential NQS KPI-specific endpoints...');
  const endpoints = [
    `/api/nqs/v1/devices/${encodeURIComponent(rnSerial)}/kpi`,
    `/api/nqs/v1/devices/${encodeURIComponent(rnSerial)}/metrics`,
    `/api/nqs/v1/devices/${encodeURIComponent(rnSerial)}/performance`,
    `/api/nqs/v1/devices/${encodeURIComponent(rnSerial)}/link`,
    `/api/nqs/v2/devices/${encodeURIComponent(rnSerial)}`,
    `/api/nqs/v2/devices/${encodeURIComponent(rnSerial)}/kpi`,
  ];

  const results: Record<string, unknown> = {};
  for (const ep of endpoints) {
    try {
      const r = await taranaFetch<any>(ep);
      const keys = flattenKeys(r).slice(0, 20);
      const kpiKeys = keys.filter(k =>
        /sinr|path.?loss|rx.?signal|rssi|dl.?rate|ul.?rate|inr|sensitivity|per|rf.?dist|bandwidth|profile/i.test(k)
      );
      console.log(`  ${ep}: ✅ (${keys.length} fields, ${kpiKeys.length} KPI-relevant)`);
      kpiKeys.forEach(k => console.log(`    ${k}: ${getNestedValue(r, k)}`));
      results[ep] = { success: true, keys, kpiKeys, response: r };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = msg.match(/\b(404|403|400|500)\b/)?.[0] ?? '?';
      console.log(`  ${ep}: ❌ ${status} — ${msg.slice(0, 80)}`);
      results[ep] = { success: false, error: msg };
    }
  }
  return results;
}

async function probe_5_tmq_search_bn_planning(bnSerial: string): Promise<Record<string, unknown>> {
  console.log('\n[Probe 5] TMQ v1 BN search — Network Profile + Operational Bandwidth...');
  const BN_PLANNING_FIELDS = [
    '/network/state/profile',
    '/network/config/profile',
    '/system/state/network-profile',
    '/rf/state/operational-bandwidth',
    '/rf/config/bandwidth',
    '/system/state/bandwidth',
    '/planning/state/network-profile',
    '/planning/state/operational-bandwidth',
    '/radios/regulatory/state/band',
    '/system/install/state/height',
  ];

  try {
    const body = {
      query: {
        deviceType: 'BN',
        conditions: [{
          logicalOperator: 'AND',
          conditions: [{
            type: 'identity',
            conditions: [{ field: 'serialNumber', operation: 'IN', values: [bnSerial] }],
          }],
        }],
      },
      outputSchema: { deviceFields: BN_PLANNING_FIELDS },
    };

    const response = await taranaFetch<any>('/api/tmq/v1/radios/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const bns = response.radios || [];
    if (bns.length === 0) {
      console.log('  No BN found.');
      return { found: false };
    }

    const fields = bns[0].fields || {};
    const found = Object.entries(fields).filter(([, v]) => v !== null && v !== undefined);
    console.log(`  BN fields returned: ${Object.keys(fields).length}, non-null: ${found.length}`);
    found.forEach(([k, v]) => console.log(`    ${k}: ${v}`));
    return { bn: bns[0], foundFields: Object.fromEntries(found) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  Failed: ${msg.slice(0, 200)}`);
    return { error: msg };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return prefix ? [prefix] : [];
  const result: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result.push(...flattenKeys(v, key));
    } else {
      result.push(key);
    }
  }
  return result;
}

function getNestedValue(obj: unknown, dotPath: string): unknown {
  return dotPath.split('.').reduce((acc: any, k) => acc?.[k], obj);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const argRn = process.argv[2];
  const argBn = process.argv[3];

  let rnSerial = argRn;
  let bnSerial = argBn;

  // Discover a live RN if not provided
  if (!rnSerial) {
    console.log('No RN serial provided — discovering first live SA RN...');
    const result = await searchRadios('RN', { limit: 5 });
    const live = result.radios.find(r => r.serialNumber);
    if (!live) {
      console.error('No RN devices found in SA regions. Check TCS auth and region IDs.');
      process.exit(1);
    }
    rnSerial = live.serialNumber;
    console.log(`Using RN: ${rnSerial} (site: ${live.siteName ?? 'unknown'})`);
  }

  if (!bnSerial) {
    console.log('No BN serial provided — discovering BN for sector...');
    const result = await searchRadios('BN', { limit: 5 });
    const bn = result.radios.find(r => r.serialNumber);
    if (bn) {
      bnSerial = bn.serialNumber;
      console.log(`Using BN: ${bnSerial} (site: ${bn.siteName ?? 'unknown'})`);
    } else {
      console.log('No BN found — skipping BN probe 5');
      bnSerial = 'UNKNOWN';
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TCS KPI Discovery — RN: ${rnSerial}  BN: ${bnSerial}`);
  console.log('='.repeat(60));

  const results: Record<string, unknown> = {
    probedAt: new Date().toISOString(),
    rnSerial,
    bnSerial,
  };

  // Run all probes
  results.probe1_nqs_full = await probe_1_nqs_full_device(rnSerial);
  results.probe2_tmq_search_kpi_schema = await probe_2_tmq_search_with_kpi_schema(rnSerial);
  results.probe3_tmq_v5_aggregate = await probe_3_tmq_v5_kpi_aggregate(rnSerial);
  results.probe4_nqs_kpi_endpoints = await probe_4_nqs_kpi_endpoints(rnSerial);
  if (bnSerial !== 'UNKNOWN') {
    results.probe5_bn_planning = await probe_5_tmq_search_bn_planning(bnSerial);
  }

  // Summary: which target KPIs were found?
  const TARGET_KPIS = ['pathLoss', 'path-loss', 'dlSinr', 'dl-sinr', 'rxSignalCarrier0',
    'rx-signal-carrier-0', 'dlRate', 'dl-rate', 'inrCarrier0', 'inr-carrier-0',
    'sensitivityLossCarrier0', 'dlPer', 'dl-per', 'rfDistance', 'rf-distance',
    'networkProfile', 'network-profile', 'bandwidth'];

  console.log('\n' + '='.repeat(60));
  console.log('TARGET KPI AVAILABILITY SUMMARY');
  console.log('='.repeat(60));

  const rawStr = JSON.stringify(results).toLowerCase();
  TARGET_KPIS.forEach(kpi => {
    const found = rawStr.includes(kpi.toLowerCase());
    console.log(`  ${found ? '✅' : '❌'} ${kpi}`);
  });

  // Save full results
  const outputPath = path.join(process.cwd(), 'scripts/tarana/discovered-kpi.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results saved to: ${outputPath}`);
  console.log('Run: cat scripts/tarana/discovered-kpi.json | python3 -m json.tool | grep -i "sinr\\|path\\|rssi\\|rate\\|inr\\|per\\|bandwidth"');
}

main().catch(err => {
  console.error('KPI discovery failed:', err);
  process.exit(1);
});
