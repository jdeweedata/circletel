/**
 * Clinic Onboarding Pipeline Dashboard API
 *
 * Returns per-clinic rows for Unjani clinics (or any customers with active onboarding)
 * with stage indicators, SLA tracking, and aggregate counts.
 *
 * GET /api/admin/b2b/onboarding-pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';
import { differenceInDays } from 'date-fns';

interface PipelineClinic {
  account_number: string;
  customer_id: string;
  business_name: string;
  province: string;
  nurse_name: string | null;
  phone: string | null;
  email: string | null;
  stage: string;
  document_vetting_status: string | null;
  mandate_status: string | null;
  vetting_due_date: string | null;
  submitted_at: string | null;
  service_order_issued_at: string | null;
  sla: {
    dueDate: string | null;
    overdue: boolean;
    businessDaysLeft: number | null;
  };
  submission_id: string | null;
  site_address: string | null;
  incumbent_isp: string | null;
  incumbent_cost: number | null;
  contract_status: 'in_contract' | 'out_of_contract' | 'unknown';
}

interface PipelineResponse {
  clinics: PipelineClinic[];
  stageCounts: {
    invited: number;
    submitted: number;
    changes_requested: number;
    docs_approved: number;
    mandate_active: number;
    billing_ready: number;
    pending: number;
  };
  overdueCount: number;
}

/**
 * Determine the clinic's current stage in the onboarding pipeline
 */
function determineStage(
  onboarding_status: string | null,
  submission_status: string | null,
  document_vetting_status: string | null,
  mandate_status: string | null
): string {
  // billing_ready takes precedence
  if (onboarding_status === 'billing_ready') {
    return 'billing_ready';
  }

  // mandate_active (docs approved + mandate active but not billing_ready yet)
  if (mandate_status === 'active') {
    return 'mandate_active';
  }

  // docs_approved (vetting approved but mandate not yet active)
  if (document_vetting_status === 'approved') {
    return 'docs_approved';
  }

  // changes_requested (rejected docs)
  if (document_vetting_status === 'rejected') {
    return 'changes_requested';
  }

  // submitted (docs pending or under review)
  if (submission_status === 'submitted') {
    return 'submitted';
  }

  // invited (in_progress but no submission yet)
  if (onboarding_status === 'in_progress') {
    return 'invited';
  }

  return 'pending';
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const perm = requirePermission(authResult.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm;

    const supabase = await createServerClient();

    // Query: Get all Unjani clinics (business_name ilike '%unjani%' OR has onboarding_submission)
    // with their latest onboarding_submission + payment method info
    const { data: clinics, error: clinicsError } = await supabase
      .from('customers')
      .select(
        `
        id,
        account_number,
        business_name,
        phone,
        email,
        onboarding_status,
        clinic_details,
        onboarding_submissions!onboarding_submissions_customer_id_fkey (
          id,
          status,
          document_vetting_status,
          submitted_at,
          vetting_due_date,
          service_order_issued_at
        ),
        customer_payment_methods!customer_payment_methods_customer_id_fkey (
          id,
          mandate_status,
          method_type
        )
      `
      )
      .or(`business_name.ilike.%unjani%,onboarding_submissions.not.is.null`)
      .order('created_at', { ascending: false });

    if (clinicsError) {
      apiLogger.error('Failed to fetch clinic list', { error: clinicsError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clinic list' },
        { status: 500 }
      );
    }

    const now = new Date();
    const result: PipelineResponse = {
      clinics: [],
      stageCounts: {
        invited: 0,
        submitted: 0,
        changes_requested: 0,
        docs_approved: 0,
        mandate_active: 0,
        billing_ready: 0,
        pending: 0,
      },
      overdueCount: 0,
    };

    // Transform each clinic row
    for (const clinic of clinics || []) {
      // Latest submission (most recent, if any)
      const submission = Array.isArray(clinic.onboarding_submissions)
        ? clinic.onboarding_submissions[0]
        : null;

      // Debit-order payment method (method_type='debit_order')
      const debitOrderPm = Array.isArray(clinic.customer_payment_methods)
        ? clinic.customer_payment_methods.find((pm: any) => pm.method_type === 'debit_order')
        : null;

      const details =
        clinic.clinic_details && typeof clinic.clinic_details === 'object'
          ? (clinic.clinic_details as Record<string, unknown>)
          : {};
      const province = typeof details.province === 'string' ? details.province : '';
      const nurseName =
        typeof details.nurse_owner_name === 'string' ? details.nurse_owner_name : null;

      const stage = determineStage(
        clinic.onboarding_status,
        submission?.status || null,
        submission?.document_vetting_status || null,
        debitOrderPm?.mandate_status || null
      );

      // SLA calculation: vetting_due_date (if submitted) vs now
      let businessDaysLeft: number | null = null;
      let isOverdue = false;

      if (submission?.vetting_due_date) {
        const dueDate = new Date(submission.vetting_due_date);
        businessDaysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        isOverdue = businessDaysLeft < 0;
        if (isOverdue) {
          result.overdueCount++;
        }
      }

      const clinic_row: PipelineClinic = {
        account_number: clinic.account_number,
        customer_id: clinic.id,
        business_name: clinic.business_name,
        province,
        nurse_name: nurseName,
        phone: clinic.phone || null,
        email: clinic.email || null,
        stage,
        document_vetting_status: submission?.document_vetting_status || null,
        mandate_status: debitOrderPm?.mandate_status || null,
        vetting_due_date: submission?.vetting_due_date || null,
        submitted_at: submission?.submitted_at || null,
        service_order_issued_at: submission?.service_order_issued_at || null,
        sla: {
          dueDate: submission?.vetting_due_date || null,
          overdue: isOverdue,
          businessDaysLeft,
        },
        submission_id: submission?.id || null,
        site_address: (details.site_address as string) ?? null,
        incumbent_isp: (details.incumbent_isp as string) ?? null,
        incumbent_cost: (details.incumbent_cost as number) ?? null,
        contract_status:
          (details.contract_status as 'in_contract' | 'out_of_contract' | 'unknown') ?? 'unknown',
      };

      result.clinics.push(clinic_row);

      // Increment stage count
      if (stage in result.stageCounts) {
        result.stageCounts[stage as keyof typeof result.stageCounts]++;
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    apiLogger.error('API error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
