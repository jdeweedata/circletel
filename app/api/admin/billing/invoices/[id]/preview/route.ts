/**
 * Admin Invoice Preview API
 * GET /api/admin/billing/invoices/[id]/preview
 *
 * Returns assembled InvoicePreviewData for any invoice.
 * Uses service role — admin layout handles session auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assembleInvoicePreviewData } from '@/lib/invoices/invoice-preview-data';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { invoice } = await assembleInvoicePreviewData(supabase, id);

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: `Invoice ${id} not found` },
        { status: 404 }
      );
    }

    apiLogger.error('[Invoice Preview] Error', { invoiceId: id, error: message });
    return NextResponse.json(
      { success: false, error: 'Failed to load invoice' },
      { status: 500 }
    );
  }
}
