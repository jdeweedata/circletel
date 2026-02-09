import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MTNDealerProductFormData } from '@/lib/types/mtn-dealer-products';
import { apiLogger } from '@/lib/logging/logger';

// GET /api/admin/mtn-dealer-products/[id] - Get single product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from('mtn_dealer_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[MTN Dealer Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/mtn-dealer-products/[id] - Update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body: Partial<MTNDealerProductFormData> & { change_reason?: string } = await request.json();

    // Get existing product for audit
    const { data: existing, error: fetchError } = await supabase
      .from('mtn_dealer_products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Parse bundle values to numeric if provided
    const updateData: Record<string, any> = { ...body };
    delete updateData.change_reason;

    if (body.data_bundle !== undefined) {
      updateData.data_bundle_gb = body.data_bundle ? parseFloat(body.data_bundle.replace(/[^0-9.]/g, '')) || null : null;
    }
    if (body.anytime_minutes !== undefined) {
      updateData.anytime_minutes_value = body.anytime_minutes ? parseInt(body.anytime_minutes.replace(/[^0-9]/g, '')) || null : null;
    }
    if (body.on_net_minutes !== undefined) {
      updateData.on_net_minutes_value = body.on_net_minutes ? parseInt(body.on_net_minutes.replace(/[^0-9]/g, '')) || null : null;
    }
    if (body.sms_bundle !== undefined) {
      updateData.sms_bundle_value = body.sms_bundle ? parseInt(body.sms_bundle.replace(/[^0-9]/g, '')) || null : null;
    }

    const { data: product, error } = await supabase
      .from('mtn_dealer_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('[MTN Dealer Products API] Update error', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Determine action type for audit
    let action = 'update';
    if (body.status && body.status !== existing.status) {
      action = 'status_change';
    } else if (body.mtn_price_incl_vat !== undefined || body.markup_value !== undefined) {
      action = 'price_change';
    }

    // Log audit
    await supabase.from('mtn_dealer_product_audit_log').insert({
      product_id: product.id,
      deal_id: product.deal_id,
      action,
      old_values: existing,
      new_values: product,
      reason: body.change_reason,
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[MTN Dealer Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/mtn-dealer-products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get existing product for audit
    const { data: existing, error: fetchError } = await supabase
      .from('mtn_dealer_products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('mtn_dealer_products')
      .delete()
      .eq('id', id);

    if (error) {
      apiLogger.error('[MTN Dealer Products API] Delete error', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('mtn_dealer_product_audit_log').insert({
      product_id: null, // Product is deleted
      deal_id: existing.deal_id,
      action: 'delete',
      old_values: existing,
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('[MTN Dealer Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
