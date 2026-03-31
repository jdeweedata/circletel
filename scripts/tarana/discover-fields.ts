/**
 * TCS Portal Field Discovery Script
 *
 * Calls /api/tni/v2/config_attributes to enumerate all available radio
 * metric fields (YANG paths) that can be requested via the radio search API.
 *
 * Run: npx tsx scripts/tarana/discover-fields.ts
 */

import { taranaFetch } from '../../lib/tarana/client';
import type { TaranaConfigAttribute } from '../../lib/tarana/types';
import * as fs from 'fs';
import * as path from 'path';

// Keywords to identify signal-quality fields
const SIGNAL_KEYWORDS = [
  'rssi', 'sinr', 'snr', 'mcs', 'throughput', 'noise', 'power',
  'modulation', 'capacity', 'traffic', 'signal', 'rx', 'tx',
  'ber', 'fer', 'latency', 'rate', 'bandwidth', 'dl', 'ul'
];

async function discoverFields() {
  console.log('Fetching config_attributes from TCS Portal...');

  const response = await taranaFetch<{ data: TaranaConfigAttribute[] }>(
    '/api/tni/v2/config_attributes'
  );

  const attributes = response.data || [];
  console.log(`\nTotal fields available: ${attributes.length}`);

  // Categorise by signal relevance
  const signalFields: TaranaConfigAttribute[] = [];
  const otherFields: TaranaConfigAttribute[] = [];

  for (const attr of attributes) {
    const searchStr = `${attr.fieldName} ${attr.displayName} ${attr.stateYangPath}`.toLowerCase();
    const isSignal = SIGNAL_KEYWORDS.some(kw => searchStr.includes(kw));
    if (isSignal) {
      signalFields.push(attr);
    } else {
      otherFields.push(attr);
    }
  }

  console.log(`\n=== SIGNAL-QUALITY FIELDS (${signalFields.length}) ===`);
  for (const f of signalFields) {
    console.log(`  [${f.targetType}] ${f.displayName}`);
    console.log(`    fieldName: ${f.fieldName}`);
    console.log(`    stateYangPath: ${f.stateYangPath}`);
    console.log(`    dataType: ${f.dataType}`);
    console.log('');
  }

  console.log(`\n=== ALL OTHER FIELDS (${otherFields.length}) ===`);
  for (const f of otherFields) {
    console.log(`  [${f.targetType}] ${f.fieldName}: ${f.displayName} (${f.stateYangPath})`);
  }

  // Save full output to JSON
  const outputPath = path.join(process.cwd(), 'scripts/tarana/discovered-fields.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    totalFields: attributes.length,
    signalFields,
    otherFields,
    discoveredAt: new Date().toISOString(),
  }, null, 2));

  console.log(`\nFull output saved to: ${outputPath}`);
  console.log('\nSignal field stateYangPaths (for use in outputSchema.deviceFields):');
  for (const f of signalFields) {
    console.log(`  '${f.stateYangPath}',`);
  }
}

discoverFields().catch(err => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
