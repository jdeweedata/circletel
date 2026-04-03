import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { otpService } from '@/lib/integrations/clickatell/otp-service';
import { syncCustomerToZohoBilling } from '@/lib/integrations/zoho/customer-sync-service';
import { apiLogger } from '@/lib/logging';

/** Normalise a South African phone number to E.164 format (+27XXXXXXXXX) */
function normaliseSAPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('27') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.length === 9) return `+27${digits}`;
  // Already has + prefix or unknown format — return as-is
  return phone.startsWith('+') ? phone : `+${digits}`;
}

/**
 * POST /api/auth/phone-signup
 *
 * Phantom email pattern: creates a Supabase user with a synthetic email
 * (e.g. 27821234567@phone.circletel.co.za) after Clickatell OTP verification.
 * The phone number is already verified by this point.
 *
 * Body: { phone, otp, firstName?, lastName? }
 * Returns: { success, session: { access_token, refresh_token }, customer, isExistingUser }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, firstName, lastName } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // 1. Confirm phone was recently verified via /api/otp/verify (within last 5 minutes)
    const otpResult = await otpService.verifyRecentlyVerified(phone);
    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error },
        { status: 400 }
      );
    }

    // Normalise phone to international format
    const normalised = normaliseSAPhone(phone);

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Check if a customer already exists with this phone number
    const { data: existingCustomer } = await serviceSupabase
      .from('customers')
      .select('id, auth_user_id, email, first_name, last_name, phone_verified_at')
      .eq('phone', normalised)
      .maybeSingle();

    if (existingCustomer?.auth_user_id) {
      // Returning user: stamp phone_verified_at and sign them back in
      await serviceSupabase
        .from('customers')
        .update({ phone_verified_at: new Date().toISOString() })
        .eq('id', existingCustomer.id);

      // Sign in with their phantom email
      const phantomEmail = `${normalised}@phone.circletel.co.za`;
      // Retrieve the stored password from metadata
      const { data: authUserData } = await serviceSupabase.auth.admin.getUserById(existingCustomer.auth_user_id);
      const storedPassword = authUserData?.user?.user_metadata?.phone_signup_token as string | undefined;

      if (!storedPassword) {
        // Edge case: account exists but token not stored (legacy) — force password reset path
        return NextResponse.json(
          { success: false, error: 'Account found but sign-in token is missing. Please contact support.', code: 'MISSING_TOKEN' },
          { status: 400 }
        );
      }

      const { data: signInData, error: signInError } = await serviceSupabase.auth.signInWithPassword({
        email: phantomEmail,
        password: storedPassword,
      });

      if (signInError || !signInData.session) {
        apiLogger.error('[PhoneSignup] Sign-in failed for existing user', { error: signInError });
        return NextResponse.json(
          { success: false, error: 'Sign-in failed. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        isExistingUser: true,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
        },
        customer: existingCustomer,
      });
    }

    // 3. New user — generate phantom email + one-time password
    const phantomEmail = `${normalised}@phone.circletel.co.za`;
    const signupToken = crypto.randomBytes(32).toString('hex');

    // 4. Create Supabase auth user
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: phantomEmail,
      password: signupToken,
      email_confirm: true,
      phone: normalised,
      phone_confirm: true,
      user_metadata: {
        phone_signup: true,
        phone_signup_token: signupToken, // stored for future sign-ins
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
      },
    });

    if (authError || !authData.user) {
      apiLogger.error('[PhoneSignup] Auth user creation failed', { error: authError });
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    const authUserId = authData.user.id;

    // 5. Create customer record
    const finalFirstName = firstName?.trim() || 'Customer';
    const finalLastName = lastName?.trim() || 'User';

    const { data: customer, error: customerError } = await serviceSupabase
      .from('customers')
      .insert({
        auth_user_id: authUserId,
        first_name: finalFirstName,
        last_name: finalLastName,
        email: phantomEmail,
        phone: normalised,
        account_type: 'personal',
        email_verified: false,
        status: 'active',
        phone_verified_at: new Date().toISOString(),
        metadata: { phone_signup: true },
      })
      .select()
      .single();

    if (customerError || !customer) {
      // Rollback: delete the auth user we just created
      await serviceSupabase.auth.admin.deleteUser(authUserId);
      apiLogger.error('[PhoneSignup] Customer record creation failed', { error: customerError });
      return NextResponse.json(
        { success: false, error: 'Failed to create customer profile. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Async Zoho sync (non-blocking)
    syncCustomerToZohoBilling(customer.id).catch((err) => {
      apiLogger.error('[PhoneSignup] Zoho sync failed', { error: err });
    });

    // 7. Sign in to get session tokens
    const { data: signInData, error: signInError } = await serviceSupabase.auth.signInWithPassword({
      email: phantomEmail,
      password: signupToken,
    });

    if (signInError || !signInData.session) {
      apiLogger.error('[PhoneSignup] Post-creation sign-in failed', { error: signInError });
      return NextResponse.json(
        { success: false, error: 'Account created but sign-in failed. Please try signing in manually.' },
        { status: 500 }
      );
    }

    apiLogger.info('[PhoneSignup] New phone-signup user created', { customerId: customer.id, phone: normalised });

    return NextResponse.json({
      success: true,
      isExistingUser: false,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      customer,
    });
  } catch (error) {
    apiLogger.error('[PhoneSignup] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
