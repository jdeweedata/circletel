import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/pipeline
 * List pipeline entries joined with coverage_leads
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const zoneId = searchParams.get('zone_id');
    const stage = searchParams.get('stage');
    const outcome = searchParams.get('outcome');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('pipeline')
      .select('*, coverage_leads(address, company_name, phone)', { count: 'exact' })
      .order('stage_entered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (outcome) {
      query = query.eq('outcome', outcome);
    }

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('[Sales Engine] Error fetching pipeline', { error: error.message });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      total_count: count,
      limit,
      offset,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Pipeline GET error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sales-engine/pipeline
 * Create a new pipeline entry
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      coverage_lead_id,
      zone_id,
      lead_score_id,
      contact_method,
      stage,
    } = body;

    if (!coverage_lead_id) {
      return NextResponse.json(
        { error: 'Missing required field: coverage_lead_id', success: false },
        { status: 400 }
      );
    }

    const insertPayload: Record<string, unknown> = {
      coverage_lead_id,
      stage: stage || 'coverage_confirmed',
      stage_entered_at: new Date().toISOString(),
    };

    if (zone_id) insertPayload.zone_id = zone_id;
    if (lead_score_id) insertPayload.lead_score_id = lead_score_id;
    if (contact_method) insertPayload.contact_method = contact_method;

    const { data, error } = await supabase
      .from('pipeline')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error creating pipeline entry', { error: error.message });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info('[Sales Engine] Pipeline entry created', {
      pipeline_id: data.id,
      coverage_lead_id,
      stage: insertPayload.stage,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Pipeline POST error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sales-engine/pipeline
 * Advance stage or update a pipeline entry
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      id,
      stage,
      contact_method,
      decision_maker_confirmed,
      quote_mrr,
      product_tier,
      contract_type,
      objection_category,
      outcome,
      loss_reason,
      loss_competitor,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id', success: false },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (stage !== undefined) {
      updatePayload.stage = stage;
      updatePayload.stage_entered_at = new Date().toISOString();
    }
    if (contact_method !== undefined) updatePayload.contact_method = contact_method;
    if (decision_maker_confirmed !== undefined) updatePayload.decision_maker_confirmed = decision_maker_confirmed;
    if (quote_mrr !== undefined) updatePayload.quote_mrr = quote_mrr;
    if (product_tier !== undefined) updatePayload.product_tier = product_tier;
    if (contract_type !== undefined) updatePayload.contract_type = contract_type;
    if (objection_category !== undefined) updatePayload.objection_category = objection_category;
    if (outcome !== undefined) updatePayload.outcome = outcome;
    if (loss_reason !== undefined) updatePayload.loss_reason = loss_reason;
    if (loss_competitor !== undefined) updatePayload.loss_competitor = loss_competitor;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', success: false },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('pipeline')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error updating pipeline entry', { error: error.message, pipeline_id: id });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info('[Sales Engine] Pipeline entry updated', {
      pipeline_id: id,
      stage: updatePayload.stage,
      outcome: updatePayload.outcome,
    });

    return NextResponse.json({ data, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Pipeline PUT error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
