/**
 * Test API Route: Create Order
 * Creates a test order for KYC upload testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { firstName, lastName, email, phone } = body;

    // Create test order
    const { data: order, error } = await supabase
      .from('consumer_orders')
      .insert({
        order_number: `TEST-${Date.now()}`,
        first_name: firstName || 'Test',
        last_name: lastName || 'User',
        email: email || 'test@example.com',
        phone: phone || '+27123456789',
        installation_address: '123 Test Street, Johannesburg, 2000',
        package_name: 'Test Package',
        package_speed: '100Mbps',
        package_price: 500.00,
        installation_fee: 0,
        status: 'pending',
      })
      .select('id, order_number, first_name, last_name, email')
      .single();

    if (error) {
      console.error('Error creating test order:', error);
      return NextResponse.json(
        { error: 'Failed to create test order', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      customer: {
        firstName: order.first_name,
        lastName: order.last_name,
        email: order.email,
      },
      message: 'Test order created successfully',
    });
  } catch (error: any) {
    console.error('Test order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
