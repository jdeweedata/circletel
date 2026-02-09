/**
 * Quote Request Token Validation API
 *
 * GET /api/quotes/request/validate?token=[token]
 *
 * Validates agent quote link token (optional - form works without token too)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // If no token, return success (public form)
    if (!token) {
      return NextResponse.json({
        success: true,
        is_public: true,
        message: 'Public quote request form'
      });
    }

    const supabase = await createClient();

    // Check if token is a permanent agent link
    const { data: agent, error: agentError } = await supabase
      .from('sales_agents')
      .select('id, full_name, email, agent_type, status, unique_link_token')
      .eq('unique_link_token', token)
      .eq('status', 'active')
      .single();

    if (agent) {
      return NextResponse.json({
        success: true,
        is_public: false,
        token_type: 'agent_permanent',
        agent: {
          id: agent.id,
          name: agent.full_name,
          email: agent.email,
          type: agent.agent_type
        }
      });
    }

    // Check if token is a temporary quote link
    const { data: link, error: linkError } = await supabase
      .from('agent_quote_links')
      .select(`
        *,
        agent:sales_agents!agent_id (
          id,
          full_name,
          email,
          agent_type,
          status
        )
      `)
      .eq('token', token)
      .eq('active', true)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token'
        },
        { status: 404 }
      );
    }

    // Check if agent is active
    if (link.agent.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Agent account is not active'
        },
        { status: 403 }
      );
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'This link has expired'
        },
        { status: 410 }
      );
    }

    // Check usage limit
    if (link.max_uses && link.use_count >= link.max_uses) {
      return NextResponse.json(
        {
          success: false,
          error: 'This link has reached its usage limit'
        },
        { status: 410 }
      );
    }

    // Return valid token info
    return NextResponse.json({
      success: true,
      is_public: false,
      token_type: 'agent_temporary',
      agent: {
        id: link.agent.id,
        name: link.agent.full_name,
        email: link.agent.email,
        type: link.agent.agent_type
      },
      link: {
        expires_at: link.expires_at,
        uses_remaining: link.max_uses ? link.max_uses - link.use_count : null
      }
    });

  } catch (error) {
    apiLogger.error('Error validating quote request token:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate token'
      },
      { status: 500 }
    );
  }
}
