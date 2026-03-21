import { createClient } from '@/lib/supabase/server';
import { getReallocationRecommendations } from './scorecard-service';
import type { RecommendedAction } from './types';

export interface ZoneRecommendation {
  zone_id: string;
  zone_name: string;
  type: 'focus' | 'infrastructure' | 'park' | 'demographic_opportunity';
  reason: string;
  metrics: {
    unworked_leads?: number;
    enriched_zone_score?: number;
    propensity_score?: number;
    avg_close_rate?: number;
    coverage_confidence?: string;
    lead_demand?: number;
    pct_no_internet?: number;
    demographic_fit_score?: number;
  };
}

export interface WeeklyRecommendations {
  focus_zones: ZoneRecommendation[];
  infrastructure_priorities: ZoneRecommendation[];
  park_candidates: ZoneRecommendation[];
  demographic_opportunities: ZoneRecommendation[];
  generated_at: string;
}

export async function getWeeklyRecommendations(): Promise<{ data: WeeklyRecommendations | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get active zones with enrichment data
    const { data: zones, error: zonesError } = await supabase
      .from('sales_zones')
      .select('*')
      .eq('status', 'active')
      .order('enriched_zone_score', { ascending: false });

    if (zonesError) {
      return { data: null, error: zonesError.message };
    }

    const activeZones = zones ?? [];

    // Get lead counts per zone (unworked = in lead_scores but not in pipeline)
    const { data: leadScores } = await supabase
      .from('lead_scores')
      .select('zone_id, coverage_lead_id');

    const { data: pipelineEntries } = await supabase
      .from('sales_pipeline_stages')
      .select('coverage_lead_id');

    const pipelineCLIds = new Set((pipelineEntries ?? []).map((p: any) => p.coverage_lead_id));

    // Count unworked leads per zone
    const unworkedByZone: Record<string, number> = {};
    for (const ls of (leadScores ?? [])) {
      if (!pipelineCLIds.has(ls.coverage_lead_id)) {
        const zoneId = ls.zone_id || 'unassigned';
        unworkedByZone[zoneId] = (unworkedByZone[zoneId] || 0) + 1;
      }
    }

    // Get reallocation recommendations (includes close rates)
    const reallocResult = await getReallocationRecommendations();
    const reallocMap = new Map(
      (reallocResult.data ?? []).map((r) => [r.zone_id, r])
    );

    const focus_zones: ZoneRecommendation[] = [];
    const infrastructure_priorities: ZoneRecommendation[] = [];
    const park_candidates: ZoneRecommendation[] = [];
    const demographic_opportunities: ZoneRecommendation[] = [];

    for (const zone of activeZones) {
      const realloc = reallocMap.get(zone.id);
      const unworkedLeads = unworkedByZone[zone.id] || 0;

      // Use propensity_score when available, fall back to enriched_zone_score
      const effectiveScore = (zone.propensity_score ?? 0) > 0
        ? zone.propensity_score
        : (zone.enriched_zone_score ?? 0);

      // Focus zones: high unworked leads + good score
      if (unworkedLeads >= 5 && effectiveScore >= 50) {
        focus_zones.push({
          zone_id: zone.id,
          zone_name: zone.name,
          type: 'focus',
          reason: `${unworkedLeads} unworked leads with strong score (${effectiveScore})`,
          metrics: {
            unworked_leads: unworkedLeads,
            enriched_zone_score: zone.enriched_zone_score,
            propensity_score: zone.propensity_score,
            avg_close_rate: realloc?.avg_close_rate ?? 0,
          },
        });
      }

      // Infrastructure priorities: poor coverage but high lead demand
      if (
        (zone.coverage_confidence === 'none' || zone.coverage_confidence === 'low') &&
        unworkedLeads >= 3
      ) {
        infrastructure_priorities.push({
          zone_id: zone.id,
          zone_name: zone.name,
          type: 'infrastructure',
          reason: `${unworkedLeads} leads but ${zone.coverage_confidence || 'unknown'} coverage — needs infrastructure investment`,
          metrics: {
            coverage_confidence: zone.coverage_confidence || 'unknown',
            lead_demand: unworkedLeads,
          },
        });
      }

      // Demographic opportunities: high internet gap + coverage ready but few leads
      if (
        (zone.pct_no_internet ?? 0) >= 30 &&
        (zone.coverage_score ?? 0) >= 40 &&
        unworkedLeads < 3
      ) {
        demographic_opportunities.push({
          zone_id: zone.id,
          zone_name: zone.name,
          type: 'demographic_opportunity',
          reason: `${zone.pct_no_internet}% no-internet + coverage ready — canvass this ward`,
          metrics: {
            pct_no_internet: zone.pct_no_internet,
            demographic_fit_score: zone.demographic_fit_score,
            propensity_score: zone.propensity_score,
            coverage_confidence: zone.coverage_confidence || 'unknown',
          },
        });
      }

      // Park candidates: from reallocation recommendations
      if (realloc?.action === 'park_zone') {
        park_candidates.push({
          zone_id: zone.id,
          zone_name: zone.name,
          type: 'park',
          reason: `Close rate ${realloc.avg_close_rate}% for 3+ weeks — consider parking`,
          metrics: {
            avg_close_rate: realloc.avg_close_rate,
          },
        });
      }
    }

    // Sort by relevance
    focus_zones.sort((a, b) => (b.metrics.propensity_score ?? b.metrics.unworked_leads ?? 0) - (a.metrics.propensity_score ?? a.metrics.unworked_leads ?? 0));
    infrastructure_priorities.sort((a, b) => (b.metrics.lead_demand ?? 0) - (a.metrics.lead_demand ?? 0));
    demographic_opportunities.sort((a, b) => (b.metrics.pct_no_internet ?? 0) - (a.metrics.pct_no_internet ?? 0));

    return {
      data: {
        focus_zones,
        infrastructure_priorities,
        park_candidates,
        demographic_opportunities,
        generated_at: new Date().toISOString(),
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Zone recommendations error: ${message}` };
  }
}
