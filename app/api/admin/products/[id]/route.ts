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

    console.log('[Product Detail API] Fetching product:', id);

    // Now using service_packages as single source of truth
    const { data: product, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Product Detail API] Database error:', {
        error,
        productId: id,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details
      });
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!product) {
      console.warn('[Product Detail API] Product not found:', id);
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('[Product Detail API] Product found:', {
      id: product.id,
      name: product.name,
      hasMetadata: !!product.metadata,
      hasPricing: !!product.pricing
    });

    // Map service_packages fields to match frontend expectations
    try {
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

      console.log('[Product Detail API] Successfully mapped product');
      
      // Return mapped fields - frontend uses database field names
      return NextResponse.json({ success: true, data: mappedProduct });
    } catch (mappingError) {
      console.error('[Product Detail API] Error mapping product data:', {
        mappingError,
        productKeys: Object.keys(product),
        productData: product
      });
      throw mappingError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('[Product Detail API] Unexpected error:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
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

    console.log('[Product Update API] Request received:', {
      productId: id,
      bodyKeys: Object.keys(body),
      bodySize: JSON.stringify(body).length
    });

    // Get authenticated user from Supabase session (optional for audit logging)
    const user = await getAuthenticatedUser(request);

    // Get user info from headers as fallback (for cases where session is not available)
    const userEmail = user?.email || request.headers.get('x-user-email') || 'admin@circletel.co.za';
    const userName = user?.full_name || request.headers.get('x-user-name') || 'Admin User';

    const changeReason = body.change_reason;

    console.log('[Product Update API] Auth info:', {
      userEmail,
      userName,
      hasChangeReason: !!changeReason
    });

    // Remove change_reason and pricing object fields from update payload
    const {
      change_reason,
      // Frontend field names that need mapping (not direct database columns)
      is_active, featured, category, service, customer_type,
      // Pricing object fields (handled separately)
      pricing_monthly, pricing_setup, pricing_download_speed, pricing_upload_speed,
      // Accept multiple naming conventions for backward compatibility
      price_monthly, price_once_off,           // From edit form (old)
      monthly_price, setup_fee,                // From PriceEditModal (old)
      base_price_zar, cost_price_zar,         // Database field names (current)
      // Legacy fields that should not be updated directly
      speed_download, speed_upload,
      data_limit, contract_duration,
      // UI-only fields
      features,
      ...updateData
    } = body;

    // Build pricing JSONB object (trigger will auto-sync to root fields)
    // Only update pricing if pricing-related fields are provided
    if (body.pricing || pricing_monthly || base_price_zar || price_monthly || monthly_price || 
        pricing_setup || cost_price_zar || price_once_off || setup_fee ||
        pricing_download_speed || body.speed_download || pricing_upload_speed || body.speed_upload) {
      const pricingObject = body.pricing || {
        monthly: pricing_monthly ?? base_price_zar ?? price_monthly ?? monthly_price,
        setup: pricing_setup ?? cost_price_zar ?? price_once_off ?? setup_fee ?? 0,
        download_speed: pricing_download_speed ?? body.speed_download ?? 0,
        upload_speed: pricing_upload_speed ?? body.speed_upload ?? 0
      };
      updateData.pricing = pricingObject;
    }

    // Map form fields to service_packages schema
    if (category) {
      updateData.product_category = category;
    }
    if (service) {
      updateData.service_type = service;
    }
    if (customer_type) {
      // Map consumer/smme/enterprise to business/consumer
      updateData.customer_type = (customer_type === 'smme' || customer_type === 'enterprise') ? 'business' : 'consumer';
    }
    if (is_active !== undefined) {
      updateData.active = is_active;
      updateData.status = is_active ? 'active' : 'inactive';
    }
    if (featured !== undefined) {
      updateData.is_featured = featured;
    }

    // Store data_limit and contract_duration in metadata JSONB
    // First get existing metadata from the product
    const { data: existingProduct } = await supabase
      .from('service_packages')
      .select('metadata')
      .eq('id', id)
      .single();

    const metadata = { ...(existingProduct?.metadata || {}), ...(body.metadata || {}) };
    if (body.data_limit) metadata.data_limit = body.data_limit;
    if (body.contract_duration) metadata.contract_duration = body.contract_duration;
    if (features && Array.isArray(features)) {
      // Store features in metadata as well
      updateData.features = features;
    }
    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata;
    }

    // Update the product in service_packages (single source of truth)
    console.log('[Product Update API] Updating product:', {
      productId: id,
      updateDataKeys: Object.keys(updateData),
      hasPricing: !!updateData.pricing,
      hasMetadata: !!updateData.metadata,
      userEmail,
      userName
    });

    const { data: product, error: updateError } = await supabase
      .from('service_packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Product Update API] Database error:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        updateData
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update product',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      );
    }

    // The trigger will automatically create the audit log entry
    // But we need to update it with user attribution since trigger doesn't have access to that
    const { error: auditError } = await supabase
      .from('service_packages_audit_logs')
      .update({
        changed_by_email: userEmail,
        changed_by_name: userName,
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

    console.log('[Product Update API] Update successful');
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('[Product Update API] Unexpected error:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : typeof error
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    // Soft delete - set status to inactive (migrated to service_packages - Epic 1.6)
    const { data: product, error } = await supabase
      .from('service_packages')
      .update({
        status: 'inactive',
        active: false  // service_packages uses 'active' boolean field
      })
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

    // Update audit log with user attribution (service_packages uses service_packages_audit_logs)
    await supabase
      .from('service_packages_audit_logs')
      .update({
        changed_by_email: user.email,
        changed_by_name: user.full_name,
        change_reason: 'Product soft-deleted (status set to inactive)',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      .eq('package_id', id)
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
