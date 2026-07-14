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
import { getBusinessDaysUntil } from '@/lib/dates/business-days';

interface PipelineClinic {
  account_number: string;
  customer_id: string;
  business_name: string;
  province: string;
  nurse_name: string | null;
  phone: string | null;
  email: string | null;
  stage: string;
  display_stage: string;
  document_vetting_status: string | null;
  mandate_status: string | null;
  vetting_due_date: string | null;
  submitted_at: string | null;
  service_order_issued_at: string | null;
  /** Storage path in kyc-documents when a Service Order PDF was issued */
  service_order_pdf_path: string | null;
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
  current_service: PipelineService | null;
  latest_invoice: PipelineInvoice | null;
}

interface PipelineResponse {
  clinics: PipelineClinic[];
  stageCounts: {
    invited: number;
    submitted: number;
    changes_requested: number;
    docs_approved: number;
    billing_ready: number;
    service_active: number;
    pending: number;
  };
  overdueCount: number;
}

interface VettingSla {
  dueDate: string | null;
  overdue: boolean;
  businessDaysLeft: number | null;
}

interface PipelineService {
  status: string | null;
  active: boolean | null;
  package_name: string | null;
  monthly_price: number | null;
  activation_date: string | null;
  billing_day: number | null;
  last_invoice_date: string | null;
}

interface PipelineInvoice {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  status: string | null;
  total_amount: number | null;
  amount_paid: number | null;
  amount_due: number | null;
  paid_at: string | null;
  payment_collection_method: string | null;
}

interface PipelineSubmission {
  id?: string | null;
  status?: string | null;
  document_vetting_status?: string | null;
  submitted_at?: string | null;
  vetting_due_date?: string | null;
  service_order_issued_at?: string | null;
  service_order_pdf_path?: string | null;
}

interface PipelinePaymentMethod {
  method_type?: string | null;
  mandate_status?: string | null;
  is_active?: boolean | null;
  encrypted_details?: unknown;
}

const CLOSED_VETTING_STATUSES = new Set(['approved', 'rejected', 'expired']);

function dateTimeValue(value?: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Vetting SLA only applies while documents are awaiting internal review.
 * Once vetting resolves, completed rows stay in their pipeline stage but drop
 * out of overdue counts and SLA filters.
 */
export function calculateVettingSla(
  submission: {
    document_vetting_status?: string | null;
    vetting_due_date?: string | null;
  } | null,
  now = new Date()
): VettingSla {
  const status = submission?.document_vetting_status ?? null;
  const isClosed = status !== null && CLOSED_VETTING_STATUSES.has(status);

  if (!submission?.vetting_due_date || isClosed) {
    return {
      dueDate: null,
      overdue: false,
      businessDaysLeft: null,
    };
  }

  const dueDate = new Date(submission.vetting_due_date);
  if (Number.isNaN(dueDate.getTime())) {
    return {
      dueDate: null,
      overdue: false,
      businessDaysLeft: null,
    };
  }

  const businessDaysLeft = getBusinessDaysUntil(now, dueDate);

  return {
    dueDate: submission.vetting_due_date,
    overdue: businessDaysLeft < 0,
    businessDaysLeft,
  };
}

export function pickCurrentService(
  services: Array<PipelineService & { created_at?: string | null }> | null | undefined
): PipelineService | null {
  if (!services || services.length === 0) return null;

  const sorted = [...services].sort((a, b) => {
    const aActive = a.status === 'active' || a.active === true ? 1 : 0;
    const bActive = b.status === 'active' || b.active === true ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;

    return (
      dateTimeValue(b.activation_date) - dateTimeValue(a.activation_date) ||
      dateTimeValue(b.created_at) - dateTimeValue(a.created_at)
    );
  });

  const service = sorted[0];

  return {
    status: service.status,
    active: service.active,
    package_name: service.package_name,
    monthly_price: service.monthly_price,
    activation_date: service.activation_date,
    billing_day: service.billing_day,
    last_invoice_date: service.last_invoice_date,
  };
}

export function pickLatestInvoice(
  invoices: Array<PipelineInvoice & { created_at?: string | null }> | null | undefined
): PipelineInvoice | null {
  if (!invoices || invoices.length === 0) return null;

  const sorted = [...invoices].sort(
    (a, b) =>
      dateTimeValue(b.invoice_date) - dateTimeValue(a.invoice_date) ||
      dateTimeValue(b.created_at) - dateTimeValue(a.created_at)
  );

  const invoice = sorted[0];

  return {
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    status: invoice.status,
    total_amount: invoice.total_amount,
    amount_paid: invoice.amount_paid,
    amount_due: invoice.amount_due,
    paid_at: invoice.paid_at,
    payment_collection_method: invoice.payment_collection_method,
  };
}

export function isPipelineServiceActive(
  service: Pick<PipelineService, 'status' | 'active'> | null | undefined
): boolean {
  return service?.status === 'active' || service?.active === true;
}

function detailsObject(details: unknown): Record<string, unknown> {
  return details && typeof details === 'object' && !Array.isArray(details)
    ? (details as Record<string, unknown>)
    : {};
}

export function paymentMethodIsCollectible(
  paymentMethod: PipelinePaymentMethod | null | undefined
): boolean {
  const details = detailsObject(paymentMethod?.encrypted_details);
  const verified = details.verified === true || details.verified === 'true';
  const mandateActive =
    paymentMethod?.mandate_status === 'active' || paymentMethod?.mandate_status === 'approved';

  return (
    paymentMethod?.method_type === 'debit_order' &&
    paymentMethod?.is_active === true &&
    mandateActive &&
    verified &&
    Boolean(details.account_number) &&
    Boolean(details.branch_code)
  );
}

export function pickDebitOrderPaymentMethod(
  paymentMethods: PipelinePaymentMethod[] | null | undefined
): PipelinePaymentMethod | null {
  const debitOrderMethods = (paymentMethods || []).filter(
    (paymentMethod) => paymentMethod.method_type === 'debit_order'
  );

  return (
    debitOrderMethods.find(paymentMethodIsCollectible) ||
    debitOrderMethods.find((paymentMethod) => paymentMethod.is_active === true) ||
    debitOrderMethods[0] ||
    null
  );
}

export function pickLatestSubmission<T extends PipelineSubmission>(
  submissions: T[] | null | undefined
): T | null {
  if (!submissions || submissions.length === 0) return null;

  return [...submissions].sort(
    (a, b) => dateTimeValue(b.submitted_at) - dateTimeValue(a.submitted_at)
  )[0];
}

export function clinicIsBillingActivated(
  stage: string,
  submission: PipelineSubmission | null | undefined,
  service: Pick<PipelineService, 'status' | 'active'> | null | undefined,
  paymentMethod: PipelinePaymentMethod | null | undefined
): boolean {
  return (
    stage === 'billing_ready' &&
    submission?.document_vetting_status === 'approved' &&
    Boolean(submission.service_order_issued_at) &&
    isPipelineServiceActive(service) &&
    paymentMethodIsCollectible(paymentMethod)
  );
}

export function displayStageForClinic(
  stage: string,
  submission: PipelineSubmission | null | undefined,
  service: Pick<PipelineService, 'status' | 'active'> | null | undefined,
  paymentMethod: PipelinePaymentMethod | null | undefined
): string {
  return clinicIsBillingActivated(stage, submission, service, paymentMethod)
    ? 'service_active'
    : stage;
}

/**
 * Determine the clinic's current stage in the onboarding pipeline
 *
 * Stages flow: pending → invited → submitted → changes_requested/docs_approved → billing_ready
 * No longer includes mandate_active (billing bypassed eMandate signature via click-wrap).
 */
export function determineStage(
  onboarding_status: string | null,
  submission_status: string | null,
  document_vetting_status: string | null
): string {
  // billing_ready takes precedence
  if (onboarding_status === 'billing_ready') {
    return 'billing_ready';
  }

  // docs_approved (vetting approved, bank details on file)
  // Note: mandate_status is no longer required; we check bank details in the gate
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
          service_order_issued_at,
          service_order_pdf_path
        ),
        customer_payment_methods!customer_payment_methods_customer_id_fkey (
          id,
          mandate_status,
          method_type,
          is_active,
          encrypted_details
        ),
        customer_services!customer_services_customer_id_fkey (
          status,
          active,
          package_name,
          monthly_price,
          activation_date,
          billing_day,
          last_invoice_date,
          created_at
        ),
        customer_invoices!customer_invoices_customer_id_fkey (
          invoice_number,
          invoice_date,
          due_date,
          status,
          total_amount,
          amount_paid,
          amount_due,
          paid_at,
          payment_collection_method,
          created_at
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
        billing_ready: 0,
        service_active: 0,
        pending: 0,
      },
      overdueCount: 0,
    };

    // Transform each clinic row
    for (const clinic of clinics || []) {
      // Latest submission (most recent, if any)
      const submission = pickLatestSubmission(
        Array.isArray(clinic.onboarding_submissions) ? clinic.onboarding_submissions : null
      );

      // Debit-order payment method (method_type='debit_order')
      const debitOrderPm = pickDebitOrderPaymentMethod(
        Array.isArray(clinic.customer_payment_methods) ? clinic.customer_payment_methods : null
      );
      const currentService = pickCurrentService(
        Array.isArray(clinic.customer_services) ? clinic.customer_services : null
      );
      const latestInvoice = pickLatestInvoice(
        Array.isArray(clinic.customer_invoices) ? clinic.customer_invoices : null
      );

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
        submission?.document_vetting_status || null
      );
      const displayStage = displayStageForClinic(stage, submission, currentService, debitOrderPm);

      const sla = calculateVettingSla(submission, now);
      if (sla.overdue) {
        result.overdueCount++;
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
        display_stage: displayStage,
        document_vetting_status: submission?.document_vetting_status || null,
        mandate_status: debitOrderPm?.mandate_status || null,
        vetting_due_date: submission?.vetting_due_date || null,
        submitted_at: submission?.submitted_at || null,
        service_order_issued_at: submission?.service_order_issued_at || null,
        service_order_pdf_path: submission?.service_order_pdf_path || null,
        sla,
        submission_id: submission?.id || null,
        site_address: (details.site_address as string) ?? null,
        incumbent_isp: (details.incumbent_isp as string) ?? null,
        incumbent_cost: (details.incumbent_cost as number) ?? null,
        contract_status:
          (details.contract_status as 'in_contract' | 'out_of_contract' | 'unknown') ?? 'unknown',
        current_service: currentService,
        latest_invoice: latestInvoice,
      };

      result.clinics.push(clinic_row);

      // Increment stage count
      if (displayStage in result.stageCounts) {
        result.stageCounts[displayStage as keyof typeof result.stageCounts]++;
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
