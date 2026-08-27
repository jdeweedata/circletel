import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { CREDIT_DECISIONS } from '@/lib/credit-risk/types';
import { passBlockedReason } from '@/lib/credit-risk/decision';
import { getQuoteCreditReview, upsertQuoteCreditReview } from '@/lib/credit-risk/review-store';
import { validateDualControlOverride } from '@/lib/credit-risk/consumer-gate';
import { persistCompanyCreditPullOnQuote } from '@/lib/credit-risk/quote-company-pull';
import {
  requestCompanyCreditReport,
  riskServiceKeyConfigured,
} from '@/lib/credit-risk/netcash-risk-client';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { id } = await context.params;
  const review = await getQuoteCreditReview(adminDb(), id);
  return NextResponse.json({
    success: true,
    data: review,
    riskApiConfigured: riskServiceKeyConfigured(),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { id } = await context.params;
  const body = await request.json();

  if (body.decision && !CREDIT_DECISIONS.includes(body.decision)) {
    return NextResponse.json({ success: false, error: 'Invalid credit decision' }, { status: 400 });
  }

  const supabase = adminDb();
  const { data: quote } = await supabase
    .from('business_quotes')
    .select('id, total_monthly')
    .eq('id', id)
    .maybeSingle();

  if (!quote) {
    return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
  }

  if (body.decision === 'PASS') {
    const passBlock = passBlockedReason(body.flags, Boolean(body.hardware_prepaid));
    if (passBlock) {
      const override = validateDualControlOverride({
        actorRole: authResult.adminUser.role,
        signoffs: body.override_signoffs,
        reason: body.override_reason,
        requestedDecision: body.decision,
        flags: body.flags,
        hardwarePrepaid: Boolean(body.hardware_prepaid),
      });
      if (!override.ok) {
        return NextResponse.json({ success: false, error: override.reason }, { status: 422 });
      }
    }
  }

  try {
    const review = await upsertQuoteCreditReview(supabase, {
      business_quote_id: id,
      bureau: body.bureau,
      report_id: body.report_id,
      transaction_id: body.transaction_id,
      purpose: body.purpose,
      requested_at: body.requested_at,
      flags: body.flags,
      decision: body.decision,
      hardware_prepaid: body.hardware_prepaid,
      private_note: body.private_note,
      pdf_storage_path: body.pdf_storage_path,
      override_reason: body.override_reason,
      override_by: body.override_reason ? authResult.adminUser.id : body.override_by,
      override_signoffs: body.override_signoffs,
      reviewed_by: authResult.adminUser.id,
      updated_by: authResult.adminUser.email,
      package_price: Number(quote.total_monthly) || 0,
    });
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  if (!riskServiceKeyConfigured()) {
    return NextResponse.json(
      { success: false, error: 'NETCASH_RISK_SERVICE_KEY is not configured' },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const supabase = adminDb();
  const { data: quote } = await supabase
    .from('business_quotes')
    .select('id, quote_number, registration_number, total_monthly')
    .eq('id', id)
    .maybeSingle();

  if (!quote) {
    return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
  }
  if (!quote.registration_number) {
    return NextResponse.json(
      { success: false, error: 'registration_number is required to pull CD32' },
      { status: 400 }
    );
  }

  try {
    const pull = await requestCompanyCreditReport({
      registrationNumber: String(quote.registration_number),
      accountReference: quote.quote_number || id,
      instruction: 'CD32',
    });
    const review = await persistCompanyCreditPullOnQuote(supabase, id, pull, 'CD32');
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Netcash pull failed' },
      { status: 502 }
    );
  }
}
