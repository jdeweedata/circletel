/**
 * API Route: DELETE /api/admin/integrations/oauth/[slug]/revoke
 *
 * Revoke OAuth token for an integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { slug } = await context.params;
    const supabaseAdmin = await createClient();

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
      apiLogger.error('[OAuth Revoke API] Failed to revoke token', { error: revokeError.message, code: revokeError.code });
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
      performed_by: authResult.user.id,
      performed_by_email: authResult.user.email,
      action_result: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'OAuth token revoked successfully',
    });
  } catch (error) {
    apiLogger.error('[OAuth Revoke API] Unexpected error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
