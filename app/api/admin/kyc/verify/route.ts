/**
 * Admin KYC Verification API Route
 * Handles approve/reject actions for KYC documents
 * Sends email notifications to customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailNotificationService } from '@/lib/notifications/notification-service';

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

    // Get document and order details for notifications
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

    // Get order details for email notification
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('order_number, first_name, last_name, email')
      .eq('id', document.consumer_order_id)
      .single();

    if (orderError) {
      console.error('Failed to fetch order:', orderError);
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
    let emailSent = false;
    let emailError: string | undefined;

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

          // Send approval email
          if (order) {
            try {
              const emailResult = await EmailNotificationService.sendKycApproval(
                order.email,
                `${order.first_name} ${order.last_name}`,
                order.order_number
              );
              emailSent = emailResult.success;
              emailError = emailResult.error;

              if (!emailSent) {
                console.error('Failed to send KYC approval email:', emailError);
              }
            } catch (error: any) {
              console.error('Error sending KYC approval email:', error);
              emailError = error.message;
            }
          }
        }
      }
    } else if (status === 'rejected') {
      // Any rejection means order needs attention
      await supabase
        .from('consumer_orders')
        .update({ status: 'kyc_rejected' })
        .eq('id', document.consumer_order_id);

      // Send rejection email
      if (order && rejectionReason) {
        try {
          const emailResult = await EmailNotificationService.sendKycRejection(
            order.email,
            `${order.first_name} ${order.last_name}`,
            order.order_number,
            rejectionReason
          );
          emailSent = emailResult.success;
          emailError = emailResult.error;

          if (!emailSent) {
            console.error('Failed to send KYC rejection email:', emailError);
          }
        } catch (error: any) {
          console.error('Error sending KYC rejection email:', error);
          emailError = error.message;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`,
      emailSent,
      emailError,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
