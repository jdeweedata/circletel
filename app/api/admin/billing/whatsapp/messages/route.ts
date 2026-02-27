/**
 * Admin WhatsApp Messages API
 *
 * Returns recent WhatsApp message history for the dashboard.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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

    // Get messages from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_message_log')
      .select(`
        id,
        message_id,
        phone,
        template_name,
        status,
        created_at,
        invoice_id,
        customer_id
      `)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      apiLogger.error('[WhatsApp Messages] Failed to fetch messages', { error: messagesError.message });
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get related invoice and customer data
    const enrichedMessages = await Promise.all(
      (messages || []).map(async (msg) => {
        let invoice = null;
        let customer = null;

        if (msg.invoice_id) {
          const { data: invoiceData } = await supabase
            .from('customer_invoices')
            .select('invoice_number, total_amount')
            .eq('id', msg.invoice_id)
            .single();
          invoice = invoiceData;
        }

        if (msg.customer_id) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('first_name, last_name')
            .eq('id', msg.customer_id)
            .single();
          customer = customerData;
        }

        return {
          ...msg,
          invoice,
          customer,
        };
      })
    );

    return NextResponse.json({ messages: enrichedMessages });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[WhatsApp Messages] Error', { error: errorMsg });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
