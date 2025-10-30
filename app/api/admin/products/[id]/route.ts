import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET /api/admin/products/[id] - Get single product details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Now using service_packages as single source of truth
    const { data: product, error } = await supabase
      .from('service_packages')
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

    // Map service_packages fields to match frontend expectations
    const mappedProduct = {
      ...product,
      // Map service_packages fields to products fields for compatibility
      category: product.product_category || 'connectivity',
      service: product.service_type,
      customer_type: product.customer_type === 'business' ? 'smme' : 'consumer',
      is_active: product.active,
      featured: product.is_featured || false,
      data_limit: product.metadata?.data_limit || '',
      contract_duration: product.metadata?.contract_duration || '',
    };

    // Return mapped fields - frontend uses database field names
    return NextResponse.json({ success: true, data: mappedProduct });
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
    const supabase = await createClient();
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

    // Remove change_reason and pricing object fields from update payload
    const {
      change_reason,
      // Pricing object fields (handled separately)
      pricing_monthly, pricing_setup, pricing_download_speed, pricing_upload_speed,
      // Accept multiple naming conventions for backward compatibility
      price_monthly, price_once_off,           // From edit form (old)
      monthly_price, setup_fee,                // From PriceEditModal (old)
      base_price_zar, cost_price_zar,         // Database field names (current)
      ...updateData
    } = body;

    // Build pricing JSONB object (trigger will auto-sync to root fields)
    const pricingObject = body.pricing || {
      monthly: pricing_monthly ?? base_price_zar ?? price_monthly ?? monthly_price,
      setup: pricing_setup ?? cost_price_zar ?? price_once_off ?? setup_fee ?? 0,
      download_speed: pricing_download_speed ?? body.speed_download ?? 0,
      upload_speed: pricing_upload_speed ?? body.speed_upload ?? 0
    };

    updateData.pricing = pricingObject;

    // Map form fields to service_packages schema
    if (body.category) {
      updateData.product_category = body.category;
    }
    if (body.service) {
      updateData.service_type = body.service;
    }
    if (body.customer_type) {
      // Map consumer/smme/enterprise to business/consumer
      updateData.customer_type = (body.customer_type === 'smme' || body.customer_type === 'enterprise') ? 'business' : 'consumer';
    }
    if (body.is_active !== undefined) {
      updateData.active = body.is_active;
      updateData.status = body.is_active ? 'active' : 'inactive';
    }
    if (body.featured !== undefined) {
      updateData.is_featured = body.featured;
    }

    // Store data_limit and contract_duration in metadata JSONB
    const metadata = body.metadata || {};
    if (body.data_limit) metadata.data_limit = body.data_limit;
    if (body.contract_duration) metadata.contract_duration = body.contract_duration;
    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata;
    }

    // Update the product in service_packages (single source of truth)
    const { data: product, error: updateError } = await supabase
      .from('service_packages')
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
      .from('service_packages_audit_logs')
      .update({
        changed_by_email: user.email,
        changed_by_name: user.full_name,
        change_reason: changeReason,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .eq('package_id', id)
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
    const supabase = await createClient();

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
