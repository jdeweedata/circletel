import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging/logger';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

/**
 * GET /api/admin/technicians
 * Returns list of technicians (active by default, or all if include_inactive=true)
 * Maps new schema (first_name, last_name, skills) to old format (name, specialties) for compatibility
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
      .order('first_name', { ascending: true });

    // Filter by active status unless include_inactive is true
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: technicians, error } = await query;

    if (error) {
      apiLogger.error('Error fetching technicians', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch technicians', details: error.message },
        { status: 500 }
      );
    }

    // Map new schema to old format for backwards compatibility
    const mappedTechnicians = (technicians || []).map((tech) => ({
      ...tech,
      // Combine first_name + last_name as 'name' for old UI
      name: `${tech.first_name} ${tech.last_name}`.trim(),
      // Map 'skills' to 'specialties' for old UI
      specialties: tech.skills || [],
      // Keep original fields for new UI
      total_installations: 0,
      completed_installations: 0,
      average_rating: null,
      notes: null,
    }));

    return NextResponse.json({
      success: true,
      data: mappedTechnicians,
    });
  } catch (error: any) {
    apiLogger.error('Admin technicians fetch error', { error });
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
 * Accepts both old format (name) and new format (first_name, last_name)
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

    const { name, first_name, last_name, email, phone, specialties, skills, team, employee_id } = body;

    // Handle both old format (name) and new format (first_name, last_name)
    let firstName = first_name;
    let lastName = last_name;

    if (!firstName && name) {
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    // Validation
    if (!firstName || !phone) {
      return NextResponse.json(
        { success: false, error: 'First name and phone are required' },
        { status: 400 }
      );
    }

    const { data: technician, error } = await supabase
      .from('technicians')
      .insert({
        first_name: firstName,
        last_name: lastName || '',
        email: email || null,
        phone,
        skills: skills || specialties || [],
        team: team || null,
        employee_id: employee_id || null,
        status: 'available',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      apiLogger.error('Error creating technician', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to create technician', details: error.message },
        { status: 500 }
      );
    }

    // Map response to include 'name' for backwards compatibility
    const mappedTechnician = {
      ...technician,
      name: `${technician.first_name} ${technician.last_name}`.trim(),
      specialties: technician.skills || [],
    };

    return NextResponse.json({
      success: true,
      data: mappedTechnician,
      message: 'Technician created successfully',
    });
  } catch (error: any) {
    apiLogger.error('Admin technician create error', { error });
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
