import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/products/[id]/cost-components/[componentId] - Get single component
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const { id: packageId, componentId } = await context.params;
    const supabase = await createClient();

    const { data: component, error } = await supabase
      .from('product_cost_components')
      .select('*')
      .eq('id', componentId)
      .eq('package_id', packageId)
      .single();

    if (error) {
      console.error('[Cost Component API] Error fetching:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true, data: component });
  } catch (error) {
    console.error('[Cost Component API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id]/cost-components/[componentId] - Update component
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const { id: packageId, componentId } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    // Build update data (only include provided fields)
    const updateData: Record<string, any> = {};
    
    const allowedFields = [
      'name', 'category', 'cost_amount', 'recurrence', 'amortisation_months',
      'unit_count', 'supplier_name', 'supplier_reference', 'hardware_model',
      'hardware_retail_value', 'hardware_dealer_cost', 'description', 'notes',
      'sort_order', 'is_optional', 'is_visible_to_customer', 'metadata'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: component, error } = await supabase
      .from('product_cost_components')
      .update(updateData)
      .eq('id', componentId)
      .eq('package_id', packageId)
      .select()
      .single();

    if (error) {
      console.error('[Cost Component API] Error updating:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: component });
  } catch (error) {
    console.error('[Cost Component API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id]/cost-components/[componentId] - Delete component
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const { id: packageId, componentId } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('product_cost_components')
      .delete()
      .eq('id', componentId)
      .eq('package_id', packageId);

    if (error) {
      console.error('[Cost Component API] Error deleting:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cost Component API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
