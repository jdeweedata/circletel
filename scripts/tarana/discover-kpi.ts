/**
 * TCS KPI Aggregate Endpoint Discovery Script
 *
 * Explores POST /api/tmq/v5/radios/kpi/aggregate to find the request format
 * and available KPI metrics (throughput, latency, uptime, signal quality).
 *
 * Run: npx tsx scripts/tarana/discover-kpi.ts
 */

import { taranaFetch } from '../../lib/tarana/client';
import * as fs from 'fs';
import * as path from 'path';

const SA_REGION_IDS = [1073, 1071];
const MTN_OPERATOR_ID = 219;

// Candidate request body formats to try
const REQUEST_FORMATS = [
  {
    name: 'format-1-basic-filter',
    body: {
      filter: { regions: SA_REGION_IDS },
      deviceType: 'RN',
    },
  },
  {
    name: 'format-2-query-wrapper',
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
    name: 'format-3-operator-only',
    body: {
      filter: { operatorId: MTN_OPERATOR_ID },
    },
  },
  {
    name: 'format-4-time-range',
    body: {
      filter: { regions: SA_REGION_IDS },
      timeRange: { from: Date.now() - 3600000, to: Date.now() },
    },
  },
];

async function discoverKpi() {
  console.log('Probing /api/tmq/v5/radios/kpi/aggregate...\n');

  const results: Record<string, any> = {};

  for (const format of REQUEST_FORMATS) {
    console.log(`Trying ${format.name}...`);
    try {
      const response = await taranaFetch<any>(
        '/api/tmq/v5/radios/kpi/aggregate',
        {
          method: 'POST',
          body: JSON.stringify(format.body),
        }
      );
      console.log(`  Success! Keys: ${Object.keys(response?.data || response || {}).join(', ')}`);
      results[format.name] = { success: true, response };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  Failed: ${msg.slice(0, 120)}`);
      results[format.name] = { success: false, error: msg };
    }
  }

  const outputPath = path.join(process.cwd(), 'scripts/tarana/discovered-kpi.json');
  fs.writeFileSync(outputPath, JSON.stringify({ results, discoveredAt: new Date().toISOString() }, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

discoverKpi().catch(err => {
  console.error('KPI discovery failed:', err);
  process.exit(1);
});
