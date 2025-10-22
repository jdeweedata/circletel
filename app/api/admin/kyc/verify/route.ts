/**
 * Admin KYC Verification API Route
 * Handles approve/reject actions for KYC documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Use service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await request.json();
    const { documentId, status, notes, rejectionReason } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['approved', 'rejected', 'under_review'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status is required' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get document to find associated order
    const { data: document, error: docError } = await supabase
      .from('kyc_documents')
      .select('id, consumer_order_id, customer_email, customer_name')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document status
    const updateData: any = {
      verification_status: status,
      verified_at: new Date().toISOString(),
      verification_notes: notes || null,
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabase
      .from('kyc_documents')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      );
    }

    // Update order status based on verification result
    if (status === 'approved') {
      // Check if all documents for this order are approved
      const { data: allDocs, error: docsError } = await supabase
        .from('kyc_documents')
        .select('verification_status')
        .eq('consumer_order_id', document.consumer_order_id);

      if (!docsError && allDocs) {
        const allApproved = allDocs.every(
          (doc) => doc.verification_status === 'approved'
        );

        if (allApproved) {
          // All documents approved, update order to kyc_approved
          await supabase
            .from('consumer_orders')
            .update({ status: 'kyc_approved' })
            .eq('id', document.consumer_order_id);
        }
      }
    } else if (status === 'rejected') {
      // Any rejection means order needs attention
      await supabase
        .from('consumer_orders')
        .update({ status: 'kyc_rejected' })
        .eq('id', document.consumer_order_id);
    }

    // TODO: Send email notification to customer
    // This will be implemented in the next task

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
