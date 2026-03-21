import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/admin/sales-engine/leads
 * List lead_scores joined with coverage_leads
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const zoneId = searchParams.get('zone_id');
    const track = searchParams.get('track');
    const minScore = searchParams.get('min_score');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('lead_scores')
      .select('*, coverage_leads(*)', { count: 'exact' })
      .order('composite_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }

    if (track) {
      query = query.eq('recommended_track', track);
    }

    if (minScore) {
      query = query.gte('composite_score', parseFloat(minScore));
    }

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('[Sales Engine] Error fetching leads', { error: error.message });
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
    apiLogger.error('[Sales Engine] Leads GET error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sales-engine/leads
 * Score a lead — insert into lead_scores and update coverage_leads.lead_score
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      coverage_lead_id,
      zone_id,
      product_fit_score,
      revenue_potential_score,
      competitive_vuln_score,
      conversion_speed_score,
      recommended_product,
      recommended_track,
      estimated_mrr,
      competitor_identified,
    } = body;

    if (!coverage_lead_id || product_fit_score == null || revenue_potential_score == null ||
        competitive_vuln_score == null || conversion_speed_score == null) {
      return NextResponse.json(
        { error: 'Missing required fields: coverage_lead_id, product_fit_score, revenue_potential_score, competitive_vuln_score, conversion_speed_score', success: false },
        { status: 400 }
      );
    }

    // Compute composite score: product_fit * 0.35 + revenue * 0.30 + competitive * 0.20 + speed * 0.15
    const compositeScore = Math.round(
      (product_fit_score * 0.35 +
       revenue_potential_score * 0.30 +
       competitive_vuln_score * 0.20 +
       conversion_speed_score * 0.15) * 100
    ) / 100;

    const insertPayload: Record<string, unknown> = {
      coverage_lead_id,
      product_fit_score,
      revenue_potential_score,
      competitive_vuln_score,
      conversion_speed_score,
      composite_score: compositeScore,
    };

    if (zone_id) insertPayload.zone_id = zone_id;
    if (recommended_product) insertPayload.recommended_product = recommended_product;
    if (recommended_track) insertPayload.recommended_track = recommended_track;
    if (estimated_mrr != null) insertPayload.estimated_mrr = estimated_mrr;
    if (competitor_identified) insertPayload.competitor_identified = competitor_identified;

    const { data, error } = await supabase
      .from('lead_scores')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error scoring lead', { error: error.message });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    // Update coverage_leads with the composite score
    const { error: updateError } = await supabase
      .from('coverage_leads')
      .update({ lead_score: compositeScore })
      .eq('id', coverage_lead_id);

    if (updateError) {
      apiLogger.error('[Sales Engine] Error updating coverage_leads.lead_score', {
        error: updateError.message,
        coverage_lead_id,
      });
    }

    apiLogger.info('[Sales Engine] Lead scored', {
      lead_score_id: data.id,
      coverage_lead_id,
      composite_score: compositeScore,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Leads POST error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
