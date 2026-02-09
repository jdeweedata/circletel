/**
 * Invoice Audit History API
 * GET /api/admin/billing/invoices/[id]/audit
 * 
 * Returns the complete audit trail for an invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { CompliantBillingService } from '@/lib/billing/compliant-billing-service';
import { apiLogger } from '@/lib/logging';

export async function GET(
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

    // Get audit history
    const auditHistory = await CompliantBillingService.getAuditHistory(invoiceId);

    return NextResponse.json({
      success: true,
      invoice_id: invoiceId,
      audit_entries: auditHistory,
      count: auditHistory.length
    });

  } catch (error: any) {
    apiLogger.error('Get audit history failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get audit history' },
      { status: 500 }
    );
  }
}
