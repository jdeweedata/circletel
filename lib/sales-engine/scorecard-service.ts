/**
 * Scorecard Service
 * Weekly zone performance tracking, MSC monitoring, and reallocation
 * recommendations for CircleTel's Sales Engine.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ZoneMetric,
  RecordMetricsInput,
  MSCPeriod,
  SalesEngineSummary,
  RecommendedAction,
} from './types';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get the Monday of the current week as YYYY-MM-DD.
 */
function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// =============================================================================
// Weekly Scorecard
// =============================================================================

/**
 * Get the weekly scorecard for all zones for a given week.
 * Defaults to the current week's Monday if no weekStart is provided.
 * Joins with sales_zones for zone metadata.
 */
export async function getWeeklyScorecard(
  weekStart?: string
): Promise<{ data: ZoneMetric[]; error: string | null }> {
  const supabase = await createClient();
  const targetWeek = weekStart ?? getCurrentMonday();

  const { data, error } = await supabase
    .from('zone_metrics')
    .select('*, zone:sales_zones(id, name, zone_type, status, priority, province, suburb, serviceable_addresses, active_customers, zone_score)')
    .eq('week_start', targetWeek)
    .order('zone_id');

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as ZoneMetric[], error: null };
}

/**
 * Record or update weekly metrics for a zone.
 * Upserts on the UNIQUE constraint (zone_id, week_start).
 * Auto-computes penetration_rate, coverage_to_lead_rate, and lead_to_close_rate.
 */
export async function recordWeeklyMetrics(
  input: RecordMetricsInput
): Promise<{ data: ZoneMetric | null; error: string | null }> {
  const supabase = await createClient();

  const serviceableAddresses = input.serviceable_addresses ?? 0;
  const activeCustomers = input.active_customers ?? 0;
  const addressesCanvassed = input.addresses_canvassed ?? 0;
  const leadsGenerated = input.leads_generated ?? 0;
  const qualifiedLeads = input.qualified_leads ?? 0;
  const closedDeals = input.closed_deals ?? 0;

  // Compute derived rates
  const penetrationRate =
    serviceableAddresses > 0
      ? (activeCustomers / serviceableAddresses) * 100
      : 0;

  const coverageToLeadRate =
    addressesCanvassed > 0
      ? (leadsGenerated / addressesCanvassed) * 100
      : 0;

  const leadToCloseRate =
    qualifiedLeads > 0
      ? (closedDeals / qualifiedLeads) * 100
      : 0;

  const record = {
    zone_id: input.zone_id,
    week_start: input.week_start,
    serviceable_addresses: serviceableAddresses,
    active_customers: activeCustomers,
    penetration_rate: Math.round(penetrationRate * 100) / 100,
    addresses_canvassed: addressesCanvassed,
    leads_generated: leadsGenerated,
    coverage_to_lead_rate: Math.round(coverageToLeadRate * 100) / 100,
    qualified_leads: qualifiedLeads,
    closed_deals: closedDeals,
    lead_to_close_rate: Math.round(leadToCloseRate * 100) / 100,
    new_mrr_added: input.new_mrr_added ?? 0,
    total_zone_mrr: input.total_zone_mrr ?? 0,
    cost_per_activation: input.cost_per_activation ?? 0,
    active_rns: input.active_rns ?? 0,
    linkedin_contacts: input.linkedin_contacts ?? 0,
    whatsapp_contacts: input.whatsapp_contacts ?? 0,
    walk_ins: input.walk_ins ?? 0,
    referrals_generated: input.referrals_generated ?? 0,
  };

  const { data, error } = await supabase
    .from('zone_metrics')
    .upsert(record, { onConflict: 'zone_id,week_start' })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as ZoneMetric, error: null };
}

/**
 * Get the last N weeks of metrics for a specific zone.
 * Defaults to 8 weeks. Ordered most recent first.
 */
export async function getZoneTrend(
  zoneId: string,
  weeks: number = 8
): Promise<{ data: ZoneMetric[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('zone_metrics')
    .select('*, zone:sales_zones(id, name, zone_type, status, priority)')
    .eq('zone_id', zoneId)
    .order('week_start', { ascending: false })
    .limit(weeks);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as ZoneMetric[], error: null };
}

// =============================================================================
// MSC (Minimum Spend Commitment)
// =============================================================================

/**
 * Get all MSC periods and determine the current active period based on today's date.
 */
export async function getMSCStatus(): Promise<{
  data: { periods: MSCPeriod[]; current: MSCPeriod | null };
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('msc_periods')
    .select('*')
    .order('period_start', { ascending: true });

  if (error) {
    return { data: { periods: [], current: null }, error: error.message };
  }

  const periods = (data ?? []) as MSCPeriod[];
  const today = new Date().toISOString().split('T')[0];

  const current = periods.find(
    (p) => p.period_start <= today && p.period_end >= today
  ) ?? null;

  return { data: { periods, current }, error: null };
}

/**
 * Update an MSC period's actual RNs and spend.
 */
export async function updateMSC(
  id: string,
  actual_rns: number,
  actual_spend: number
): Promise<{ data: MSCPeriod | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('msc_periods')
    .update({ actual_rns, actual_spend })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as MSCPeriod, error: null };
}

// =============================================================================
// Reallocation Recommendations
// =============================================================================

/**
 * Analyse the last 3 weeks of metrics for each active zone and recommend
 * resource reallocation actions.
 *
 * Logic:
 * - avg lead_to_close_rate > 20% → 'increase_effort'
 * - avg lead_to_close_rate 10-20% → 'change_message'
 * - avg lead_to_close_rate < 10% for all 3 weeks → 'park_zone'
 * - Otherwise → 'maintain'
 */
export async function getReallocationRecommendations(): Promise<{
  data: { zone_id: string; zone_name: string; avg_close_rate: number; action: RecommendedAction }[];
  error: string | null;
}> {
  const supabase = await createClient();

  // Get active zones
  const { data: zones, error: zoneError } = await supabase
    .from('sales_zones')
    .select('id, name')
    .eq('status', 'active');

  if (zoneError) {
    return { data: [], error: zoneError.message };
  }

  const activeZones = zones ?? [];

  if (activeZones.length === 0) {
    return { data: [], error: null };
  }

  // Get last 3 weeks of metrics for all active zones
  const zoneIds = activeZones.map((z: { id: string; name: string }) => z.id);

  const { data: metrics, error: metricsError } = await supabase
    .from('zone_metrics')
    .select('zone_id, week_start, lead_to_close_rate')
    .in('zone_id', zoneIds)
    .order('week_start', { ascending: false });

  if (metricsError) {
    return { data: [], error: metricsError.message };
  }

  const allMetrics = metrics ?? [];

  type MetricRow = { zone_id: string; week_start: string; lead_to_close_rate: number | null };
  const typedMetrics = allMetrics as MetricRow[];

  const recommendations = activeZones.map((zone: { id: string; name: string }) => {
    const zoneMetrics = typedMetrics
      .filter((m: MetricRow) => m.zone_id === zone.id)
      .slice(0, 3); // Most recent 3 weeks

    if (zoneMetrics.length === 0) {
      return {
        zone_id: zone.id,
        zone_name: zone.name,
        avg_close_rate: 0,
        action: 'maintain' as RecommendedAction,
      };
    }

    const avgCloseRate =
      zoneMetrics.reduce((sum: number, m: MetricRow) => sum + (m.lead_to_close_rate ?? 0), 0) /
      zoneMetrics.length;

    let action: RecommendedAction;

    if (avgCloseRate > 20) {
      action = 'increase_effort';
    } else if (avgCloseRate >= 10) {
      action = 'change_message';
    } else if (
      zoneMetrics.length >= 3 &&
      zoneMetrics.every((m: MetricRow) => (m.lead_to_close_rate ?? 0) < 10)
    ) {
      action = 'park_zone';
    } else {
      action = 'maintain';
    }

    return {
      zone_id: zone.id,
      zone_name: zone.name,
      avg_close_rate: Math.round(avgCloseRate * 100) / 100,
      action,
    };
  });

  return { data: recommendations, error: null };
}

// =============================================================================
// Dashboard Summary
// =============================================================================

/**
 * Get a comprehensive Sales Engine summary for the dashboard.
 * Aggregates zone counts, lead scores, pipeline status, penetration, RNs, and MSC.
 */
export async function getSalesEngineSummary(): Promise<{
  data: SalesEngineSummary | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Run queries in parallel for performance
  const [zonesResult, leadsResult, pipelineResult, mscResult] = await Promise.all([
    supabase
      .from('sales_zones')
      .select('id, status, serviceable_addresses, active_customers'),

    supabase
      .from('lead_scores')
      .select('id, composite_score'),

    supabase
      .from('sales_pipeline_stages')
      .select('id, outcome, quote_mrr'),

    getMSCStatus(),
  ]);

  if (zonesResult.error) {
    return { data: null, error: zonesResult.error.message };
  }
  if (leadsResult.error) {
    return { data: null, error: leadsResult.error.message };
  }
  if (pipelineResult.error) {
    return { data: null, error: pipelineResult.error.message };
  }
  if (mscResult.error) {
    return { data: null, error: mscResult.error };
  }

  type ZoneRow = { id: string; status: string; serviceable_addresses: number | null; active_customers: number | null };
  type LeadRow = { id: string; composite_score: number | null };
  type PipelineRow = { id: string; outcome: string; quote_mrr: number | null };

  const zones = (zonesResult.data ?? []) as ZoneRow[];
  const leads = (leadsResult.data ?? []) as LeadRow[];
  const pipeline = (pipelineResult.data ?? []) as PipelineRow[];

  const totalZones = zones.length;
  const activeZones = zones.filter((z: ZoneRow) => z.status === 'active').length;

  const totalLeadsScored = leads.length;
  const avgLeadScore =
    leads.length > 0
      ? Math.round(
          (leads.reduce((sum: number, l: LeadRow) => sum + (l.composite_score ?? 0), 0) / leads.length) * 100
        ) / 100
      : 0;

  const pipelineOpen = pipeline.filter((p: PipelineRow) => p.outcome === 'open').length;
  const pipelineWon = pipeline.filter((p: PipelineRow) => p.outcome === 'won').length;
  const pipelineLost = pipeline.filter((p: PipelineRow) => p.outcome === 'lost').length;

  const totalPipelineMrr = pipeline
    .filter((p: PipelineRow) => p.outcome === 'open' || p.outcome === 'won')
    .reduce((sum: number, p: PipelineRow) => sum + (p.quote_mrr ?? 0), 0);

  const totalServiceable = zones.reduce((sum: number, z: ZoneRow) => sum + (z.serviceable_addresses ?? 0), 0);
  const totalActive = zones.reduce((sum: number, z: ZoneRow) => sum + (z.active_customers ?? 0), 0);
  const overallPenetrationRate =
    totalServiceable > 0
      ? Math.round((totalActive / totalServiceable) * 100 * 100) / 100
      : 0;

  // Get total active RNs from most recent zone_metrics
  const { data: latestMetrics } = await supabase
    .from('zone_metrics')
    .select('active_rns')
    .order('week_start', { ascending: false })
    .limit(zones.length > 0 ? zones.length : 1);

  const totalActiveRns = ((latestMetrics ?? []) as { active_rns: number | null }[]).reduce(
    (sum: number, m: { active_rns: number | null }) => sum + (m.active_rns ?? 0),
    0
  );

  const summary: SalesEngineSummary = {
    total_zones: totalZones,
    active_zones: activeZones,
    total_leads_scored: totalLeadsScored,
    avg_lead_score: avgLeadScore,
    pipeline_open: pipelineOpen,
    pipeline_won: pipelineWon,
    pipeline_lost: pipelineLost,
    total_pipeline_mrr: totalPipelineMrr,
    overall_penetration_rate: overallPenetrationRate,
    total_active_rns: totalActiveRns,
    msc_current: mscResult.data.current,
  };

  return { data: summary, error: null };
}
