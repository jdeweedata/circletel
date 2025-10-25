import { NextRequest, NextResponse } from 'next/server';
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';
import { otpService } from '@/lib/integrations/clickatell/otp-service';

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

    // Check if there's already a pending OTP
    if (otpService.hasPendingOTP(phone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'An OTP has already been sent. Please wait before requesting a new one.' 
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
    console.error('Error in OTP send route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send OTP' 
      },
      { status: 500 }
    );
  }
}
