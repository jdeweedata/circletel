import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zone_id = searchParams.get('zone_id');
    const min_score = searchParams.get('min_score');
    const track = searchParams.get('track');
    const product = searchParams.get('product');
    const exclude_in_pipeline = searchParams.get('exclude_in_pipeline') === 'true';

    const supabase = await createClient();

    // Build query for leads with coverage_lead join
    let query = supabase
      .from('lead_scores')
      .select(`
        *,
        coverage_lead:coverage_leads (
          id, address, latitude, longitude, status, customer_type, company_name, phone, created_at
        ),
        zone:sales_zones (id, name)
      `)
      .order('composite_score', { ascending: false });

    if (zone_id) query = query.eq('zone_id', zone_id);
    if (min_score) query = query.gte('composite_score', parseInt(min_score));
    if (track) query = query.eq('recommended_track', track);
    if (product) query = query.eq('recommended_product', product);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let leads = data ?? [];

    // Exclude leads already in pipeline
    if (exclude_in_pipeline && leads.length > 0) {
      const coverageLeadIds = leads.map((l: any) => l.coverage_lead_id).filter(Boolean);
      if (coverageLeadIds.length > 0) {
        const { data: pipelineEntries } = await supabase
          .from('sales_pipeline_stages')
          .select('coverage_lead_id')
          .in('coverage_lead_id', coverageLeadIds);

        const inPipeline = new Set((pipelineEntries ?? []).map((p: any) => p.coverage_lead_id));
        leads = leads.filter((l: any) => !inPipeline.has(l.coverage_lead_id));
      }
    }

    // Build CSV
    const headers = ['Company', 'Contact', 'Phone', 'Email', 'Address', 'Score', 'Product', 'MRR', 'Coverage', 'Zone'];

    const escapeCSV = (field: string | null | undefined): string => {
      if (!field) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = leads.map((lead: any) => {
      const cl = lead.coverage_lead;
      const zone = lead.zone;
      return [
        escapeCSV(cl?.company_name),
        escapeCSV(cl?.customer_type),
        escapeCSV(cl?.phone),
        '', // email not in coverage_leads schema
        escapeCSV(cl?.address),
        String(lead.composite_score ?? 0),
        escapeCSV(lead.recommended_product),
        String(lead.estimated_mrr ?? 0),
        escapeCSV(lead.skyfibre_confidence || lead.dfa_coverage_type || 'unknown'),
        escapeCSV(zone?.name),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Return as downloadable CSV
    const date = new Date().toISOString().split('T')[0];
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="circletel-leads-${date}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
