import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * GET /api/admin/technicians
 * Returns list of active technicians
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: technicians, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

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
    const supabase = await createClient();
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
