/**
 * API Route: Generate Shareable Quote Link
 *
 * POST /api/quotes/business/[id]/share
 *
 * Generates a unique shareable link for a quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin using shared helper (reads session cookies correctly)
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user, adminUser } = authResult;

    // Optional RBAC: require ability to read or send quotes
    const permissionError = requirePermission(adminUser, ['quotes:read', 'quotes:write']);
    if (permissionError) {
      return permissionError;
    }

    const { id } = await context.params;
    const supabase = await createClient();

    // Get quote
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .select('id, quote_number, share_token, share_enabled')
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Generate new share token if one doesn't exist
    let shareToken = quote.share_token;

    if (!shareToken) {
      // Generate a URL-safe random token
      shareToken = crypto.randomBytes(24).toString('base64url');

      // Update quote with share token
      const { error: updateError } = await supabase
        .from('business_quotes')
        .update({
          share_token: shareToken,
          share_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }
    }

    // Track share event
    await supabase
      .from('quote_tracking')
      .insert({
        quote_id: id,
        event_type: 'shared',
        admin_user_id: adminUser.id,
        metadata: {
          shared_by: user.email,
          share_method: 'link_generation'
        }
      });

    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
    const shareUrl = `${baseUrl}/quotes/share/${shareToken}`;

    return NextResponse.json({
      success: true,
      data: {
        share_url: shareUrl,
        share_token: shareToken,
        quote_number: quote.quote_number
      }
    });

  } catch (error: any) {
    console.error('Share link generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate share link',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to revoke a shareable link
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Check if user is authenticated (admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Revoke share link by disabling it
    const { error } = await supabase
      .from('business_quotes')
      .update({
        share_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Share link revoked successfully'
    });

  } catch (error: any) {
    console.error('Share link revocation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to revoke share link',
        details: error.message
      },
      { status: 500 }
    );
  }
}
