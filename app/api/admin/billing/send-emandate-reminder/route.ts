/**
 * Send eMandate Reminder Email
 *
 * POST /api/admin/billing/send-emandate-reminder
 *
 * Sends an email reminder to a customer to complete their NetCash eMandate setup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { billingLogger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, customerEmail, customerName } = body;

    if (!customerId && !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Either customerId or customerEmail is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get customer details
    let customer;
    if (customerId) {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .eq('id', customerId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }
      customer = data;
    } else {
      customer = {
        email: customerEmail,
        first_name: customerName || 'Valued Customer',
        last_name: '',
      };
    }

    if (!customer.email) {
      return NextResponse.json(
        { success: false, error: 'Customer has no email address' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const firstName = customer.first_name || 'Valued Customer';

    // Build email HTML
    const emailHtml = buildEmandateReminderEmail(firstName);

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel Billing <billing@notify.circletel.co.za>',
        to: [customer.email],
        subject: 'Action Required: Complete Your Debit Order Setup - CircleTel',
        html: emailHtml,
        tags: [
          { name: 'type', value: 'emandate-reminder' },
          { name: 'customer', value: customer.id || 'manual' },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      billingLogger.error('eMandate reminder email failed', {
        email: customer.email,
        error: errorData,
      });
      return NextResponse.json(
        { success: false, error: errorData.message || `HTTP ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    billingLogger.info('eMandate reminder email sent', {
      email: customer.email,
      messageId: data.id,
    });

    return NextResponse.json({
      success: true,
      messageId: data.id,
      sentTo: customer.email,
    });

  } catch (error) {
    billingLogger.error('eMandate reminder error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildEmandateReminderEmail(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Debit Order - CircleTel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #F5831F; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CircleTel</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 22px;">Complete Your Debit Order Setup</h2>

              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi ${firstName},
              </p>

              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                We noticed that your debit order authorization is still pending. Setting up a debit order means you'll never have to worry about missing a payment - we'll automatically collect your monthly bill on your billing date.
              </p>

              <!-- Benefits Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #92400E; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                      Why Set Up a Debit Order?
                    </p>
                    <ul style="color: #78350F; font-size: 14px; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Never miss a payment</li>
                      <li style="margin-bottom: 8px;">Avoid service interruptions</li>
                      <li style="margin-bottom: 8px;">No manual payment hassle each month</li>
                      <li>Secure bank-level encryption via NetCash</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://www.circletel.co.za/dashboard/billing/setup-debit-order" style="display: inline-block; background-color: #F5831F; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none; padding: 16px 48px; border-radius: 8px;">Complete Debit Order Setup</a>
                  </td>
                </tr>
              </table>

              <p style="color: #6B7280; font-size: 14px; line-height: 20px; margin: 30px 0 0 0; text-align: center;">
                This process takes less than 2 minutes and is completely secure via NetCash.
              </p>

              <!-- How It Works -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 30px;">
                <tr>
                  <td>
                    <p style="color: #1F2937; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">
                      How It Works:
                    </p>
                    <ol style="color: #4B5563; font-size: 14px; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Click the button above to go to your billing dashboard</li>
                      <li style="margin-bottom: 8px;">Select "Set Up Debit Order"</li>
                      <li style="margin-bottom: 8px;">Enter your bank details securely via NetCash</li>
                      <li>Confirm the mandate - that's it!</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center;">
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">
                Questions? Contact us at <a href="mailto:support@circletel.co.za" style="color: #F5831F;">support@circletel.co.za</a>
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                CircleTel (Pty) Ltd | South Africa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
