/**
 * Admin KYC Verification API Route
 * Handles approve/reject actions for KYC documents
 * Sends email notifications to customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { apiLogger } from '@/lib/logging/logger';
import { computeVettingStatus, requiredDocsFor } from '@/lib/onboarding/document-requirements';
import { maybeMarkBillingReady } from '@/lib/onboarding/billing-ready';
import { WhatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import { issueToken, buildMagicLinkUrl } from '@/lib/onboarding/onboarding-service';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const perm = requirePermission(authResult.adminUser, 'kyc:verify');
    if (perm) return perm;

    // Use service role key for admin access
    const supabase = await createServerClient();

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
      apiLogger.error('Failed to fetch order', { error: orderError });
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
      apiLogger.error('Update error', { error: updateError });
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      );
    }

    // Re-fetch the document to learn its scope (consumer_order_id vs onboarding_submission_id)
    const { data: scopedDoc, error: scopeError } = await supabase
      .from('kyc_documents')
      .select('consumer_order_id, onboarding_submission_id')
      .eq('id', documentId)
      .single();

    if (scopeError || !scopedDoc) {
      apiLogger.error('Failed to re-fetch document scope', { error: scopeError });
      return NextResponse.json(
        { success: false, error: 'Failed to determine document scope' },
        { status: 500 }
      );
    }

    let emailSent = false;
    let emailError: string | undefined;

    // B2B SUBMISSION PATH: onboarding_submission_id is set
    if (scopedDoc.onboarding_submission_id) {
      const submissionId = scopedDoc.onboarding_submission_id;

      // Fetch the submission to get its context (segment, submission_data)
      const { data: submission, error: subError } = await supabase
        .from('onboarding_submissions')
        .select('id, customer_id, segment, submission_data, status')
        .eq('id', submissionId)
        .single();

      if (!subError && submission) {
        // Compute required docs based on segment + entity context
        const step2 = submission.submission_data?.step2;
        const required = requiredDocsFor(submission.segment as any, {
          vatRegistered: step2?.vat === 'Yes',
          entityType: step2?.entityType || '',
        })
          .filter((r) => r.required)
          .map((r) => r.type);

        // Fetch this submission's documents
        const { data: submissionDocs, error: docsError } = await supabase
          .from('kyc_documents')
          .select('document_type, verification_status')
          .eq('onboarding_submission_id', submissionId);

        if (!docsError && submissionDocs) {
          const vetting = computeVettingStatus(required, submissionDocs);

          // Update the submission's vetting status and overall status
          const submissionStatus =
            vetting === 'approved'
              ? 'approved'
              : vetting === 'rejected'
                ? 'rejected'
                : 'submitted';

          await supabase.from('onboarding_submissions').update({
            document_vetting_status: vetting,
            status: submissionStatus,
            admin_reviewed_at: new Date().toISOString(),
            admin_reviewed_by: authResult.adminUser.id,
          }).eq('id', submissionId);

          // Try to mark customer billing_ready if all conditions are met
          const marked = await maybeMarkBillingReady(supabase, submission.customer_id);

          // Send notifications (best-effort; failures don't break the API response)
          try {
            // Fetch customer + clinic details for notification
            const { data: customer } = await supabase
              .from('customers')
              .select('id, first_name, business_name, phone, email, clinic_details')
              .eq('id', submission.customer_id)
              .single();

            if (customer) {
              const firstName = customer.first_name || 'Clinic Owner';
              const clinicName = customer.business_name || 'Your Clinic';
              const phone = customer.phone;
              const email = customer.email;

              const whatsAppService = new WhatsAppService();

              // APPROVAL path: send approval notifications
              if (vetting === 'approved' && phone) {
                try {
                  // Send WhatsApp approval notification (best-effort)
                  // Note: circletel_docs_approved template submitted to Meta (PENDING approval)
                  await whatsAppService.sendTemplate(
                    phone,
                    'circletel_docs_approved' as any,
                    [
                      {
                        type: 'body',
                        parameters: [
                          { type: 'text', text: firstName },
                          { type: 'text', text: clinicName },
                        ],
                      },
                    ]
                  );
                } catch (err) {
                  apiLogger.error('[KYC B2B] WhatsApp approval send failed', { error: err });
                }

                // Send email approval notification (best-effort)
                if (email) {
                  try {
                    await EmailNotificationService.sendKycApproval(
                      email,
                      firstName,
                      customer.id
                    );
                  } catch (err) {
                    apiLogger.error('[KYC B2B] Email approval send failed', { error: err });
                  }
                }
              }

              // REJECTION path: send rejection notifications + magic link
              if (vetting === 'rejected' && phone) {
                try {
                  // Issue a fresh token for the clinic to re-upload documents
                  const token = await issueToken(customer.id, 'whatsapp');
                  const magicLink = buildMagicLinkUrl(
                    'https://www.circletel.co.za',
                    token
                  );

                  // Send WhatsApp rejection notification with link to fix documents
                  // Note: circletel_docs_changes template submitted to Meta (PENDING approval)
                  await whatsAppService.sendTemplate(
                    phone,
                    'circletel_docs_changes' as any,
                    [
                      {
                        type: 'body',
                        parameters: [
                          { type: 'text', text: firstName },
                          { type: 'text', text: clinicName },
                          { type: 'text', text: rejectionReason || 'Documents require review' },
                        ],
                      },
                      {
                        type: 'button',
                        sub_type: 'url',
                        index: 0,
                        parameters: [{ type: 'text', text: magicLink }],
                      },
                    ]
                  );
                } catch (err) {
                  apiLogger.error('[KYC B2B] WhatsApp rejection send failed', { error: err });
                }

                // Send email rejection notification
                if (email) {
                  try {
                    await EmailNotificationService.sendKycRejection(
                      email,
                      firstName,
                      customer.id,
                      rejectionReason || 'Documents require review'
                    );
                  } catch (err) {
                    apiLogger.error('[KYC B2B] Email rejection send failed', { error: err });
                  }
                }
              }
            }
          } catch (notifyErr) {
            apiLogger.error('[KYC B2B] Notification error (non-fatal)', { error: notifyErr });
          }

          return NextResponse.json({
            success: true,
            message: `Document ${status} successfully`,
            vetting,
            billingReadyMarked: marked,
          });
        }
      }
    }

    // CONSUMER ORDER PATH: consumer_order_id is set (original logic)
    if (status === 'approved') {
      // Check if all documents for this order are approved
      const { data: allDocs, error: docsError } = await supabase
        .from('kyc_documents')
        .select('verification_status')
        .eq('consumer_order_id', document.consumer_order_id);

      if (!docsError && allDocs) {
        const allApproved = allDocs.every((doc) => doc.verification_status === 'approved');

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
                apiLogger.error('Failed to send KYC approval email', { error: emailError });
              }
            } catch (error: unknown) {
              apiLogger.error('Error sending KYC approval email', { error });
              emailError = (error as Error).message;
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
            apiLogger.error('Failed to send KYC rejection email', { error: emailError });
          }
        } catch (error: unknown) {
          apiLogger.error('Error sending KYC rejection email', { error });
          emailError = (error as Error).message;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`,
      emailSent,
      emailError,
    });
  } catch (error: unknown) {
    apiLogger.error('API error', { error });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
