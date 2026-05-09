import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // Fetch tickets with customer info
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      apiLogger.error('[Support Tickets API] Error', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tickets', details: error.message },
        { status: 500 }
      );
    }

    // Calculate stats
    const total = tickets?.length || 0;
    const open = tickets?.filter(t => t.status === 'open').length || 0;
    const pending = tickets?.filter(t => t.status === 'pending').length || 0;
    const resolved = tickets?.filter(t => t.status === 'resolved').length || 0;
    const closed = tickets?.filter(t => t.status === 'closed').length || 0;

    return NextResponse.json({
      success: true,
      data: tickets || [],
      stats: {
        total,
        open,
        pending,
        resolved,
        closed
      }
    });
  } catch (error) {
    apiLogger.error('[Support Tickets API] Error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
