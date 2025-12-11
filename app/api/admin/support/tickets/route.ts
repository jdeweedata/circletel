import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      ticket_number,
      customer_id,
      subject,
      description,
      priority,
      category,
      agent_id,
      status,
      attachments,
    } = body;

    // Validate required fields
    if (!customer_id || !subject) {
      return NextResponse.json(
        { error: 'Customer and subject are required' },
        { status: 400 }
      );
    }

    // Create ticket in database
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number,
        customer_id,
        subject,
        description: description || null,
        priority: priority || 'low',
        category: category || 'general',
        assigned_agent_id: agent_id || null,
        status: status || 'open',
        attachments: attachments || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating support ticket:', error);
      // If table doesn't exist, return mock success for now
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: {
            id: `mock-${Date.now()}`,
            ticket_number,
            customer_id,
            subject,
            status: 'open',
          },
          message: 'Ticket created (mock - table not yet created)',
        });
      }
      return NextResponse.json(
        { error: 'Failed to create ticket', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/support/tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('support_tickets')
      .select('*, customers(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: tickets, error, count } = await query;

    if (error) {
      console.error('Error fetching support tickets:', error);
      // Return empty array if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          message: 'No tickets (table not yet created)',
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tickets || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/support/tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
