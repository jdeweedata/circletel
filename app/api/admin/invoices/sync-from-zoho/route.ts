/**
 * API Route: Sync Invoice Numbers from Zoho
 * POST /api/admin/invoices/sync-from-zoho
 * 
 * Syncs invoice numbers from Zoho Billing to local database
 * Used to fix discrepancies between admin portal and Zoho
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';
import { apiLogger } from '@/lib/logging/logger';

interface SyncResult {
  invoice_id: string;
  local_number: string;
  zoho_number: string;
  status: 'synced' | 'not_found' | 'error';
  error?: string;
}

/**
 * POST - Sync invoice numbers from Zoho for specific invoices or all unsynced
 * 
 * Request body:
 * {
 *   "invoice_ids": ["uuid1", "uuid2"] // Optional - if not provided, syncs all with zoho_billing_invoice_id
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const { invoice_ids } = body;

    // Build query for invoices to sync
    // Check both zoho_billing_invoice_id and zoho_invoice_id (legacy field)
    let query = supabase
      .from('customer_invoices')
      .select('id, invoice_number, zoho_billing_invoice_id, zoho_invoice_id');

    if (invoice_ids && Array.isArray(invoice_ids) && invoice_ids.length > 0) {
      // If specific IDs provided, fetch those
      query = query.in('id', invoice_ids);
    } else {
      // Otherwise, only fetch invoices that have a Zoho ID
      query = query.or('zoho_billing_invoice_id.not.is.null,zoho_invoice_id.not.is.null');
    }

    const { data: invoices, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch invoices: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No invoices to sync',
        results: []
      });
    }

    const billingClient = new ZohoBillingClient();
    const results: SyncResult[] = [];

    for (const invoice of invoices) {
      const zohoInvoiceId = invoice.zoho_billing_invoice_id || invoice.zoho_invoice_id;

      if (!zohoInvoiceId) {
        results.push({
          invoice_id: invoice.id,
          local_number: invoice.invoice_number,
          zoho_number: '',
          status: 'not_found',
          error: 'No Zoho invoice ID'
        });
        continue;
      }

      try {
        // Fetch invoice from Zoho
        const zohoInvoice = await billingClient.getInvoice(zohoInvoiceId);

        if (!zohoInvoice) {
          results.push({
            invoice_id: invoice.id,
            local_number: invoice.invoice_number,
            zoho_number: '',
            status: 'not_found',
            error: 'Invoice not found in Zoho'
          });
          continue;
        }

        // Update local invoice with Zoho's invoice number
        const { error: updateError } = await supabase
          .from('customer_invoices')
          .update({
            invoice_number: zohoInvoice.invoice_number,
            zoho_sync_status: 'synced',
            zoho_last_synced_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

        if (updateError) {
          results.push({
            invoice_id: invoice.id,
            local_number: invoice.invoice_number,
            zoho_number: zohoInvoice.invoice_number,
            status: 'error',
            error: updateError.message
          });
        } else {
          results.push({
            invoice_id: invoice.id,
            local_number: invoice.invoice_number,
            zoho_number: zohoInvoice.invoice_number,
            status: 'synced'
          });
        }

      } catch (error) {
        results.push({
          invoice_id: invoice.id,
          local_number: invoice.invoice_number,
          zoho_number: '',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const syncedCount = results.filter(r => r.status === 'synced').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} invoices, ${errorCount} errors`,
      results
    });

  } catch (error) {
    apiLogger.error('[InvoiceSync] Error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get invoices with mismatched numbers (for review before sync)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all invoices that have a Zoho ID
    const { data: invoices, error } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        zoho_billing_invoice_id,
        zoho_invoice_id,
        zoho_sync_status,
        customer:customers(first_name, last_name, email)
      `)
      .not('zoho_billing_invoice_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: invoices?.length || 0,
      invoices
    });

  } catch (error) {
    apiLogger.error('[InvoiceSync] Error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
