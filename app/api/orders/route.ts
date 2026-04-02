import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { error: 'reference query param required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('consumer_orders')
      .select(
        `
        id,
        order_number,
        payment_reference,
        status,
        payment_status,
        package_name,
        package_speed,
        package_price,
        installation_fee,
        installation_address,
        first_name,
        last_name,
        email,
        phone,
        created_at
      `
      )
      .eq('payment_reference', reference)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    apiLogger.error('[GET /api/orders] Error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
