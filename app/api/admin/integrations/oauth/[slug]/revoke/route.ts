/**
 * API Route: DELETE /api/admin/integrations/oauth/[slug]/revoke
 *
 * Revoke OAuth token for an integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

export async function DELETE(
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
            // No-op for DELETE requests
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

    // Get OAuth token
    const { data: token, error: tokenError } = await supabaseAdmin
      .from('integration_oauth_tokens')
      .select('*')
      .eq('integration_slug', slug)
      .eq('is_active', true)
      .single();

    if (tokenError || !token) {
      return NextResponse.json({ error: 'OAuth token not found' }, { status: 404 });
    }

    // Revoke token by marking as inactive
    const { error: revokeError } = await supabaseAdmin
      .from('integration_oauth_tokens')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', token.id);

    if (revokeError) {
      console.error('[OAuth Revoke API] Failed to revoke token:', revokeError);
      return NextResponse.json({ error: 'Failed to revoke OAuth token' }, { status: 500 });
    }

    // Update integration health status to down
    await supabaseAdmin
      .from('integration_registry')
      .update({
        health_status: 'down',
        last_health_check_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug);

    // Log activity
    await supabaseAdmin.from('integration_activity_log').insert({
      integration_slug: slug,
      action_type: 'oauth_token_revoked',
      action_description: `OAuth token revoked`,
      performed_by: user.id,
      performed_by_email: adminUser.email,
      action_result: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'OAuth token revoked successfully',
    });
  } catch (error) {
    console.error('[OAuth Revoke API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
