/**
 * Zoho Books Reset Retry Count Endpoint
 *
 * Resets the retry count for a specific entity to allow fresh retry attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ResetRequest {
  entityType: 'customer' | 'invoice' | 'payment';
  entityId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetRequest = await request.json();
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

    const { error } = await supabase
      .from(table)
      .update({
        zoho_books_retry_count: 0,
        zoho_books_next_retry_at: null,
        zoho_sync_status: 'pending',
        zoho_sync_error: null,
      })
      .eq('id', entityId);

    if (error) {
      return NextResponse.json(
        { success: false, message: `Failed to reset: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Retry count reset successfully. Entity will be picked up in next sync.',
    });
  } catch (error) {
    console.error('[ZohoBooks/Reset] Error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Reset failed' },
      { status: 500 }
    );
  }
}
