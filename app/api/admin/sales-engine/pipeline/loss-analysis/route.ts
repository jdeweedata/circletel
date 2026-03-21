import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PIPELINE_STAGE_LABELS, PipelineStage, PIPELINE_STAGE_ORDER } from '@/lib/sales-engine/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const zone_id = searchParams.get('zone_id');

    // Get all lost deals with coverage_lead + zone
    let query = supabase
      .from('sales_pipeline_stages')
      .select(`
        *,
        coverage_lead:coverage_leads(id, address, company_name),
        zone:sales_zones(id, name)
      `)
      .eq('outcome', 'lost');

    if (zone_id) query = query.eq('zone_id', zone_id);

    const { data: lostDeals, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const deals = lostDeals ?? [];

    // Also get won deals for win/loss ratio
    let wonQuery = supabase
      .from('sales_pipeline_stages')
      .select('id, zone_id')
      .eq('outcome', 'won');
    if (zone_id) wonQuery = wonQuery.eq('zone_id', zone_id);
    const { data: wonDeals } = await wonQuery;

    // Loss by competitor
    const competitorCounts: Record<string, number> = {};
    for (const deal of deals) {
      const comp = deal.loss_competitor || 'Unknown';
      competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
    }
    const loss_by_competitor = Object.entries(competitorCounts)
      .map(([competitor, count]) => ({ competitor, count }))
      .sort((a, b) => b.count - a.count);

    // Loss by reason
    const reasonCounts: Record<string, number> = {};
    for (const deal of deals) {
      const reason = deal.loss_reason || 'Not specified';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
    const loss_by_reason = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // Loss by stage (which stage was the deal at when lost)
    const stageCounts: Record<string, number> = {};
    for (const deal of deals) {
      const stage = deal.stage as string;
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    }
    const loss_by_stage = PIPELINE_STAGE_ORDER.map((stage) => ({
      stage,
      label: PIPELINE_STAGE_LABELS[stage],
      count: stageCounts[stage] || 0,
    })).filter((s) => s.count > 0);

    // Loss by zone
    const zoneCounts: Record<string, { zone_name: string; lost: number; won: number }> = {};
    for (const deal of deals) {
      const zoneId = deal.zone_id || 'unassigned';
      const zoneName = (deal as Record<string, unknown> & { zone?: { name?: string } }).zone?.name || 'Unassigned';
      if (!zoneCounts[zoneId]) {
        zoneCounts[zoneId] = { zone_name: zoneName, lost: 0, won: 0 };
      }
      zoneCounts[zoneId].lost++;
    }
    for (const won of wonDeals ?? []) {
      const zoneId = won.zone_id || 'unassigned';
      if (!zoneCounts[zoneId]) {
        zoneCounts[zoneId] = { zone_name: zoneId, lost: 0, won: 0 };
      }
      zoneCounts[zoneId].won++;
    }
    const loss_by_zone = Object.entries(zoneCounts)
      .map(([id, data]) => ({
        zone_id: id,
        zone_name: data.zone_name,
        lost: data.lost,
        won: data.won,
        win_rate:
          data.won + data.lost > 0
            ? Math.round((data.won / (data.won + data.lost)) * 100)
            : 0,
      }))
      .sort((a, b) => b.lost - a.lost);

    // Objection patterns
    const objectionCounts: Record<string, number> = {};
    for (const deal of deals) {
      if (deal.objection_category) {
        objectionCounts[deal.objection_category] =
          (objectionCounts[deal.objection_category] || 0) + 1;
      }
    }
    const objection_patterns = Object.entries(objectionCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Win/loss ratio
    const totalWon = (wonDeals ?? []).length;
    const totalLost = deals.length;
    const win_loss_ratio = {
      won: totalWon,
      lost: totalLost,
      ratio:
        totalLost > 0
          ? Math.round((totalWon / totalLost) * 100) / 100
          : totalWon > 0
            ? Infinity
            : 0,
      win_rate:
        totalWon + totalLost > 0
          ? Math.round((totalWon / (totalWon + totalLost)) * 100)
          : 0,
    };

    // Total lost MRR
    const total_lost_mrr = deals.reduce(
      (sum: number, d: Record<string, unknown>) => sum + (Number(d.quote_mrr) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        loss_by_competitor,
        loss_by_reason,
        loss_by_stage,
        loss_by_zone,
        objection_patterns,
        win_loss_ratio,
        total_lost_deals: totalLost,
        total_lost_mrr,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
