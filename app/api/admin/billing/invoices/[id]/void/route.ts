/**
 * Void Invoice API
 * POST /api/admin/billing/invoices/[id]/void
 * 
 * Voids a draft invoice. Sent invoices require credit notes.
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
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required to void an invoice' },
        { status: 400 }
      );
    }

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

    // Void invoice
    const result = await CompliantBillingService.voidInvoice(invoiceId, reason, {
      user_id: user.id,
      user_email: user.email || undefined,
      user_role: adminUser.role,
      reason
    });

    // Log admin action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: adminUser.id,
        action: 'void_invoice',
        resource_type: 'customer_invoice',
        resource_id: invoiceId,
        details: { reason }
      });

    return NextResponse.json({
      success: true,
      message: 'Invoice voided successfully',
      ...result
    });

  } catch (error: any) {
    console.error('Void invoice failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to void invoice' },
      { status: 500 }
    );
  }
}
