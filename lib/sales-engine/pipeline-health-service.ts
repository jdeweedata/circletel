/**
 * Pipeline Health & Forecast Service
 * Weighted pipeline MRR, stage velocity, conversion funnel,
 * aging deal detection, and MSC gap analysis.
 */

import { createClient } from '@/lib/supabase/server';
import { PIPELINE_STAGE_ORDER, PIPELINE_STAGE_LABELS, PipelineStage } from './types';
import { getMSCStatus } from './scorecard-service';

// Stage probability weights for weighted pipeline
const STAGE_WEIGHTS: Record<PipelineStage, number> = {
  coverage_confirmed: 0.10,
  contact_made: 0.20,
  site_survey_booked: 0.40,
  quote_sent: 0.60,
  objection_stage: 0.50,
  contract_signed: 0.90,
  installed_active: 1.0,
};

interface StageVelocity {
  stage: PipelineStage;
  label: string;
  avg_days: number;
  deal_count: number;
}

interface AgingDeal {
  id: string;
  company_name: string | null;
  address: string;
  stage: PipelineStage;
  stage_label: string;
  days_in_stage: number;
  quote_mrr: number | null;
  contact_method: string | null;
}

interface FunnelStep {
  stage: PipelineStage;
  label: string;
  entered: number;
  converted: number;
  conversion_rate: number;
}

export interface PipelineHealth {
  weighted_pipeline_mrr: number;
  total_open_mrr: number;
  msc_gap: number;
  avg_deal_cycle_days: number;
  bottleneck_stage: string;
  bottleneck_avg_days: number;
  stage_velocity: StageVelocity[];
  aging_deals: AgingDeal[];
  funnel: FunnelStep[];
  summary: {
    open_deals: number;
    won_this_period: number;
    weighted_mrr: number;
    projected_rns: number;
  };
}

export async function getPipelineHealth(): Promise<{ data: PipelineHealth | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Fetch all pipeline entries with coverage_lead data
    const { data: allEntries, error: entriesError } = await supabase
      .from('sales_pipeline_stages')
      .select(`
        *,
        coverage_lead:coverage_leads(id, address, company_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (entriesError) {
      return { data: null, error: entriesError.message };
    }

    type PipelineRow = {
      id: string;
      stage: string;
      stage_entered_at: string;
      outcome: string;
      quote_mrr: number | null;
      contact_method: string | null;
      created_at: string;
      updated_at: string;
      coverage_lead?: {
        id: string;
        address: string;
        company_name?: string | null;
        phone?: string | null;
      } | null;
    };

    const entries = (allEntries ?? []) as PipelineRow[];
    const openEntries = entries.filter((e) => e.outcome === 'open');
    const wonEntries = entries.filter((e) => e.outcome === 'won');

    // 1. Weighted pipeline MRR
    let weightedMRR = 0;
    for (const entry of openEntries) {
      const weight = STAGE_WEIGHTS[entry.stage as PipelineStage] ?? 0;
      weightedMRR += (Number(entry.quote_mrr) || 0) * weight;
    }
    weightedMRR = Math.round(weightedMRR);

    const totalOpenMRR = openEntries.reduce((sum, e) => sum + (Number(e.quote_mrr) || 0), 0);

    // 2. Average deal cycle from won deals (created_at to updated_at)
    const wonDealDurations = wonEntries.map((e) => {
      const created = new Date(e.created_at).getTime();
      const updated = new Date(e.updated_at).getTime();
      return (updated - created) / (1000 * 60 * 60 * 24); // days
    });
    const avgDealCycleDays = wonDealDurations.length > 0
      ? Math.round(wonDealDurations.reduce((a, b) => a + b, 0) / wonDealDurations.length)
      : 0;

    // 3. Per-stage velocity (avg dwell time for open deals)
    const stageVelocity: StageVelocity[] = [];

    for (const stage of PIPELINE_STAGE_ORDER) {
      const stageEntries = openEntries.filter((e) => e.stage === stage);
      const daysInStage = stageEntries.map((e) => {
        return Math.floor((Date.now() - new Date(e.stage_entered_at).getTime()) / 86400000);
      });
      const avgDays = daysInStage.length > 0
        ? Math.round(daysInStage.reduce((a, b) => a + b, 0) / daysInStage.length * 10) / 10
        : 0;

      stageVelocity.push({
        stage,
        label: PIPELINE_STAGE_LABELS[stage],
        avg_days: avgDays,
        deal_count: stageEntries.length,
      });
    }

    // 4. Bottleneck - stage with longest avg dwell time (from open deals)
    const activeStages = stageVelocity.filter((s) => s.deal_count > 0);
    const bottleneck = activeStages.length > 0
      ? activeStages.reduce((max, s) => s.avg_days > max.avg_days ? s : max, activeStages[0])
      : { label: 'None', avg_days: 0 };

    // 5. Aging deals (> 14 days in current stage)
    const agingDeals: AgingDeal[] = openEntries
      .map((e) => {
        const daysInStage = Math.floor((Date.now() - new Date(e.stage_entered_at).getTime()) / 86400000);
        return {
          id: e.id,
          company_name: e.coverage_lead?.company_name ?? null,
          address: e.coverage_lead?.address ?? 'Unknown',
          stage: e.stage as PipelineStage,
          stage_label: PIPELINE_STAGE_LABELS[e.stage as PipelineStage] || e.stage,
          days_in_stage: daysInStage,
          quote_mrr: e.quote_mrr,
          contact_method: e.contact_method,
        };
      })
      .filter((d) => d.days_in_stage > 14)
      .sort((a, b) => b.days_in_stage - a.days_in_stage);

    // 6. Conversion funnel - count entries that reached or passed each stage
    const funnel: FunnelStep[] = PIPELINE_STAGE_ORDER.map((stage, index) => {
      const entered = entries.filter((e) => {
        const stageIndex = PIPELINE_STAGE_ORDER.indexOf(e.stage as PipelineStage);
        return stageIndex >= index && (e.outcome === 'open' || e.outcome === 'won');
      }).length;
      const converted = entries.filter((e) => {
        const stageIndex = PIPELINE_STAGE_ORDER.indexOf(e.stage as PipelineStage);
        return stageIndex > index && (e.outcome === 'open' || e.outcome === 'won');
      }).length;
      return {
        stage,
        label: PIPELINE_STAGE_LABELS[stage],
        entered,
        converted,
        conversion_rate: entered > 0 ? Math.round((converted / entered) * 100) : 0,
      };
    });

    // 7. MSC gap calculation
    const mscResult = await getMSCStatus();
    const currentMSC = mscResult.data.current;
    const projectedRNs = Math.round(weightedMRR / 899); // Approximate: 1 RN ~ R899 avg
    const mscGap = currentMSC
      ? Math.max(0, currentMSC.required_rns - (currentMSC.actual_rns + projectedRNs))
      : 0;

    return {
      data: {
        weighted_pipeline_mrr: weightedMRR,
        total_open_mrr: totalOpenMRR,
        msc_gap: mscGap,
        avg_deal_cycle_days: avgDealCycleDays,
        bottleneck_stage: bottleneck.label,
        bottleneck_avg_days: bottleneck.avg_days,
        stage_velocity: stageVelocity,
        aging_deals: agingDeals,
        funnel,
        summary: {
          open_deals: openEntries.length,
          won_this_period: wonEntries.length,
          weighted_mrr: weightedMRR,
          projected_rns: projectedRNs,
        },
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Pipeline health error: ${message}` };
  }
}
