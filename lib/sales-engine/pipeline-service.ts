/**
 * Pipeline Service
 * Manages the 7-stage sales pipeline for CircleTel's Sales Engine.
 * Handles deal progression, loss tracking, and pipeline analytics.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  PipelineEntry,
  CreatePipelineInput,
  AdvanceStageInput,
  PipelineStageSummary,
  PipelineStage,
  ObjectionCategory,
  PipelineOutcome,
} from './types';
import {
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_DAY_TARGETS,
} from './types';

// =============================================================================
// Pipeline CRUD
// =============================================================================

/**
 * Create a new pipeline entry for a coverage lead.
 * Sets the initial stage (default: coverage_confirmed) and computes day_target
 * from PIPELINE_STAGE_DAY_TARGETS.
 */
export async function createPipelineEntry(
  input: CreatePipelineInput
): Promise<{ data: PipelineEntry | null; error: string | null }> {
  const supabase = await createClient();

  const stage: PipelineStage = input.stage ?? 'coverage_confirmed';
  const dayTarget = input.day_target ?? PIPELINE_STAGE_DAY_TARGETS[stage];

  const { data, error } = await supabase
    .from('sales_pipeline_stages')
    .insert({
      coverage_lead_id: input.coverage_lead_id,
      zone_id: input.zone_id ?? null,
      lead_score_id: input.lead_score_id ?? null,
      stage,
      stage_entered_at: new Date().toISOString(),
      day_target: dayTarget,
      contact_method: input.contact_method ?? null,
      outcome: 'open' as PipelineOutcome,
    })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as PipelineEntry, error: null };
}

/**
 * Advance a pipeline entry to the next stage.
 * Updates stage, resets stage_entered_at, and applies any additional field updates.
 */
export async function advanceStage(
  input: AdvanceStageInput
): Promise<{ data: PipelineEntry | null; error: string | null }> {
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {
    stage: input.stage,
    stage_entered_at: new Date().toISOString(),
    day_target: PIPELINE_STAGE_DAY_TARGETS[input.stage],
  };

  if (input.contact_method !== undefined) updatePayload.contact_method = input.contact_method;
  if (input.decision_maker_confirmed !== undefined) updatePayload.decision_maker_confirmed = input.decision_maker_confirmed;
  if (input.quote_mrr !== undefined) updatePayload.quote_mrr = input.quote_mrr;
  if (input.product_tier !== undefined) updatePayload.product_tier = input.product_tier;
  if (input.contract_type !== undefined) updatePayload.contract_type = input.contract_type;
  if (input.objection_category !== undefined) updatePayload.objection_category = input.objection_category;
  if (input.outcome !== undefined) updatePayload.outcome = input.outcome;
  if (input.loss_reason !== undefined) updatePayload.loss_reason = input.loss_reason;
  if (input.loss_competitor !== undefined) updatePayload.loss_competitor = input.loss_competitor;

  const { data, error } = await supabase
    .from('sales_pipeline_stages')
    .update(updatePayload)
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as PipelineEntry, error: null };
}

/**
 * Record a lost deal with reason and optional competitor.
 */
export async function recordLoss(
  id: string,
  loss_reason: string,
  loss_competitor?: string
): Promise<{ data: PipelineEntry | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sales_pipeline_stages')
    .update({
      outcome: 'lost' as PipelineOutcome,
      loss_reason,
      loss_competitor: loss_competitor ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as PipelineEntry, error: null };
}

// =============================================================================
// Pipeline Queries
// =============================================================================

/**
 * Get all pipeline entries for a specific zone, joined with coverage_leads.
 */
export async function getPipelineByZone(
  zoneId: string
): Promise<{ data: PipelineEntry[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sales_pipeline_stages')
    .select('*, coverage_lead:coverage_leads(id, address, latitude, longitude, status, customer_type, company_name, phone, created_at)')
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as PipelineEntry[], error: null };
}

/**
 * Get pipeline summary: count and total MRR per stage.
 * Optionally filtered by zone.
 */
export async function getPipelineSummary(
  zoneId?: string
): Promise<{ data: PipelineStageSummary[]; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from('sales_pipeline_stages')
    .select('stage, quote_mrr, outcome');

  if (zoneId) {
    query = query.eq('zone_id', zoneId);
  }

  // Only count open/won deals in the summary (not lost/parked)
  query = query.in('outcome', ['open', 'won']);

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = (data ?? []) as { stage: string; quote_mrr: number | null; outcome: string }[];

  const summary: PipelineStageSummary[] = PIPELINE_STAGE_ORDER.map((stage) => {
    const stageRows = rows.filter((r: { stage: string }) => r.stage === stage);
    const totalMrr = stageRows.reduce((sum: number, r: { quote_mrr: number | null }) => sum + (r.quote_mrr ?? 0), 0);
    return {
      stage,
      label: PIPELINE_STAGE_LABELS[stage],
      count: stageRows.length,
      total_mrr: totalMrr,
    };
  });

  return { data: summary, error: null };
}

/**
 * Get objection patterns grouped by category.
 * Returns counts per objection_category for deals in the objection stage.
 */
export async function getObjectionPatterns(
  zoneId?: string
): Promise<{ data: { category: ObjectionCategory; count: number }[]; error: string | null }> {
  const supabase = await createClient();

  let query = supabase
    .from('sales_pipeline_stages')
    .select('objection_category')
    .not('objection_category', 'is', null);

  if (zoneId) {
    query = query.eq('zone_id', zoneId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = data ?? [];
  const counts = new Map<ObjectionCategory, number>();

  for (const row of rows) {
    const cat = row.objection_category as ObjectionCategory;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  const result = Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return { data: result, error: null };
}

/**
 * Get loss patterns for lost deals, grouped by competitor and reason.
 */
export async function getLossPatterns(
  zoneId?: string
): Promise<{
  data: { loss_competitor: string | null; loss_reason: string | null; count: number }[];
  error: string | null;
}> {
  const supabase = await createClient();

  let query = supabase
    .from('sales_pipeline_stages')
    .select('loss_competitor, loss_reason')
    .eq('outcome', 'lost');

  if (zoneId) {
    query = query.eq('zone_id', zoneId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = data ?? [];
  const groupKey = (r: { loss_competitor: string | null; loss_reason: string | null }) =>
    `${r.loss_competitor ?? '__none__'}::${r.loss_reason ?? '__none__'}`;

  const counts = new Map<string, { loss_competitor: string | null; loss_reason: string | null; count: number }>();

  for (const row of rows) {
    const key = groupKey(row);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        loss_competitor: row.loss_competitor,
        loss_reason: row.loss_reason,
        count: 1,
      });
    }
  }

  const result = Array.from(counts.values()).sort((a, b) => b.count - a.count);

  return { data: result, error: null };
}

/**
 * Get paginated pipeline entries with optional filters and joined data.
 */
export async function getPipelineEntries(options: {
  zone_id?: string;
  stage?: PipelineStage;
  outcome?: PipelineOutcome;
  limit?: number;
  offset?: number;
}): Promise<{ data: PipelineEntry[]; count: number; error: string | null }> {
  const supabase = await createClient();

  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;

  let query = supabase
    .from('sales_pipeline_stages')
    .select(
      '*, coverage_lead:coverage_leads(id, address, latitude, longitude, status, customer_type, company_name, phone, created_at), lead_score:lead_scores(id, composite_score, recommended_product, estimated_mrr), zone:sales_zones(id, name, zone_type, status, priority)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.zone_id) {
    query = query.eq('zone_id', options.zone_id);
  }
  if (options.stage) {
    query = query.eq('stage', options.stage);
  }
  if (options.outcome) {
    query = query.eq('outcome', options.outcome);
  }

  const { data, count, error } = await query;

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  return {
    data: (data ?? []) as PipelineEntry[],
    count: count ?? 0,
    error: null,
  };
}
