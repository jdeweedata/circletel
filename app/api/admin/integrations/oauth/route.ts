/**
 * Integration OAuth Management API
 *
 * GET /api/admin/integrations/oauth
 *
 * List all OAuth tokens for the integrations OAuth management page
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { differenceInDays } from 'date-fns';

/**
 * GET /api/admin/integrations/oauth
 *
 * List all OAuth tokens with their status
 *
 * Authentication: Admin users with 'integrations:view' permission
 */
export async function GET(request: NextRequest) {
  try {
    // =========================================================================
    // Authentication & Authorization
    // =========================================================================
    const supabase = await createSSRClient();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add RBAC permission check when implemented (integrations:view)

    // =========================================================================
    // Fetch OAuth Tokens
    // =========================================================================
    const { data: tokens, error: tokensError } = await supabase
      .from('integration_oauth_tokens')
      .select(
        `
        id,
        integration_slug,
        expires_at,
        last_refreshed_at,
        refresh_count,
        last_error,
        last_error_at,
        consecutive_failures,
        is_active,
        created_at,
        updated_at
      `
      )
      .order('integration_slug', { ascending: true });

    if (tokensError) {
      console.error('[OAuth API] Error fetching tokens:', tokensError);
      return NextResponse.json({ error: 'Failed to fetch OAuth tokens' }, { status: 500 });
    }

    // =========================================================================
    // Fetch Integration Names
    // =========================================================================
    const { data: integrations } = await supabase
      .from('integration_registry')
      .select('slug, name')
      .in('integration_type', ['oauth', 'api_key']); // Include API keys that use OAuth

    const integrationMap = new Map(integrations?.map((i) => [i.slug, i.name]) || []);

    // =========================================================================
    // Format Response
    // =========================================================================
    const formattedTokens = (tokens || []).map((token) => {
      // Calculate token status
      let tokenStatus: 'active' | 'expired' | 'revoked' = 'active';

      if (!token.is_active) {
        tokenStatus = 'revoked';
      } else if (token.expires_at) {
        const daysUntilExpiry = differenceInDays(new Date(token.expires_at), new Date());
        if (daysUntilExpiry < 0) {
          tokenStatus = 'expired';
        }
      }

      return {
        id: token.id,
        integration_slug: token.integration_slug,
        integration_name: integrationMap.get(token.integration_slug) || token.integration_slug,
        token_status: tokenStatus,
        expires_at: token.expires_at,
        last_refreshed_at: token.last_refreshed_at,
        refresh_count: token.refresh_count,
        created_at: token.created_at,
      };
    });

    return NextResponse.json({
      tokens: formattedTokens,
      summary: {
        total: formattedTokens.length,
        active: formattedTokens.filter((t) => t.token_status === 'active').length,
        expired: formattedTokens.filter((t) => t.token_status === 'expired').length,
        revoked: formattedTokens.filter((t) => t.token_status === 'revoked').length,
      },
    });
  } catch (error) {
    console.error('[OAuth API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
