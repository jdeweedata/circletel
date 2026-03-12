/**
 * Zoho Books Single Entity Retry Endpoint
 *
 * Retries sync for a specific failed entity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoBooksSyncOrchestrator } from '@/lib/integrations/zoho/books-sync-orchestrator';

interface RetryRequest {
  entityType: 'customer' | 'invoice' | 'payment';
  entityId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RetryRequest = await request.json();
    const { entityType, entityId } = body;

    if (!['customer', 'invoice', 'payment'].includes(entityType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid entity type. Must be: customer, invoice, or payment' },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { success: false, message: 'Entity ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Map entity type to table name
    const tableMap = {
      customer: 'customers',
      invoice: 'customer_invoices',
      payment: 'payment_transactions',
    } as const;

    const table = tableMap[entityType];

    // Reset status to pending for retry
    const { error: updateError } = await supabase
      .from(table)
      .update({ zoho_sync_status: 'pending' })
      .eq('id', entityId);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: `Failed to reset entity status: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Trigger sync for this entity type
    const orchestrator = new ZohoBooksSyncOrchestrator();

    switch (entityType) {
      case 'customer':
        await orchestrator.syncCustomers({});
        break;
      case 'invoice':
        await orchestrator.syncInvoices({});
        break;
      case 'payment':
        await orchestrator.syncPayments({});
        break;
    }

    // Check if entity was synced successfully - use separate queries by type
    let zohoId: string | null = null;
    let syncStatus: string | null = null;

    if (entityType === 'customer') {
      const { data } = await supabase
        .from('customers')
        .select('zoho_books_contact_id, zoho_sync_status')
        .eq('id', entityId)
        .single();
      zohoId = data?.zoho_books_contact_id ?? null;
      syncStatus = data?.zoho_sync_status ?? null;
    } else if (entityType === 'invoice') {
      const { data } = await supabase
        .from('customer_invoices')
        .select('zoho_books_invoice_id, zoho_sync_status')
        .eq('id', entityId)
        .single();
      zohoId = data?.zoho_books_invoice_id ?? null;
      syncStatus = data?.zoho_sync_status ?? null;
    } else if (entityType === 'payment') {
      const { data } = await supabase
        .from('payment_transactions')
        .select('zoho_books_payment_id, zoho_sync_status')
        .eq('id', entityId)
        .single();
      zohoId = data?.zoho_books_payment_id ?? null;
      syncStatus = data?.zoho_sync_status ?? null;
    }

    return NextResponse.json({
      success: syncStatus === 'synced',
      message: zohoId ? 'Entity synced successfully' : 'Sync attempted but entity not synced',
      zohoId,
    });
  } catch (error) {
    console.error('[ZohoBooks/Retry] Error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Retry failed' },
      { status: 500 }
    );
  }
}
