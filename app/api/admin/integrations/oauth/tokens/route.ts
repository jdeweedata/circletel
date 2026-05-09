/**
 * API Route: GET /api/admin/integrations/oauth/tokens
 *
 * List all OAuth tokens across integrations with status
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { differenceInHours } from 'date-fns';
import { apiLogger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabaseAdmin = await createClient();

    // Get all OAuth tokens with integration details
    const { data: tokens, error: tokensError } = await supabaseAdmin
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
        scopes
      `
      )
      .eq('is_active', true)
      .order('integration_slug');

    if (tokensError) {
      apiLogger.error('[OAuth Tokens API] Failed to fetch tokens', { error: tokensError.message, code: tokensError.code });
      return NextResponse.json({ error: 'Failed to fetch OAuth tokens' }, { status: 500 });
    }

    // Get integration names
    const { data: integrations } = await supabaseAdmin
      .from('integration_registry')
      .select('slug, name')
      .eq('integration_type', 'oauth');

    const integrationMap = new Map(integrations?.map((i) => [i.slug, i.name]) || []);

    // Calculate token status
    const tokensWithStatus = (tokens || []).map((token) => {
      let status: 'valid' | 'expired' | 'expiring_soon' | 'error' = 'valid';
      let expiresIn = 0;

      if (token.last_error) {
        status = 'error';
      } else if (token.expires_at) {
        const expiresAt = new Date(token.expires_at);
        expiresIn = differenceInHours(expiresAt, new Date());

        if (expiresIn <= 0) {
          status = 'expired';
        } else if (expiresIn < 24) {
          status = 'expiring_soon';
        }
      }

      return {
        integrationId: token.id,
        integrationSlug: token.integration_slug,
        integrationName: integrationMap.get(token.integration_slug) || token.integration_slug,
        hasAccessToken: true,
        hasRefreshToken: true,
        expiresAt: token.expires_at,
        expiresIn,
        lastRefreshedAt: token.last_refreshed_at,
        refreshCount: token.refresh_count,
        lastError: token.last_error,
        lastErrorAt: token.last_error_at,
        consecutiveFailures: token.consecutive_failures,
        scopes: token.scopes,
        status,
      };
    });

    return NextResponse.json({
      tokens: tokensWithStatus,
      summary: {
        total: tokensWithStatus.length,
        valid: tokensWithStatus.filter((t) => t.status === 'valid').length,
        expiringSoon: tokensWithStatus.filter((t) => t.status === 'expiring_soon').length,
        expired: tokensWithStatus.filter((t) => t.status === 'expired').length,
        error: tokensWithStatus.filter((t) => t.status === 'error').length,
      },
    });
  } catch (error) {
    apiLogger.error('[OAuth Tokens API] Unexpected error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
