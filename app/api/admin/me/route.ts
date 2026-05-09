import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Get Current Admin User API
 * Returns the current authenticated admin user's details
 */

// Vercel configuration: Ensure function stays alive longer than our timeout
export const runtime = 'nodejs';
export const maxDuration = 10; // Allow up to 10 seconds

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const startTime = Date.now();
  console.log('[Admin Me API] ⏱️ Request started');

  try {
    const supabase = await createClient();
    console.log('[Admin Me API] ⏱️ Supabase client created:', Date.now() - startTime, 'ms');

    // Get admin user details
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, is_active, role, role_template_id')
      .eq('id', authResult.user.id)
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
