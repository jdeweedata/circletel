/**
 * WhatsApp Opt-In Confirmation API
 *
 * Confirms WhatsApp consent using an opt-in token.
 * Called from the opt-in landing page when user clicks "Confirm".
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Confirm opt-in with token
 *
 * Request body:
 * {
 *   token: string (required)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('whatsapp_optin_tokens')
      .select('id, customer_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Check if already used
    if (tokenData.used_at) {
      return NextResponse.json(
        { error: 'Token already used', alreadyOptedIn: true },
        { status: 400 }
      );
    }

    // Check if expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      );
    }

    // Start transaction-like operations
    const now = new Date().toISOString();

    // 1. Mark token as used
    const { error: markError } = await supabase
      .from('whatsapp_optin_tokens')
      .update({ used_at: now })
      .eq('id', tokenData.id);

    if (markError) {
      console.error('[WhatsApp Opt-in] Failed to mark token:', markError);
      return NextResponse.json(
        { error: 'Failed to process token' },
        { status: 500 }
      );
    }

    // 2. Update customer consent
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        whatsapp_consent: true,
        whatsapp_consent_at: now,
        whatsapp_consent_source: 'sms_optin',
      })
      .eq('id', tokenData.customer_id);

    if (updateError) {
      console.error('[WhatsApp Opt-in] Failed to update customer:', updateError);

      // Rollback token
      await supabase
        .from('whatsapp_optin_tokens')
        .update({ used_at: null })
        .eq('id', tokenData.id);

      return NextResponse.json(
        { error: 'Failed to update consent' },
        { status: 500 }
      );
    }

    // 3. Fetch customer for confirmation
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, phone')
      .eq('id', tokenData.customer_id)
      .single();

    console.log('[WhatsApp Opt-in] Consent confirmed', {
      customerId: tokenData.customer_id,
      phone: customer?.phone,
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp notifications enabled',
      customerName: customer?.first_name || 'Customer',
    });
  } catch (error) {
    console.error('[WhatsApp Opt-in] Confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
