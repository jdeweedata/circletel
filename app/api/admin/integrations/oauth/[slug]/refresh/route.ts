/**
 * API Route: POST /api/admin/integrations/oauth/[slug]/refresh
 *
 * Manually refresh OAuth token for an integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Create TWO clients:
    // 1. SSR client for authentication (reads cookies)
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op for POST requests
          },
        },
      }
    );

    // 2. Service role client for database queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Check authentication using SSR client
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin user using service role client (bypasses RLS)
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active, email')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Refresh token based on integration type
    let refreshResult: { success: boolean; expiresAt?: string; error?: string };

    // Handle Zoho token refresh (stored in zoho_tokens table)
    if (slug === 'zoho') {
      refreshResult = await refreshZohoTokenFromEnv(supabaseAdmin);
    } else if (slug.startsWith('zoho-')) {
      // Legacy: Get OAuth token from integration_oauth_tokens table
      const { data: token, error: tokenError } = await supabaseAdmin
        .from('integration_oauth_tokens')
        .select('*')
        .eq('integration_slug', slug)
        .eq('is_active', true)
        .single();

      if (tokenError || !token) {
        return NextResponse.json({ error: 'OAuth token not found' }, { status: 404 });
      }
      refreshResult = await refreshZohoToken(token);
    } else {
      // Get OAuth token from database for other integrations
      const { data: token, error: tokenError } = await supabaseAdmin
        .from('integration_oauth_tokens')
        .select('*')
        .eq('integration_slug', slug)
        .eq('is_active', true)
        .single();

      if (tokenError || !token) {
        return NextResponse.json({ error: 'OAuth token not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'OAuth refresh not implemented for this integration' },
        { status: 501 }
      );
    }

    if (!refreshResult.success) {
      // Log failure
      await supabaseAdmin.from('integration_activity_log').insert({
        integration_slug: slug,
        action_type: 'oauth_token_refreshed',
        action_description: `Manual OAuth token refresh failed`,
        performed_by: user.id,
        performed_by_email: adminUser.email,
        action_result: 'failed',
        error_message: refreshResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          message: refreshResult.error || 'Failed to refresh OAuth token',
        },
        { status: 500 }
      );
    }

    // Log success
    await supabaseAdmin.from('integration_activity_log').insert({
      integration_slug: slug,
      action_type: 'oauth_token_refreshed',
      action_description: `Manual OAuth token refresh successful`,
      performed_by: user.id,
      performed_by_email: adminUser.email,
      action_result: 'success',
    });

    return NextResponse.json({
      success: true,
      expiresAt: refreshResult.expiresAt,
      message: 'OAuth token refreshed successfully',
    });
  } catch (error) {
    console.error('[OAuth Refresh API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Refresh Zoho OAuth token using environment variables
 * Stores token in zoho_tokens table
 */
async function refreshZohoTokenFromEnv(supabase: any): Promise<{
  success: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return { success: false, error: 'Missing Zoho OAuth credentials in environment' };
    }

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    // Delete existing tokens and insert new one
    await supabase.from('zoho_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    await supabase.from('zoho_tokens').insert({
      access_token: data.access_token,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      token_type: data.token_type || 'Bearer',
      scope: data.scope || 'ZohoCRM.modules.ALL',
    });

    return {
      success: true,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh Zoho OAuth token (legacy - from integration_oauth_tokens)
 */
async function refreshZohoToken(token: any): Promise<{
  success: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const clientId = token.client_id;
    const clientSecret = token.client_secret;
    const refreshToken = token.refresh_token;

    if (!clientId || !clientSecret || !refreshToken) {
      return { success: false, error: 'Missing OAuth credentials' };
    }

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Update token in database
    const supabase = await createClient();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await supabase
      .from('integration_oauth_tokens')
      .update({
        access_token: data.access_token,
        expires_at: expiresAt.toISOString(),
        last_refreshed_at: new Date().toISOString(),
        refresh_count: token.refresh_count + 1,
        consecutive_failures: 0,
        last_error: null,
        last_error_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', token.id);

    return {
      success: true,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
