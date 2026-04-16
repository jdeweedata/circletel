/**
 * Zoho Desk Token Refresh Inngest Function
 *
 * Proactively refreshes the Zoho Desk OAuth access token before it expires.
 * Zoho access tokens expire after 1 hour. We refresh every 45 minutes to
 * ensure the WhatsApp Campaign cron and other Desk API calls always have a
 * valid token without requiring manual token regeneration.
 *
 * Schedule: Every 45 minutes
 */

import { inngest } from '../client';
import { createZohoDeskAuthService } from '@/lib/integrations/zoho/auth-service';
import { zohoLogger } from '@/lib/logging';

// =============================================================================
// ZOHO DESK TOKEN REFRESH FUNCTION
// =============================================================================

/**
 * Proactive token refresh to prevent the 1-hour Zoho access token from expiring.
 * Runs every 45 minutes — 4x within any 3-hour window, well ahead of expiry.
 */
export const zohoDeskTokenRefreshFunction = inngest.createFunction(
  {
    id: 'zoho-desk-token-refresh',
    name: 'Zoho Desk Token Refresh',
    retries: 3,
  },
  [
    // Cron trigger: every 45 minutes
    { cron: '*/45 * * * *' },
    // Event trigger: manual refresh
    { event: 'zoho-desk/token.refresh' },
  ],
  async ({ step }) => {
    const result = await step.run('refresh-zoho-desk-token', async () => {
      try {
        const auth = createZohoDeskAuthService();
        const accessToken = await auth.forceRefresh();

        // Mask token for logging — show first 8 chars only
        const masked = accessToken.slice(0, 8) + '...' + accessToken.slice(-4);
        zohoLogger.info('[ZohoDeskTokenRefresh] Token refreshed successfully', { masked });

        return {
          success: true as const,
          refreshedAt: new Date().toISOString(),
          // Zoho tokens expire in 1 hour; next refresh in 45 min gives 15-min buffer
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          error: null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        zohoLogger.error('[ZohoDeskTokenRefresh] Token refresh failed', { error: message });
        return {
          success: false as const,
          refreshedAt: null,
          expiresAt: null,
          error: message,
        };
      }
    });

    // Send a failure event so it can be monitored / alerted
    if (!result.success) {
      await step.run('send-failure-alert', async () => {
        await inngest.send({
          name: 'zoho-desk/token.refresh.failed',
          data: {
            error: result.error ?? 'Unknown error',
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

export const zohoDeskTokenRefreshFailedFunction = inngest.createFunction(
  {
    id: 'zoho-desk-token-refresh-failed',
    name: 'Zoho Desk Token Refresh Failed Handler',
  },
  { event: 'zoho-desk/token.refresh.failed' },
  async ({ event, step }) => {
    const { error, timestamp } = event.data;

    await step.run('log-failure', async () => {
      zohoLogger.error(
        `[ZohoDeskTokenRefresh] ALERT: Token refresh failed at ${timestamp}: ${error}`
      );
      // Future: Slack/email alert to ops team
    });

    return { alerted: true };
  }
);
