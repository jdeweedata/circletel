import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateServiceAddressPayload } from '@/lib/types/profile';

/**
 * GET /api/profile/service-addresses
 * Retrieve all service addresses for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch service addresses
    const { data: addresses, error } = await supabase
      .from('service_addresses')
      .select('*')
      .eq('auth_user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Service Addresses API] Error fetching addresses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service addresses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ addresses: addresses || [] });
  } catch (error) {
    console.error('[Service Addresses API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/service-addresses
 * Create a new service address for the authenticated customer
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = (await request.json()) as CreateServiceAddressPayload;

    // Validate required fields
    if (
      !body.location_name ||
      !body.service_type ||
      !body.street_address ||
      !body.city ||
      !body.province ||
      !body.postal_code
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get customer_id from customers table
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      console.error('[Service Addresses API] Customer not found:', customerError);
      return NextResponse.json(
        { error: 'Customer record not found' },
        { status: 404 }
      );
    }

    // If this is marked as primary, unset existing primary
    if (body.is_primary) {
      await supabase
        .from('service_addresses')
        .update({ is_primary: false })
        .eq('customer_id', customer.id)
        .eq('is_primary', true);
    }

    // Insert new service address
    const { data: newAddress, error: insertError } = await supabase
      .from('service_addresses')
      .insert({
        customer_id: customer.id,
        auth_user_id: user.id,
        location_name: body.location_name,
        service_type: body.service_type,
        street_address: body.street_address,
        suburb: body.suburb,
        city: body.city,
        province: body.province,
        postal_code: body.postal_code,
        installation_date: body.installation_date,
        installation_status: body.installation_status || 'pending',
        is_primary: body.is_primary || false,
        notes: body.notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Service Addresses API] Error creating address:', insertError);
      return NextResponse.json(
        { error: 'Failed to create service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error('[Service Addresses API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
