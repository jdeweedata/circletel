/**
 * API Route: Create Account
 * POST /api/account/create
 * 
 * Handles account creation with Supabase authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { accountFormSchema } from '@/lib/validations/account-schema';
import { ZodError } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend for email
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = accountFormSchema.parse(body);
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', validatedData.email)
      .single();
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false, // Require email verification
      user_metadata: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone,
        account_type: validatedData.accountType,
      },
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }
    
    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone,
        account_type: validatedData.accountType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (profileError) {
      console.error('Profile error:', profileError);
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create profile. Please try again.' },
        { status: 500 }
      );
    }
    
    // Generate email verification token
    const { data: tokenData, error: tokenError } = await supabase.auth.admin
      .generateLink({
        type: 'signup',
        email: validatedData.email,
      });
    
    if (tokenError) {
      console.error('Token error:', tokenError);
    }
    
    // Send verification email
    if (tokenData?.properties?.action_link) {
      try {
        await resend.emails.send({
          from: 'CircleTel <noreply@circletel.co.za>',
          to: validatedData.email,
          subject: 'Verify your CircleTel account',
          html: generateVerificationEmail(
            validatedData.firstName,
            tokenData.properties.action_link
          ),
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    // Log account creation event
    await logEvent({
      event_type: 'account_created',
      user_id: authData.user.id,
      metadata: {
        account_type: validatedData.accountType,
        email: validatedData.email,
      },
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: validatedData.email,
      message: 'Account created successfully. Please check your email to verify your account.',
    });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML email for verification
 */
function generateVerificationEmail(firstName: string, verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .button {
          display: inline-block;
          background: #f97316;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to CircleTel!</h1>
      </div>
      <div class="content">
        <h2>Hi ${firstName},</h2>
        <p>Thank you for choosing CircleTel for your internet services. We're excited to have you on board!</p>
        <p>To complete your account setup and get started, please verify your email address by clicking the button below:</p>
        <div style="text-align: center;">
          <a href="${verificationLink}" class="button">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verificationLink}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you didn't create an account with CircleTel, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} CircleTel. All rights reserved.</p>
        <p>West House, 7 Autumn Road, Rivonia, Johannesburg, 2128</p>
        <p>Need help? Call us at 087 067 6305</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Log event to analytics/database
 */
async function logEvent(event: {
  event_type: string;
  user_id: string;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from('events').insert({
      event_type: event.event_type,
      user_id: event.user_id,
      metadata: event.metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

/**
 * Rate limiting helper (implement with Redis or similar)
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  // TODO: Implement rate limiting
  // For example, using Redis to track requests per IP
  return true;
}
