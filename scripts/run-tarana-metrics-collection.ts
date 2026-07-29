/**
 * One-shot manual trigger for Tarana link-metrics collection.
 *
 * Runs collectLinkMetrics() directly (bypassing the Inngest event pipeline,
 * which is dormant in this environment) and prints the result so we can
 * verify tarana_link_metrics populates.
 *
 * Usage:
 *   set -a && source /home/circletel/.env.local && set +a && npx tsx scripts/run-tarana-metrics-collection.ts
 */

import { collectLinkMetrics } from '@/lib/tarana/metrics-service';

async function main() {
  console.log('[run-collection] Starting Tarana link-metrics collection…');
  const started = Date.now();

  const result = await collectLinkMetrics();

  console.log('[run-collection] Done in', Date.now() - started, 'ms');
  console.log('[run-collection] collected:', result.collected);
  console.log('[run-collection] skipped:', result.skipped);
  console.log('[run-collection] errors:', result.errors.length);
  if (result.errors.length > 0) {
    for (const e of result.errors) console.log('   -', e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[run-collection] FAILED:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
