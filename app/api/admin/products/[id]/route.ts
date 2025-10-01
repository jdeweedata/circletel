import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/admin/products/[id] - Get single product details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product' },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error in GET /api/admin/products/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Get authenticated user from Supabase session
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const changeReason = body.change_reason;

    // Remove change_reason from update payload and map field names to database columns
    const { change_reason, monthly_price, setup_fee, ...updateData } = body;

    // Map frontend field names to database column names
    if (monthly_price !== undefined) {
      updateData.base_price_zar = monthly_price;
    }
    if (setup_fee !== undefined) {
      updateData.cost_price_zar = setup_fee;
    }

    // Update the product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // The trigger will automatically create the audit log entry
    // But we need to update it with user attribution since trigger doesn't have access to that
    const { error: auditError } = await supabase
      .from('product_audit_logs')
      .update({
        changed_by_email: user.email,
        changed_by_name: user.full_name,
        change_reason: changeReason,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .eq('product_id', id)
      .order('changed_at', { ascending: false })
      .limit(1);

    if (auditError) {
      console.warn('Failed to update audit log with user info:', auditError);
      // Don't fail the request if audit update fails
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error in PUT /api/admin/products/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id] - Partial update (same as PUT for now)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

// DELETE /api/admin/products/[id] - Delete product (soft delete by setting status to inactive)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Get authenticated user from Supabase session
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Soft delete - set status to inactive instead of actually deleting
    const { data: product, error } = await supabase
      .from('products')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    // Update audit log with user attribution
    await supabase
      .from('product_audit_logs')
      .update({
        changed_by_email: user.email,
        changed_by_name: user.full_name,
        change_reason: 'Product soft-deleted (status set to inactive)',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .eq('product_id', id)
      .order('changed_at', { ascending: false })
      .limit(1);

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error in DELETE /api/admin/products/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
