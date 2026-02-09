import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/integrations/clickatell/otp-service';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

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

    // Verify OTP
    const result = await otpService.verifyOTP(phone, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Update customer record with phone verification timestamp
    // This enables phone as a secondary authentication factor
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('customers')
      .update({ phone_verified_at: new Date().toISOString() })
      .eq('phone', phone);

    if (updateError) {
      apiLogger.error('[OTP Verify] Failed to update phone_verified_at', { error: updateError });
      // Non-blocking - continue with success since OTP was verified
    } else {
      apiLogger.info('[OTP Verify] Phone verified and customer record updated', { phone });
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      phoneVerified: true,
    });
  } catch (error) {
    apiLogger.error('Error in OTP verify route', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP'
      },
      { status: 500 }
    );
  }
}
