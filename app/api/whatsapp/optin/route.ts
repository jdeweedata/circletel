/**
 * WhatsApp Opt-In API
 *
 * Generates unique opt-in tokens for existing customers.
 * Tokens are sent via SMS and used to confirm WhatsApp consent.
 *
 * Endpoints:
 * - POST /api/whatsapp/optin - Generate opt-in token and send SMS
 * - GET /api/whatsapp/optin?token=xxx - Validate token (for landing page)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';

// =============================================================================
// GENERATE OPT-IN TOKEN (POST)
// =============================================================================

/**
 * Generate an opt-in token for a customer and send via SMS
 *
 * Request body:
 * {
 *   customer_id: string (required)
 *   admin_user_id?: string (for audit trail)
 * }
 *
 * Or for bulk generation:
 * {
 *   customer_ids: string[]
 *   admin_user_id?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, customer_ids, admin_user_id } = body;

    // Validate input
    const ids = customer_ids || (customer_id ? [customer_id] : []);
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'customer_id or customer_ids required' },
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

    const results: Array<{
      customer_id: string;
      success: boolean;
      token?: string;
      error?: string;
    }> = [];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

    for (const customerId of ids) {
      try {
        // Fetch customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id, first_name, phone, whatsapp_consent')
          .eq('id', customerId)
          .single();

        if (customerError || !customer) {
          results.push({
            customer_id: customerId,
            success: false,
            error: 'Customer not found',
          });
          continue;
        }

        // Check if already consented
        if (customer.whatsapp_consent) {
          results.push({
            customer_id: customerId,
            success: false,
            error: 'Already consented to WhatsApp',
          });
          continue;
        }

        // Check if phone exists
        if (!customer.phone) {
          results.push({
            customer_id: customerId,
            success: false,
            error: 'No phone number',
          });
          continue;
        }

        // Generate unique token
        const token = randomBytes(16).toString('hex');

        // Store token
        const { error: tokenError } = await supabase
          .from('whatsapp_optin_tokens')
          .insert({
            customer_id: customerId,
            token,
            phone: customer.phone,
          });

        if (tokenError) {
          // Might be duplicate - delete old token and retry
          await supabase
            .from('whatsapp_optin_tokens')
            .delete()
            .eq('customer_id', customerId)
            .is('used_at', null);

          const { error: retryError } = await supabase
            .from('whatsapp_optin_tokens')
            .insert({
              customer_id: customerId,
              token,
              phone: customer.phone,
            });

          if (retryError) {
            results.push({
              customer_id: customerId,
              success: false,
              error: 'Failed to create token',
            });
            continue;
          }
        }

        // Generate opt-in URL
        const optinUrl = `${baseUrl}/whatsapp/optin/${token}`;

        // Send SMS
        const customerName = customer.first_name || 'Customer';
        const smsText = `Hi ${customerName}, get payment reminders on WhatsApp! Opt in here: ${optinUrl} - CircleTel`;

        const smsResult = await clickatellService.sendSMS({
          to: customer.phone,
          text: smsText,
        });

        if (!smsResult.success) {
          // Clean up token if SMS failed
          await supabase
            .from('whatsapp_optin_tokens')
            .delete()
            .eq('token', token);

          results.push({
            customer_id: customerId,
            success: false,
            error: `SMS failed: ${smsResult.error}`,
          });
          continue;
        }

        results.push({
          customer_id: customerId,
          success: true,
          token,
        });
      } catch (error) {
        results.push({
          customer_id: customerId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log admin action
    if (admin_user_id && results.some(r => r.success)) {
      await supabase.from('whatsapp_consent_audit').insert({
        admin_user_id,
        action: 'optin_sms_sent',
        customer_count: results.filter(r => r.success).length,
        reason: 'SMS opt-in links sent',
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('[WhatsApp Opt-in] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// VALIDATE TOKEN (GET)
// =============================================================================

/**
 * Validate an opt-in token
 * Used by the landing page to check if token is valid before showing form
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

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

    // Find token
    const { data: tokenData, error: tokenError } = await supabase
      .from('whatsapp_optin_tokens')
      .select(`
        id,
        customer_id,
        phone,
        expires_at,
        used_at,
        customers (
          id,
          first_name,
          whatsapp_consent
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Check if already used
    if (tokenData.used_at) {
      return NextResponse.json({
        valid: false,
        error: 'Token already used',
        alreadyOptedIn: true,
      });
    }

    // Check if expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Token expired',
      });
    }

    // Check if customer already consented (via another method)
    const customer = Array.isArray(tokenData.customers)
      ? tokenData.customers[0]
      : tokenData.customers;

    if (customer?.whatsapp_consent) {
      return NextResponse.json({
        valid: false,
        error: 'Already opted in',
        alreadyOptedIn: true,
      });
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      customerName: customer?.first_name || 'Customer',
      phone: tokenData.phone,
      expiresAt: tokenData.expires_at,
    });
  } catch (error) {
    console.error('[WhatsApp Opt-in] Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
