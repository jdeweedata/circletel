import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClientWithSession } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

/**
 * POST /api/auth/migrate-email
 *
 * Allows phone-signup users (who have a phantom @phone.circletel.co.za email)
 * to add their real email address. Updates both Supabase Auth and the customers table.
 * Supabase will automatically send a verification email to the new address.
 *
 * Auth: Bearer token required
 * Body: { email: string }
 * Returns: { success, message }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const sessionSupabase = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser(
      authHeader.split(' ')[1]
    );

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 });
    }

    // Only phone-signup users can migrate their email
    if (!user.email?.endsWith('@phone.circletel.co.za')) {
      return NextResponse.json(
        { success: false, error: 'Email migration is only available for phone-signup accounts' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const normalisedEmail = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalisedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email address format' }, { status: 400 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if the new email is already taken by another customer
    const { data: existingCustomer } = await serviceSupabase
      .from('customers')
      .select('id')
      .eq('email', normalisedEmail)
      .neq('auth_user_id', user.id)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'This email address is already associated with another account' },
        { status: 409 }
      );
    }

    // Update Supabase auth user email — Supabase will send a verification email automatically
    const { error: updateAuthError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
      email: normalisedEmail,
      email_confirm: false, // requires verification
    });

    if (updateAuthError) {
      apiLogger.error('[MigrateEmail] Auth email update failed', { error: updateAuthError });
      return NextResponse.json(
        { success: false, error: updateAuthError.message || 'Failed to update email. Please try again.' },
        { status: 500 }
      );
    }

    // Update customers table
    const { error: customerUpdateError } = await serviceSupabase
      .from('customers')
      .update({
        email: normalisedEmail,
        email_verified: false,
      })
      .eq('auth_user_id', user.id);

    if (customerUpdateError) {
      apiLogger.error('[MigrateEmail] Customer email update failed', { error: customerUpdateError });
      // Non-fatal — auth was updated, customers table can be reconciled
    }

    apiLogger.info('[MigrateEmail] Email migrated from phantom to real', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Email updated. Please check your inbox to verify your new email address.',
    });
  } catch (error) {
    apiLogger.error('[MigrateEmail] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
