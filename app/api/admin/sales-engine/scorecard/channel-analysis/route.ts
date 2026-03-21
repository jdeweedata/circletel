import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const zone_id = searchParams.get('zone_id');

    // Get pipeline entries with contact_method and outcome
    let pipelineQuery = supabase
      .from('sales_pipeline_stages')
      .select('contact_method, outcome, zone_id, quote_mrr')
      .not('contact_method', 'is', null);

    if (zone_id) pipelineQuery = pipelineQuery.eq('zone_id', zone_id);

    const { data: pipelineData, error: pipelineError } = await pipelineQuery;
    if (pipelineError) {
      return NextResponse.json({ success: false, error: pipelineError.message }, { status: 500 });
    }

    const entries = pipelineData ?? [];

    // Get zone_metrics for channel activity counts
    let metricsQuery = supabase
      .from('zone_metrics')
      .select('zone_id, linkedin_contacts, whatsapp_contacts, walk_ins, referrals_generated')
      .order('week_start', { ascending: false });

    if (zone_id) metricsQuery = metricsQuery.eq('zone_id', zone_id);

    const { data: metricsData } = await metricsQuery;

    // Get zone names
    const { data: zonesData } = await supabase
      .from('sales_zones')
      .select('id, name')
      .eq('status', 'active');

    const zoneNames: Record<string, string> = {};
    for (const z of (zonesData ?? [])) {
      zoneNames[z.id] = z.name;
    }

    // Channel conversion analysis
    const channelStats: Record<string, { total: number; won: number; lost: number; mrr: number }> = {};
    for (const entry of entries) {
      const channel = entry.contact_method as string;
      if (!channelStats[channel]) {
        channelStats[channel] = { total: 0, won: 0, lost: 0, mrr: 0 };
      }
      channelStats[channel].total++;
      if (entry.outcome === 'won') {
        channelStats[channel].won++;
        channelStats[channel].mrr += Number(entry.quote_mrr) || 0;
      } else if (entry.outcome === 'lost') {
        channelStats[channel].lost++;
      }
    }

    const channel_performance = Object.entries(channelStats)
      .map(([channel, stats]) => ({
        channel,
        total_deals: stats.total,
        won: stats.won,
        lost: stats.lost,
        conversion_rate: stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0,
        total_mrr: stats.mrr,
      }))
      .sort((a, b) => b.conversion_rate - a.conversion_rate);

    // Channel per zone analysis
    const zoneChannelMap: Record<string, Record<string, { total: number; won: number }>> = {};
    for (const entry of entries) {
      const zId = entry.zone_id || 'unassigned';
      const channel = entry.contact_method as string;
      if (!zoneChannelMap[zId]) zoneChannelMap[zId] = {};
      if (!zoneChannelMap[zId][channel]) zoneChannelMap[zId][channel] = { total: 0, won: 0 };
      zoneChannelMap[zId][channel].total++;
      if (entry.outcome === 'won') zoneChannelMap[zId][channel].won++;
    }

    const best_channel_per_zone = Object.entries(zoneChannelMap).map(([zId, channels]) => {
      const best = Object.entries(channels).reduce((best, [ch, stats]) => {
        const rate = stats.total > 0 ? stats.won / stats.total : 0;
        const bestRate = best.stats.total > 0 ? best.stats.won / best.stats.total : 0;
        return rate > bestRate ? { channel: ch, stats } : best;
      }, { channel: Object.keys(channels)[0], stats: Object.values(channels)[0] });

      return {
        zone_id: zId,
        zone_name: zoneNames[zId] || 'Unassigned',
        best_channel: best.channel,
        conversion_rate: best.stats.total > 0 ? Math.round((best.stats.won / best.stats.total) * 100) : 0,
        total_deals: best.stats.total,
      };
    }).sort((a, b) => b.conversion_rate - a.conversion_rate);

    // Activity totals from zone_metrics (latest week per zone)
    const latestMetricsByZone: Record<string, any> = {};
    for (const m of (metricsData ?? [])) {
      if (!latestMetricsByZone[m.zone_id]) {
        latestMetricsByZone[m.zone_id] = m;
      }
    }
    const activity_totals = {
      linkedin: Object.values(latestMetricsByZone).reduce((sum: number, m: any) => sum + (m.linkedin_contacts || 0), 0),
      whatsapp: Object.values(latestMetricsByZone).reduce((sum: number, m: any) => sum + (m.whatsapp_contacts || 0), 0),
      walk_ins: Object.values(latestMetricsByZone).reduce((sum: number, m: any) => sum + (m.walk_ins || 0), 0),
      referrals: Object.values(latestMetricsByZone).reduce((sum: number, m: any) => sum + (m.referrals_generated || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        channel_performance,
        best_channel_per_zone,
        activity_totals,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
