import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

// GET /api/admin/tarana/metrics?serial=X&from=ISO&to=ISO&limit=100
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await inngest.send({
    name: 'tarana/metrics.collection.requested',
    data: { triggered_by: 'manual', admin_user_id: user.id },
  });

  return NextResponse.json({
    message: 'Metrics collection triggered',
    triggered_at: new Date().toISOString(),
  });
}
