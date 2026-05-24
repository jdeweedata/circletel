/**
 * Invoice Audit History API
 * GET /api/admin/billing/invoices/[id]/audit
 * 
 * Returns the complete audit trail for an invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompliantBillingService } from '@/lib/billing/compliant-billing-service';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { id: invoiceId } = await params;

    const supabase = await createClient();

    // Get audit history
    const auditHistory = await CompliantBillingService.getAuditHistory(invoiceId);

    return NextResponse.json({
      success: true,
      invoice_id: invoiceId,
      audit_entries: auditHistory,
      count: auditHistory.length
    });

  } catch (error: unknown) {
    apiLogger.error('Get audit history failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get audit history' },
      { status: 500 }
    );
  }
}
