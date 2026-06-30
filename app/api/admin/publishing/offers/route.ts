import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const OFFER_SELECT =
  'id,slug,title,customer_type,lifecycle_state,channel_visibility,base_price,source_uid,status,updated_at,' +
  'offer_pricing_snapshot(resolved_price,total_cost,margin_pct,guardrail_status,computed_at),' +
  'offer_components(role,source_type,label,qty)';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'active';
  const search = searchParams.get('search');

  let query = supabase
    .from('offers')
    .select(OFFER_SELECT)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (status !== 'all') query = query.eq('status', status);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, offers: data ?? [] });
}
