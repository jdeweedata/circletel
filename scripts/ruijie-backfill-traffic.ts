/**
 * Queue Ruijie → Supabase traffic history backfill (up to 168h hourly points).
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/ruijie-backfill-traffic.ts
 *   npx tsx scripts/ruijie-backfill-traffic.ts --hours=168
 */

import { inngest } from '../lib/inngest/client';
import {
  clampTrafficHistoryHours,
  RUIJIE_TRAFFIC_HISTORY_HOURS,
} from '../lib/ruijie/traffic-history';

async function main() {
  const hoursArg = process.argv.find((a) => a.startsWith('--hours='));
  const hours = clampTrafficHistoryHours(
    hoursArg ? Number(hoursArg.split('=')[1]) : RUIJIE_TRAFFIC_HISTORY_HOURS
  );

  console.log(`[Backfill] Queueing ruijie/traffic.backfill.requested hours=${hours}`);
  await inngest.send({
    name: 'ruijie/traffic.backfill.requested',
    data: {
      hours,
      triggered_by: 'script',
    },
  });
  console.log('[Backfill] Queued. Inngest will upsert ruijie_traffic_rollups.');
}

main().catch((err) => {
  console.error('[Backfill] Failed:', err);
  process.exit(1);
});
