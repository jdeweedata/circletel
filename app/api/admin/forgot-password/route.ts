import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin Password Reset Request API
 *
 * Stricter security for admin password resets:
 * 1. Verifies email exists in admin_users table
 * 2. Checks if account is active
 * 3. Logs the password reset request for audit trail
 * 4. Rate limits requests to prevent abuse
 * 5. Sends password reset email via Supabase Auth
 */

// Simple in-memory rate limiting (use Redis in production)
const resetAttempts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3; // Max 3 attempts per 15 minutes

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check
    const now = Date.now();
    const attempts = resetAttempts.get(normalizedEmail);

    const supabase = await createClient();

    if (attempts) {
      // Reset counter if window has passed
      if (now - attempts.timestamp > RATE_LIMIT_WINDOW) {
        resetAttempts.set(normalizedEmail, { count: 1, timestamp: now });
      } else if (attempts.count >= MAX_ATTEMPTS) {
        // Log rate limit violation
        const ipAddress =
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          request.headers.get('x-real-ip') ||
          'unknown';

        await supabase.from('admin_audit_logs').insert({
          user_email: normalizedEmail,
          action: 'password_reset_rate_limited',
          action_category: 'security',
          ip_address: ipAddress,
          user_agent: request.headers.get('user-agent') || 'unknown',
          request_method: 'POST',
          request_path: '/api/admin/forgot-password',
          metadata: { attempts: attempts.count },
          status: 'failure',
          severity: 'high',
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Too many reset attempts. Please try again in 15 minutes.',
          },
          { status: 429 }
        );
      } else {
        attempts.count++;
      }
    } else {
      resetAttempts.set(normalizedEmail, { count: 1, timestamp: now });
    }

    // Step 1: Verify email exists in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, is_active, role, role_template_id')
      .eq('email', normalizedEmail)
      .single();

    if (adminError || !adminUser) {
      // Don't reveal if user exists or not (security best practice)
      // Always return success message
      return NextResponse.json({
        success: true,
        message: 'If an admin account exists with this email, password reset instructions have been sent.',
      });
    }

    // Step 2: Check if account is active
    if (!adminUser.is_active) {
      // Log the attempt for inactive account
      console.warn(`Password reset attempted for inactive admin account: ${normalizedEmail}`);

      // Still return success message (don't reveal account status)
      return NextResponse.json({
        success: true,
        message: 'If an admin account exists with this email, password reset instructions have been sent.',
      });
    }

    // Step 3: Send password reset email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reset-password`,
      }
    );

    if (resetError) {
      console.error('Error sending password reset email:', resetError);

      // Don't expose internal error to user
      return NextResponse.json({
        success: true,
        message: 'If an admin account exists with this email, password reset instructions have been sent.',
      });
    }

    // Step 4: Log the password reset request (audit trail)
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert into audit log table
    await supabase.from('admin_audit_logs').insert({
      user_id: adminUser.id,
      user_email: normalizedEmail,
      admin_user_id: adminUser.id,
      action: 'password_reset_requested',
      action_category: 'password',
      ip_address: ipAddress,
      user_agent: userAgent,
      request_method: 'POST',
      request_path: '/api/admin/forgot-password',
      metadata: {
        email: normalizedEmail,
        role: adminUser.role,
        role_template_id: adminUser.role_template_id,
      },
      status: 'success',
      severity: 'medium',
    });

    console.log(`Password reset requested for admin: ${normalizedEmail} (ID: ${adminUser.id}) from IP: ${ipAddress}`);

    return NextResponse.json({
      success: true,
      message: 'If an admin account exists with this email, password reset instructions have been sent.',
    });

  } catch (error) {
    console.error('Admin password reset error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your request. Please try again later.',
      },
      { status: 500 }
    );
  }
}
