/**
 * Void Invoice API
 * POST /api/admin/billing/invoices/[id]/void
 * 
 * Voids a draft invoice. Sent invoices require credit notes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompliantBillingService } from '@/lib/billing/compliant-billing-service';
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
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required to void an invoice' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Void invoice
    const result = await CompliantBillingService.voidInvoice(invoiceId, reason, {
      user_id: authResult.adminUser.id,
      user_email: authResult.adminUser.email || undefined,
      user_role: authResult.adminUser.role,
      reason
    });

    // Log admin action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: authResult.adminUser.id,
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
    apiLogger.error('Void invoice failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to void invoice' },
      { status: 500 }
    );
  }
}
