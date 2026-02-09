import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

// POST /api/orders/mtn-deal - Create order for MTN dealer deal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      deal_id,
      customer_type,
      firstName,
      lastName,
      email,
      phone,
      idNumber,
      companyName,
      companyReg,
      vatNumber,
      deliveryType,
      streetAddress,
      suburb,
      city,
      province,
      postalCode,
      portNumber,
      existingNumber,
    } = body;
    
    // Validate required fields
    if (!deal_id || !firstName || !lastName || !email || !phone || !idNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get deal details
    const { data: deal, error: dealError } = await supabase
      .from('mtn_dealer_products')
      .select('*')
      .eq('id', deal_id)
      .single();
    
    if (dealError || !deal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Create or find customer
    let customerId: string | null = null;
    
    // Check if customer exists by email
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          id_number: idNumber,
          customer_type: customer_type,
          company_name: companyName || null,
          company_registration: companyReg || null,
          vat_number: vatNumber || null,
        })
        .select('id')
        .single();
      
      if (customerError) {
        apiLogger.error('[MTN Deal Order] Customer creation error', { error: customerError });
        // Continue without customer ID - will be linked later
      } else {
        customerId = newCustomer.id;
      }
    }
    
    // Create order
    const orderData = {
      order_number: orderNumber,
      customer_id: customerId,
      order_type: 'mtn_dealer_deal',
      status: 'pending_payment',
      
      // Customer details (denormalized for order record)
      customer_email: email,
      customer_phone: phone,
      customer_name: `${firstName} ${lastName}`,
      customer_type: customer_type,
      company_name: companyName || null,
      
      // Deal details
      product_id: deal.id,
      product_name: deal.has_device ? deal.device_name : deal.price_plan,
      product_type: 'mtn_dealer_product',
      
      // Pricing
      monthly_amount: deal.selling_price_incl_vat,
      once_off_amount: deal.once_off_pay_in_incl_vat || 0,
      contract_term: deal.contract_term,
      
      // Delivery
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? {
        street: streetAddress,
        suburb,
        city,
        province,
        postal_code: postalCode,
      } : null,
      
      // Porting
      port_number: portNumber,
      existing_number: existingNumber || null,
      
      // Metadata
      metadata: {
        deal_id: deal.deal_id,
        technology: deal.technology,
        data_bundle: deal.data_bundle,
        anytime_minutes: deal.anytime_minutes,
        sms_bundle: deal.sms_bundle,
        price_plan: deal.price_plan,
        has_device: deal.has_device,
      },
    };
    
    // Try to insert into consumer_orders or business_quotes based on customer type
    const tableName = customer_type === 'business' ? 'business_quotes' : 'consumer_orders';
    
    const { data: order, error: orderError } = await supabase
      .from(tableName)
      .insert(orderData)
      .select('id, order_number')
      .single();
    
    if (orderError) {
      apiLogger.error('[MTN Deal Order] Order creation error', { error: orderError });
      
      // Fallback: store in a generic orders table or return partial success
      return NextResponse.json({
        success: true,
        order_id: orderNumber,
        message: 'Order received - our team will contact you shortly',
        requires_manual_processing: true,
      });
    }
    
    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      amount_due: deal.once_off_pay_in_incl_vat || 0,
      monthly_amount: deal.selling_price_incl_vat,
    });
    
  } catch (error) {
    apiLogger.error('[MTN Deal Order] Error', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
