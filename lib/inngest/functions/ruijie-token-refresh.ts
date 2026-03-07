/**
 * Ruijie Token Refresh Inngest Function
 *
 * Proactively refreshes the Ruijie Cloud API token before expiry.
 * Token expires in 30 days, so we refresh weekly to ensure it's always valid.
 *
 * Schedule: Every 7 days (well before 30-day expiry)
 */

import { inngest } from '../client';
import { authenticateRuijie, clearRuijieAuth, isMockMode } from '@/lib/ruijie';

// =============================================================================
// RUIJIE TOKEN REFRESH FUNCTION
// =============================================================================

/**
 * Proactive token refresh to prevent expiry.
 * Runs weekly - 4x before the 30-day token would expire.
 */
export const ruijieTokenRefreshFunction = inngest.createFunction(
  {
    id: 'ruijie-token-refresh',
    name: 'Ruijie Token Refresh',
    retries: 3,
  },
  [
    // Cron trigger: every 7 days at 3am UTC (5am South Africa)
    { cron: '0 3 */7 * *' },
    // Event trigger: manual refresh
    { event: 'ruijie/token.refresh' },
  ],
  async ({ step }) => {
    // Skip in mock mode
    if (isMockMode()) {
      return { skipped: true, reason: 'Mock mode enabled' };
    }

    // Step 1: Clear existing token to force refresh
    await step.run('clear-existing-token', async () => {
      clearRuijieAuth();
      console.log('[RuijieTokenRefresh] Cleared existing token cache');
    });

    // Step 2: Authenticate to get fresh token
    const result = await step.run('fetch-new-token', async () => {
      try {
        const auth = await authenticateRuijie();
        console.log('[RuijieTokenRefresh] Got new token, expires in', auth.expiresIn, 'seconds');

        return {
          success: true as const,
          expiresIn: auth.expiresIn,
          expiresAt: new Date(Date.now() + auth.expiresIn * 1000).toISOString(),
          error: null,
        };
      } catch (error) {
        console.error('[RuijieTokenRefresh] Failed to refresh token:', error);
        return {
          success: false as const,
          expiresIn: null,
          expiresAt: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Step 3: Send notification event if failed
    if (!result.success) {
      await step.run('send-failure-alert', async () => {
        await inngest.send({
          name: 'ruijie/token.refresh.failed',
          data: {
            error: result.error || 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        });
      });
    }

    return result;
  }
);

// =============================================================================
// TOKEN REFRESH FAILURE HANDLER
// =============================================================================

/**
 * Handle token refresh failures.
 * Can be extended to send Slack/email alerts.
 */
export const ruijieTokenRefreshFailedFunction = inngest.createFunction(
  {
    id: 'ruijie-token-refresh-failed',
    name: 'Ruijie Token Refresh Failed Handler',
  },
  { event: 'ruijie/token.refresh.failed' },
  async ({ event, step }) => {
    const { error, timestamp } = event.data;

    await step.run('log-failure', async () => {
      console.error(
        `[RuijieTokenRefresh] ALERT: Token refresh failed at ${timestamp}: ${error}`
      );

      // Future: Send Slack notification
      // Future: Send email alert to ops team
      // Future: Create incident in monitoring system
    });

    return { alerted: true };
  }
);
