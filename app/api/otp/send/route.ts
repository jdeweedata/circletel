import { NextRequest, NextResponse } from 'next/server';
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';
import { otpService } from '@/lib/integrations/clickatell/otp-service';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

// P7: Max OTP sends per phone number within the sliding window
const OTP_RATE_LIMIT_MAX = 3;
const OTP_RATE_LIMIT_WINDOW_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // P7: Server-side rate limit — max 3 OTP sends per phone per 10-minute window
    const supabase = await createClient();
    const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('otp_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('email', phone) // phone stored in the email column
      .gte('created_at', windowStart);

    if (!countError && (count ?? 0) >= OTP_RATE_LIMIT_MAX) {
      apiLogger.warn('[OTP Send] Rate limit exceeded', { phone });
      return NextResponse.json(
        {
          success: false,
          error: `Too many OTP requests. Please wait ${OTP_RATE_LIMIT_WINDOW_MINUTES} minutes before trying again.`,
          retryAfter: OTP_RATE_LIMIT_WINDOW_MINUTES * 60,
        },
        { status: 429 }
      );
    }

    // Check if there's already a pending OTP (60-second per-send cooldown, database-backed for serverless)
    const hasPending = await otpService.hasPendingOTP(phone);
    if (hasPending) {
      return NextResponse.json(
        {
          success: false,
          error: 'An OTP has already been sent. Please wait 60 seconds before requesting a new one.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = otpService.generateOTP();

    // Store OTP
    await otpService.storeOTP(phone, otp);

    // Send OTP via Clickatell
    const result = await clickatellService.sendOTP(phone, otp);

    if (!result.success) {
      // Clear OTP if sending failed
      otpService.clearOTP(phone);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    apiLogger.error('Error in OTP send route', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP'
      },
      { status: 500 }
    );
  }
}
