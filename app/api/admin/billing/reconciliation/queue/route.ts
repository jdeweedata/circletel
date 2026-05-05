import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const source = searchParams.get('source');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort_by') || 'source_date';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? true : false;

    const supabase = await createClient();

    let query = supabase
      .from('reconciliation_queue')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source', source);
    }

    query = query
      .order(sortBy, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count: pendingCount } = await supabase
      .from('reconciliation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedCount } = await supabase
      .from('reconciliation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedCount } = await supabase
      .from('reconciliation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected');

    const stats = {
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
      total: (pendingCount || 0) + (approvedCount || 0) + (rejectedCount || 0),
    };

    return NextResponse.json({
      items: data || [],
      total: count || 0,
      stats,
      pagination: { limit, offset },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
