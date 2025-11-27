import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: unknown): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Create a pending order without payment
 * This is part of the reduced-friction flow where payment is handled later in the dashboard
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[create-pending] Starting order creation...');

    // Use service role client for database operations (bypasses RLS)
    const supabase = await createClient();
    console.log('[create-pending] Supabase client created');

    // Get authenticated user - check BOTH Authorization header AND cookies
    // (session may be in localStorage on client, sent via Authorization header)
    let user = null;
    let authError = null;

    // First, try Authorization header (preferred - works with localStorage sessions)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data, error } = await supabase.auth.getUser(token);
      user = data?.user || null;
      authError = error;
      console.log('[create-pending] Auth via header:', user ? `Authenticated (${user.email})` : 'Not authenticated');
    }

    // Fallback to cookie-based session if no header
    if (!user) {
      const supabaseWithSession = await createClientWithSession();
      const { data, error } = await supabaseWithSession.auth.getUser();
      user = data?.user || null;
      authError = error;
      console.log('[create-pending] Auth via cookies:', user ? `Authenticated (${user.email})` : 'Not authenticated');
    }

    console.log('[create-pending] Final auth status:', user ? `Authenticated (${user.email})` : 'Not authenticated', authError ? `Error: ${authError.message}` : '');

    // If authenticated, get customer record
    let customerId = null;
    if (user) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (customer) {
        customerId = customer.id;
        console.log('[create-pending] Found customer:', customerId);
      }
    }

    const body = await request.json();
    console.log('[create-pending] Request body received:', {
      hasEmail: !!body.email,
      hasPackageName: !!body.package_name,
      hasInstallationAddress: !!body.installation_address
    });
    const {
      // Package details
      service_package_id,
      package_name,
      package_speed,
      package_price,

      // Installation details
      installation_address,
      coordinates,
      installation_location_type,
      installation_fee,

      // Customer details (will be stored for later association)
      email,
      phone,
      first_name,
      last_name,
      account_type,
    } = body;

    // Validation
    if (!package_name || !installation_address || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: package_name, installation_address, email'
        },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(supabase);
    const paymentReference = `PAY-${orderNumber}`;

    // Create pending order (using consumer_orders table)
    const orderData = {
      // Order identifiers
      order_number: orderNumber,
      payment_reference: paymentReference,

      // Link to customer (if authenticated)
      customer_id: customerId,

      // Customer info
      first_name: first_name || email.split('@')[0],
      last_name: last_name || 'Customer',
      email,
      phone: phone || '',
      alternate_phone: null,

      // Installation address
      installation_address,
      suburb: null,
      city: null,
      province: null,
      postal_code: null,
      coordinates: coordinates || null,
      special_instructions: null,

      // Billing address (same as installation by default)
      billing_same_as_installation: true,
      billing_address: null,
      billing_suburb: null,
      billing_city: null,
      billing_province: null,
      billing_postal_code: null,

      // Package details - validate UUID to prevent 400 errors
      service_package_id: isValidUUID(service_package_id) ? service_package_id : null,
      package_name,
      package_speed: package_speed || '',
      package_price: package_price || 0,
      installation_fee: installation_fee || 0,
      router_included: false,
      router_rental_fee: null,

      // References
      coverage_check_id: null,
      coverage_lead_id: null,

      // Payment
      payment_method: null,
      payment_status: 'pending',
      total_paid: 0,

      // Status
      status: 'pending',

      // Installation preferences
      preferred_installation_date: null,
      installation_scheduled_date: null,
      installation_time_slot: null,

      // Contact preferences
      contact_preference: 'email',
      marketing_opt_in: false,
      whatsapp_opt_in: false,

      // Lead source
      lead_source: 'coverage_checker',
      source_campaign: null,
      referral_code: null,

      // Metadata
      metadata: {},
      internal_notes: null,
    };

    console.log('Creating pending order:', orderData);

    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order',
          details: orderError.message
        },
        { status: 500 }
      );
    }

    console.log('Pending order created successfully:', order);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_reference: order.payment_reference,
        status: order.status,
      },
      message: 'Order created successfully. Please log in to complete your order.',
    });

  } catch (error) {
    console.error('Unexpected error creating pending order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate unique order number (same as /api/orders/create)
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
      .maybeSingle();

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
