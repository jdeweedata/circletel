/**
 * Test Email Endpoint
 * Send a test email to verify Microsoft 365 deliverability
 * 
 * Usage: POST /api/test-email
 * Body: { "to": "email@example.com" }
 */

import { NextRequest, NextResponse } from 'next/server';

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'CircleTel Notifications <noreply@notify.circletel.co.za>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

/**
 * Generate List-Unsubscribe headers for Microsoft/Gmail compliance
 */
function generateUnsubscribeHeaders(email: string) {
  const encodedEmail = encodeURIComponent(email);
  const token = Buffer.from(`${email}:${Date.now()}`).toString('base64url');
  
  return {
    'List-Unsubscribe': `<${BASE_URL}/unsubscribe?email=${encodedEmail}&token=${token}>, <mailto:unsubscribe@circletel.co.za?subject=Unsubscribe%20${encodedEmail}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const to = body.to || 'jeffrey@newgengroup.co.za';

    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Generate unsubscribe headers for Microsoft compliance
    const unsubscribeHeaders = generateUnsubscribeHeaders(to);

    // Build email HTML with proper structure
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CircleTel Test Email</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #F5831F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">CircleTel Test Email</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #E6E9EF; border-top: none;">
    <h2 style="color: #1F2937; margin-top: 0;">Microsoft 365 Deliverability Test</h2>
    
    <p>This is a test email to verify that CircleTel emails are being delivered correctly to Microsoft 365 accounts.</p>
    
    <div style="background-color: #E6E9EF; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Test Details:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Sent: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</li>
        <li>From: noreply@notify.circletel.co.za</li>
        <li>To: ${to}</li>
        <li>List-Unsubscribe: Enabled</li>
      </ul>
    </div>
    
    <p><strong>What to check:</strong></p>
    <ol>
      <li>Did this email arrive in your Inbox or Junk folder?</li>
      <li>Check the email headers for SPF, DKIM, and DMARC results</li>
      <li>Verify the unsubscribe link appears in your email client</li>
    </ol>
    
    <a href="${BASE_URL}" style="display: inline-block; padding: 12px 24px; background-color: #F5831F; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
      Visit CircleTel
    </a>
    
    <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
      If you received this email in your Junk folder, please mark it as "Not Junk" to help train Microsoft's filters.
    </p>
  </div>
  
  <div style="background-color: #E6E9EF; padding: 20px; text-align: center; font-size: 12px; color: #4B5563; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 10px 0;">CircleTel (Pty) Ltd</p>
    <p style="margin: 0 0 10px 0;">123 Business Street, Johannesburg, South Africa</p>
    <p style="margin: 0 0 10px 0;">
      <a href="mailto:support@circletel.co.za" style="color: #4B5563;">support@circletel.co.za</a> | 
      0860 CIRCLE (0860 247 253)
    </p>
    <p style="margin: 0;">
      <a href="${BASE_URL}/unsubscribe?email=${encodeURIComponent(to)}" style="color: #4B5563;">Unsubscribe from marketing emails</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    // Plain text version
    const text = `
CircleTel Test Email
=====================

Microsoft 365 Deliverability Test

This is a test email to verify that CircleTel emails are being delivered correctly to Microsoft 365 accounts.

Test Details:
- Sent: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
- From: noreply@notify.circletel.co.za
- To: ${to}
- List-Unsubscribe: Enabled

What to check:
1. Did this email arrive in your Inbox or Junk folder?
2. Check the email headers for SPF, DKIM, and DMARC results
3. Verify the unsubscribe link appears in your email client

Visit CircleTel: ${BASE_URL}

---
CircleTel (Pty) Ltd
123 Business Street, Johannesburg, South Africa
support@circletel.co.za | 0860 CIRCLE (0860 247 253)

Unsubscribe: ${BASE_URL}/unsubscribe?email=${encodeURIComponent(to)}
    `.trim();

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: 'CircleTel Test Email - Microsoft 365 Deliverability Check',
        html,
        text,
        reply_to: 'support@circletel.co.za',
        headers: unsubscribeHeaders,
        tags: [
          { name: 'type', value: 'test' },
          { name: 'purpose', value: 'microsoft_deliverability' },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to send email', details: result },
        { status: response.status }
      );
    }

    console.log(`✅ Test email sent to ${to}, Message ID: ${result.id}`);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`,
      message_id: result.id,
      headers_included: Object.keys(unsubscribeHeaders),
    });

  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for easy browser testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to') || 'jeffrey@newgengroup.co.za';
  
  // Create a mock request with the email
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ to }),
  });
  
  return POST(mockRequest);
}
