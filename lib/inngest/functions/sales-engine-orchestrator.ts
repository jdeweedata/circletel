/**
 * Sales Engine Orchestrator Inngest Functions
 *
 * 1. Daily Orchestrator — runs at 5:30 AM SAST (3:30 UTC), after competitor scrape.
 *    Processes competitor intel, syncs pricing, updates milestones, generates briefing,
 *    and sends Slack digest.
 *
 * 2. Weekly Execution Review — runs Monday 6:00 AM SAST (4:00 UTC), after Sunday
 *    demographic enrichment. Computes execution snapshot and checks hiring triggers.
 *
 * 3. Orchestrator Completed — logs completion of the daily orchestrator.
 *
 * All service imports are dynamic (inside step.run) to avoid module-level side effects
 * that break Inngest's step-based execution model.
 */

import { inngest } from '../client';

// =============================================================================
// DAILY ORCHESTRATOR
// =============================================================================

/**
 * Orchestrates the daily sales engine pipeline:
 * competitor intel -> pricing sync -> milestone update -> briefing -> Slack digest
 */
export const salesEngineDailyOrchestrator = inngest.createFunction(
  {
    id: 'sales-engine-daily-orchestrator',
    name: 'Sales Engine Daily Orchestrator',
    retries: 2,
  },
  [
    // Cron trigger: 5:30 AM SAST = 3:30 UTC
    { cron: '30 3 * * *' },
    // Manual/programmatic trigger
    { event: 'sales-engine/orchestrator.requested' },
  ],
  async ({ event, step }) => {
    const startTime = Date.now();

    // =========================================================================
    // Step 1: Process competitor intelligence
    // =========================================================================
    const competitorResult = await step.run('process-competitor-intelligence', async () => {
      const { processCompetitorPriceChanges } = await import(
        '@/lib/sales-engine/competitor-intelligence-service'
      );
      const result = await processCompetitorPriceChanges();
      if (result.error) {
        console.error(
          `[Sales Engine Orchestrator] Competitor intelligence failed: ${result.error}`
        );
      }
      return {
        success: !result.error,
        error: result.error ?? null,
        data: result.data ?? null,
      };
    });

    // =========================================================================
    // Step 2: Sync product pricing / scoring constants
    // =========================================================================
    const syncResult = await step.run('sync-product-pricing', async () => {
      const { syncScoringConstants } = await import(
        '@/lib/sales-engine/product-sync-service'
      );
      const result = await syncScoringConstants();
      if (result.error) {
        console.error(
          `[Sales Engine Orchestrator] Product pricing sync failed: ${result.error}`
        );
      }
      return {
        success: !result.error,
        synced: result.data?.synced ?? false,
        error: result.error ?? null,
      };
    });

    // =========================================================================
    // Step 3: Update execution milestones with actual MRR
    // =========================================================================
    const milestonesResult = await step.run('update-execution-milestones', async () => {
      const { updateMilestoneActuals } = await import(
        '@/lib/sales-engine/execution-plan-service'
      );
      const result = await updateMilestoneActuals();
      if (result.error) {
        console.error(
          `[Sales Engine Orchestrator] Milestone update failed: ${result.error}`
        );
      }
      return {
        success: !result.error,
        updated: result.data?.updated ?? 0,
        error: result.error ?? null,
      };
    });

    // =========================================================================
    // Step 4: Generate daily briefing
    // =========================================================================
    const briefingResult = await step.run('generate-daily-briefing', async () => {
      const { getDailyBriefing } = await import(
        '@/lib/sales-engine/briefing-service'
      );
      const result = await getDailyBriefing();
      if (result.error) {
        console.error(
          `[Sales Engine Orchestrator] Daily briefing failed: ${result.error}`
        );
      }
      return {
        success: !result.error,
        hasBriefing: !!result.data,
        priorityCalls: result.data?.priority_calls?.length ?? 0,
        error: result.error ?? null,
      };
    });

    // =========================================================================
    // Step 5: Send Slack digest
    // =========================================================================
    const slackResult = await step.run('send-slack-digest', async () => {
      const { sendDailyDigest } = await import(
        '@/lib/sales-engine/slack-digest-service'
      );
      const result = await sendDailyDigest();
      if (result.error) {
        console.error(
          `[Sales Engine Orchestrator] Slack digest failed: ${result.error}`
        );
      }
      return {
        success: result.success,
        error: result.error ?? null,
      };
    });

    // =========================================================================
    // Step 6: Send completion event
    // =========================================================================
    const durationMs = Date.now() - startTime;

    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'sales-engine/orchestrator.completed',
        data: {
          duration_ms: durationMs,
          steps: {
            competitor_intelligence: competitorResult.success,
            product_sync: syncResult.success,
            milestones_updated: milestonesResult.updated,
            briefing_generated: briefingResult.hasBriefing,
            priority_calls: briefingResult.priorityCalls,
            slack_sent: slackResult.success,
          },
          errors: [
            competitorResult.error,
            syncResult.error,
            milestonesResult.error,
            briefingResult.error,
            slackResult.error,
          ].filter(Boolean),
        },
      });
    });

    console.log(
      `[Sales Engine Orchestrator] Daily run completed in ${durationMs}ms — ` +
        `competitor: ${competitorResult.success}, sync: ${syncResult.success}, ` +
        `milestones: ${milestonesResult.updated}, briefing: ${briefingResult.hasBriefing}, ` +
        `slack: ${slackResult.success}`
    );

    return {
      status: 'completed',
      duration_ms: durationMs,
      steps: {
        competitor_intelligence: competitorResult.success,
        product_sync: syncResult.success,
        milestones_updated: milestonesResult.updated,
        briefing_generated: briefingResult.hasBriefing,
        priority_calls: briefingResult.priorityCalls,
        slack_sent: slackResult.success,
      },
    };
  }
);

// =============================================================================
// WEEKLY EXECUTION REVIEW
// =============================================================================

/**
 * Weekly review of the execution plan — computes MRR snapshot, checks hiring
 * triggers, and sends a structured Slack report every Monday morning.
 */
export const salesEngineWeeklyReview = inngest.createFunction(
  {
    id: 'sales-engine-weekly-review',
    name: 'Sales Engine Weekly Review',
    retries: 2,
  },
  [
    // Cron trigger: Monday 6:00 AM SAST = 4:00 UTC
    { cron: '0 4 * * 1' },
    // Manual/programmatic trigger
    { event: 'sales-engine/weekly-review.requested' },
  ],
  async ({ event, step }) => {
    const startTime = Date.now();

    // =========================================================================
    // Step 1: Compute execution snapshot
    // =========================================================================
    const snapshot = await step.run('compute-execution-snapshot', async () => {
      const { getExecutionSnapshot } = await import(
        '@/lib/sales-engine/execution-plan-service'
      );
      const result = await getExecutionSnapshot();
      if (result.error || !result.data) {
        throw new Error(
          `Execution snapshot failed: ${result.error ?? 'no data returned'}`
        );
      }
      return result.data;
    });

    // =========================================================================
    // Step 2: Check hiring triggers
    // =========================================================================
    const hiringTriggers = await step.run('check-hiring-triggers', async () => {
      const { getHiringTriggers } = await import(
        '@/lib/sales-engine/execution-plan-service'
      );
      const result = await getHiringTriggers();
      if (result.error || !result.data) {
        console.error(
          `[Sales Engine Weekly] Hiring triggers check failed: ${result.error ?? 'no data'}`
        );
        return [];
      }
      return result.data;
    });

    // =========================================================================
    // Step 3: Run zone discovery (expire stale + discover new candidates)
    // =========================================================================
    const discoveryResult = await step.run('run-zone-discovery', async () => {
      const { expireOldCandidates, runZoneDiscovery } = await import(
        '@/lib/sales-engine/zone-discovery-service'
      );

      // Expire candidates older than 30 days
      const expireResult = await expireOldCandidates();
      if (expireResult.error) {
        console.error(
          `[Sales Engine Weekly] Candidate expiry failed: ${expireResult.error}`
        );
      }

      // Run discovery
      const result = await runZoneDiscovery();
      if (result.error) {
        console.error(
          `[Sales Engine Weekly] Zone discovery failed: ${result.error}`
        );
      }

      return {
        success: !result.error,
        candidates_found: result.data?.candidates?.length ?? 0,
        expired: expireResult.data?.expired ?? 0,
        error: result.error ?? null,
      };
    });

    // =========================================================================
    // Step 3b: Aggregate coverage demand signals
    // =========================================================================
    const demandResult = await step.run('aggregate-demand-signals', async () => {
      try {
        const { aggregateDemandSignals } = await import(
          '@/lib/sales-engine/demand-signal-service'
        );
        const result = await aggregateDemandSignals(30);
        if (result.error) {
          console.error(`[Sales Engine Weekly] Demand signal aggregation failed: ${result.error}`);
          return { success: false, wards_updated: 0, error: result.error };
        }
        return { success: true, wards_updated: result.data?.wards_updated ?? 0, error: null };
      } catch (err) {
        console.error('[Sales Engine Weekly] Demand signals error:', err);
        return { success: false, wards_updated: 0, error: String(err) };
      }
    });

    // =========================================================================
    // Step 3c: Auto-approve discovery candidates
    // =========================================================================
    const autoApprovalResult = await step.run('auto-approve-candidates', async () => {
      if (!discoveryResult.success || discoveryResult.candidates_found === 0) {
        return { skipped: true, reason: 'No candidates to process' };
      }

      try {
        const { autoProcessDiscoveryCandidates } = await import(
          '@/lib/sales-engine/zone-discovery-service'
        );
        const supabase = await (await import('@/lib/supabase/server')).createClient();

        // Get the latest pending batch
        const { data: latestBatch } = await supabase
          .from('zone_discovery_candidates')
          .select('discovery_batch_id')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!latestBatch?.discovery_batch_id) {
          return { skipped: true, reason: 'No pending batch found' };
        }

        const result = await autoProcessDiscoveryCandidates(latestBatch.discovery_batch_id);
        if (result.error) {
          console.error(`[Sales Engine Weekly] Auto-approval failed: ${result.error}`);
          return { skipped: false, error: result.error };
        }

        return {
          skipped: false,
          auto_approved_high: result.data?.auto_approved_high ?? 0,
          auto_approved_passive: result.data?.auto_approved_passive ?? 0,
          auto_rejected: result.data?.auto_rejected ?? 0,
        };
      } catch (err) {
        console.error('[Sales Engine Weekly] Auto-approval error:', err);
        return { skipped: false, error: String(err) };
      }
    });

    // =========================================================================
    // Step 3d: Tag zones with campaign metadata
    // =========================================================================
    await step.run('tag-zone-campaigns', async () => {
      try {
        const { tagAllActiveZones } = await import(
          '@/lib/sales-engine/campaign-service'
        );
        const result = await tagAllActiveZones();
        if (result.error) {
          console.error(`[Sales Engine Weekly] Campaign tagging failed: ${result.error}`);
        }
        return { tagged: result.data?.tagged ?? 0 };
      } catch (err) {
        console.error('[Sales Engine Weekly] Campaign tagging error:', err);
        return { tagged: 0 };
      }
    });

    // =========================================================================
    // Step 3e: Refresh OSM POI data for top-scoring wards
    // =========================================================================
    await step.run('refresh-osm-pois', async () => {
      try {
        const { refreshTopWardPois } = await import(
          '@/lib/sales-engine/osm-poi-service'
        );
        const result = await refreshTopWardPois(30);
        if (result.error) {
          console.error(`[Sales Engine Weekly] OSM refresh failed: ${result.error}`);
        }
        return { refreshed: result.data?.wards_refreshed ?? 0 };
      } catch (err) {
        console.error('[Sales Engine Weekly] OSM refresh error:', err);
        return { refreshed: 0 };
      }
    });

    // =========================================================================
    // Step 4: Send weekly Slack report
    // =========================================================================
    await step.run('send-weekly-slack-report', async () => {
      const webhookUrl = process.env.SLACK_SALES_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn(
          '[Sales Engine Weekly] SLACK_SALES_WEBHOOK_URL not set — skipping Slack report'
        );
        return { sent: false, reason: 'no webhook URL' };
      }

      const readyTriggers = hiringTriggers.filter((t) => t.ready);
      const pendingTriggers = hiringTriggers.filter((t) => !t.ready);

      const alertLines =
        snapshot.alerts.length > 0
          ? snapshot.alerts
              .map(
                (a) =>
                  `${a.severity === 'critical' ? ':red_circle:' : a.severity === 'warning' ? ':large_yellow_circle:' : ':large_blue_circle:'} ${a.message}`
              )
              .join('\n')
          : ':white_check_mark: No active alerts';

      const hiringReadyText =
        readyTriggers.length > 0
          ? readyTriggers.map((t) => `:white_check_mark: ${t.trigger} (R${t.mrr_threshold.toLocaleString()})`).join('\n')
          : '_None ready yet_';

      const hiringPendingText =
        pendingTriggers.length > 0
          ? pendingTriggers
              .map(
                (t) =>
                  `:hourglass: ${t.trigger} — R${t.current_mrr.toLocaleString()} / R${t.mrr_threshold.toLocaleString()}`
              )
              .join('\n')
          : '_All triggers met_';

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Weekly Execution Plan Review',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Current MRR*\nR${snapshot.total_mrr.toLocaleString()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Target MRR*\nR${snapshot.target_mrr.toLocaleString()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Attainment*\n${snapshot.mrr_attainment_pct.toFixed(1)}%`,
            },
            {
              type: 'mrkdwn',
              text: `*MSC Coverage Ratio*\n${snapshot.msc_coverage_ratio.toFixed(2)}x`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*Phase Status*\n` +
              `Phase: *${snapshot.current_phase}* (Month ${snapshot.current_month})\n` +
              `Milestones met: ${snapshot.active_milestones.filter((m) => m.status === 'met').length} / ${snapshot.active_milestones.length}\n` +
              `Customers: ${snapshot.total_customers}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*Hiring Triggers*\n` +
              `_Ready:_\n${hiringReadyText}\n\n` +
              `_Pending:_\n${hiringPendingText}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Alerts*\n${alertLines}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*Zone Discovery*\n` +
              (discoveryResult.success
                ? `:mag: ${discoveryResult.candidates_found} new zone candidates found` +
                  (discoveryResult.expired > 0
                    ? ` | ${discoveryResult.expired} stale candidates expired`
                    : '')
                : `:warning: Discovery failed: ${discoveryResult.error}`),
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Sales Engine Weekly Review | ${new Date().toISOString().split('T')[0]} | Generated in ${Date.now() - startTime}ms`,
            },
          ],
        },
      ];

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(
          `[Sales Engine Weekly] Slack webhook failed (${response.status}): ${body}`
        );
        return { sent: false, reason: `Slack returned ${response.status}` };
      }

      return { sent: true };
    });

    const durationMs = Date.now() - startTime;

    console.log(
      `[Sales Engine Weekly] Review completed in ${durationMs}ms — ` +
        `MRR: R${snapshot.total_mrr.toLocaleString()} / R${snapshot.target_mrr.toLocaleString()} ` +
        `(${snapshot.mrr_attainment_pct.toFixed(1)}%), ` +
        `hiring triggers ready: ${hiringTriggers.filter((t) => t.ready).length}/${hiringTriggers.length}`
    );

    return {
      status: 'completed',
      duration_ms: durationMs,
      snapshot: {
        current_phase: snapshot.current_phase,
        current_month: snapshot.current_month,
        total_mrr: snapshot.total_mrr,
        target_mrr: snapshot.target_mrr,
        mrr_attainment_pct: snapshot.mrr_attainment_pct,
        msc_coverage_ratio: snapshot.msc_coverage_ratio,
        total_customers: snapshot.total_customers,
        alerts_count: snapshot.alerts.length,
      },
      hiring_triggers: {
        total: hiringTriggers.length,
        ready: hiringTriggers.filter((t) => t.ready).length,
      },
    };
  }
);

// =============================================================================
// ORCHESTRATOR COMPLETED HANDLER
// =============================================================================

/**
 * Handles the completion event from the daily orchestrator.
 * Logs the summary for observability.
 */
export const salesEngineOrchestratorCompleted = inngest.createFunction(
  {
    id: 'sales-engine-orchestrator-completed',
    name: 'Sales Engine Orchestrator Completed',
  },
  { event: 'sales-engine/orchestrator.completed' },
  async ({ event }) => {
    const { duration_ms, steps, errors } = event.data as {
      duration_ms: number;
      steps: {
        competitor_intelligence: boolean;
        product_sync: boolean;
        milestones_updated: number;
        briefing_generated: boolean;
        priority_calls: number;
        slack_sent: boolean;
      };
      errors: string[];
    };

    const errorSummary =
      errors.length > 0 ? ` | Errors: ${errors.join('; ')}` : '';

    console.log(
      `[Sales Engine Orchestrator Completed] ` +
        `Duration: ${duration_ms}ms | ` +
        `Competitor Intel: ${steps.competitor_intelligence} | ` +
        `Pricing Sync: ${steps.product_sync} | ` +
        `Milestones Updated: ${steps.milestones_updated} | ` +
        `Briefing: ${steps.briefing_generated} (${steps.priority_calls} priority calls) | ` +
        `Slack: ${steps.slack_sent}` +
        errorSummary
    );

    return {
      logged: true,
      had_errors: errors.length > 0,
    };
  }
);
