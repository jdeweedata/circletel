import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Login API with Audit Logging
 *
 * Handles admin authentication with comprehensive audit logging:
 * 1. Checks if user exists in admin_users table (bypasses RLS with service role)
 * 2. Validates account is active
 * 3. Authenticates credentials via Supabase Auth
 * 4. Logs all login attempts (success and failure)
 * 5. Tracks IP addresses and user agents
 */

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get IP address and user agent for audit logging
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const supabase = await createClient();

    // Step 1: Check if user exists in admin_users (using service role to bypass RLS)
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, is_active, role, role_template_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // If user doesn't exist in admin_users, don't even try to authenticate
    if (adminError || !adminUser) {
      // Log failed attempt (not an admin user)
      await supabase.from('admin_audit_logs').insert({
        user_email: normalizedEmail,
        action: 'login_failed_not_admin',
        action_category: 'authentication',
        ip_address: ipAddress,
        user_agent: userAgent,
        request_method: 'POST',
        request_path: '/api/admin/login',
        metadata: {
          error: 'User not found in admin_users table',
          email: normalizedEmail,
        },
        status: 'failure',
        severity: 'high',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 2: Check if account is active
    if (!adminUser.is_active) {
      // Log inactive account login attempt
      await supabase.from('admin_audit_logs').insert({
        user_email: normalizedEmail,
        admin_user_id: adminUser.id,
        action: 'login_failed_inactive_account',
        action_category: 'authentication',
        ip_address: ipAddress,
        user_agent: userAgent,
        request_method: 'POST',
        request_path: '/api/admin/login',
        metadata: {
          error: 'Account is inactive',
          email: normalizedEmail,
          role: adminUser.role,
        },
        status: 'failure',
        severity: 'medium',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 3: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError || !authData.user) {
      // Log failed login attempt
      await supabase.from('admin_audit_logs').insert({
        user_email: normalizedEmail,
        admin_user_id: adminUser.id,
        action: 'login_failed',
        action_category: 'authentication',
        ip_address: ipAddress,
        user_agent: userAgent,
        request_method: 'POST',
        request_path: '/api/admin/login',
        metadata: {
          error: authError?.message || 'Authentication failed',
          email: normalizedEmail,
        },
        status: 'failure',
        severity: 'medium',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 4: Log successful login
    await supabase.from('admin_audit_logs').insert({
      user_id: authData.user.id,
      user_email: normalizedEmail,
      admin_user_id: adminUser.id,
      action: 'login_success',
      action_category: 'authentication',
      ip_address: ipAddress,
      user_agent: userAgent,
      request_method: 'POST',
      request_path: '/api/admin/login',
      metadata: {
        email: normalizedEmail,
        role: adminUser.role,
        role_template_id: adminUser.role_template_id,
        full_name: adminUser.full_name,
      },
      status: 'success',
      severity: 'low',
    });

    console.log(`Admin login successful: ${normalizedEmail} (${adminUser.role}) from IP: ${ipAddress}`);

    // Create response with session cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
        role_template_id: adminUser.role_template_id,
      },
    });

    // Set session cookies manually so middleware can read them
    if (authData.session) {
      // Set access token cookie
      response.cookies.set({
        name: `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('://')[1].split('.')[0]}-auth-token`,
        value: JSON.stringify({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
          expires_in: authData.session.expires_in,
          token_type: authData.session.token_type,
          user: authData.session.user,
        }),
        path: '/',
        sameSite: 'lax',
        httpOnly: false, // Must be false so client can read it
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;

  } catch (error) {
    console.error('Admin login error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during login. Please try again later.',
      },
      { status: 500 }
    );
  }
}
