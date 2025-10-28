/**
 * Sales Agents API - List & Create
 *
 * GET  /api/sales-agents - List all sales agents (with filters)
 * POST /api/sales-agents - Create new sales agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SalesAgentFilters, CreateSalesAgentRequest } from '@/lib/sales-agents/types';

/**
 * GET /api/sales-agents
 *
 * List sales agents with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters: SalesAgentFilters = {
      status: searchParams.get('status') as any,
      agent_type: searchParams.get('agent_type') as any,
      search: searchParams.get('search') || undefined,
    };

    // Build query
    let query = supabase.from('sales_agents').select('*');

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.agent_type) {
      query = query.eq('agent_type', filters.agent_type);
    }

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: agents, error } = await query;

    if (error) {
      console.error('Error fetching sales agents:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch sales agents'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agents: agents || []
    });

  } catch (error) {
    console.error('Error in GET /api/sales-agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sales-agents
 *
 * Create new sales agent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateSalesAgentRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.full_name || !body.agent_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, full_name, agent_type'
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('sales_agents')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists'
        },
        { status: 409 }
      );
    }

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();

    // Create sales agent
    const { data: agent, error } = await supabase
      .from('sales_agents')
      .insert({
        email: body.email,
        full_name: body.full_name,
        phone: body.phone || null,
        company: body.company || null,
        agent_type: body.agent_type,
        commission_rate: body.commission_rate || 5.0,
        status: 'active',
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sales agent:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create sales agent'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        agent,
        message: 'Sales agent created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/sales-agents:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
