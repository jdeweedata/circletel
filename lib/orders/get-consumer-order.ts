import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { getOrderCreditReview } from '@/lib/credit-risk/review-store';
import { toCustomerCreditFields } from '@/lib/credit-risk/customer-outcome';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { customerMayReadOrder } from '@/lib/orders/consumer-order-access';

async function resolveOrderReader(request: NextRequest): Promise<{
  isAdmin: boolean;
  userEmail: string | null;
  customerId: string | null;
} | null> {
  const admin = await authenticateAdmin(request);
  if (admin.success) {
    return { isAdmin: true, userEmail: admin.user.email ?? null, customerId: null };
  }

  const supabase = await createClient();
  let user = null;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data } = await supabase.auth.getUser(token);
    user = data?.user || null;
  }
  if (!user) {
    const sessionClient = await createClientWithSession();
    const { data } = await sessionClient.auth.getUser();
    user = data?.user || null;
  }
  if (!user) return null;

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return {
    isAdmin: false,
    userEmail: user.email ?? null,
    customerId: customer?.id ?? null,
  };
}

/**
 * GET /api/orders/create?id=|&orderNumber=|&email=
 * Admin session, or the owning customer. Non-owners get 404 so a guessed UUID
 * does not confirm the order exists.
 */
export async function getConsumerOrder(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    const reader = await resolveOrderReader(request);
    if (!reader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    if (orderId) {
      const { data: order, error } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      if (
        !reader.isAdmin &&
        !customerMayReadOrder({
          userEmail: reader.userEmail,
          customerId: reader.customerId,
          order,
        })
      ) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      const creditReview = await getOrderCreditReview(supabase, order.id);
      return NextResponse.json({
        success: true,
        order: {
          ...order,
          ...toCustomerCreditFields(creditReview),
        },
      });
    }

    if (orderNumber) {
      const { data: order, error } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      if (
        !reader.isAdmin &&
        !customerMayReadOrder({
          userEmail: reader.userEmail,
          customerId: reader.customerId,
          order,
        })
      ) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        order,
      });
    }

    if (email) {
      if (
        !reader.isAdmin &&
        (reader.userEmail || '').trim().toLowerCase() !== email.trim().toLowerCase()
      ) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { data: orders, error } = await supabase
        .from('consumer_orders')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch orders' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orders,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing query parameter: id, orderNumber, or email' },
      { status: 400 }
    );
  } catch (error) {
    apiLogger.error('Order fetch error', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order',
      },
      { status: 500 }
    );
  }
}
