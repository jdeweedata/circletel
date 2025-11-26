import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/cost-component-templates - Get all templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const productCategory = searchParams.get('product_category');
    const serviceType = searchParams.get('service_type');
    const customerType = searchParams.get('customer_type');

    let query = supabase
      .from('cost_component_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    // Apply filters if provided
    if (productCategory) {
      query = query.eq('product_category', productCategory);
    }
    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }
    if (customerType) {
      query = query.eq('customer_type', customerType);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('[Cost Templates API] Error fetching:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: templates || [] });
  } catch (error) {
    console.error('[Cost Templates API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/cost-component-templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.components) {
      return NextResponse.json(
        { success: false, error: 'Name and components are required' },
        { status: 400 }
      );
    }

    const templateData = {
      name: body.name,
      description: body.description || null,
      product_category: body.product_category || null,
      service_type: body.service_type || null,
      customer_type: body.customer_type || null,
      components: body.components,
      is_active: body.is_active !== false,
    };

    const { data: template, error } = await supabase
      .from('cost_component_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('[Cost Templates API] Error creating:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('[Cost Templates API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
