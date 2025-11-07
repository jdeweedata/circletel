import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateServiceAddressPayload } from '@/lib/types/profile';

/**
 * PUT /api/profile/service-addresses/[id]
 * Update an existing service address
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
    const body = (await request.json()) as UpdateServiceAddressPayload;

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

    // Verify ownership
    const { data: existingAddress, error: checkError } = await supabase
      .from('service_addresses')
      .select('id')
      .eq('id', id)
      .eq('auth_user_id', user.id)
      .single();

    if (checkError || !existingAddress) {
      return NextResponse.json(
        { error: 'Service address not found' },
        { status: 404 }
      );
    }

    // If setting as primary, unset existing primary
    if (body.is_primary === true) {
      await supabase
        .from('service_addresses')
        .update({ is_primary: false })
        .eq('customer_id', customer.id)
        .eq('is_primary', true)
        .neq('id', id);
    }

    // Update service address
    const { data: updatedAddress, error: updateError } = await supabase
      .from('service_addresses')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Service Addresses API] Error updating address:', updateError);
      return NextResponse.json(
        { error: 'Failed to update service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error('[Service Addresses API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/service-addresses/[id]
 * Delete a service address
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership before deleting
    const { data: existingAddress, error: checkError } = await supabase
      .from('service_addresses')
      .select('id')
      .eq('id', id)
      .eq('auth_user_id', user.id)
      .single();

    if (checkError || !existingAddress) {
      return NextResponse.json(
        { error: 'Service address not found' },
        { status: 404 }
      );
    }

    // Delete service address
    const { error: deleteError } = await supabase
      .from('service_addresses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Service Addresses API] Error deleting address:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete service address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Service Addresses API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
