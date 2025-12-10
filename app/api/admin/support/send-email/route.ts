/**
 * Admin Support Email API
 * 
 * Send support emails to customers from the admin panel.
 * 
 * POST /api/admin/support/send-email
 * 
 * Required body:
 * - to: string | string[] - Recipient email(s)
 * - subject: string - Email subject
 * - body: string - Email body (plain text or HTML)
 * 
 * Optional body:
 * - cc: string | string[] - CC recipients
 * - bcc: string | string[] - BCC recipients
 * - isHtml: boolean - Whether body is HTML (default: false, will auto-detect)
 * - replyTo: string - Reply-to address (default: support@circletel.co.za)
 * - fromName: string - Sender name (default: CircleTel Support)
 * - tags: string[] - Email tags for tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM_EMAIL = 'support@circletel.co.za';
const DEFAULT_FROM_NAME = 'CircleTel Support';

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  isHtml?: boolean;
  replyTo?: string;
  fromName?: string;
  tags?: string[];
  // Optional: link to customer/order for logging
  customerId?: string;
  orderId?: string;
  ticketId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, full_name')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate API key
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: SendEmailRequest = await request.json();

    // Validate required fields
    if (!body.to) {
      return NextResponse.json(
        { error: 'Recipient email (to) is required' },
        { status: 400 }
      );
    }

    if (!body.subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!body.body) {
      return NextResponse.json(
        { error: 'Email body is required' },
        { status: 400 }
      );
    }

    // Normalize recipients to arrays
    const toRecipients = Array.isArray(body.to) ? body.to : [body.to];
    const ccRecipients = body.cc ? (Array.isArray(body.cc) ? body.cc : [body.cc]) : undefined;
    const bccRecipients = body.bcc ? (Array.isArray(body.bcc) ? body.bcc : [body.bcc]) : undefined;

    // Auto-detect HTML content
    const isHtml = body.isHtml ?? (body.body.includes('<') && body.body.includes('>'));

    // Build email content
    const fromName = body.fromName || DEFAULT_FROM_NAME;
    const fromEmail = `${fromName} <${DEFAULT_FROM_EMAIL}>`;
    const replyTo = body.replyTo || DEFAULT_FROM_EMAIL;

    // Wrap plain text in basic HTML template if not HTML
    let htmlContent: string;
    let textContent: string;

    if (isHtml) {
      htmlContent = wrapInEmailTemplate(body.body);
      textContent = stripHtml(body.body);
    } else {
      textContent = body.body;
      htmlContent = wrapInEmailTemplate(convertTextToHtml(body.body));
    }

    // Build tags
    const tags = [
      { name: 'type', value: 'support' },
      { name: 'sent_by', value: adminUser.full_name || user.email || 'admin' },
      ...(body.tags || []).map(tag => ({ name: 'custom', value: tag })),
    ];

    if (body.customerId) {
      tags.push({ name: 'customer_id', value: body.customerId });
    }
    if (body.orderId) {
      tags.push({ name: 'order_id', value: body.orderId });
    }

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toRecipients,
        cc: ccRecipients,
        bcc: bccRecipients,
        subject: body.subject,
        html: htmlContent,
        text: textContent,
        reply_to: replyTo,
        tags,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Support Email] Resend API error:', result);
      return NextResponse.json(
        { error: result.message || 'Failed to send email', details: result },
        { status: response.status }
      );
    }

    // Log the email in database for audit trail
    await logSupportEmail(supabase, {
      messageId: result.id,
      to: toRecipients,
      cc: ccRecipients,
      subject: body.subject,
      sentBy: adminUser.id,
      customerId: body.customerId,
      orderId: body.orderId,
      ticketId: body.ticketId,
    });

    console.log(`[Support Email] Sent to ${toRecipients.join(', ')} by ${adminUser.full_name}`);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${toRecipients.join(', ')}`,
      messageId: result.id,
      recipients: {
        to: toRecipients,
        cc: ccRecipients,
        bcc: bccRecipients,
      },
    });

  } catch (error: any) {
    console.error('[Support Email] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Log support email for audit trail
 */
async function logSupportEmail(
  supabase: any,
  data: {
    messageId: string;
    to: string[];
    cc?: string[];
    subject: string;
    sentBy: string;
    customerId?: string;
    orderId?: string;
    ticketId?: string;
  }
) {
  try {
    await supabase.from('support_email_log').insert({
      resend_message_id: data.messageId,
      recipients: data.to,
      cc_recipients: data.cc,
      subject: data.subject,
      sent_by_admin_id: data.sentBy,
      customer_id: data.customerId,
      order_id: data.orderId,
      ticket_id: data.ticketId,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.warn('[Support Email] Failed to log email:', error);
  }
}

/**
 * Wrap content in CircleTel email template
 */
function wrapInEmailTemplate(content: string): string {
  // If content already has full HTML structure, return as-is
  if (content.includes('<!DOCTYPE') || content.includes('<html')) {
    return content;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CircleTel Support</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: #F5831F; padding: 15px 20px; border-radius: 8px 8px 0 0;">
    <img src="https://circletel.co.za/images/circletel-logo-white.png" alt="CircleTel" style="height: 40px; width: auto;" />
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #E6E9EF; border-top: none;">
    ${content}
  </div>
  
  <div style="background-color: #E6E9EF; padding: 20px; text-align: center; font-size: 12px; color: #4B5563; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 10px 0;"><strong>CircleTel (Pty) Ltd</strong></p>
    <p style="margin: 0 0 10px 0;">
      <a href="mailto:support@circletel.co.za" style="color: #F5831F; text-decoration: none;">support@circletel.co.za</a> | 
      0860 CIRCLE (0860 247 253)
    </p>
    <p style="margin: 0;">
      <a href="https://circletel.co.za" style="color: #4B5563;">www.circletel.co.za</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Convert plain text to HTML (preserve line breaks)
 */
function convertTextToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(paragraph => `<p style="margin: 0 0 16px 0;">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * GET - Health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'Support Email API',
    status: RESEND_API_KEY ? 'operational' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
}
