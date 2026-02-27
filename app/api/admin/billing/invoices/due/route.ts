/**
 * Admin Due Invoices API
 *
 * Returns invoices due today for WhatsApp bulk send.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get today's date range (in SAST)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get invoices due today that are still pending/unpaid
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        due_date,
        status,
        whatsapp_sent_at,
        customer_id
      `)
      .gte('due_date', startOfDay.toISOString())
      .lte('due_date', endOfDay.toISOString())
      .in('status', ['pending', 'sent', 'overdue'])
      .order('due_date', { ascending: true });

    if (invoicesError) {
      apiLogger.error('[Due Invoices] Failed to fetch invoices', { error: invoicesError.message });
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Get customer data for each invoice
    const enrichedInvoices = await Promise.all(
      (invoices || []).map(async (invoice) => {
        let customer = null;

        if (invoice.customer_id) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('id, first_name, last_name, phone, whatsapp_consent')
            .eq('id', invoice.customer_id)
            .single();
          customer = customerData;
        }

        return {
          ...invoice,
          customer,
        };
      })
    );

    return NextResponse.json({ invoices: enrichedInvoices });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Due Invoices] Error', { error: errorMsg });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
