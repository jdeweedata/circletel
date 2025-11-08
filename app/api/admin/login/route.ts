import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Login API with Audit Logging and Proper Cookie Management
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Login API] ⏱️ Request started');

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
    console.log('[Login API] ⏱️ Request parsed:', Date.now() - startTime, 'ms');

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
    console.log('[Login API] ⏱️ Supabase clients created:', Date.now() - startTime, 'ms');

    // Step 1: Check if user exists in admin_users
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, is_active, role, role_template_id, permissions')
      .eq('email', normalizedEmail)
      .maybeSingle();
    console.log('[Login API] ⏱️ Admin user lookup completed:', Date.now() - startTime, 'ms');

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
    // Add timeout wrapper to fail fast if Supabase Auth is slow
    console.log('[Login API] ⏱️ Starting Supabase Auth...');
    
    const AUTH_TIMEOUT = 10000; // 10 second timeout
    const authPromise = supabaseSSR.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Authentication timeout - Supabase Auth service may be experiencing issues'));
      }, AUTH_TIMEOUT);
    });
    
    let authData, authError;
    try {
      const result = await Promise.race([authPromise, timeoutPromise]);
      authData = result.data;
      authError = result.error;
      console.log('[Login API] ⏱️ Supabase Auth completed:', Date.now() - startTime, 'ms');
    } catch (timeoutError) {
      console.error('[Login API] ❌ Supabase Auth timeout:', Date.now() - startTime, 'ms');
      
      // Log timeout issue
      await supabaseAdmin.from('admin_audit_logs').insert({
        user_email: normalizedEmail,
        admin_user_id: adminUser.id,
        action: 'login_failed_auth_timeout',
        action_category: 'authentication',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { 
          error: timeoutError instanceof Error ? timeoutError.message : 'Unknown timeout error',
          timeout_ms: AUTH_TIMEOUT,
          elapsed_ms: Date.now() - startTime
        },
        status: 'failure',
        severity: 'critical',
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication service is currently slow. Please try again in a few moments.',
          technical_error: 'AUTH_TIMEOUT'
        },
        { status: 503 } // Service Unavailable
      );
    }

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

    console.log('[Login API] ⏱️ Writing audit logs asynchronously...');

    // Write audit logs asynchronously (fire-and-forget) to avoid blocking the response
    // This prevents slow database writes from timing out the login
    Promise.all([
      supabaseAdmin.from('admin_audit_logs').insert({
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
      }),
      supabaseAdmin.from('admin_activity_log').insert({
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
      })
    ]).then(([auditResult, activityResult]) => {
      console.log('[Login API] ⏱️ Audit logs completed (async):', Date.now() - startTime, 'ms');
      if (auditResult.error) console.error('[Login API] Audit log error:', auditResult.error);
      if (activityResult.error) console.error('[Login API] Activity log error:', activityResult.error);
    }).catch(error => {
      console.error('[Login API] Audit logging failed (non-blocking):', error);
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
    console.log('[Login API] ⏱️ Total request time:', Date.now() - startTime, 'ms');

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
