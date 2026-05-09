import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { inngest } from '@/lib/inngest/client';

// GET /api/admin/tarana/metrics?serial=X&from=ISO&to=ISO&limit=100
export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const serial = searchParams.get('serial');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  let query = supabase
    .from('tarana_link_metrics')
    .select('*')
    .order('captured_at', { ascending: false })
    .limit(limit);

  if (serial) query = query.eq('rn_serial_number', serial);
  if (from) query = query.gte('captured_at', from);
  if (to) query = query.lte('captured_at', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ metrics: data, count: data?.length ?? 0 });
}

// POST /api/admin/tarana/metrics — trigger manual collection
export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const { user } = authResult;

  await inngest.send({
    name: 'tarana/metrics.collection.requested',
    data: { triggered_by: 'manual', admin_user_id: user.id },
  });

  return NextResponse.json({
    message: 'Metrics collection triggered',
    triggered_at: new Date().toISOString(),
  });
}
