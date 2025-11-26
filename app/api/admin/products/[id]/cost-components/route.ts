import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/products/[id]/cost-components - Get all cost components for a product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packageId } = await context.params;
    const supabase = await createClient();

    const { data: components, error } = await supabase
      .from('product_cost_components')
      .select('*')
      .eq('package_id', packageId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Cost Components API] Error fetching:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: components || [] });
  } catch (error) {
    console.error('[Cost Components API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products/[id]/cost-components - Create a new cost component
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packageId } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const componentData = {
      package_id: packageId,
      name: body.name,
      category: body.category,
      cost_amount: body.cost_amount || 0,
      recurrence: body.recurrence || 'monthly',
      amortisation_months: body.amortisation_months || null,
      unit_count: body.unit_count || 1,
      supplier_name: body.supplier_name || null,
      supplier_reference: body.supplier_reference || null,
      hardware_model: body.hardware_model || null,
      hardware_retail_value: body.hardware_retail_value || null,
      hardware_dealer_cost: body.hardware_dealer_cost || null,
      description: body.description || null,
      notes: body.notes || null,
      sort_order: body.sort_order || 0,
      is_optional: body.is_optional || false,
      is_visible_to_customer: body.is_visible_to_customer || false,
      metadata: body.metadata || {},
    };

    const { data: component, error } = await supabase
      .from('product_cost_components')
      .insert(componentData)
      .select()
      .single();

    if (error) {
      console.error('[Cost Components API] Error creating:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: component });
  } catch (error) {
    console.error('[Cost Components API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
