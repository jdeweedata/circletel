/**
 * Zone Demographic Enrichment Inngest Function
 *
 * Enriches all active sales zones with ward-level demographic data.
 * Computes propensity scores combining demographics + coverage + market signals.
 *
 * Schedule: Weekly Sunday 3AM SAST (1:00 UTC)
 * Also triggered manually via 'zone/demographics.enrichment.requested' event.
 *
 * Pattern follows tarana-sync.ts exactly.
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  enrichZoneDemographics,
  getWardImportStats,
} from '@/lib/sales-engine/demographic-enrichment-service';

// =============================================================================
// ZONE DEMOGRAPHIC ENRICHMENT FUNCTION
// =============================================================================

export const zoneDemographicEnrichmentFunction = inngest.createFunction(
  {
    id: 'zone-demographic-enrichment',
    name: 'Zone Demographic Enrichment',
    retries: 3,
    cancelOn: [
      {
        event: 'zone/demographics.enrichment.cancelled',
        match: 'data.enrichment_log_id',
      },
    ],
  },
  [
    // Cron trigger: Sunday 3AM SAST = 1:00 UTC
    { cron: '0 1 * * 0' },
    // Event trigger: manual requests
    { event: 'zone/demographics.enrichment.requested' },
  ],
  async ({ event, step }) => {
    const eventData = event?.data as {
      enrichment_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      admin_user_id?: string;
    } | undefined;

    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const startTime = Date.now();

    // =========================================================================
    // Step 1: Check ward data availability
    // =========================================================================
    const wardStats = await step.run('check-ward-data', async () => {
      const result = await getWardImportStats();
      if (result.error || !result.data) {
        throw new Error(`Ward stats check failed: ${result.error ?? 'no data'}`);
      }
      return result.data;
    });

    // Skip if no ward data is loaded
    if (wardStats.total_wards === 0) {
      await step.run('send-skipped-event', async () => {
        await inngest.send({
          name: 'zone/demographics.enrichment.completed',
          data: {
            enrichment_log_id: eventData?.enrichment_log_id ?? 'auto',
            triggered_by: triggeredBy,
            enriched: 0,
            skipped_reason: 'No ward demographics data loaded',
            duration_ms: Date.now() - startTime,
          },
        });
      });
      return { status: 'skipped', reason: 'No ward data loaded' };
    }

    // =========================================================================
    // Step 2: Fetch active zones
    // =========================================================================
    const activeZoneIds = await step.run('fetch-active-zones', async () => {
      const supabase = await createClient();
      const { data: zones, error } = await supabase
        .from('sales_zones')
        .select('id')
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to fetch zones: ${error.message}`);
      }

      return (zones ?? []).map((z) => z.id);
    });

    if (activeZoneIds.length === 0) {
      return { status: 'skipped', reason: 'No active zones' };
    }

    // =========================================================================
    // Step 3: Enrich zones in batches
    // =========================================================================
    const enrichmentResult = await step.run('enrich-zones-batch', async () => {
      let enriched = 0;
      const errors: string[] = [];

      for (const zoneId of activeZoneIds) {
        const result = await enrichZoneDemographics(zoneId);
        if (result.error) {
          errors.push(`Zone ${zoneId}: ${result.error}`);
        } else {
          enriched++;
        }
      }

      return { enriched, errors, total: activeZoneIds.length };
    });

    // =========================================================================
    // Step 4: Send completion event
    // =========================================================================
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'zone/demographics.enrichment.completed',
        data: {
          enrichment_log_id: eventData?.enrichment_log_id ?? 'auto',
          triggered_by: triggeredBy,
          enriched: enrichmentResult.enriched,
          errors_count: enrichmentResult.errors.length,
          total_zones: enrichmentResult.total,
          ward_count: wardStats.total_wards,
          duration_ms: Date.now() - startTime,
        },
      });
    });

    return {
      status: 'completed',
      enriched: enrichmentResult.enriched,
      errors: enrichmentResult.errors.length,
      total_zones: enrichmentResult.total,
      duration_ms: Date.now() - startTime,
    };
  }
);

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

export const zoneDemographicEnrichmentCompletedFunction = inngest.createFunction(
  {
    id: 'zone-demographic-enrichment-completed',
    name: 'Zone Demographic Enrichment Completed',
  },
  { event: 'zone/demographics.enrichment.completed' },
  async ({ event }) => {
    const data = event.data;
    console.log(
      `[Demographic Enrichment] Completed: ${data.enriched}/${data.total_zones} zones enriched in ${data.duration_ms}ms`
    );
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

export const zoneDemographicEnrichmentFailedFunction = inngest.createFunction(
  {
    id: 'zone-demographic-enrichment-failed',
    name: 'Zone Demographic Enrichment Failed',
  },
  { event: 'zone/demographics.enrichment.failed' },
  async ({ event }) => {
    console.error(
      `[Demographic Enrichment] Failed: ${event.data.error} (attempt ${event.data.attempt})`
    );
  }
);
