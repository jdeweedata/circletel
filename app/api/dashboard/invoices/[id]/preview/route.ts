/**
 * Dashboard Invoice Preview API
 * GET /api/dashboard/invoices/[id]/preview
 *
 * Returns InvoicePreviewData for a single invoice owned by the
 * logged-in customer. Returns 403 if the invoice belongs to someone else.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientWithSession } from '@/lib/supabase/server';
import { assembleInvoicePreviewData } from '@/lib/invoices/invoice-preview-data';
import { billingLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // 1. Auth: Bearer header first, then session cookies
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

    // 2. Resolve customer ID from auth user
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

    // 3. Assemble with ownership enforcement
    const { invoice } = await assembleInvoicePreviewData(
      serviceClient,
      id,
      { customerId: customer.id }
    );

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (message.includes('not found')) {
      return NextResponse.json({ success: false, error: `Invoice ${id} not found` }, { status: 404 });
    }

    billingLogger.error('[Dashboard Invoice Preview] Error', { invoiceId: id, error: message });
    return NextResponse.json({ success: false, error: 'Failed to load invoice' }, { status: 500 });
  }
}
