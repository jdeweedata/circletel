import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin Logout API with Audit Logging
 *
 * Handles admin logout with audit logging:
 * 1. Gets current user info before logout
 * 2. Signs out from Supabase Auth
 * 3. Logs logout action
 * 4. Tracks IP addresses and user agents
 */

export async function POST(request: NextRequest) {
  try {
    // Get IP address and user agent for audit logging
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const supabase = await createClient();

    // Get current user before logout
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get admin user info
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, email, full_name, role, role_template_id')
        .eq('id', user.id)
        .single();

      // Sign out
      await supabase.auth.signOut();

      // Log successful logout
      if (adminUser) {
        await supabase.from('admin_audit_logs').insert({
          user_id: user.id,
          user_email: adminUser.email,
          admin_user_id: adminUser.id,
          action: 'logout_success',
          action_category: 'authentication',
          ip_address: ipAddress,
          user_agent: userAgent,
          request_method: 'POST',
          request_path: '/api/admin/logout',
          metadata: {
            email: adminUser.email,
            role: adminUser.role,
            role_template_id: adminUser.role_template_id,
            full_name: adminUser.full_name,
          },
          status: 'success',
          severity: 'low',
        });

        console.log(`Admin logout successful: ${adminUser.email} from IP: ${ipAddress}`);
      }
    } else {
      // No user session, still sign out to be safe
      await supabase.auth.signOut();
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Admin logout error:', error);

    // Still try to sign out even on error
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Sign out error:', signOutError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during logout',
      },
      { status: 500 }
    );
  }
}
