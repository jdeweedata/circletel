import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/server';

/**
 * Get Current Admin User API
 * Returns the current authenticated admin user's details
 */

// Vercel configuration: Ensure function stays alive longer than our timeout
export const runtime = 'nodejs';
export const maxDuration = 10; // Allow up to 10 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Admin Me API] ⏱️ Request started');

  try {
    // Create SSR client with cookies for session management
    const supabaseSSR = await createSSRClient();

    // Get current user from session with timeout protection
    const GET_USER_TIMEOUT = 5000; // 5 second timeout
    const getUserPromise = supabaseSSR.auth.getUser();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Get user timeout - Supabase Auth service may be experiencing issues'));
      }, GET_USER_TIMEOUT);
    });

    let user, authError;
    try {
      const result = await Promise.race([getUserPromise, timeoutPromise]);
      user = result.data.user;
      authError = result.error;
      console.log('[Admin Me API] ⏱️ Auth getUser completed:', Date.now() - startTime, 'ms');
    } catch (timeoutError) {
      console.error('[Admin Me API] ❌ Auth timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication service is currently slow. Please refresh the page.',
          technical_error: 'AUTH_TIMEOUT'
        },
        { status: 503 }
      );
    }

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use service role client to bypass RLS when checking admin_users
    const supabaseAdmin = await createAdminClient();
    console.log('[Admin Me API] ⏱️ Supabase admin client created:', Date.now() - startTime, 'ms');

    // Get admin user by auth user ID
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, is_active, role, role_template_id')
      .eq('id', user.id)
      .maybeSingle();

    console.log('[Admin Me API] ⏱️ Admin user lookup completed:', Date.now() - startTime, 'ms');

    if (adminError || !adminUser) {
      console.error('Admin user fetch error:', adminError?.message || 'User not found in admin_users table');
      return NextResponse.json(
        { success: false, error: 'User not found in admin_users table' },
        { status: 404 }
      );
    }

    if (!adminUser.is_active) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 403 }
      );
    }

    console.log('[Admin Me API] ⏱️ Total request time:', Date.now() - startTime, 'ms');
    console.log(`✅ Admin user verified: ${adminUser.email} (${adminUser.role})`);

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
        role_template_id: adminUser.role_template_id,
      },
    });
  } catch (error) {
    console.error('Get admin user error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while fetching user details.',
      },
      { status: 500 }
    );
  }
}
