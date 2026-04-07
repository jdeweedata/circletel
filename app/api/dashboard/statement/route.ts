import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientWithSession } from '@/lib/supabase/server';
import { assembleStatementData, StatementOptions } from '@/lib/billing/statement-data';
import { billingLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Auth: check Bearer header first, then cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let user: { id: string } | null = null;

    if (token) {
      const anonClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user: tokenUser }, error } = await anonClient.auth.getUser(token);
      if (error || !tokenUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      user = tokenUser;
    } else {
      const sessionClient = await createClientWithSession();
      const { data: { session }, error } = await sessionClient.auth.getSession();
      if (error || !session?.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      user = session.user;
    }

    // 2. Look up customer using service role client
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as StatementOptions['period']) || '3m';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    // 4. Assemble statement
    const { statement, customerRecord } = await assembleStatementData(
      serviceClient,
      customer.id,
      { period, from, to }
    );

    return NextResponse.json({ success: true, statement, customer: customerRecord });
  } catch (error) {
    billingLogger.error('[Dashboard Statement API] Error', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ success: false, error: 'Failed to generate statement' }, { status: 500 });
  }
}
