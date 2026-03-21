import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * Get the Monday of the current week as YYYY-MM-DD
 */
function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * GET /api/admin/sales-engine/scorecard
 * Weekly scorecard — zone_metrics for a given week joined with sales_zones
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const weekStart = searchParams.get('week_start') || getCurrentMonday();

    const { data: metrics, error: metricsError } = await supabase
      .from('zone_metrics')
      .select('*, sales_zones(*)')
      .eq('week_start', weekStart);

    if (metricsError) {
      apiLogger.error('[Sales Engine] Error fetching scorecard', { error: metricsError.message });
      return NextResponse.json(
        { error: metricsError.message, success: false },
        { status: 500 }
      );
    }

    // Compute summary stats across all zones for the week
    const summary = {
      total_zones: metrics.length,
      total_leads_generated: 0,
      total_qualified_leads: 0,
      total_closed_deals: 0,
      total_addresses_canvassed: 0,
      total_active_customers: 0,
      total_serviceable_addresses: 0,
      avg_penetration_rate: 0,
      avg_coverage_to_lead_rate: 0,
      avg_lead_to_close_rate: 0,
    };

    for (const m of metrics) {
      summary.total_leads_generated += m.leads_generated ?? 0;
      summary.total_qualified_leads += m.qualified_leads ?? 0;
      summary.total_closed_deals += m.closed_deals ?? 0;
      summary.total_addresses_canvassed += m.addresses_canvassed ?? 0;
      summary.total_active_customers += m.active_customers ?? 0;
      summary.total_serviceable_addresses += m.serviceable_addresses ?? 0;
    }

    if (summary.total_serviceable_addresses > 0) {
      summary.avg_penetration_rate = Math.round(
        (summary.total_active_customers / summary.total_serviceable_addresses) * 10000
      ) / 100;
    }
    if (summary.total_addresses_canvassed > 0) {
      summary.avg_coverage_to_lead_rate = Math.round(
        (summary.total_leads_generated / summary.total_addresses_canvassed) * 10000
      ) / 100;
    }
    if (summary.total_qualified_leads > 0) {
      summary.avg_lead_to_close_rate = Math.round(
        (summary.total_closed_deals / summary.total_qualified_leads) * 10000
      ) / 100;
    }

    return NextResponse.json({
      data: {
        week_start: weekStart,
        metrics,
        summary,
      },
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Scorecard GET error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sales-engine/scorecard
 * Record or update weekly metrics — upsert into zone_metrics
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      zone_id,
      week_start,
      serviceable_addresses,
      active_customers,
      addresses_canvassed,
      leads_generated,
      qualified_leads,
      closed_deals,
      ...rest
    } = body;

    if (!zone_id || !week_start) {
      return NextResponse.json(
        { error: 'Missing required fields: zone_id, week_start', success: false },
        { status: 400 }
      );
    }

    // Auto-compute rates
    const penetration_rate =
      serviceable_addresses > 0
        ? Math.round((active_customers / serviceable_addresses) * 10000) / 100
        : 0;

    const coverage_to_lead_rate =
      addresses_canvassed > 0
        ? Math.round((leads_generated / addresses_canvassed) * 10000) / 100
        : 0;

    const lead_to_close_rate =
      qualified_leads > 0
        ? Math.round((closed_deals / qualified_leads) * 10000) / 100
        : 0;

    const upsertPayload = {
      zone_id,
      week_start,
      serviceable_addresses: serviceable_addresses ?? 0,
      active_customers: active_customers ?? 0,
      addresses_canvassed: addresses_canvassed ?? 0,
      leads_generated: leads_generated ?? 0,
      qualified_leads: qualified_leads ?? 0,
      closed_deals: closed_deals ?? 0,
      penetration_rate,
      coverage_to_lead_rate,
      lead_to_close_rate,
      ...rest,
    };

    const { data, error } = await supabase
      .from('zone_metrics')
      .upsert(upsertPayload, { onConflict: 'zone_id,week_start' })
      .select()
      .single();

    if (error) {
      apiLogger.error('[Sales Engine] Error upserting scorecard metrics', { error: error.message });
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info('[Sales Engine] Scorecard metrics upserted', {
      zone_id,
      week_start,
      penetration_rate,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Sales Engine] Scorecard POST error', { error: message });
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
