/**
 * Tarana Link Metrics Collection Inngest Function
 *
 * Collects signal data from active Tarana RNs via the TCS Portal API every
 * 15 minutes and stores snapshots in the tarana_link_metrics table.
 *
 * Schedule: Every 15 minutes
 */

import { inngest } from '../client';
import { collectLinkMetrics } from '@/lib/tarana/metrics-service';

// =============================================================================
// TARANA METRICS COLLECTION FUNCTION
// =============================================================================

/**
 * Collects link metrics from all active Tarana RNs.
 * Triggered by:
 * - Cron schedule: every 15 minutes
 * - Event: 'tarana/metrics.collection.requested' for manual triggers
 */
export const taranaMetricsCollectionFunction = inngest.createFunction(
  {
    id: 'tarana-metrics-collection',
    name: 'Tarana Link Metrics Collection',
    retries: 2,
  },
  [
    // Cron trigger: every 15 minutes
    { cron: '*/15 * * * *' },
    // Event trigger: manual requests
    { event: 'tarana/metrics.collection.requested' },
  ],
  async ({ step }) => {
    const startTime = Date.now();

    // Step 1 — collect link metrics from TCS Portal
    const result = await step.run('collect-link-metrics', async () => {
      try {
        console.log('[TaranaMetrics] Starting link metrics collection...');
        const collected = await collectLinkMetrics();
        console.log(
          `[TaranaMetrics] Collected ${collected.collected} snapshots, skipped ${collected.skipped}, errors: ${collected.errors.length}`
        );
        return collected;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[TaranaMetrics] Collection failed:', message);

        // Send failure event so the error is observable
        await inngest.send({
          name: 'tarana/metrics.collection.failed',
          data: {
            error: message,
            attempt: 1,
          },
        });

        throw error;
      }
    });

    // Step 2 — send completion event
    await step.run('send-completion-event', async () => {
      const duration_ms = Date.now() - startTime;

      await inngest.send({
        name: 'tarana/metrics.collection.completed',
        data: {
          collected: result.collected,
          errors_count: result.errors.length,
          duration_ms,
        },
      });

      console.log(
        `[TaranaMetrics] Completed in ${duration_ms}ms — ${result.collected} rows collected`
      );
    });

    return {
      collected: result.collected,
      skipped: result.skipped,
      errors: result.errors,
      duration_ms: Date.now() - startTime,
    };
  }
);
