/**
 * Issue Service Order PDF API
 *
 * POST /api/admin/b2b/issue-service-order
 *
 * Admin-only endpoint to generate and issue a Service Order PDF to a clinic.
 * Generates PDF, uploads to kyc-documents bucket, sends email copy to clinic.
 *
 * Request body:
 * {
 *   customerId: string (UUID)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   pdfPath: string,
 *   emailed: boolean,
 *   message: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { uploadFile } from '@/lib/storage/supabase-upload';
import { generateServiceOrderBlob } from '@/lib/contracts/service-order-pdf';
import { apiLogger } from '@/lib/logging/logger';
import { Resend } from 'resend';

interface RequestBody {
  customerId: string;
}

interface ServiceOrderResponse {
  success: boolean;
  pdfPath?: string;
  emailed?: boolean;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ServiceOrderResponse>> {
  try {
    // === Admin Auth ===
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response as NextResponse<ServiceOrderResponse>;

    const perm = requirePermission(authResult.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm as NextResponse<ServiceOrderResponse>;

    const supabase = await createServerClient();
    const { customerId } = (await request.json()) as RequestBody;

    if (!customerId) {
      return NextResponse.json<ServiceOrderResponse>(
        { success: false, message: 'customerId is required' },
        { status: 400 }
      );
    }

    // === Load Customer ===
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, account_number, business_name, email, phone, clinic_details, onboarding_status')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      apiLogger.error('[Service Order] Customer not found', { customerId, error: customerError });
      return NextResponse.json<ServiceOrderResponse>(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // === Load Latest Onboarding Submission ===
    const { data: submission, error: submissionError } = await supabase
      .from('onboarding_submissions')
      .select('id, submission_data, submitted_at')
      .eq('customer_id', customerId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (submissionError || !submission) {
      apiLogger.error('[Service Order] No onboarding submission found', { customerId, error: submissionError });
      return NextResponse.json<ServiceOrderResponse>(
        { success: false, message: 'No onboarding submission found for this customer' },
        { status: 404 }
      );
    }

    // === Load Customer Service (for monthly price) ===
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select('monthly_price, activation_date')
      .eq('customer_id', customerId)
      .order('activation_date', { ascending: false })
      .limit(1)
      .single();

    if (serviceError || !service) {
      apiLogger.error('[Service Order] No customer service found', { customerId, error: serviceError });
      return NextResponse.json<ServiceOrderResponse>(
        { success: false, message: 'No active service found for this customer' },
        { status: 404 }
      );
    }

    // === Extract Data from Submission ===
    const submissionData = submission.submission_data as any;
    const step5 = submissionData?.step5 || {};
    const billingDay = step5.paymentDate || '1';
    const clinicDetails = customer.clinic_details as any || {};

    // === Generate Service Order PDF ===
    const pdfBlob = generateServiceOrderBlob({
      accountNumber: customer.account_number,
      clinicName: customer.business_name,
      clinicAddress: clinicDetails.site_address || 'Not provided',
      clinicProvince: clinicDetails.province || 'Not provided',
      clinicEmail: customer.email,
      clinicPhone: customer.phone,
      monthlyFeeExclVat: service.monthly_price || 450,
      vatPercentage: 15,
      billingDay: billingDay as '1' | '15' | '20' | '25',
      activationDate: service.activation_date || new Date().toISOString(),
      submittedAt: submission.submitted_at || new Date().toISOString(),
    });

    // === Upload PDF to Storage ===
    // Convert Blob to File for uploadFile API
    const pdfFile = new File(
      [pdfBlob],
      `SO-${customer.account_number}-${Date.now()}.pdf`,
      { type: 'application/pdf' }
    );

    const uploadResult = await uploadFile(pdfFile, {
      bucket: 'kyc-documents',
      folder: `service-orders/${customerId}`,
      maxSizeBytes: 5 * 1024 * 1024,
      allowedTypes: ['application/pdf'],
      supabaseClient: supabase,
    });

    if (!uploadResult.success || !uploadResult.path) {
      apiLogger.error('[Service Order] PDF upload failed', { customerId, error: uploadResult.error });
      return NextResponse.json<ServiceOrderResponse>(
        { success: false, message: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // === Update Onboarding Submission with PDF Path ===
    const { error: updateError } = await supabase
      .from('onboarding_submissions')
      .update({
        service_order_pdf_path: uploadResult.path,
        service_order_issued_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (updateError) {
      apiLogger.error('[Service Order] Failed to update submission', { submissionId: submission.id, error: updateError });
      return NextResponse.json<ServiceOrderResponse>(
        { success: false, message: 'Failed to update submission record' },
        { status: 500 }
      );
    }

    // === Send Email (best effort, don't fail the request) ===
    let emailSent = false;
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: emailError } = await resend.emails.send({
        from: 'billing@notify.circletel.co.za',
        to: customer.email,
        subject: `Your CircleTel Service Order (${customer.account_number})`,
        html: `
          <h2>Service Order Issued</h2>
          <p>Dear ${customer.business_name},</p>
          <p>Your Service Order has been generated and is attached to this email.</p>
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 8px 0;"><strong>Service Order Number:</strong> SO-${customer.account_number}</p>
            <p style="margin: 8px 0;"><strong>Service:</strong> CircleTel ClinicConnect — Managed Connectivity</p>
            <p style="margin: 8px 0;"><strong>Monthly Fee:</strong> R${(service.monthly_price || 450).toFixed(2)} ex VAT</p>
            <p style="margin: 8px 0;"><strong>Billing Day:</strong> ${billingDay === '1' ? '1st' : billingDay === '15' ? '15th' : billingDay === '20' ? '20th' : '25th'}</p>
          </div>
          <p>This Service Order is back-to-back with the Master Service Agreement between CircleTel and the Unjani Clinic Network.</p>
          <p>If you have any questions, please contact our support team at support@circletel.co.za.</p>
          <p>Regards,<br>CircleTel</p>
        `,
      });

      if (!emailError) {
        emailSent = true;
      } else {
        apiLogger.warn('[Service Order] Email send failed but request succeeding', { customerId, error: emailError });
      }
    } catch (emailException) {
      apiLogger.warn('[Service Order] Email exception but request succeeding', { customerId, error: emailException });
    }

    apiLogger.info('[Service Order] Service Order issued successfully', {
      customerId,
      accountNumber: customer.account_number,
      pdfPath: uploadResult.path,
      emailed: emailSent,
    });

    return NextResponse.json<ServiceOrderResponse>(
      {
        success: true,
        pdfPath: uploadResult.path,
        emailed: emailSent,
        message: `Service Order issued successfully. Email ${emailSent ? 'sent' : 'could not be sent'}.`,
      },
      { status: 200 }
    );
  } catch (error) {
    apiLogger.error('[Service Order] Unexpected error', { error });
    return NextResponse.json<ServiceOrderResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
