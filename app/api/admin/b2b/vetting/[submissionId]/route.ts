/**
 * B2B Onboarding Vetting Detail API
 * Fetches a single submission with its documents and banking details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const perm = requirePermission(authResult.adminUser, 'kyc:verify');
    if (perm) return perm;

    const supabase = await createServerClient();
    const { submissionId } = await context.params;

    // Fetch submission with customer details
    const { data: submission, error: subError } = await supabase
      .from('onboarding_submissions')
      .select(
        `
        id,
        customer_id,
        segment,
        status,
        document_vetting_status,
        submission_data,
        admin_reviewed_at,
        admin_reviewed_by,
        admin_notes,
        rejection_reason,
        submitted_at,
        customers(id, account_number, business_name, email, phone, clinic_details)
      `
      )
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Fetch this submission's documents
    const { data: documents, error: docsError } = await supabase
      .from('kyc_documents')
      .select('id, document_type, file_path, verification_status, rejection_reason, verified_at')
      .eq('onboarding_submission_id', submissionId);

    if (docsError) {
      apiLogger.error('Failed to fetch documents', { error: docsError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Fetch the customer's payment method(s) created by this submission
    const { data: paymentMethods, error: pmError } = await supabase
      .from('customer_payment_methods')
      .select('id, display_name, mandate_status, encrypted_details')
      .eq('customer_id', submission.customer_id)
      .eq('onboarding_submission_id', submissionId);

    if (pmError) {
      apiLogger.error('Failed to fetch payment methods', { error: pmError });
    }

    // Check name match: account holder vs business_name (trimmed, lowercased)
    const accountHolder = submission.submission_data?.step3?.accHolder ?? '';
    const customer = Array.isArray(submission.customers)
      ? submission.customers[0]
      : submission.customers;
    const businessName = customer?.business_name ?? '';
    const nameMatch =
      accountHolder.trim().toLowerCase() === businessName.trim().toLowerCase();

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        documents: documents || [],
        paymentMethods: paymentMethods || [],
        nameMatch,
      },
    });
  } catch (error: unknown) {
    apiLogger.error('API error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
