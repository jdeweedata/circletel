import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { CREDIT_DECISIONS } from '@/lib/credit-risk/types';
import { passBlockedReason } from '@/lib/credit-risk/decision';
import {
  adminFieldsToKeepOnPull,
  getOrderCreditReview,
  upsertOrderCreditReview,
} from '@/lib/credit-risk/review-store';
import {
  requestAvsReport,
  requestCreditDataReport,
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
  context: { params: Promise<{ orderId: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { orderId } = await context.params;
  const review = await getOrderCreditReview(adminDb(), orderId);
  return NextResponse.json({
    success: true,
    data: review,
    riskApiConfigured: riskServiceKeyConfigured(),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { orderId } = await context.params;
  const body = await request.json();

  if (body.decision && !CREDIT_DECISIONS.includes(body.decision)) {
    return NextResponse.json({ success: false, error: 'Invalid credit decision' }, { status: 400 });
  }

  const supabase = adminDb();
  const { data: order } = await supabase
    .from('consumer_orders')
    .select('id, package_price, router_included')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  const passBlock = body.decision === 'PASS'
    ? passBlockedReason(body.flags, Boolean(body.hardware_prepaid))
    : null;
  if (passBlock) {
    return NextResponse.json({ success: false, error: passBlock }, { status: 422 });
  }

  try {
    const review = await upsertOrderCreditReview(supabase, {
      consumer_order_id: orderId,
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
      reviewed_by: authResult.adminUser.id,
      updated_by: authResult.adminUser.email,
      package_price: Number(order.package_price) || 0,
      router_included: Boolean(order.router_included),
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
  context: { params: Promise<{ orderId: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  if (!riskServiceKeyConfigured()) {
    return NextResponse.json(
      { success: false, error: 'NETCASH_RISK_SERVICE_KEY is not configured' },
      { status: 503 }
    );
  }

  const { orderId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = adminDb();
  const { data: order } = await supabase
    .from('consumer_orders')
    .select('id, first_name, last_name, package_price, router_included')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  const idNumber = String(body.idNumber || '');
  if (!idNumber) {
    return NextResponse.json({ success: false, error: 'idNumber is required to pull Netcash' }, { status: 400 });
  }

  try {
    const credit = await requestCreditDataReport({
      idNumber,
      firstName: order.first_name,
      lastName: order.last_name,
      reason: body.reason || 'Credit Risk Assessment',
    });
    let flags = credit.flags;
    if (body.accountNumber) {
      const avs = await requestAvsReport({
        idNumber,
        accountNumber: String(body.accountNumber),
      });
      flags = { ...flags, ...avs.flags };
    }

    const existing = await getOrderCreditReview(supabase, orderId);
    const review = await upsertOrderCreditReview(supabase, {
      consumer_order_id: orderId,
      flags,
      bureau: 'TransUnion',
      purpose: body.reason || 'Credit Risk Assessment',
      requested_at: new Date().toISOString(),
      reviewed_by: authResult.adminUser.id,
      updated_by: authResult.adminUser.email,
      package_price: Number(order.package_price) || 0,
      router_included: Boolean(order.router_included),
      ...adminFieldsToKeepOnPull(existing),
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Netcash pull failed' },
      { status: 502 }
    );
  }
}
