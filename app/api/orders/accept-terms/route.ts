/**
 * POST /api/orders/accept-terms
 *
 * Records customer acceptance of Terms & Conditions / Service Agreement
 * for a consumer order. This is the legal acceptance step between KYC
 * verification and service activation.
 *
 * Supports both customer-facing (via dashboard) and admin-facing (via
 * admin panel) acceptance.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { orderId, acceptedBy } = body;

    // 1. Validate input
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    // 2. Fetch order
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, email, first_name, last_name, terms_accepted')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 3. Check if already accepted
    if (order.terms_accepted) {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        message: 'Terms already accepted',
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          acceptedAt: order.terms_accepted_at,
        },
      });
    }

    // 4. Extract client info
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 5. Record acceptance
    const { error: updateError } = await supabase
      .from('consumer_orders')
      .update({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        terms_version: '2026-05-27',
        terms_accepted_ip: clientIp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(`Failed to record acceptance: ${updateError.message}`);
    }

    // 6. Log the acceptance event
    await supabase.from('payment_audit_logs').insert({
      order_id: orderId,
      event_type: 'terms_accepted',
      status: 'success',
      request_body: JSON.stringify({
        orderNumber: order.order_number,
        acceptedBy: acceptedBy || 'customer',
        clientIp,
        userAgent,
        termsVersion: '2026-05-27',
      }),
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });

    console.log(`[Terms] Order ${order.order_number} — T&Cs accepted by ${acceptedBy || 'customer'}`);

    return NextResponse.json({
      success: true,
      message: 'Terms & Conditions accepted',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: `${order.first_name} ${order.last_name}`,
        acceptedAt: new Date().toISOString(),
        termsVersion: '2026-05-27',
      },
    });
  } catch (error) {
    console.error('[Terms] Acceptance failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record acceptance',
      },
      { status: 500 }
    );
  }
}
