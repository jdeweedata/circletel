import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { leadId, packageId, customer } = await request.json();

    if (!leadId || !packageId || !customer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email is verified
    const { data: otpRecord } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', customer.email)
      .eq('verified', true)
      .order('verified_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Email not verified' },
        { status: 400 }
      );
    }

    // Get lead information
    const { data: lead } = await supabase
      .from('coverage_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Create customer account
    const { data: customerRecord, error: customerError } = await supabase
      .from('customers')
      .insert({
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        id_number: customer.idNumber,
        email_verified: true,
        status: 'active',
      })
      .select()
      .single();

    if (customerError) {
      console.error('Customer creation error:', customerError);
      return NextResponse.json(
        { success: false, error: 'Failed to create customer account' },
        { status: 500 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerRecord.id,
        lead_id: leadId,
        package_id: packageId,
        status: 'pending',
        order_type: 'new_connection',
        installation_address: lead.address,
        coordinates: lead.coordinates,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      customerId: customerRecord.id,
      message: 'Order placed successfully',
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}