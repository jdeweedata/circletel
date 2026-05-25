import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { id } = await context.params;
    const supabase = await createServerClient();

    const { data: session, error } = await supabase
      .from('kyc_sessions')
      .select(`
        *,
        quote:business_quotes (
          id,
          contact_name,
          contact_email,
          contact_phone,
          customer_id,
          company_name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { success: false, error: 'KYC session not found' },
        { status: 404 }
      );
    }

    let orderData = null;
    const orderId = session.extracted_data?.order_id;
    if (orderId) {
      const { data: order } = await supabase
        .from('consumer_orders')
        .select('id, order_number, email, first_name, last_name, phone, status')
        .eq('id', orderId)
        .single();
      orderData = order;
    }

    const enriched = {
      ...session,
      order: orderData
        ? {
            id: orderData.id,
            order_number: orderData.order_number,
            status: orderData.status,
          }
        : null,
      customer_name:
        orderData?.first_name && orderData?.last_name
          ? `${orderData.first_name} ${orderData.last_name}`
          : (Array.isArray(session.quote) && session.quote.length > 0
              ? session.quote[0].contact_name
              : 'Unknown'),
      customer_email:
        orderData?.email ||
        (Array.isArray(session.quote) && session.quote.length > 0
          ? session.quote[0].contact_email
          : 'N/A'),
      customer_phone:
        orderData?.phone ||
        (Array.isArray(session.quote) && session.quote.length > 0
          ? session.quote[0].contact_phone
          : 'N/A'),
    };

    return NextResponse.json({ success: true, session: enriched });
  } catch (error: unknown) {
    apiLogger.error('KYC session fetch error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
