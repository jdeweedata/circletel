import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Login API with Audit Logging and Proper Cookie Management
 */

export async function POST(request: NextRequest) {
  // Store cookies that will be set by Supabase SSR client
  const cookiesToSet: Array<{ name: string; value: string; options?: any }> = [];

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get IP address and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create TWO Supabase clients:
    // 1. SSR client for authentication (manages cookies)
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = request.cookies.getAll();
            console.log('[Login API] Cookies from request count:', cookies.length);
            return cookies;
          },
          setAll(cookies) {
            console.log('[Login API] Capturing cookies to set, count:', cookies.length);
            if (cookies.length > 0) {
              console.log('[Login API] First cookie name:', cookies[0].name);
            }
            // Store cookies to be set on final response
            cookiesToSet.push(...cookies);
          },
        },
      }
    );

    // 2. Service role client for admin_users check (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Step 1: Check if user exists in admin_users
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, is_active, role, role_template_id, permissions')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (adminError || !adminUser) {
      await supabaseAdmin.from('admin_audit_logs').insert({
        user_email: normalizedEmail,
        action: 'login_failed_not_admin',
        action_category: 'authentication',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { error: 'User not found in admin_users table' },
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
      await supabaseAdmin.from('admin_audit_logs').insert({
        user_email: normalizedEmail,
        admin_user_id: adminUser.id,
        action: 'login_failed_inactive_account',
        action_category: 'authentication',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { error: 'Account is inactive' },
        status: 'failure',
        severity: 'medium',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 3: Authenticate with Supabase Auth using SSR client
    // This will automatically set the session cookies in the response
    const { data: authData, error: authError } = await supabaseSSR.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError || !authData.user) {
      await supabaseAdmin.from('admin_audit_logs').insert({
        user_email: normalizedEmail,
        admin_user_id: adminUser.id,
        action: 'login_failed',
        action_category: 'authentication',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { error: authError?.message || 'Authentication failed' },
        status: 'failure',
        severity: 'medium',
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Step 4: Log successful login with detailed session info
    const loginMetadata = {
      email: normalizedEmail,
      role: adminUser.role,
      role_template_id: adminUser.role_template_id,
      full_name: adminUser.full_name,
      session_id: authData.session?.access_token?.substring(0, 20) + '...', // Partial token for tracking
      expires_at: authData.session?.expires_at,
      login_timestamp: new Date().toISOString(),
      user_agent_details: {
        raw: userAgent,
        // Parse basic user agent info
        browser: userAgent.includes('Chrome') ? 'Chrome' : 
                 userAgent.includes('Firefox') ? 'Firefox' : 
                 userAgent.includes('Safari') ? 'Safari' : 'Other',
        os: userAgent.includes('Windows') ? 'Windows' : 
            userAgent.includes('Mac') ? 'MacOS' : 
            userAgent.includes('Linux') ? 'Linux' : 'Other',
        device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
      },
      ip_info: {
        address: ipAddress,
        is_local: ipAddress === 'unknown' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress === '::1' || ipAddress === '127.0.0.1'
      }
    };

    await supabaseAdmin.from('admin_audit_logs').insert({
      user_id: authData.user.id,
      user_email: normalizedEmail,
      admin_user_id: adminUser.id,
      action: 'login_success',
      action_category: 'authentication',
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: loginMetadata,
      status: 'success',
      severity: 'low',
    });

    // Also log to admin_activity_log for historical tracking
    await supabaseAdmin.from('admin_activity_log').insert({
      admin_user_id: adminUser.id,
      action: 'admin_login',
      resource_type: 'authentication',
      resource_id: authData.session?.access_token?.substring(0, 10),
      details: {
        timestamp: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        session_expires: authData.session?.expires_at
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });

    console.log(`✅ Admin login successful: ${normalizedEmail} (${adminUser.role}) from IP: ${ipAddress}`);

    // Create success response and set all cookies captured from Supabase SSR client
    const successResponse = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
        role_template_id: adminUser.role_template_id,
        permissions: adminUser.permissions || {},
        is_active: adminUser.is_active,
      },
    });

    // Set all auth cookies on the response
    cookiesToSet.forEach(({ name, value, options }) => {
      successResponse.cookies.set(name, value, options);
    });

    console.log('[Login API] Final response cookie count:', cookiesToSet.length);

    return successResponse;
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
