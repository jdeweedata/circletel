/**
 * Backfill Service Order PDFs for Unjani Clinics
 *
 * This script generates and stores Service Order PDFs for clinics that have completed vetting
 * but don't yet have a service_order_pdf_path.
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/netcash/issue-service-orders.ts [account_number1] [account_number2] ...
 *
 * Examples:
 *   npx tsx scripts/netcash/issue-service-orders.ts CT-2026-00016 CT-2026-00017
 *   npx tsx scripts/netcash/issue-service-orders.ts  # defaults to CT-2026-00016, CT-2026-00017
 */

import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { generateServiceOrderBlob } from '@/lib/contracts/service-order-pdf';
import { uploadFile } from '@/lib/storage/supabase-upload';
import { apiLogger } from '@/lib/logging/logger';

const DEFAULT_ACCOUNTS = ['CT-2026-00016', 'CT-2026-00017'];

interface IssuanceResult {
  accountNumber: string;
  success: boolean;
  pdfPath?: string;
  error?: string;
}

async function issueSingleServiceOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
  accountNumber: string
): Promise<IssuanceResult> {
  try {
    // === Load Customer ===
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, account_number, business_name, email, phone, clinic_details, onboarding_status')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return {
        accountNumber,
        success: false,
        error: `Customer not found: ${customerError?.message || 'no record'}`,
      };
    }

    // === Load Latest Onboarding Submission ===
    const { data: submission, error: submissionError } = await supabase
      .from('onboarding_submissions')
      .select('id, submission_data, submitted_at, service_order_pdf_path')
      .eq('customer_id', customerId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (submissionError || !submission) {
      return {
        accountNumber,
        success: false,
        error: `No onboarding submission found: ${submissionError?.message || 'no record'}`,
      };
    }

    // Check if already issued
    if (submission.service_order_pdf_path) {
      return {
        accountNumber,
        success: true,
        pdfPath: submission.service_order_pdf_path,
      };
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
      return {
        accountNumber,
        success: false,
        error: `No customer service found: ${serviceError?.message || 'no record'}`,
      };
    }

    // === Extract Data from Submission ===
    const submissionData = submission.submission_data as any;
    const step5 = submissionData?.step5 || {};
    const billingDay = step5.paymentDate || '1';
    const clinicDetails = customer.clinic_details as any || {};

    // === Acceptance evidence (captured at the Step-5 click-accept) ===
    const acceptanceRecord = submissionData?.acceptance;
    let acceptance: Parameters<typeof generateServiceOrderBlob>[0]['acceptance'];
    if (acceptanceRecord?.accepted_at) {
      let linkSentVia: string | undefined;
      let linkSentAtIso: string | undefined;
      if (acceptanceRecord.token_id) {
        const { data: tokenRow } = await supabase
          .from('onboarding_tokens')
          .select('sent_via, sent_at')
          .eq('id', acceptanceRecord.token_id)
          .maybeSingle();
        linkSentVia = tokenRow?.sent_via || undefined;
        linkSentAtIso = tokenRow?.sent_at || undefined;
      }
      const digits = (customer.phone || '').replace(/\D/g, '');
      const maskedPhone =
        digits.length >= 7 ? `${digits.slice(0, 3)} *** ${digits.slice(-4)}` : undefined;

      acceptance = {
        acceptedAtIso: acceptanceRecord.accepted_at,
        ip: acceptanceRecord.ip || undefined,
        termsVersion: acceptanceRecord.terms_version || undefined,
        termsHash: acceptanceRecord.terms_hash || undefined,
        termsSnapshot: Array.isArray(acceptanceRecord.terms_snapshot)
          ? acceptanceRecord.terms_snapshot
          : undefined,
        linkSentVia,
        linkSentAtIso,
        maskedPhone,
        submissionId: submission.id,
      };
    }

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
      acceptance,
    });

    // Integrity hash
    const pdfSha256 = crypto
      .createHash('sha256')
      .update(Buffer.from(await pdfBlob.arrayBuffer()))
      .digest('hex');

    // === Upload PDF to Storage ===
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
      return {
        accountNumber,
        success: false,
        error: `PDF upload failed: ${uploadResult.error || 'unknown error'}`,
      };
    }

    // === Update Onboarding Submission with PDF Path + integrity hash ===
    const { error: updateError } = await supabase
      .from('onboarding_submissions')
      .update({
        service_order_pdf_path: uploadResult.path,
        service_order_issued_at: new Date().toISOString(),
        submission_data: {
          ...submissionData,
          service_order_pdf_sha256: pdfSha256,
        },
      })
      .eq('id', submission.id);

    if (updateError) {
      return {
        accountNumber,
        success: false,
        error: `Failed to update submission: ${updateError.message}`,
      };
    }

    console.log(`✓ ${accountNumber}: Service Order issued (${uploadResult.path})`);
    return {
      accountNumber,
      success: true,
      pdfPath: uploadResult.path,
    };
  } catch (error) {
    return {
      accountNumber,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const supabase = await createClient();

  // Parse account numbers from CLI args, default to the two clinics
  const accountNumbers = process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : DEFAULT_ACCOUNTS;

  console.log(`Issuing Service Orders for: ${accountNumbers.join(', ')}\n`);

  const results: IssuanceResult[] = [];

  for (const accountNumber of accountNumbers) {
    console.log(`Processing ${accountNumber}...`);

    // Look up the customer by account_number
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id')
      .eq('account_number', accountNumber)
      .maybeSingle();

    if (error || !customer) {
      results.push({
        accountNumber,
        success: false,
        error: `Customer not found: ${error?.message || 'no record'}`,
      });
      continue;
    }

    const result = await issueSingleServiceOrder(supabase, customer.id, accountNumber);
    results.push(result);
  }

  // Summary
  console.log('\n--- Summary ---');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  for (const result of results) {
    if (!result.success) {
      console.log(`✗ ${result.accountNumber}: ${result.error}`);
    }
  }

  console.log(`\nTotal: ${successful} successful, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
