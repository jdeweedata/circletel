/**
 * API Route: Update Invoice Number
 * PATCH /api/admin/invoices/[id]/update-number
 * 
 * Manually update an invoice number (for fixing sync issues)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { invoice_number } = body;

    if (!invoice_number) {
      return NextResponse.json(
        { success: false, error: 'invoice_number is required' },
        { status: 400 }
      );
    }

    // Update the invoice number
    const { data, error } = await supabase
      .from('customer_invoices')
      .update({
        invoice_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, invoice_number')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invoice number updated to ${invoice_number}`,
      invoice: data
    });

  } catch (error) {
    apiLogger.error('[UpdateInvoiceNumber] Error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
