/**
 * Sales Agent API - Individual Agent Operations
 *
 * GET    /api/sales-agents/[id] - Get agent details
 * PATCH  /api/sales-agents/[id] - Update agent
 * DELETE /api/sales-agents/[id] - Deactivate agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdateSalesAgentRequest } from '@/lib/sales-agents/types';
import { apiLogger } from '@/lib/logging/logger';

/**
 * GET /api/sales-agents/[id]
 *
 * Get sales agent details with performance metrics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch agent
    const { data: agent, error: agentError } = await supabase
      .from('sales_agents')
      .select('*')
      .eq('id', id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sales agent not found'
        },
        { status: 404 }
      );
    }

    // Calculate acceptance rate
    const acceptance_rate = agent.total_quotes_created > 0
      ? (agent.total_quotes_accepted / agent.total_quotes_created) * 100
      : 0;

    // Calculate average quote value
    const average_quote_value = agent.total_quotes_accepted > 0
      ? agent.total_revenue_generated / agent.total_quotes_accepted
      : 0;

    // Get last quote created date
    const { data: lastQuote } = await supabase
      .from('business_quotes')
      .select('created_at')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get active quotes count
    const { count: activeQuotesCount } = await supabase
      .from('business_quotes')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id)
      .in('status', ['draft', 'pending_approval', 'approved', 'sent', 'viewed']);

    // Return agent with calculated metrics
    return NextResponse.json({
      success: true,
      agent: {
        ...agent,
        acceptance_rate: Math.round(acceptance_rate * 100) / 100,
        average_quote_value: Math.round(average_quote_value * 100) / 100,
        last_quote_created_at: lastQuote?.created_at || null,
        active_quotes_count: activeQuotesCount || 0
      }
    });

  } catch (error) {
    apiLogger.error('Error in GET /api/sales-agents/[id]', { error });
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
 * PATCH /api/sales-agents/[id]
 *
 * Update sales agent
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body: UpdateSalesAgentRequest = await request.json();

    // Build update object
    const updates: Record<string, unknown> = {};

    if (body.full_name !== undefined) updates.full_name = body.full_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.company !== undefined) updates.company = body.company;
    if (body.commission_rate !== undefined) updates.commission_rate = body.commission_rate;
    if (body.status !== undefined) updates.status = body.status;

    // Update agent
    const { data: agent, error } = await supabase
      .from('sales_agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Error updating sales agent', { error });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update sales agent'
        },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sales agent not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent,
      message: 'Sales agent updated successfully'
    });

  } catch (error) {
    apiLogger.error('Error in PATCH /api/sales-agents/[id]', { error });
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
 * DELETE /api/sales-agents/[id]
 *
 * Deactivate sales agent (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Deactivate agent (soft delete)
    const { data: agent, error } = await supabase
      .from('sales_agents')
      .update({ status: 'inactive' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Error deactivating sales agent', { error });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to deactivate sales agent'
        },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sales agent not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent,
      message: 'Sales agent deactivated successfully'
    });

  } catch (error) {
    apiLogger.error('Error in DELETE /api/sales-agents/[id]', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
