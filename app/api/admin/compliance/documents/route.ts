/**
 * Admin Compliance Documents API
 * Lists FICA/RICA documents customers uploaded via the self-service portal, and lets an
 * admin/compliance officer approve or reject them.
 *
 * Files live in the private `kyc-documents` bucket — use GET /api/admin/kyc/document-url?path={file_path}
 * to obtain a short-lived signed URL for viewing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/compliance/documents?customerId=&orderId=&status=
 * Returns compliance documents (optionally filtered) enriched with customer + order info.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    // Service role — admin reads across all customers (bypasses RLS).
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');

    let query = supabase
      .from('compliance_documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (orderId) query = query.eq('order_id', orderId);
    if (status) query = query.eq('status', status);

    const { data: documents, error } = await query;

    if (error) {
      apiLogger.error('[Admin Compliance] List query failed', { error: error.message });
      return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
    }

    const docs = documents || [];

    // compliance_documents.customer_id has no FK to customers, so enrich via batched lookups.
    const customerIds = Array.from(new Set(docs.map((d) => d.customer_id).filter(Boolean)));
    const orderIds = Array.from(new Set(docs.map((d) => d.order_id).filter(Boolean)));

    const [{ data: customers }, { data: orders }] = await Promise.all([
      customerIds.length
        ? supabase
            .from('customers')
            .select('id, first_name, last_name, email, phone, account_number')
            .in('id', customerIds)
        : Promise.resolve({ data: [] as any[] }),
      orderIds.length
        ? supabase.from('consumer_orders').select('id, order_number, package_name').in('id', orderIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const customerById = new Map((customers || []).map((c) => [c.id, c]));
    const orderById = new Map((orders || []).map((o) => [o.id, o]));

    const enriched = docs.map((d) => {
      const c = customerById.get(d.customer_id);
      const o = orderById.get(d.order_id);
      return {
        ...d,
        customer: c
          ? {
              id: c.id,
              name: [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.email,
              email: c.email,
              phone: c.phone,
              account_number: c.account_number,
            }
          : null,
        order: o ? { id: o.id, order_number: o.order_number, package_name: o.package_name } : null,
      };
    });

    return NextResponse.json({ success: true, documents: enriched, count: enriched.length });
  } catch (error) {
    apiLogger.error('[Admin Compliance] GET error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/compliance/documents
 * Body: { documentId, status: 'approved' | 'rejected' | 'pending', rejection_reason? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;
    const { adminUser } = authResult;

    const body = await request.json();
    const { documentId, status, rejection_reason } = body as {
      documentId?: string;
      status?: string;
      rejection_reason?: string;
    };

    if (!documentId || !status) {
      return NextResponse.json({ success: false, error: 'documentId and status are required' }, { status: 400 });
    }
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: "status must be 'approved', 'rejected' or 'pending'" },
        { status: 400 }
      );
    }
    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { success: false, error: 'rejection_reason is required when rejecting a document' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from('compliance_documents')
      .update({
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      apiLogger.error('[Admin Compliance] Update failed', { error: error.message, documentId });
      return NextResponse.json({ success: false, error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    apiLogger.error('[Admin Compliance] PATCH error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
