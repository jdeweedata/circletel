/**
 * Business Quotes API
 *
 * GET /api/quotes - List quotes with optional filters (agent_id, status, search)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const agent_id = searchParams.get('agent_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('business_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `quote_number.ilike.%${search}%,company_name.ilike.%${search}%,contact_email.ilike.%${search}%`
      );
    }

    const { data: quotes, error } = await query;

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch quotes'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quotes: quotes || []
    });

  } catch (error) {
    console.error('Error in GET /api/quotes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
