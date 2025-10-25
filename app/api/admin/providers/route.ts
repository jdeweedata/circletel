// Network Providers Management API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface CreateProviderRequest {
  name: string;
  displayName: string;
  type: 'api' | 'static';
  description?: string;
  website?: string;
  supportContact?: string;
  apiConfig?: Record<string, unknown>;
  staticConfig?: Record<string, unknown>;
  serviceTypes: string[];
  priority: number;
  enabled?: boolean;
}

interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  id: string;
}

// Get all network providers
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');
    const type = searchParams.get('type');

    // Build query
    let query = supabase
      .from('fttb_network_providers')
      .select('*');

    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true');
    }

    if (type) {
      query = query.eq('type', type);
    }

    query = query.order('priority', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch network providers',
      code: 'FETCH_ERROR'
    }, { status: 500 });
  }
}

// Create new network provider
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateProviderRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.displayName || !body.type) {
      return NextResponse.json({
        success: false,
        error: 'Name, display name, and type are required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Validate service types
    const validServiceTypes = [
      'fibre', 'fixed_lte', 'uncapped_wireless', 'licensed_wireless',
      '5g', 'lte', '3g_900', '3g_2100', '3g', '2g', 'satellite', 'microwave', 'dsl', 'cable'
    ];

    for (const serviceType of body.serviceTypes) {
      if (!validServiceTypes.includes(serviceType)) {
        return NextResponse.json({
          success: false,
          error: `Invalid service type: ${serviceType}`,
          code: 'INVALID_SERVICE_TYPE'
        }, { status: 400 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('fttb_network_providers')
      .insert([{
        name: body.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: body.displayName,
        type: body.type,
        description: body.description,
        website: body.website,
        support_contact: body.supportContact,
        api_config: body.apiConfig,
        static_config: body.staticConfig,
        service_types: body.serviceTypes,
        priority: body.priority,
        enabled: body.enabled ?? true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          error: 'Provider name already exists',
          code: 'DUPLICATE_NAME'
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create network provider',
      code: 'CREATE_ERROR'
    }, { status: 500 });
  }
}

// Update network provider
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body: UpdateProviderRequest = await request.json();

    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    // Validate service types if provided
    if (body.serviceTypes) {
      const validServiceTypes = [
        'fibre', 'fixed_lte', 'uncapped_wireless', 'licensed_wireless',
        '5g', 'lte', '3g_900', '3g_2100', '3g', '2g', 'satellite', 'microwave', 'dsl', 'cable'
      ];

      for (const serviceType of body.serviceTypes) {
        if (!validServiceTypes.includes(serviceType)) {
          return NextResponse.json({
            success: false,
            error: `Invalid service type: ${serviceType}`,
            code: 'INVALID_SERVICE_TYPE'
          }, { status: 400 });
        }
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name.toLowerCase().replace(/\s+/g, '_');
    if (body.displayName) updateData.display_name = body.displayName;
    if (body.type) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.supportContact !== undefined) updateData.support_contact = body.supportContact;
    if (body.apiConfig !== undefined) updateData.api_config = body.apiConfig;
    if (body.staticConfig !== undefined) updateData.static_config = body.staticConfig;
    if (body.serviceTypes) updateData.service_types = body.serviceTypes;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;

    const { data, error} = await supabase
      .from('fttb_network_providers')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json({
          success: false,
          error: 'Provider not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update network provider',
      code: 'UPDATE_ERROR'
    }, { status: 500 });
  }
}

// Delete network provider
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Provider ID is required',
        code: 'MISSING_ID'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('fttb_network_providers')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete network provider',
      code: 'DELETE_ERROR'
    }, { status: 500 });
  }
}