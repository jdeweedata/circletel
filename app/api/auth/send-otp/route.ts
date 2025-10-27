import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { email, type = 'signup' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        email,
        otp,
        type,
        expires_at: expiresAt.toISOString(),
        verified: false,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to store OTP' },
        { status: 500 }
      );
    }

    // Send OTP email via Resend
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'CircleTel <noreply@circletel.co.za>',
        to: [email],
        subject: 'Your CircleTel Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #F5831F; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">CircleTel</h1>
              </div>

              <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #1F2937; margin-top: 0;">Verify Your Email Address</h2>

                <p style="font-size: 16px; color: #4B5563;">
                  Thank you for signing up with CircleTel! To complete your registration, please use the verification code below:
                </p>

                <div style="background-color: white; border: 2px solid #F5831F; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                  <p style="margin: 0; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                  <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #F5831F; letter-spacing: 8px;">
                    ${otp}
                  </p>
                </div>

                <p style="font-size: 14px; color: #6B7280;">
                  This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                </p>

                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

                <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
                  © ${new Date().getFullYear()} CircleTel. All rights reserved.<br>
                  West House, 7 Autumn Road, Rivonia, Johannesburg, 2128<br>
                  <a href="mailto:contactus@circletel.co.za" style="color: #F5831F; text-decoration: none;">contactus@circletel.co.za</a> |
                  <a href="tel:0870876305" style="color: #F5831F; text-decoration: none;">087 087 6305</a>
                </p>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error('Resend error:', emailError);
        return NextResponse.json(
          { success: false, error: 'Failed to send email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        emailId: emailData?.id,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}