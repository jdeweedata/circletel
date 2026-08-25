import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resolveToken, svc } from '@/lib/onboarding/onboarding-service';
import { step1Schema, step2Schema, step3Schema, step5Schema } from '@/lib/onboarding/schemas';
import { requiredDocsFor } from '@/lib/onboarding/document-requirements';
import { buildEMandateRequest } from '@/lib/onboarding/emandate-request';
import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import { addBusinessDays, now } from '@/lib/dates';
import {
  SERVICE_ORDER_TERMS,
  SERVICE_ORDER_TERMS_TITLE,
  SERVICE_ORDER_TERMS_VERSION,
  SERVICE_ORDER_MSA_REFERENCE,
  stripHtmlFromTerms,
} from '@/lib/onboarding/service-order-terms';

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

  // Check idempotency: if already submitted/approved, short-circuit
  const { data: existingSub } = await supabase
    .from('onboarding_submissions')
    .select('status')
    .eq('id', submissionId)
    .single();
  if (existingSub?.status === 'submitted' || existingSub?.status === 'approved') {
    const { data: c } = await supabase
      .from('customers')
      .select('account_number')
      .eq('id', customerId)
      .single();
    return NextResponse.json({
      success: true,
      accountNumber: c?.account_number,
      eMandateSent: true,
      idempotent: true,
    });
  }

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
  const { error: custErr } = await supabase
    .from('customers')
    .update({
      business_name: s2.data.entityName,
      business_registration: s2.data.regNumber,
      tax_number: s2.data.vat === 'Yes' ? s2.data.vatNumber : null,
      onboarding_status: 'submitted',
      clinic_details: {
        clinic_name: s1.data.clinicName,
        province: s1.data.province,
        nurse_owner_name: s1.data.contact,
        site_address: s1.data.siteAddress,
        lat: s1.data.lat,
        lng: s1.data.lng,
      },
    })
    .eq('id', customerId);
  if (custErr) {
    return NextResponse.json(
      { success: false, error: custErr.message },
      { status: 500 }
    );
  }

  // 2) Set chosen billing day on the service
  const { error: svcErr } = await supabase
    .from('customer_services')
    .update({ billing_day: Number(s5.data.paymentDate) })
    .eq('customer_id', customerId);
  if (svcErr) {
    return NextResponse.json(
      { success: false, error: svcErr.message },
      { status: 500 }
    );
  }

  // 3) Create payment method.
  // The click-wrap Service Order acceptance below IS the signed debit order
  // mandate (terms clause: "constitutes your signed debit order mandate", with
  // IP/UA/terms-hash evidence captured) — so the mandate is ACTIVE from
  // acceptance. A later NetCash DebiCheck signature only re-affirms it.
  // bank-details `verified` stays false until eMandate/first collection.
  const acceptedAt = new Date().toISOString();
  // Avoid duplicate payment methods on retry
  const { data: existingPm } = await supabase
    .from('customer_payment_methods')
    .select('id')
    .eq('onboarding_submission_id', submissionId)
    .maybeSingle();
  let paymentMethodId: string;
  if (existingPm) {
    paymentMethodId = existingPm.id;
  } else {
    const { data: pm, error: pmErr } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id: customerId,
        onboarding_submission_id: submissionId,
        method_type: 'debit_order',
        display_name: `DebiCheck - ${s3.data.bank} ****${s3.data.accNumber.slice(-4)}`,
        last_four: s3.data.accNumber.slice(-4),
        // plain object: debit-order batch + eMandate webhook read encrypted_details.verified directly
        encrypted_details: {
          bank_name: s3.data.bank,
          account_holder_name: s3.data.accHolder,
          account_type: s3.data.accType,
          account_number: s3.data.accNumber,
          branch_code: s3.data.branchCode,
          verified: false,
        },
        mandate_status: 'active',
        mandate_approved_at: acceptedAt,
        is_primary: true,
        is_active: true,
      })
      .select('id')
      .single();
    if (pmErr) {
      return NextResponse.json(
        { success: false, error: pmErr.message },
        { status: 500 }
      );
    }
    paymentMethodId = pm!.id;
  }

  // 4) Finalize submission
  const vettingDueDate = addBusinessDays(now(), 2); // 2 business days from now

  // Acceptance evidence: exactly which terms were accepted, when, and from where.
  // The snapshot + hash let us prove the accepted terms even after the live terms change.
  const termsCanonical = JSON.stringify([
    SERVICE_ORDER_TERMS_TITLE,
    ...SERVICE_ORDER_TERMS,
    SERVICE_ORDER_MSA_REFERENCE,
  ]);
  const acceptance = {
    accepted_at: acceptedAt,
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null,
    user_agent: request.headers.get('user-agent') || null,
    token_id: resolved.tokenId,
    terms_version: SERVICE_ORDER_TERMS_VERSION,
    terms_hash: crypto.createHash('sha256').update(termsCanonical).digest('hex'),
    terms_snapshot: stripHtmlFromTerms(SERVICE_ORDER_TERMS),
    msa_reference: SERVICE_ORDER_MSA_REFERENCE,
  };

  const { error: subErr } = await supabase
    .from('onboarding_submissions')
    .update({
      status: 'submitted',
      document_vetting_status: 'documents_pending',
      submitted_at: acceptedAt,
      vetting_due_date: vettingDueDate.toISOString(),
      submission_data: {
        step1: s1.data,
        step2: s2.data,
        step3: { ...s3.data, accNumber: `****${s3.data.accNumber.slice(-4)}` },
        step5: s5.data,
        acceptance,
      },
    })
    .eq('id', submissionId);
  if (subErr) {
    return NextResponse.json(
      { success: false, error: subErr.message },
      { status: 500 }
    );
  }

  // 5) Mark token used (single-use)
  await supabase
    .from('onboarding_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', resolved.tokenId);

  // 6) Fire NetCash eMandate (best-effort; do not fail the submission on transient errors)
  const { data: cust } = await supabase
    .from('customers')
    .select('account_number, business_name, first_name, phone')
    .eq('id', customerId)
    .single();
  const { data: svcRow } = await supabase
    .from('customer_services')
    .select('monthly_price, activation_date')
    .eq('customer_id', customerId)
    .maybeSingle();
  let fileToken: string | undefined;
  let eMandateSent = false;
  try {
    // Null-check: skip eMandate if account_number is missing, but don't crash
    if (!cust?.account_number) {
      console.warn('[Onboarding] customer account_number not found, skipping eMandate');
    } else {
      const req = buildEMandateRequest({
        accountNumber: cust.account_number,
        paymentMethodId,
        submissionId,
        signerName: s1.data.contact, // the nurse signs the mandate
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
        eMandateSent = true;
        await supabase
          .from('onboarding_submissions')
          .update({ netcash_file_token: fileToken })
          .eq('id', submissionId);
      }
    }
  } catch (e) {
    console.error('[Onboarding] eMandate submit error', e);
  }

  // 7) Confirm receipt to the nurse on WhatsApp (best-effort; never blocks the submission)
  // Template circletel_docs_received: account number + "we're vetting your documents".
  try {
    if (cust?.phone && cust.account_number) {
      const result = await whatsAppService.sendClinicDocsReceived(
        cust.phone,
        {
          firstName: cust.first_name || 'there',
          clinicName: cust.business_name || 'your clinic',
          accountNumber: cust.account_number,
        },
        { customerId, createdBy: 'onboarding-wizard' }
      );
      if (!result.success) {
        console.warn('[Onboarding] docs-received WhatsApp failed', result.error);
      }
    }
  } catch (e) {
    console.error('[Onboarding] docs-received WhatsApp error', e);
  }

  return NextResponse.json({
    success: true,
    accountNumber: cust?.account_number,
    eMandateSent,
  });
}
