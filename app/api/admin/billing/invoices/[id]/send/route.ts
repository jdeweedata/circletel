/**
 * Send Invoice API
 * POST /api/admin/billing/invoices/[id]/send
 * 
 * Generates PDF, stores it, and marks invoice as sent (locks it)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { billingEngine } from '@/lib/billing/engine';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { id: invoiceId } = await params;

    const supabase = await createClient();

    // Send invoice via billing engine (delegate → CompliantBillingService)
    const result = (await billingEngine.issueInvoice(invoiceId, {
      source: 'admin',
      user_id: authResult.adminUser.id,
      user_email: authResult.adminUser.email || undefined,
      user_role: authResult.adminUser.role,
    })) as { invoice_number?: string; pdf_url?: string };

    // Log admin action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: authResult.adminUser.id,
        action: 'send_invoice',
        resource_type: 'customer_invoice',
        resource_id: invoiceId,
        details: {
          invoice_number: result.invoice_number,
          pdf_url: result.pdf_url
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      ...result
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send invoice';
    apiLogger.error('Send invoice failed', { error: message });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
