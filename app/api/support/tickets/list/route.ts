/**
 * List Support Tickets API
 * Retrieves customer tickets from ZOHO Desk
 */

import { NextRequest, NextResponse } from 'next/server';
import { createZohoDeskService } from '@/lib/integrations/zoho/desk-service';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get email from query params (or use authenticated user's email)
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || user.email;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify the email belongs to the authenticated user
    if (email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized access to other user tickets' }, { status: 403 });
    }

    // Get limit from query params (default 50)
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Create ZOHO Desk service
    const deskService = createZohoDeskService();

    // List tickets
    const result = await deskService.listCustomerTickets(email, limit);

    if (!result.success) {
      apiLogger.error('[List Tickets] ZOHO Desk error', { error: result.error });
      return NextResponse.json(
        { error: 'Failed to fetch tickets', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tickets: result.tickets || [],
    });
  } catch (error) {
    apiLogger.error('[List Tickets] Unexpected error', { error });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
