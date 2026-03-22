/**
 * Briefing Service
 * Aggregates data for the daily sales briefing: priority calls, stalled deals,
 * follow-ups, zone alerts, and MSC snapshot.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PipelineStage,
  RecommendedAction,
  MarketAlert,
  CompetitorIntelligenceSummary,
  ExecutionSnapshot,
} from './types';
import {
  PIPELINE_STAGE_DAY_TARGETS,
  PIPELINE_STAGE_LABELS,
} from './types';
import { getMSCStatus, getReallocationRecommendations } from './scorecard-service';
import { getAllProvinceMarketContexts } from './market-indicators-service';

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

export interface MarketContext {
  alerts: MarketAlert[];
  province_summary: string;
}

export interface DailyBriefing {
  priority_calls: BriefingLead[];
  stalled_deals: StalledDeal[];
  follow_ups: FollowUp[];
  zone_alerts: ZoneAlert[];
  msc_snapshot: MSCSnapshot | null;
  market_context: MarketContext | null;
  competitor_intelligence: CompetitorIntelligenceSummary | null;
  execution_status: {
    current_mrr: number;
    target_mrr: number;
    attainment_pct: number;
    msc_coverage_ratio: number;
    phase: string;
    alerts_count: number;
  } | null;
  summary: {
    calls_needed: number;
    pipeline_mrr: number;
    deals_to_close: number;
  };
}

// =============================================================================
// Sniper Briefing Types
// =============================================================================

export interface SniperTarget {
  zone_id: string;
  zone_name: string;
  zone_type: string;
  suburb: string | null;
  province: string;
  composite_score: number;
  routing: 'tarana_primary' | 'arlan_primary' | 'dual_funnel';
  campaign_tag: string | null;
  campaign_name: string | null;
  rationale: string[];
  primary_product: string;
  arlan_deal_categories: string[];
  estimated_zone_mrr: number;
  demand_signal_count: number;
  demand_checks_last_7d: number;
  unworked_leads: number;
  open_deals: number;
  stalled_deals: number;
  coverage_confidence: string | null;
  business_poi_density: number;
  pct_no_internet: number;
}

export interface ArlanWeeklyTargets {
  data_connectivity: { target: number; current: number };
  backup_connectivity: { target: number; current: number };
  iot_m2m: { target: number; current: number };
  fleet_management: { target: number; current: number };
  made_for_business: { target: number; current: number };
}

export interface WeeklyBriefing extends DailyBriefing {
  sniper_targets: SniperTarget[];
  arlan_weekly_targets: ArlanWeeklyTargets;
  weekly_focus_summary: string;
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

    // -----------------------------------------------------------------------
    // 6. Market Context — provincial economic signals for active zones
    // -----------------------------------------------------------------------
    let marketContext: MarketContext | null = null;
    try {
      const { data: activeZones } = await supabase
        .from('sales_zones')
        .select('province')
        .eq('status', 'active');

      const provinces = [...new Set((activeZones ?? []).map((z) => z.province).filter(Boolean))];

      if (provinces.length > 0) {
        const mcResult = await getAllProvinceMarketContexts();
        if (mcResult.data) {
          const relevantContexts = mcResult.data.filter((c) => provinces.includes(c.province));
          const alerts: MarketAlert[] = [];

          for (const ctx of relevantContexts) {
            if (ctx.employment_change !== null && ctx.employment_change < -40000) {
              alerts.push({
                province: ctx.province,
                signal: 'Employment declining',
                detail: `${ctx.province} lost ${Math.abs(ctx.employment_change).toLocaleString()} jobs in Q1 2025`,
                impact: 'negative',
                recommendation: 'Expect longer sales cycles — emphasize cost savings and ROI',
              });
            }
            if (ctx.home_internet_pct !== null && ctx.home_internet_pct < 10) {
              alerts.push({
                province: ctx.province,
                signal: 'Greenfield territory',
                detail: `Only ${ctx.home_internet_pct}% have home internet in ${ctx.province}`,
                impact: 'positive',
                recommendation: 'Lead with coverage advantage — minimal competition',
              });
            }
            if (ctx.home_internet_pct !== null && ctx.home_internet_pct < 20 && ctx.home_internet_pct >= 10) {
              alerts.push({
                province: ctx.province,
                signal: 'Low broadband penetration',
                detail: `${ctx.home_internet_pct}% home internet in ${ctx.province}`,
                impact: 'positive',
                recommendation: 'Prime territory for canvassing — low fixed broadband competition',
              });
            }
            if (ctx.five_g_coverage_pct !== null && ctx.five_g_coverage_pct > 70) {
              alerts.push({
                province: ctx.province,
                signal: 'Strong 5G competition',
                detail: `${ctx.five_g_coverage_pct}% 5G coverage in ${ctx.province}`,
                impact: 'neutral',
                recommendation: 'Emphasize reliability, SLA guarantees, and dedicated bandwidth vs shared 5G',
              });
            }
            if (ctx.employment_trend === 'growing') {
              alerts.push({
                province: ctx.province,
                signal: 'Job growth',
                detail: `${ctx.province} added ${ctx.employment_change?.toLocaleString()} jobs`,
                impact: 'positive',
                recommendation: 'Growing market — expand zone coverage and increase canvassing',
              });
            }
          }

          const positiveCount = alerts.filter((a) => a.impact === 'positive').length;
          const negativeCount = alerts.filter((a) => a.impact === 'negative').length;
          const provinceSummary = `${positiveCount} positive and ${negativeCount} negative market signals across ${provinces.length} zone province${provinces.length > 1 ? 's' : ''}`;

          marketContext = { alerts, province_summary: provinceSummary };
        }
      }
    } catch {
      // Market context is supplementary — don't fail the briefing
    }

    // -----------------------------------------------------------------------
    // 7. Competitor Intelligence — recent price changes and positions
    // -----------------------------------------------------------------------
    let competitorIntelligence: CompetitorIntelligenceSummary | null = null;
    try {
      const { getCompetitorAlertsSummary } = await import('./competitor-intelligence-service');
      const ciResult = await getCompetitorAlertsSummary();
      if (ciResult.data) {
        competitorIntelligence = ciResult.data;
      }
    } catch {
      // Competitor intelligence is supplementary — don't fail the briefing
    }

    // -----------------------------------------------------------------------
    // 8. Execution Plan Status — MRR vs targets
    // -----------------------------------------------------------------------
    let executionStatus: DailyBriefing['execution_status'] = null;
    try {
      const { getExecutionSnapshot } = await import('./execution-plan-service');
      const epResult = await getExecutionSnapshot();
      if (epResult.data) {
        const snap = epResult.data;
        executionStatus = {
          current_mrr: snap.total_mrr,
          target_mrr: snap.target_mrr,
          attainment_pct: snap.mrr_attainment_pct,
          msc_coverage_ratio: snap.msc_coverage_ratio,
          phase: snap.current_phase,
          alerts_count: snap.alerts.length,
        };
      }
    } catch {
      // Execution status is supplementary — don't fail the briefing
    }

    const briefing: DailyBriefing = {
      priority_calls: priorityCalls,
      stalled_deals: stalledDeals,
      follow_ups: followUps,
      zone_alerts: zoneAlerts,
      msc_snapshot: mscSnapshot,
      market_context: marketContext,
      competitor_intelligence: competitorIntelligence,
      execution_status: executionStatus,
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

// =============================================================================
// Weekly Sniper Briefing
// =============================================================================

/**
 * Get the weekly sniper briefing — extends the daily briefing with
 * top-scored zone targets, Arlan category targets, and a focus summary.
 */
export async function getWeeklyBriefing(): Promise<{
  data: WeeklyBriefing | null;
  error: string | null;
}> {
  try {
    // 1. Get the daily briefing as the base
    const dailyResult = await getDailyBriefing();
    if (dailyResult.error || !dailyResult.data) {
      return { data: null, error: dailyResult.error ?? 'Failed to load daily briefing' };
    }

    const supabase = await createClient();
    const { CAMPAIGN_DEFINITIONS } = await import('./campaign-service');

    // 2. Fetch top 5 active zones by enriched_zone_score
    const { data: topZones, error: zonesError } = await supabase
      .from('sales_zones')
      .select(
        'id, name, zone_type, suburb, province, zone_score, coverage_confidence, ' +
        'base_station_count, dfa_connected_count, business_poi_density, pct_no_internet, ' +
        'propensity_score, campaign_tag, arlan_routing, demand_signal_count, ' +
        'enriched_zone_score, coverage_score'
      )
      .gt('enriched_zone_score', 0)
      .order('enriched_zone_score', { ascending: false })
      .limit(5);

    if (zonesError) {
      return { data: null, error: `Failed to fetch top zones: ${zonesError.message}` };
    }

    type ZoneRow = {
      id: string;
      name: string;
      zone_type: string;
      suburb: string | null;
      province: string;
      zone_score: number;
      coverage_confidence: string | null;
      base_station_count: number;
      dfa_connected_count: number;
      business_poi_density: number;
      pct_no_internet: number;
      propensity_score: number;
      campaign_tag: string | null;
      arlan_routing: 'tarana_primary' | 'arlan_primary' | 'dual_funnel';
      demand_signal_count: number;
      enriched_zone_score: number;
      coverage_score: number;
    };

    const zones = (topZones ?? []) as unknown as ZoneRow[];
    const now = Date.now();

    // 3. Build sniper targets for each zone
    const sniperTargets: SniperTarget[] = [];

    for (const zone of zones) {
      // Count unworked leads in this zone
      const { count: unworkedLeadCount } = await supabase
        .from('lead_scores')
        .select('id', { count: 'exact', head: true })
        .eq('zone_id', zone.id);

      // Fetch open pipeline deals for this zone
      const { data: zoneOpenDeals } = await supabase
        .from('sales_pipeline_stages')
        .select('id, stage, stage_entered_at, day_target')
        .eq('zone_id', zone.id)
        .not('stage', 'in', '("installed_active","lost")');

      const openDealsList = zoneOpenDeals ?? [];
      const openDealCount = openDealsList.length;

      // Count stalled deals (days_stuck > stage target)
      const stalledCount = openDealsList.filter((d) => {
        const dayTarget =
          d.day_target ??
          PIPELINE_STAGE_DAY_TARGETS[d.stage as PipelineStage] ??
          7;
        const daysStuck = Math.floor(
          (now - new Date(d.stage_entered_at).getTime()) / 86400000
        );
        return daysStuck > dayTarget;
      }).length;

      // Look up campaign name from definitions
      const campaignDef = zone.campaign_tag
        ? CAMPAIGN_DEFINITIONS.find((c) => c.tag === zone.campaign_tag)
        : null;

      // Build rationale array from actual data
      const rationale: string[] = [];
      if (zone.demand_signal_count > 0) {
        rationale.push(`${zone.demand_signal_count} demand signals detected`);
      }
      if ((unworkedLeadCount ?? 0) > 0) {
        rationale.push(`${unworkedLeadCount} unworked leads awaiting contact`);
      }
      if (zone.campaign_tag && campaignDef) {
        rationale.push(`Active campaign: ${campaignDef.name}`);
      }
      if (zone.pct_no_internet > 30) {
        rationale.push(`${zone.pct_no_internet.toFixed(0)}% without internet — greenfield opportunity`);
      }
      if (zone.business_poi_density > 10) {
        rationale.push(`High business density: ${zone.business_poi_density.toFixed(0)} POIs`);
      }
      if (zone.coverage_confidence === 'high') {
        rationale.push('High coverage confidence — ready for deployment');
      }

      // Determine primary product and Arlan deal categories from campaign or routing
      const primaryProduct = campaignDef?.primary_product ??
        (zone.arlan_routing === 'tarana_primary'
          ? 'SkyFibre SMB 100/25'
          : zone.arlan_routing === 'arlan_primary'
            ? 'Arlan Data Connectivity'
            : 'SkyFibre + Arlan Bundle');

      const arlanDealCategories = campaignDef?.arlan_deal_categories ?? [];

      // Estimate zone MRR based on unworked leads and propensity
      const estimatedZoneMrr =
        (unworkedLeadCount ?? 0) * (zone.propensity_score ?? 0.3) * 1299;

      sniperTargets.push({
        zone_id: zone.id,
        zone_name: zone.name,
        zone_type: zone.zone_type,
        suburb: zone.suburb,
        province: zone.province,
        composite_score: zone.enriched_zone_score,
        routing: zone.arlan_routing ?? 'dual_funnel',
        campaign_tag: zone.campaign_tag,
        campaign_name: campaignDef?.name ?? null,
        rationale,
        primary_product: primaryProduct,
        arlan_deal_categories: arlanDealCategories,
        estimated_zone_mrr: Math.round(estimatedZoneMrr),
        demand_signal_count: zone.demand_signal_count ?? 0,
        demand_checks_last_7d: 0, // Requires spatial join — populated by enrichment jobs
        unworked_leads: unworkedLeadCount ?? 0,
        open_deals: openDealCount,
        stalled_deals: stalledCount,
        coverage_confidence: zone.coverage_confidence,
        business_poi_density: zone.business_poi_density ?? 0,
        pct_no_internet: zone.pct_no_internet ?? 0,
      });
    }

    // 4. Build Arlan weekly targets (PR #473 strategy)
    const arlanWeeklyTargets: ArlanWeeklyTargets = {
      data_connectivity: { target: 3, current: 0 },
      backup_connectivity: { target: 2, current: 0 },
      iot_m2m: { target: 2, current: 0 },
      fleet_management: { target: 1, current: 0 },
      made_for_business: { target: 2, current: 0 },
    };

    // 5. Build deterministic focus summary
    const topTarget = sniperTargets[0];
    const weeklyFocusSummary = topTarget
      ? `This week focus on ${topTarget.zone_name} (${topTarget.province}) — ` +
        `score ${topTarget.composite_score.toFixed(0)}, ` +
        `${topTarget.unworked_leads} unworked leads, ` +
        `routing: ${topTarget.routing.replace(/_/g, ' ')}. ` +
        `Primary product: ${topTarget.primary_product}.`
      : 'No active zones with enriched scores — run zone enrichment first.';

    // 6. Combine into WeeklyBriefing
    const weeklyBriefing: WeeklyBriefing = {
      ...dailyResult.data,
      sniper_targets: sniperTargets,
      arlan_weekly_targets: arlanWeeklyTargets,
      weekly_focus_summary: weeklyFocusSummary,
    };

    return { data: weeklyBriefing, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: message };
  }
}
