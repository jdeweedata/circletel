import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import type { ConsumerOrder } from '@/lib/types/customer-journey';
import { apiLogger } from '@/lib/logging';

// P4: Valid property types (must match ServiceAddressSection.tsx options)
const VALID_PROPERTY_TYPES = [
  'freestanding_home', 'gated_estate', 'apartment', 'townhouse',
  'office_park', 'industrial', 'educational', 'healthcare', 'freestanding_commercial', 'soho',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'installation_address',
      'package_name',
      'package_speed',
      'package_price',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // P4: Server-side property type validation
    if (!body.installation_location_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: installation_location_type (property type is required)' },
        { status: 400 }
      );
    }
    if (!VALID_PROPERTY_TYPES.includes(body.installation_location_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid property type: "${body.installation_location_type}". Must be one of: ${VALID_PROPERTY_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check for existing pending/active orders with same email, address, and package
    // This prevents duplicate orders for the same service at the same address
    apiLogger.info('[orders/create] Checking for duplicate orders...');
    const { data: existingOrders, error: duplicateCheckError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, status, payment_status, package_name, installation_address, service_package_id, created_at')
      .eq('email', body.email.toLowerCase())
      .in('status', ['pending', 'confirmed', 'processing', 'installation_scheduled'])
      .limit(10);

    if (duplicateCheckError) {
      apiLogger.error('[orders/create] Error checking for duplicates', { error: duplicateCheckError });
      // Continue with order creation if check fails - don't block the user
    }

    if (existingOrders && existingOrders.length > 0) {
      const normalizedAddress = (body.installation_address || '').trim().toLowerCase();

      // Find a matching order with same address and package
      const matchingOrder = existingOrders.find(order => {
        const orderAddr = (order.installation_address || '').trim().toLowerCase();
        // Check if addresses match (either contains the other for partial matches)
        const addressMatch = orderAddr.includes(normalizedAddress) ||
                            normalizedAddress.includes(orderAddr) ||
                            orderAddr === normalizedAddress;
        // Check if package matches (by ID or name)
        const packageMatch = (body.service_package_id && order.service_package_id === body.service_package_id) ||
                            order.package_name === body.package_name;
        return addressMatch && packageMatch;
      });

      if (matchingOrder) {
        apiLogger.info('[orders/create] Existing order found', { orderNumber: matchingOrder.order_number });
        return NextResponse.json({
          success: true,
          existing_order: true,
          order: {
            id: matchingOrder.id,
            order_number: matchingOrder.order_number,
            status: matchingOrder.status,
            payment_status: matchingOrder.payment_status,
            package_name: matchingOrder.package_name,
            created_at: matchingOrder.created_at
          },
          message: 'You already have a pending order for this address.'
        });
      }
    }

    apiLogger.info('[orders/create] No duplicate found, proceeding with order creation');

    // Generate order number and payment reference
    const orderNumber = await generateOrderNumber(supabase);
    const paymentReference = `PAY-${orderNumber}`; // Generate payment reference from order number

    // Create order in database
    const { data: order, error: dbError } = await supabase
      .from('consumer_orders')
      .insert({
        order_number: orderNumber,
        payment_reference: paymentReference,

        // Customer details
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        alternate_phone: body.alternate_phone || null,

        // Installation address
        installation_address: body.installation_address,
        suburb: body.suburb || null,
        city: body.city || null,
        province: body.province || null,
        postal_code: body.postal_code || null,
        coordinates: body.coordinates || null,
        special_instructions: body.special_instructions || null,

        // Billing address
        billing_same_as_installation: body.billing_same_as_installation ?? true,
        billing_address: body.billing_address || null,
        billing_suburb: body.billing_suburb || null,
        billing_city: body.billing_city || null,
        billing_province: body.billing_province || null,
        billing_postal_code: body.billing_postal_code || null,

        // Package details
        service_package_id: body.service_package_id || null,
        package_name: body.package_name,
        package_speed: body.package_speed,
        package_price: body.package_price,
        installation_fee: body.installation_fee || 0,
        router_included: body.router_included || false,
        router_rental_fee: body.router_rental_fee || null,

        // References
        coverage_check_id: body.coverage_check_id || null,
        coverage_lead_id: body.coverage_lead_id || null,

        // Payment
        payment_method: null,
        payment_status: 'pending',
        total_paid: 0,

        // Status
        status: 'pending',

        // Installation preferences
        preferred_installation_date: body.preferred_installation_date || null,
        installation_scheduled_date: null,
        installation_time_slot: null,

        // Contact preferences
        contact_preference: body.contact_preference || 'email',
        marketing_opt_in: body.marketing_opt_in || false,
        whatsapp_opt_in: body.whatsapp_opt_in || false,

        // Lead source
        lead_source: body.lead_source || 'coverage_checker',
        source_campaign: body.source_campaign || null,
        referral_code: body.referral_code || null,

        // Metadata
        metadata: body.metadata || {},
        internal_notes: null,
      })
      .select()
      .single();

    if (dbError) {
      apiLogger.error('Database error creating order', { error: dbError });
      return NextResponse.json(
        { success: false, error: 'Failed to create order in database', details: dbError.message },
        { status: 500 }
      );
    }

    // Send confirmation email (async, don't block response)
    EmailNotificationService.sendOrderConfirmation(order as ConsumerOrder)
      .then((emailResult) => {
        if (emailResult.success) {
          apiLogger.info('Order confirmation email sent', { email: order.email });
        } else {
          apiLogger.error('Failed to send confirmation email', { error: emailResult.error });
        }
      })
      .catch((error) => {
        apiLogger.error('Email send error', { error });
      });

    // TODO: PiPaperPlaneRightBold notification to admin (optional)
    // TODO: Sync to Zoho CRM (optional)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_reference: order.payment_reference,
        first_name: order.first_name,
        last_name: order.last_name,
        email: order.email,
        status: order.status,
        package_name: order.package_name,
        package_price: order.package_price,
        created_at: order.created_at,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    apiLogger.error('Order creation error', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate unique order number
async function generateOrderNumber(supabase: any): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  let orderNumber = `ORD-${dateStr}-${randomNum}`;
  let attempts = 0;
  const maxAttempts = 10;

  // Check if order number exists, regenerate if it does
  while (attempts < maxAttempts) {
    const { data } = await supabase
      .from('consumer_orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single();

    if (!data) {
      // Order number is unique
      return orderNumber;
    }

    // Generate new random number
    const newRandomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    orderNumber = `ORD-${dateStr}-${newRandomNum}`;
    attempts++;
  }

  // Fallback: use timestamp
  return `ORD-${dateStr}-${Date.now().toString().slice(-4)}`;
}

/**
 * PATCH /api/orders/create?id=<orderId>
 * P6: Order compensation — called by the client when payment initiation fails after
 * order creation, to cancel the orphaned pending order instead of leaving it in limbo.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing required query param: id' }, { status: 400 });
    }

    const body = await request.json();
    const { status, payment_status } = body as { status?: string; payment_status?: string };

    // Only allow safe terminal states via this endpoint
    const allowedStatuses = ['failed', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status for compensation. Allowed: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('consumer_orders')
      .update({
        ...(status ? { status } : {}),
        ...(payment_status ? { payment_status } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      // Only allow compensation on pending/processing orders (not already confirmed)
      .in('status', ['pending', 'processing']);

    if (error) {
      apiLogger.error('[orders/PATCH] Compensation update failed', { id, error });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    apiLogger.info('[orders/PATCH] Order compensated', { id, status, payment_status });
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('[orders/PATCH] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve orders (for admin or customer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    const supabase = await createClient();

    if (orderId) {
      // Get specific order by ID
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

      return NextResponse.json({
        success: true,
        order,
      });
    } else if (orderNumber) {
      // Get specific order by order number
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

      return NextResponse.json({
        success: true,
        order,
      });
    } else if (email) {
      // Get all orders for an email
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
