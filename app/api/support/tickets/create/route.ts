/**
 * Create Support Ticket API
 * Creates a new ticket in ZOHO Desk
 */

import { NextRequest, NextResponse } from 'next/server';
import { createZohoDeskService } from '@/lib/integrations/zoho/desk-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { subject, description, priority, customerEmail, customerName } = body;

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Create ZOHO Desk service
    const deskService = createZohoDeskService();

    // Create ticket
    const result = await deskService.createTicket({
      subject,
      description,
      customerEmail: customerEmail || user.email!,
      customerName: customerName || user.email!.split('@')[0],
      priority: priority || 'Medium',
      category: 'Customer Support',
    });

    if (!result.success) {
      console.error('[Create Ticket] ZOHO Desk error:', result.error);
      return NextResponse.json(
        { error: 'Failed to create ticket', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: result.ticket,
    });
  } catch (error) {
    console.error('[Create Ticket] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
