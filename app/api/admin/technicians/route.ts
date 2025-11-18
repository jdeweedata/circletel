import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * GET /api/admin/technicians
 * Returns list of technicians (active by default, or all if include_inactive=true)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('technicians')
      .select('*')
      .order('name', { ascending: true });

    // Filter by active status unless include_inactive is true
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: technicians, error } = await query;

    if (error) {
      console.error('Error fetching technicians:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch technicians', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: technicians || [],
    });
  } catch (error: any) {
    console.error('Admin technicians fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/technicians
 * Creates a new technician
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    const body = await request.json();

    const { name, email, phone, specialties, service_area } = body;

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    const { data: technician, error } = await supabase
      .from('technicians')
      .insert({
        name,
        email,
        phone,
        specialties: specialties || [],
        service_area: service_area || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating technician:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create technician', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: technician,
      message: 'Technician created successfully',
    });
  } catch (error: any) {
    console.error('Admin technician create error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
