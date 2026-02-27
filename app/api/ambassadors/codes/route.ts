/**
 * Ambassador Codes API
 *
 * GET - List codes for current ambassador
 * POST - Create a new code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ambassador
    const { data: ambassador, error: ambassadorError } = await supabase
      .from('ambassadors')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (ambassadorError || !ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }

    if (ambassador.status !== 'approved') {
      return NextResponse.json(
        { error: 'Ambassador account not approved' },
        { status: 403 }
      );
    }

    // Fetch codes
    const { data: codes, error: codesError } = await supabase
      .from('ambassador_codes')
      .select('*')
      .eq('ambassador_id', ambassador.id)
      .order('created_at', { ascending: false });

    if (codesError) {
      console.error('Error fetching codes:', codesError);
      return NextResponse.json(
        { error: 'Failed to fetch codes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('Ambassador codes GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ambassador
    const { data: ambassador, error: ambassadorError } = await supabase
      .from('ambassadors')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (ambassadorError || !ambassador) {
      return NextResponse.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }

    if (ambassador.status !== 'approved') {
      return NextResponse.json(
        { error: 'Ambassador account not approved' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { code, label, destination_url, discount_type, discount_value } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Check code uniqueness
    const { data: existingCode } = await supabase
      .from('ambassador_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existingCode) {
      return NextResponse.json(
        { error: 'This code is already in use' },
        { status: 409 }
      );
    }

    // Create code
    const { data: newCode, error: createError } = await supabase
      .from('ambassador_codes')
      .insert({
        ambassador_id: ambassador.id,
        code: code.toUpperCase(),
        label: label || null,
        destination_url: destination_url || '/',
        discount_type: discount_type || null,
        discount_value: discount_value || 0,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating code:', createError);
      return NextResponse.json(
        { error: 'Failed to create code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ code: newCode }, { status: 201 });
  } catch (error) {
    console.error('Ambassador codes POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
