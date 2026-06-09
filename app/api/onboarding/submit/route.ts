import { NextRequest, NextResponse } from 'next/server';
import { resolveToken, svc } from '@/lib/onboarding/onboarding-service';
import { step1Schema, step2Schema, step3Schema, step5Schema } from '@/lib/onboarding/schemas';
import { requiredDocsFor } from '@/lib/onboarding/document-requirements';
import { buildEMandateRequest } from '@/lib/onboarding/emandate-request';
import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';

export async function POST(request: NextRequest) {
  const supabase = svc();
  const body = await request.json();
  const { token, mode } = body;
  const resolved = await resolveToken(token);
  if (!resolved) {
    return NextResponse.json(
      { success: false, error: 'invalid_or_expired' },
      { status: 401 }
    );
  }
  const customerId = resolved.customerId;

  // DRAFT: create (or return existing) a submission so document uploads have an anchor
  if (mode === 'draft') {
    const { data: existing } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('customer_id', customerId)
      .eq('status', 'draft')
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ success: true, submissionId: existing.id });
    }
    const { data, error } = await supabase
      .from('onboarding_submissions')
      .insert({ customer_id: customerId, segment: 'unjani', status: 'draft' })
      .select('id')
      .single();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, submissionId: data.id });
  }

  // FINAL: validate all steps
  const s1 = step1Schema.safeParse(body.step1);
  const s2 = step2Schema.safeParse(body.step2);
  const s3 = step3Schema.safeParse(body.step3);
  const s5 = step5Schema.safeParse(body.step5);
  if (!s1.success || !s2.success || !s3.success || !s5.success) {
    return NextResponse.json(
      { success: false, error: 'validation_failed' },
      { status: 400 }
    );
  }
  const submissionId = body.submissionId as string;

  // Require all mandatory documents present
  const required = requiredDocsFor('unjani', {
    vatRegistered: s2.data.vat === 'Yes',
    entityType: s2.data.entityType,
  });
  const { data: docs } = await supabase
    .from('kyc_documents')
    .select('document_type')
    .eq('onboarding_submission_id', submissionId);
  const have = new Set((docs ?? []).map(d => d.document_type));
  const missing = required.filter(r => r.required && !have.has(r.type));
  if (missing.length) {
    return NextResponse.json(
      {
        success: false,
        error: 'documents_missing',
        missing: missing.map(m => m.type),
      },
      { status: 400 }
    );
  }

  // 1) Enrich customer
  await supabase
    .from('customers')
    .update({
      business_name: s2.data.entityName,
      business_registration: s2.data.regNumber,
      tax_number: s2.data.vat === 'Yes' ? s2.data.vatNumber : null,
      onboarding_status: 'submitted',
      clinic_details: {
        clinic_name: s1.data.clinicName,
        unjani_account: s1.data.unjaniAcc,
        province: s1.data.province,
        nurse_owner_name: s1.data.contact,
        site_address: s1.data.siteAddress,
        lat: s1.data.lat,
        lng: s1.data.lng,
      },
    })
    .eq('id', customerId);

  // 2) Set chosen billing day on the service
  await supabase
    .from('customer_services')
    .update({ billing_day: Number(s5.data.paymentDate) })
    .eq('customer_id', customerId);

  // 3) Create payment method (mandate pending, NOT verified yet)
  const { data: pm } = await supabase
    .from('customer_payment_methods')
    .insert({
      customer_id: customerId,
      onboarding_submission_id: submissionId,
      method_type: 'debit_order',
      display_name: `DebiCheck - ${s3.data.bank} ****${s3.data.accNumber.slice(-4)}`,
      last_four: s3.data.accNumber.slice(-4),
      encrypted_details: {
        bank_name: s3.data.bank,
        account_holder_name: s3.data.accHolder,
        account_type: s3.data.accType,
        account_number: s3.data.accNumber,
        branch_code: s3.data.branchCode,
        verified: false,
      },
      mandate_status: 'pending',
      is_primary: true,
      is_active: true,
    })
    .select('id')
    .single();

  // 4) Finalize submission
  await supabase
    .from('onboarding_submissions')
    .update({
      status: 'submitted',
      document_vetting_status: 'documents_pending',
      submission_data: {
        step1: s1.data,
        step2: s2.data,
        step3: { ...s3.data, accNumber: `****${s3.data.accNumber.slice(-4)}` },
        step5: s5.data,
      },
    })
    .eq('id', submissionId);

  // 5) Mark token used (single-use)
  await supabase
    .from('onboarding_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', resolved.tokenId);

  // 6) Fire NetCash eMandate (best-effort; do not fail the submission on transient errors)
  const { data: cust } = await supabase
    .from('customers')
    .select('account_number')
    .eq('id', customerId)
    .single();
  const { data: svcRow } = await supabase
    .from('customer_services')
    .select('monthly_price, activation_date')
    .eq('customer_id', customerId)
    .maybeSingle();
  let fileToken: string | undefined;
  try {
    const req = buildEMandateRequest({
      accountNumber: cust!.account_number,
      paymentMethodId: pm!.id,
      submissionId,
      accountHolder: s3.data.accHolder,
      isConsumer: false,
      entityName: s2.data.entityName,
      registrationNumber: s2.data.regNumber,
      mobile: s1.data.phone,
      bank: s3.data.bank,
      accountType: s3.data.accType,
      accountNumber2: s3.data.accNumber,
      branchCode: s3.data.branchCode,
      monthlyExVat: Number(svcRow?.monthly_price ?? 450),
      vatPct: 15,
      paymentDay: s5.data.paymentDate,
      agreementDate: new Date().toISOString().slice(0, 10),
    });
    const result = await new NetCashEMandateBatchService().submitMandate(req);
    if (result.success) {
      fileToken = result.fileToken;
      await supabase
        .from('onboarding_submissions')
        .update({ netcash_file_token: fileToken })
        .eq('id', submissionId);
    }
  } catch (e) {
    console.error('[Onboarding] eMandate submit error', e);
  }

  return NextResponse.json({
    success: true,
    accountNumber: cust!.account_number,
    eMandateSent: !!fileToken,
  });
}
