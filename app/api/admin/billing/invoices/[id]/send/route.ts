/**
 * Send Invoice API
 * POST /api/admin/billing/invoices/[id]/send
 * 
 * Generates PDF, stores it, and marks invoice as sent (locks it)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { CompliantBillingService } from '@/lib/billing/compliant-billing-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    
    // Authenticate
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
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Send invoice
    const result = await CompliantBillingService.sendInvoice(invoiceId, {
      user_id: user.id,
      user_email: user.email || undefined,
      user_role: adminUser.role
    });

    // Log admin action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: adminUser.id,
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

  } catch (error: any) {
    console.error('Send invoice failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
