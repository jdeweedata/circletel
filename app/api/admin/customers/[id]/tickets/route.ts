/**
 * Admin Customer Tickets API
 * GET /api/admin/customers/[id]/tickets
 *
 * Returns the customer's Zoho Desk support tickets (looked up by email).
 * Degrades gracefully when Zoho Desk is not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createZohoDeskService } from '@/lib/integrations/zoho/desk-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id: customerId } = await context.params;
    const supabase = await createClient();

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    let deskService;
    try {
      deskService = createZohoDeskService();
    } catch {
      // Zoho Desk not configured in this environment — return empty rather than erroring
      return NextResponse.json({ success: true, configured: false, tickets: [] });
    }

    const result = await deskService.listCustomerTickets(customer.email, 50);

    if (!result.success) {
      console.error('[Customer Tickets] Zoho Desk error:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch tickets' },
        { status: 502 }
      );
    }

    const tickets = (result.tickets || []).map((ticket) => ({
      id: ticket.id,
      ticket_number: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      created_time: ticket.createdTime,
      modified_time: ticket.modifiedTime,
    }));

    return NextResponse.json({ success: true, configured: true, tickets });
  } catch (error) {
    console.error('[Customer Tickets] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
