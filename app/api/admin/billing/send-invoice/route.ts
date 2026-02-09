/**
 * Send Invoice Email API
 * POST /api/admin/billing/send-invoice
 * 
 * Sends invoice email to customer and optionally syncs to Zoho Billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { processInvoiceNotification, resendInvoiceEmail } from '@/lib/billing/invoice-notification-service';
import { apiLogger } from '@/lib/logging';

interface SendInvoiceRequest {
  invoice_id: string;
  trigger?: 'invoice_created' | 'invoice_updated' | 'manual_send' | 'payment_reminder' | 'overdue_notice';
  sync_to_zoho?: boolean; // Default true
  send_email?: boolean; // Default true
  resend_only?: boolean; // Just resend email without Zoho sync
  force_send?: boolean; // Override duplicate check
  test_email?: string; // Override recipient email for testing
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: SendInvoiceRequest = await request.json();
    const { 
      invoice_id, 
      trigger = 'manual_send',
      sync_to_zoho = true, 
      send_email = true, 
      resend_only = false,
      force_send = false,
      test_email
    } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: invoice_id' },
        { status: 400 }
      );
    }

    // Verify invoice exists
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, customer_id, status')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { success: false, error: `Invoice not found: ${invoice_id}` },
        { status: 404 }
      );
    }

    let result;

    if (resend_only) {
      // Just resend email without Zoho sync
      result = await resendInvoiceEmail(invoice_id);
      
      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Invoice email resent successfully' : 'Failed to resend invoice email',
        invoice_number: invoice.invoice_number,
        email_sent: result.success,
        email_message_id: result.message_id,
        error: result.error,
      });
    } else {
      // Full notification workflow (Zoho sync + email)
      result = await processInvoiceNotification({
        invoice_id,
        trigger,
        sync_to_zoho,
        send_email,
        force_send,
        test_email,
      });

      // Log admin action
      await supabase.from('admin_activity_log').insert({
        admin_user_id: adminUser.id,
        action: 'send_invoice',
        resource_type: 'customer_invoice',
        resource_id: invoice_id,
        details: {
          invoice_number: invoice.invoice_number,
          zoho_synced: result.zoho_synced,
          zoho_invoice_id: result.zoho_invoice_id,
          email_sent: result.email_sent,
          email_message_id: result.email_message_id,
          errors: result.errors,
        },
      });

      // Handle skipped duplicate case
      if (result.skipped_duplicate) {
        return NextResponse.json({
          success: true,
          message: 'Invoice notification already sent for this trigger (duplicate prevented)',
          invoice_number: invoice.invoice_number,
          skipped_duplicate: true,
        });
      }

      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? 'Invoice processed successfully' 
          : 'Invoice processed with errors',
        invoice_number: invoice.invoice_number,
        zoho_synced: result.zoho_synced,
        zoho_invoice_id: result.zoho_invoice_id,
        email_sent: result.email_sent,
        email_verified: result.email_verified,
        email_message_id: result.email_message_id,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    }
  } catch (error: any) {
    apiLogger.error('[SendInvoice API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
