import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Get Current Admin User API
 * Returns the current authenticated admin user's details
 */

export async function GET(request: NextRequest) {
  try {
    // Create SSR client to get session from cookies
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No need to set cookies for GET request
          },
        },
      }
    );

    // Get current session
    const { data: { session }, error: sessionError } = await supabaseSSR.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use service role client to fetch admin user (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Get admin user by auth user ID
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, is_active, role, role_template_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (adminError || !adminUser) {
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
