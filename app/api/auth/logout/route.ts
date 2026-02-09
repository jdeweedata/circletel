import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

/**
 * Customer Logout API
 *
 * Handles customer logout:
 * 1. Signs out from Supabase Auth
 * 2. Returns success response
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (optional - for logging purposes)
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      apiLogger.info('Customer logout', { email: user.email });
    }

    // Sign out
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    apiLogger.error('Customer logout error', { error });

    // Still try to sign out even on error
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (signOutError) {
      apiLogger.error('Sign out error', { error: signOutError });
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

// Also support GET for redirect-based logout
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Redirect to home page after logout
    return NextResponse.redirect(new URL('/', request.url));

  } catch (error) {
    apiLogger.error('Customer logout error', { error });
    return NextResponse.redirect(new URL('/', request.url));
  }
}
