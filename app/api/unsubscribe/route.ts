/**
 * Marketing Email Unsubscribe API
 * 
 * Endpoints:
 * - GET /api/unsubscribe?email=xxx&token=xxx - Get preferences by email or token
 * - POST /api/unsubscribe - Update preferences or unsubscribe
 * 
 * Note: This only affects marketing emails. Transactional emails
 * (invoices, service notifications, account alerts) will still be sent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Use service role for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetPreferencesSchema = z.object({
  email: z.string().email().optional(),
  token: z.string().uuid().optional(),
}).refine(data => data.email || data.token, {
  message: 'Either email or token is required',
});

const UpdatePreferencesSchema = z.object({
  email: z.string().email(),
  token: z.string().uuid().optional().nullable(),
  promotional_emails: z.boolean().optional(),
  newsletter_emails: z.boolean().optional(),
  product_updates: z.boolean().optional(),
  partner_offers: z.boolean().optional(),
  unsubscribe_all: z.boolean().optional(),
  unsubscribe_reason: z.string().max(500).optional().nullable(),
});

// ============================================================================
// TYPES
// ============================================================================

interface MarketingPreferences {
  id: string;
  email: string;
  customer_id: string | null;
  promotional_emails: boolean;
  newsletter_emails: boolean;
  product_updates: boolean;
  partner_offers: boolean;
  unsubscribed_all: boolean;
  unsubscribe_token: string;
  unsubscribe_reason: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GET /api/unsubscribe
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || undefined;
    const token = searchParams.get('token') || undefined;

    // Validate input - need at least email or token
    if (!email && !token) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters. Provide email or token.' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailValidation = z.string().email().safeParse(email);
      if (!emailValidation.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format.' },
          { status: 400 }
        );
      }
    }

    // Validate token format if provided
    if (token) {
      const tokenValidation = z.string().uuid().safeParse(token);
      if (!tokenValidation.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid token format.' },
          { status: 400 }
        );
      }
    }

    // Build query
    let query = supabase
      .from('marketing_email_preferences')
      .select('*');

    if (token) {
      query = query.eq('unsubscribe_token', token);
    } else if (email) {
      query = query.eq('email', email.toLowerCase());
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, return defaults
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          email: email || null,
          promotional_emails: true,
          newsletter_emails: true,
          product_updates: true,
          partner_offers: false,
          unsubscribed_all: false,
          exists: false,
        },
      });
    }

    // Return preferences (hide internal fields)
    return NextResponse.json({
      success: true,
      data: {
        email: data.email,
        promotional_emails: data.promotional_emails,
        newsletter_emails: data.newsletter_emails,
        product_updates: data.product_updates,
        partner_offers: data.partner_offers,
        unsubscribed_all: data.unsubscribed_all,
        unsubscribed_at: data.unsubscribed_at,
        exists: true,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/unsubscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/unsubscribe
// Supports both:
// 1. Regular preference updates (JSON body)
// 2. RFC 8058 One-Click Unsubscribe (form-urlencoded body with List-Unsubscribe=One-Click)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle RFC 8058 One-Click Unsubscribe (from email headers)
    // Microsoft and Gmail send: Content-Type: application/x-www-form-urlencoded
    // Body: List-Unsubscribe=One-Click
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.text();
      const params = new URLSearchParams(formData);
      
      // Check for one-click unsubscribe
      if (params.get('List-Unsubscribe') === 'One-Click') {
        // Get email from URL params (set in List-Unsubscribe header)
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        
        if (!email) {
          return NextResponse.json(
            { success: false, error: 'Email required for one-click unsubscribe' },
            { status: 400 }
          );
        }
        
        const normalizedEmail = email.toLowerCase();
        
        // Check if preferences exist
        const { data: existing } = await supabase
          .from('marketing_email_preferences')
          .select('id')
          .eq('email', normalizedEmail)
          .single();
        
        if (existing) {
          // Update existing
          await supabase
            .from('marketing_email_preferences')
            .update({
              unsubscribed_all: true,
              unsubscribed_at: new Date().toISOString(),
              unsubscribe_reason: 'One-Click Unsubscribe from email header',
            })
            .eq('id', existing.id);
        } else {
          // Create new with unsubscribed
          await supabase
            .from('marketing_email_preferences')
            .insert({
              email: normalizedEmail,
              promotional_emails: false,
              newsletter_emails: false,
              product_updates: false,
              partner_offers: false,
              unsubscribed_all: true,
              unsubscribed_at: new Date().toISOString(),
              unsubscribe_reason: 'One-Click Unsubscribe from email header',
            });
        }
        
        console.log(`[One-Click Unsubscribe] Successfully unsubscribed: ${normalizedEmail}`);
        
        // Return 200 OK for one-click unsubscribe (RFC 8058 requirement)
        return NextResponse.json({
          success: true,
          message: 'Successfully unsubscribed',
        });
      }
    }
    
    // Regular JSON preference update
    const body = await request.json();
    
    console.log('[Unsubscribe API] POST body:', JSON.stringify(body, null, 2));
    
    // Validate input
    const validation = UpdatePreferencesSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Unsubscribe API] Validation failed:', validation.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      email,
      token,
      promotional_emails,
      newsletter_emails,
      product_updates,
      partner_offers,
      unsubscribe_all,
      unsubscribe_reason,
    } = validation.data;

    const normalizedEmail = email.toLowerCase();

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('marketing_email_preferences')
      .select('id, unsubscribe_token')
      .eq('email', normalizedEmail)
      .single();

    // If token provided, verify it matches
    if (token && existing && existing.unsubscribe_token !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid unsubscribe token' },
        { status: 403 }
      );
    }

    // Try to link to customer if exists
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    // Build update/insert data
    const preferencesData: Record<string, unknown> = {
      email: normalizedEmail,
      customer_id: customer?.id || null,
    };

    // Only update fields that were provided
    if (promotional_emails !== undefined) {
      preferencesData.promotional_emails = promotional_emails;
    }
    if (newsletter_emails !== undefined) {
      preferencesData.newsletter_emails = newsletter_emails;
    }
    if (product_updates !== undefined) {
      preferencesData.product_updates = product_updates;
    }
    if (partner_offers !== undefined) {
      preferencesData.partner_offers = partner_offers;
    }
    if (unsubscribe_all !== undefined) {
      preferencesData.unsubscribed_all = unsubscribe_all;
      if (unsubscribe_all) {
        preferencesData.unsubscribed_at = new Date().toISOString();
      }
    }
    if (unsubscribe_reason !== undefined) {
      preferencesData.unsubscribe_reason = unsubscribe_reason;
    }

    let result;

    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('marketing_email_preferences')
        .update(preferencesData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update preferences' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Insert new preferences
      const { data, error } = await supabase
        .from('marketing_email_preferences')
        .insert({
          ...preferencesData,
          promotional_emails: promotional_emails ?? true,
          newsletter_emails: newsletter_emails ?? true,
          product_updates: product_updates ?? true,
          partner_offers: partner_offers ?? false,
          unsubscribed_all: unsubscribe_all ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating preferences:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save preferences' },
          { status: 500 }
        );
      }
      result = data;
    }

    // Determine response message
    let message = 'Preferences updated successfully';
    if (unsubscribe_all) {
      message = 'You have been unsubscribed from all marketing emails. You will still receive important service notifications and invoices.';
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        email: result.email,
        promotional_emails: result.promotional_emails,
        newsletter_emails: result.newsletter_emails,
        product_updates: result.product_updates,
        partner_offers: result.partner_offers,
        unsubscribed_all: result.unsubscribed_all,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/unsubscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
