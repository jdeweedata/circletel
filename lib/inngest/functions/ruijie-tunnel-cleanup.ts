/**
 * Ruijie Tunnel Cleanup Inngest Function
 *
 * Marks expired tunnels as 'expired' to keep slot count accurate.
 * Handles cases where admin closes browser without clicking Disconnect.
 *
 * Schedule: Every 15 minutes
 */

import { inngest } from '../client';
import { expireStaleTunnels } from '@/lib/ruijie';

// =============================================================================
// TUNNEL CLEANUP FUNCTION
// =============================================================================

/**
 * Cleanup expired tunnels.
 * Runs every 15 minutes to mark tunnels as 'expired' where:
 * - status = 'active'
 * - expires_at < now()
 */
export const ruijieTunnelCleanupFunction = inngest.createFunction(
  {
    id: 'ruijie-tunnel-cleanup',
    name: 'Ruijie Tunnel Cleanup',
    retries: 2,
  },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const expiredCount = await step.run('expire-stale-tunnels', async () => {
      const count = await expireStaleTunnels();
      if (count > 0) {
        console.log(`[RuijieTunnelCleanup] Expired ${count} stale tunnel(s)`);
      }
      return count;
    });

    return { expiredCount };
  }
);
