import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateServiceOrderBlob, type ServiceOrderInput } from '@/lib/contracts/service-order-pdf';
import { uploadFile } from '@/lib/storage/supabase-upload';
import { issueToken } from './onboarding-service';
import {
  SERVICE_ORDER_TERMS,
  SERVICE_ORDER_TERMS_TITLE,
  SERVICE_ORDER_TERMS_VERSION,
  getServiceOrderReference,
  stripHtmlFromTerms,
} from './service-order-terms';

interface ServiceOrderIssuerOptions {
  customerId: string;
  baseUrl?: string;
  issuedBy: string;
  sendEmail?: boolean;
}

export interface ServiceOrderIssueResult {
  pdfPath: string;
  pdfSha256: string;
  submissionId: string;
  emailed: boolean;
  signoffUrl?: string;
}

interface CustomerRow {
  id: string;
  account_number: string;
  business_name: string;
  email: string;
  phone: string | null;
  clinic_details: Record<string, unknown> | null;
}

interface SubmissionRow {
  id: string;
  segment: string | null;
  submitted_at: string | null;
  submission_data: Record<string, any> | null;
}

interface ServiceRow {
  monthly_price: number | null;
  activation_date: string | null;
  package_name?: string | null;
  service_type?: string | null;
}

function cleanBaseUrl(baseUrl?: string): string {
  return (baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za').replace(/\/+$/, '');
}

export function buildServiceOrderSignoffUrl(baseUrl: string, token: string): string {
  return `${cleanBaseUrl(baseUrl)}/service-order/${token}`;
}

function termsHash(reference: string): string {
  const canonical = JSON.stringify([
    SERVICE_ORDER_TERMS_TITLE,
    ...SERVICE_ORDER_TERMS,
    reference,
  ]);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function buildAcceptance(
  submission: SubmissionRow,
  customer: CustomerRow
): ServiceOrderInput['acceptance'] | undefined {
  const submissionData = submission.submission_data ?? {};
  const acceptanceRecord = submissionData.service_order_acceptance ?? submissionData.acceptance;
  if (!acceptanceRecord?.accepted_at) return undefined;

  const digits = (customer.phone || '').replace(/\D/g, '');
  const maskedPhone =
    digits.length >= 7 ? `${digits.slice(0, 3)} *** ${digits.slice(-4)}` : undefined;

  return {
    acceptedAtIso: acceptanceRecord.accepted_at,
    ip: acceptanceRecord.ip || undefined,
    termsVersion: acceptanceRecord.terms_version || undefined,
    termsHash: acceptanceRecord.terms_hash || undefined,
    termsSnapshot: Array.isArray(acceptanceRecord.terms_snapshot)
      ? acceptanceRecord.terms_snapshot
      : undefined,
    linkSentVia: acceptanceRecord.link_sent_via || undefined,
    linkSentAtIso: acceptanceRecord.link_sent_at || undefined,
    maskedPhone,
    submissionId: submission.id,
  };
}

function buildPdfInput(
  customer: CustomerRow,
  submission: SubmissionRow,
  service: ServiceRow
): ServiceOrderInput {
  const submissionData = submission.submission_data ?? {};
  const step5 = submissionData.step5 ?? {};
  const clinicDetails = customer.clinic_details ?? {};
  const segment = submission.segment ?? 'unjani';
  const customerLabel = segment === 'unjani' ? 'Clinic' : 'Business';
  const serviceReference = getServiceOrderReference(segment);
  const serviceName =
    service.package_name ||
    (segment === 'unjani'
      ? 'CircleTel ClinicConnect — Managed Connectivity'
      : 'CircleTel Business Connectivity Service');

  return {
    accountNumber: customer.account_number,
    clinicName: customer.business_name,
    clinicAddress:
      String(clinicDetails.site_address || submissionData.step1?.siteAddress || 'Not provided'),
    clinicProvince: String(clinicDetails.province || submissionData.step1?.province || 'Not provided'),
    clinicEmail: customer.email,
    clinicPhone: customer.phone || undefined,
    customerLabel,
    serviceName,
    serviceReference,
    monthlyFeeExclVat: Number(service.monthly_price ?? 450),
    vatPercentage: 15,
    billingDay: (step5.paymentDate || '1') as '1' | '15' | '20' | '25',
    activationDate: service.activation_date || new Date().toISOString(),
    submittedAt: submission.submitted_at || new Date().toISOString(),
    acceptance: buildAcceptance(submission, customer),
  };
}

function serviceOrderEmailHtml(input: {
  customer: CustomerRow;
  accountNumber: string;
  monthlyFee: number;
  signoffUrl: string;
}) {
  return `
    <h2>CircleTel Service Order</h2>
    <p>Dear ${input.customer.business_name},</p>
    <p>Your Service Order is ready for sign-off.</p>
    <div style="background-color:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:8px 0;"><strong>Account Number:</strong> ${input.accountNumber}</p>
      <p style="margin:8px 0;"><strong>Monthly Fee:</strong> R${input.monthlyFee.toFixed(2)} ex VAT</p>
    </div>
    <p><a href="${input.signoffUrl}" style="display:inline-block;background:#E87A1E;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700;">Review and sign off</a></p>
    <p>The generated PDF is attached for your records.</p>
    <p>Regards,<br>CircleTel</p>
  `;
}

export async function issueServiceOrderForCustomer(
  supabase: SupabaseClient,
  options: ServiceOrderIssuerOptions
): Promise<ServiceOrderIssueResult> {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, account_number, business_name, email, phone, clinic_details')
    .eq('id', options.customerId)
    .single();
  if (customerError || !customer) {
    throw new Error(customerError?.message || 'Customer not found');
  }

  const { data: submission, error: submissionError } = await supabase
    .from('onboarding_submissions')
    .select('id, segment, submission_data, submitted_at')
    .eq('customer_id', options.customerId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();
  if (submissionError || !submission) {
    throw new Error(submissionError?.message || 'No onboarding submission found for this customer');
  }

  const { data: service, error: serviceError } = await supabase
    .from('customer_services')
    .select('monthly_price, activation_date, package_name, service_type')
    .eq('customer_id', options.customerId)
    .order('activation_date', { ascending: false })
    .limit(1)
    .single();
  if (serviceError || !service) {
    throw new Error(serviceError?.message || 'No active service found for this customer');
  }

  const customerRow = customer as CustomerRow;
  const submissionRow = submission as SubmissionRow;
  const serviceRow = service as ServiceRow;
  const pdfInput = buildPdfInput(customerRow, submissionRow, serviceRow);
  const pdfBlob = generateServiceOrderBlob(pdfInput);
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
  const pdfSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  const filename = `SO-${customerRow.account_number}.pdf`;

  const pdfFile = new File([pdfBlob], `${filename.replace(/\.pdf$/, '')}-${Date.now()}.pdf`, {
    type: 'application/pdf',
  });
  const uploadResult = await uploadFile(pdfFile, {
    bucket: 'kyc-documents',
    folder: `service-orders/${options.customerId}`,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedTypes: ['application/pdf'],
    supabaseClient: supabase,
  });
  if (!uploadResult.success || !uploadResult.path) {
    throw new Error(uploadResult.error || 'Failed to upload service order PDF');
  }

  const existingSubmissionData = submissionRow.submission_data ?? {};
  const accepted = Boolean(existingSubmissionData.service_order_acceptance?.accepted_at || existingSubmissionData.acceptance?.accepted_at);
  const issuedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('onboarding_submissions')
    .update({
      service_order_pdf_path: uploadResult.path,
      service_order_issued_at: issuedAt,
      submission_data: {
        ...existingSubmissionData,
        service_order_pdf_sha256: pdfSha256,
        service_order_status: accepted ? 'accepted' : 'pending_signoff',
        service_order_issued_by: options.issuedBy,
        service_order_issued_at: issuedAt,
      },
    })
    .eq('id', submissionRow.id);
  if (updateError) {
    throw new Error(updateError.message || 'Failed to update submission service order');
  }

  let emailed = false;
  let signoffUrl: string | undefined;
  if (options.sendEmail !== false) {
    const token = await issueToken(options.customerId, 'email', {
      purpose: 'service_order_signoff',
      onboardingSubmissionId: submissionRow.id,
      metadata: {
        service_order_pdf_path: uploadResult.path,
        issued_by: options.issuedBy,
      },
    });
    signoffUrl = buildServiceOrderSignoffUrl(cleanBaseUrl(options.baseUrl), token);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: 'billing@notify.circletel.co.za',
      to: customerRow.email,
      subject: `CircleTel Service Order ${customerRow.account_number}`,
      html: serviceOrderEmailHtml({
        customer: customerRow,
        accountNumber: customerRow.account_number,
        monthlyFee: Number(serviceRow.monthly_price ?? 450),
        signoffUrl,
      }),
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    if (emailError) {
      throw new Error(emailError.message || 'Failed to send service order email');
    }
    emailed = true;
  }

  return {
    pdfPath: uploadResult.path,
    pdfSha256,
    submissionId: submissionRow.id,
    emailed,
    signoffUrl,
  };
}

export function buildServiceOrderAcceptanceRecord(input: {
  tokenId: string;
  ip: string | null;
  userAgent: string | null;
  segment?: string | null;
}) {
  const acceptedAt = new Date().toISOString();
  const reference = getServiceOrderReference(input.segment);
  return {
    accepted_at: acceptedAt,
    ip: input.ip,
    user_agent: input.userAgent,
    token_id: input.tokenId,
    terms_version: SERVICE_ORDER_TERMS_VERSION,
    terms_hash: termsHash(reference),
    terms_snapshot: stripHtmlFromTerms(SERVICE_ORDER_TERMS),
    service_reference: reference,
  };
}
