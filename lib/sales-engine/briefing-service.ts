/**
 * Briefing Service
 * Aggregates data for the daily sales briefing: priority calls, stalled deals,
 * follow-ups, zone alerts, and MSC snapshot.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PipelineStage,
  RecommendedAction,
} from './types';
import {
  PIPELINE_STAGE_DAY_TARGETS,
  PIPELINE_STAGE_LABELS,
} from './types';
import { getMSCStatus, getReallocationRecommendations } from './scorecard-service';

// =============================================================================
// Briefing Types
// =============================================================================

export interface BriefingLead {
  id: string;
  company_name: string | null;
  address: string;
  phone: string | null;
  composite_score: number;
  recommended_product: string | null;
  estimated_mrr: number | null;
  zone_name: string | null;
}

export interface StalledDeal {
  id: string;
  company_name: string | null;
  address: string;
  stage: PipelineStage;
  stage_label: string;
  days_stuck: number;
  day_target: number;
  quote_mrr: number | null;
}

export interface FollowUp {
  id: string;
  company_name: string | null;
  address: string;
  stage: PipelineStage;
  stage_label: string;
  last_activity: string;
  quote_mrr: number | null;
}

export interface ZoneAlert {
  zone_id: string;
  zone_name: string;
  action: RecommendedAction;
  avg_close_rate: number;
}

export interface MSCSnapshot {
  period_label: string;
  actual_rns: number;
  required_rns: number;
  days_remaining: number;
  status: string;
}

export interface DailyBriefing {
  priority_calls: BriefingLead[];
  stalled_deals: StalledDeal[];
  follow_ups: FollowUp[];
  zone_alerts: ZoneAlert[];
  msc_snapshot: MSCSnapshot | null;
  summary: {
    calls_needed: number;
    pipeline_mrr: number;
    deals_to_close: number;
  };
}

// =============================================================================
// Briefing Aggregation
// =============================================================================

/**
 * Get the daily sales briefing — a single object containing everything
 * a sales rep needs to start their day.
 */
export async function getDailyBriefing(): Promise<{
  data: DailyBriefing | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // -----------------------------------------------------------------------
    // 1. Priority Calls — top-scored leads NOT yet in the pipeline
    // -----------------------------------------------------------------------

    // Step A: get top 30 scored leads (we over-fetch then filter out pipeline leads)
    const { data: topLeads, error: leadsError } = await supabase
      .from('lead_scores')
      .select(
        'id, coverage_lead_id, composite_score, recommended_product, estimated_mrr, zone_id, ' +
        'coverage_lead:coverage_leads(id, address, company_name, phone), ' +
        'zone:sales_zones(id, name)'
      )
      .order('composite_score', { ascending: false })
      .limit(30);

    if (leadsError) {
      return { data: null, error: `Failed to fetch lead scores: ${leadsError.message}` };
    }

    // Step B: get all coverage_lead_ids that already have a pipeline entry
    const { data: pipelineRows, error: pipelineIdsError } = await supabase
      .from('sales_pipeline_stages')
      .select('coverage_lead_id');

    if (pipelineIdsError) {
      return { data: null, error: `Failed to fetch pipeline ids: ${pipelineIdsError.message}` };
    }

    const pipelineCoverageIds = new Set(
      (pipelineRows ?? []).map((r: { coverage_lead_id: string }) => r.coverage_lead_id)
    );

    type LeadRow = {
      id: string;
      coverage_lead_id: string;
      composite_score: number;
      recommended_product: string | null;
      estimated_mrr: number | null;
      zone_id: string | null;
      coverage_lead: { id: string; address: string; company_name: string | null; phone: string | null } | null;
      zone: { id: string; name: string } | null;
    };

    const scoredLeads = (topLeads ?? []) as unknown as LeadRow[];

    const priorityCalls: BriefingLead[] = scoredLeads
      .filter((l) => !pipelineCoverageIds.has(l.coverage_lead_id))
      .slice(0, 10)
      .map((l) => ({
        id: l.coverage_lead_id,
        company_name: l.coverage_lead?.company_name ?? null,
        address: l.coverage_lead?.address ?? '',
        phone: l.coverage_lead?.phone ?? null,
        composite_score: l.composite_score,
        recommended_product: l.recommended_product,
        estimated_mrr: l.estimated_mrr,
        zone_name: l.zone?.name ?? null,
      }));

    // -----------------------------------------------------------------------
    // 2. Stalled Deals — open pipeline entries past their day target
    // -----------------------------------------------------------------------

    const { data: openDeals, error: openDealsError } = await supabase
      .from('sales_pipeline_stages')
      .select(
        'id, coverage_lead_id, stage, stage_entered_at, day_target, quote_mrr, ' +
        'coverage_lead:coverage_leads(id, address, company_name)'
      )
      .eq('outcome', 'open')
      .order('stage_entered_at', { ascending: true });

    if (openDealsError) {
      return { data: null, error: `Failed to fetch open deals: ${openDealsError.message}` };
    }

    type OpenDealRow = {
      id: string;
      coverage_lead_id: string;
      stage: PipelineStage;
      stage_entered_at: string;
      day_target: number | null;
      quote_mrr: number | null;
      coverage_lead: { id: string; address: string; company_name: string | null } | null;
    };

    const allOpenDeals = (openDeals ?? []) as unknown as OpenDealRow[];
    const now = Date.now();

    const stalledDeals: StalledDeal[] = allOpenDeals
      .map((d) => {
        const dayTarget = d.day_target ?? PIPELINE_STAGE_DAY_TARGETS[d.stage] ?? 7;
        const daysStuck = Math.floor(
          (now - new Date(d.stage_entered_at).getTime()) / 86400000
        );
        return {
          id: d.id,
          company_name: d.coverage_lead?.company_name ?? null,
          address: d.coverage_lead?.address ?? '',
          stage: d.stage,
          stage_label: PIPELINE_STAGE_LABELS[d.stage],
          days_stuck: daysStuck,
          day_target: dayTarget,
          quote_mrr: d.quote_mrr,
        };
      })
      .filter((d) => d.days_stuck > d.day_target)
      .sort((a, b) => b.days_stuck - a.days_stuck);

    // -----------------------------------------------------------------------
    // 3. Follow Ups — open deals at quote_sent or objection_stage
    // -----------------------------------------------------------------------

    const { data: followUpRows, error: followUpError } = await supabase
      .from('sales_pipeline_stages')
      .select(
        'id, coverage_lead_id, stage, stage_entered_at, quote_mrr, ' +
        'coverage_lead:coverage_leads(id, address, company_name)'
      )
      .eq('outcome', 'open')
      .in('stage', ['quote_sent', 'objection_stage'])
      .order('stage_entered_at', { ascending: true })
      .limit(10);

    if (followUpError) {
      return { data: null, error: `Failed to fetch follow ups: ${followUpError.message}` };
    }

    type FollowUpRow = {
      id: string;
      coverage_lead_id: string;
      stage: PipelineStage;
      stage_entered_at: string;
      quote_mrr: number | null;
      coverage_lead: { id: string; address: string; company_name: string | null } | null;
    };

    const followUps: FollowUp[] = ((followUpRows ?? []) as unknown as FollowUpRow[]).map((f) => ({
      id: f.id,
      company_name: f.coverage_lead?.company_name ?? null,
      address: f.coverage_lead?.address ?? '',
      stage: f.stage,
      stage_label: PIPELINE_STAGE_LABELS[f.stage],
      last_activity: f.stage_entered_at,
      quote_mrr: f.quote_mrr,
    }));

    // -----------------------------------------------------------------------
    // 4. Zone Alerts — zones needing attention
    // -----------------------------------------------------------------------

    const reallocationResult = await getReallocationRecommendations();
    const zoneAlerts: ZoneAlert[] = (reallocationResult.data ?? [])
      .filter((r) => r.action !== 'maintain')
      .map((r) => ({
        zone_id: r.zone_id,
        zone_name: r.zone_name,
        action: r.action,
        avg_close_rate: r.avg_close_rate,
      }));

    // -----------------------------------------------------------------------
    // 5. MSC Snapshot — current period status
    // -----------------------------------------------------------------------

    const mscResult = await getMSCStatus();
    let mscSnapshot: MSCSnapshot | null = null;

    if (mscResult.data.current) {
      const period = mscResult.data.current;
      const periodEnd = new Date(period.period_end);
      const daysRemaining = Math.max(
        0,
        Math.ceil((periodEnd.getTime() - now) / 86400000)
      );

      mscSnapshot = {
        period_label: period.period_label,
        actual_rns: period.actual_rns,
        required_rns: period.required_rns,
        days_remaining: daysRemaining,
        status: period.status,
      };
    }

    // -----------------------------------------------------------------------
    // 6. Summary
    // -----------------------------------------------------------------------

    const pipelineMrr = allOpenDeals.reduce(
      (sum, d) => sum + (d.quote_mrr ?? 0),
      0
    );

    const dealsToClose = allOpenDeals.filter(
      (d) => d.stage === 'quote_sent' || d.stage === 'contract_signed'
    ).length;

    const briefing: DailyBriefing = {
      priority_calls: priorityCalls,
      stalled_deals: stalledDeals,
      follow_ups: followUps,
      zone_alerts: zoneAlerts,
      msc_snapshot: mscSnapshot,
      summary: {
        calls_needed: priorityCalls.length,
        pipeline_mrr: pipelineMrr,
        deals_to_close: dealsToClose,
      },
    };

    return { data: briefing, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}
