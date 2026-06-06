import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/integrations/clickatell/otp-service';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

/**
 * Mobile OTP login — session bridge.
 *
 * Clickatell delivers + verifies the SMS OTP, but it cannot create a Supabase
 * session on its own. This route runs server-side with the service role:
 *   1. Verifies (and consumes) the Clickatell OTP exactly once.
 *   2. Resolves the auth-linked customer for the phone number.
 *   3. Mints a Supabase magic-link token for that customer's email and returns
 *      its `token_hash`, which the browser exchanges via `verifyOtp` to obtain
 *      a real session (same localStorage session the password login produces).
 *
 * The OTP is verified ONLY here — the client must not pre-verify it, otherwise
 * the single-use code is consumed and this call fails with "No OTP found".
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // 1. Verify + consume the Clickatell OTP (single source of verification)
    const verify = await otpService.verifyOTP(phone, otp);
    if (!verify.success) {
      return NextResponse.json(
        { success: false, error: verify.error || 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    const supabase = await createClient(); // service role

    // Record phone verification (non-blocking, mirrors the old verify route)
    supabase
      .from('customers')
      .update({ phone_verified_at: new Date().toISOString() })
      .eq('phone', phone)
      .then(({ error }) => {
        if (error) apiLogger.error('[OTP Login] phone_verified_at update failed', { error });
      });

    // 2. Resolve the auth-linked customer for this phone. Phone is NOT unique in
    //    `customers`, so we only consider rows with an auth user and refuse to
    //    guess when more than one matches.
    const { data: customers, error: custErr } = await supabase
      .from('customers')
      .select('email, auth_user_id, created_at')
      .eq('phone', phone)
      .not('auth_user_id', 'is', null)
      .order('created_at', { ascending: false });

    if (custErr) {
      apiLogger.error('[OTP Login] customer lookup failed', { error: custErr });
      return NextResponse.json(
        { success: false, error: 'Could not sign you in. Please try again.' },
        { status: 500 }
      );
    }

    const linked = (customers ?? []).filter((c) => c.email);

    if (linked.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No account found with this phone number. Please create an account first.' },
        { status: 404 }
      );
    }

    if (linked.length > 1) {
      // Safety: never guess which account to sign into.
      return NextResponse.json(
        {
          success: false,
          error: 'This number is linked to multiple accounts. Please sign in with your email and password.',
        },
        { status: 409 }
      );
    }

    const email = linked[0].email as string;

    // 3. Mint a magic-link token for that email; the browser exchanges its hash.
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    const tokenHash = linkData?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      apiLogger.error('[OTP Login] generateLink failed', { error: linkErr });
      return NextResponse.json(
        { success: false, error: 'Could not start your session. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tokenHash, email });
  } catch (error) {
    apiLogger.error('[OTP Login] route error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}
