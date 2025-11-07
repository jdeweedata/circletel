import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreatePhysicalAddressPayload, UpdatePhysicalAddressPayload } from '@/lib/types/profile';

/**
 * GET /api/profile/physical-address
 * Retrieve the primary physical address for the authenticated customer
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

    // Fetch primary physical address (or most recent if no primary)
    const { data: addresses, error } = await supabase
      .from('physical_addresses')
      .select('*')
      .eq('auth_user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Physical Address API] Error fetching address:', error);
      return NextResponse.json(
        { error: 'Failed to fetch physical address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ address: addresses?.[0] || null });
  } catch (error) {
    console.error('[Physical Address API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/physical-address
 * Create a new physical address for the authenticated customer
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
    const body = (await request.json()) as CreatePhysicalAddressPayload;

    // Validate required mailing address fields
    if (
      !body.address_type ||
      !body.mailing_street_address ||
      !body.mailing_city ||
      !body.mailing_province ||
      !body.mailing_postal_code
    ) {
      return NextResponse.json(
        { error: 'Missing required mailing address fields' },
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
      console.error('[Physical Address API] Customer not found:', customerError);
      return NextResponse.json(
        { error: 'Customer record not found' },
        { status: 404 }
      );
    }

    // If this is marked as primary, unset existing primary
    if (body.is_primary) {
      await supabase
        .from('physical_addresses')
        .update({ is_primary: false })
        .eq('customer_id', customer.id)
        .eq('is_primary', true);
    }

    // Insert new physical address
    const { data: newAddress, error: insertError } = await supabase
      .from('physical_addresses')
      .insert({
        customer_id: customer.id,
        auth_user_id: user.id,
        address_type: body.address_type,
        mailing_street_address: body.mailing_street_address,
        mailing_suburb: body.mailing_suburb,
        mailing_city: body.mailing_city,
        mailing_province: body.mailing_province,
        mailing_postal_code: body.mailing_postal_code,
        billing_same_as_mailing: body.billing_same_as_mailing ?? true,
        billing_street_address: body.billing_street_address,
        billing_suburb: body.billing_suburb,
        billing_city: body.billing_city,
        billing_province: body.billing_province,
        billing_postal_code: body.billing_postal_code,
        id_number: body.id_number,
        id_type: body.id_type,
        business_registration_number: body.business_registration_number,
        tax_reference_number: body.tax_reference_number,
        is_primary: body.is_primary ?? true, // Default to primary if first address
        notes: body.notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Physical Address API] Error creating address:', insertError);
      return NextResponse.json(
        { error: 'Failed to create physical address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error('[Physical Address API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/physical-address
 * Update the primary physical address for the authenticated customer
 */
export async function PUT(request: NextRequest) {
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
    const body = (await request.json()) as UpdatePhysicalAddressPayload & { id?: string };

    // Get customer_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer record not found' },
        { status: 404 }
      );
    }

    // Find existing primary address or use provided ID
    const { data: existingAddress, error: checkError } = await supabase
      .from('physical_addresses')
      .select('id')
      .eq('auth_user_id', user.id)
      .or(body.id ? `id.eq.${body.id}` : 'is_primary.eq.true')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (checkError || !existingAddress) {
      // No existing address found, create a new one
      return POST(request);
    }

    // Update physical address
    const { data: updatedAddress, error: updateError } = await supabase
      .from('physical_addresses')
      .update({
        ...body,
        id: undefined, // Remove id from update payload
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAddress.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Physical Address API] Error updating address:', updateError);
      return NextResponse.json(
        { error: 'Failed to update physical address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error('[Physical Address API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
