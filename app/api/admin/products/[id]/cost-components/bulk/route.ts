import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/products/[id]/cost-components/bulk - Bulk create/replace components
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packageId } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    if (!body.components || !Array.isArray(body.components)) {
      return NextResponse.json(
        { success: false, error: 'Components array is required' },
        { status: 400 }
      );
    }

    // Option to replace all existing components
    const replaceExisting = body.replaceExisting !== false; // Default to true

    if (replaceExisting) {
      // Delete existing components
      const { error: deleteError } = await supabase
        .from('product_cost_components')
        .delete()
        .eq('package_id', packageId);

      if (deleteError) {
        console.error('[Cost Components Bulk API] Error deleting existing:', deleteError);
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }
    }

    // Prepare components for insertion
    const componentsToInsert = body.components.map((comp: any, index: number) => ({
      package_id: packageId,
      name: comp.name || 'Unnamed Component',
      category: comp.category || 'other',
      cost_amount: comp.cost_amount || comp.default_cost || 0,
      recurrence: comp.recurrence || 'monthly',
      amortisation_months: comp.amortisation_months || null,
      unit_count: comp.unit_count || 1,
      supplier_name: comp.supplier_name || null,
      supplier_reference: comp.supplier_reference || null,
      hardware_model: comp.hardware_model || null,
      hardware_retail_value: comp.hardware_retail_value || null,
      hardware_dealer_cost: comp.hardware_dealer_cost || null,
      description: comp.description || null,
      notes: comp.notes || null,
      sort_order: comp.sort_order ?? index,
      is_optional: comp.is_optional || false,
      is_visible_to_customer: comp.is_visible_to_customer || false,
      metadata: comp.metadata || {},
    }));

    // Insert new components
    const { data: components, error: insertError } = await supabase
      .from('product_cost_components')
      .insert(componentsToInsert)
      .select();

    if (insertError) {
      console.error('[Cost Components Bulk API] Error inserting:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: components,
      message: `${components?.length || 0} components created`,
    });
  } catch (error) {
    console.error('[Cost Components Bulk API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
