/**
 * Send PayNow link and statement to Prins Mhlanga and PA Lara Buzzi
 *
 * Usage: npx ts-node scripts/send-prins-paynow-statement.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables - production.local has API keys
config({ path: resolve(process.cwd(), '.env.production.local') });
config({ path: resolve(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CLICKATELL_API_KEY = process.env.CLICKATELL_API_KEY;

// Recipients
const RECIPIENTS = {
  prins: {
    name: 'Prins Mhlanga',
    email: 'prins.mhlanga@ocean76.com',
    phone: '27829910287', // Formatted for Clickatell
  },
  lara: {
    name: 'Lara Buzzi',
    email: 'lara.buzzi@ocean76.com',
    phone: '27719923974', // Formatted: +27 71 992 3974
  },
};

// Invoice and payment details
const INVOICE = {
  number: 'INV-2026-00003',
  amount: 999.00,
  dueDate: '5 March 2026',
  period: 'March 2026',
  accountNumber: 'CT-2025-00030',
};

const PAYNOW_URL = 'https://paynow.netcash.co.za/site/paynow.aspx?m1=65251ca3-95d8-47da-bbeb-d7fad8cd9ef1&m2=6940844b-ea39-44a5-b929-427b205e457e&p2=CT-20260227-5a1851c9&p3=CircleTel%20-%20INV-2026-00003&p4=999.00';
const SHORT_PAYNOW_URL = 'https://www.circletel.co.za/api/paynow/CT-INV2026-00003-1773319726';

// Statement data
const STATEMENT = {
  invoices: [
    {
      number: 'INV-2026-00001',
      date: '25 January 2026',
      period: 'January 2026',
      amount: 999.00,
      paid: 999.00,
      status: 'PAID (Credit Note Applied)',
      note: 'Zero-rated due to installation delays',
    },
    {
      number: 'INV-2026-00003',
      date: '27 February 2026',
      period: 'March 2026',
      amount: 999.00,
      paid: 0,
      status: 'OUTSTANDING',
      note: 'Payment due via PayNow',
    },
  ],
  creditNotes: [
    {
      number: 'CN-2026-00001',
      date: '12 March 2026',
      amount: 999.00,
      reason: 'January billing waived - installation delays & e-Mandate pending',
      appliedTo: 'INV-2026-00001',
    },
  ],
  totalOutstanding: 999.00,
};

async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel Billing <billing@notify.circletel.co.za>',
        to,
        subject,
        html,
        reply_to: 'contactus@circletel.co.za',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Email failed:', error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Email sent! Message ID: ${result.id}`);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error);
    return false;
  }
}

async function sendSMS(to: string, text: string): Promise<boolean> {
  if (!CLICKATELL_API_KEY) {
    console.error('❌ CLICKATELL_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://platform.clickatell.com/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': CLICKATELL_API_KEY,
      },
      body: JSON.stringify({
        messages: [{ channel: 'sms', to, content: text }],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.messages?.[0]?.error) {
      console.error('❌ SMS failed:', data);
      return false;
    }

    console.log(`✅ SMS sent to ${to}! Message ID: ${data.messages[0].apiMessageId}`);
    return true;
  } catch (error) {
    console.error('❌ SMS error:', error);
    return false;
  }
}

function buildStatementEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Statement - CircleTel</title>
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
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Account Statement</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Dear Prins,
              </p>

              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Please find below your account statement and outstanding invoice. We apologize for any inconvenience caused by the installation delays.
              </p>

              <!-- Account Info -->
              <table role="presentation" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px;">
                    <strong style="color: #1F2937;">Account Number:</strong>
                    <span style="color: #4B5563;">${STATEMENT.invoices[0] ? 'CT-2025-00030' : 'N/A'}</span>
                  </td>
                </tr>
              </table>

              <!-- Invoice Summary -->
              <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #F5831F; padding-bottom: 10px;">
                Invoice Summary
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 12px 10px; text-align: left; color: #6B7280; font-size: 12px; text-transform: uppercase;">Invoice</th>
                    <th style="padding: 12px 10px; text-align: left; color: #6B7280; font-size: 12px; text-transform: uppercase;">Period</th>
                    <th style="padding: 12px 10px; text-align: right; color: #6B7280; font-size: 12px; text-transform: uppercase;">Amount</th>
                    <th style="padding: 12px 10px; text-align: center; color: #6B7280; font-size: 12px; text-transform: uppercase;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #E5E7EB;">
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px;">INV-2026-00001</td>
                    <td style="padding: 12px 10px; color: #4B5563; font-size: 14px;">January 2026</td>
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px; text-align: right;">R 999.00</td>
                    <td style="padding: 12px 10px; text-align: center;">
                      <span style="background-color: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">PAID</span>
                    </td>
                  </tr>
                  <tr style="background-color: #FEF3C7;">
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px; font-weight: bold;">INV-2026-00003</td>
                    <td style="padding: 12px 10px; color: #4B5563; font-size: 14px;">March 2026</td>
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px; text-align: right; font-weight: bold;">R 999.00</td>
                    <td style="padding: 12px 10px; text-align: center;">
                      <span style="background-color: #FEE2E2; color: #991B1B; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">DUE</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Credit Note -->
              <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
                Credit Notes Applied
              </h2>

              <table role="presentation" width="100%" style="background-color: #ECFDF5; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 5px 0; color: #065F46; font-weight: bold;">CN-2026-00001</p>
                    <p style="margin: 0 0 5px 0; color: #047857; font-size: 14px;">Amount: R 999.00 (applied to INV-2026-00001)</p>
                    <p style="margin: 0; color: #6B7280; font-size: 13px; font-style: italic;">
                      Reason: January billing waived due to installation delays and pending e-Mandate setup
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Outstanding Amount -->
              <table role="presentation" width="100%" style="background-color: #1F2937; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 5px 0; color: #9CA3AF; font-size: 14px; text-transform: uppercase;">Total Amount Due</p>
                    <p style="margin: 0; color: #F5831F; font-size: 36px; font-weight: bold;">R 999.00</p>
                  </td>
                </tr>
              </table>

              <!-- Pay Now Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${PAYNOW_URL}" style="display: inline-block; background-color: #F5831F; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none; padding: 18px 60px; border-radius: 8px;">
                      Pay Now - R 999.00
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 15px;">
                    <p style="color: #6B7280; font-size: 13px; margin: 0;">
                      Secure payment via Card, EFT, or Instant EFT
                    </p>
                  </td>
                </tr>
              </table>

              <!-- eMandate Notice -->
              <table role="presentation" width="100%" style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #92400E; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                      ⚠️ New e-Mandate Required
                    </p>
                    <p style="color: #78350F; font-size: 14px; margin: 0 0 15px 0;">
                      We need you to sign a new debit order mandate to enable automatic monthly payments.
                      Our team will send you the e-Mandate link shortly. Once signed, your future payments will be collected automatically.
                    </p>
                    <p style="color: #78350F; font-size: 14px; margin: 0;">
                      In the meantime, please use the Pay Now button above to settle this invoice.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              <p style="color: #6B7280; font-size: 14px; line-height: 22px; margin: 0;">
                If you have any questions about this statement, please contact us:
              </p>
              <ul style="color: #6B7280; font-size: 14px; line-height: 22px; margin: 10px 0 0 0; padding-left: 20px;">
                <li>Email: <a href="mailto:contactus@circletel.co.za" style="color: #F5831F;">contactus@circletel.co.za</a></li>
                <li>WhatsApp: <a href="https://wa.me/27824873900" style="color: #F5831F;">082 487 3900</a></li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 25px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                CircleTel (Pty) Ltd | South Africa<br>
                This is an automated message. Please do not reply directly to this email.
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

async function main() {
  console.log('='.repeat(60));
  console.log('CircleTel - Send Statement & PayNow to Prins Mhlanga');
  console.log('='.repeat(60));
  console.log('');

  // Build email
  const emailHtml = buildStatementEmailHtml();
  const emailSubject = `[ACTION REQUIRED] Account Statement & Payment Due - ${INVOICE.number}`;

  // 1. Send Email to both recipients
  console.log('📧 Sending emails...');
  console.log(`   To: ${RECIPIENTS.prins.email}, ${RECIPIENTS.lara.email}`);

  const emailSent = await sendEmail(
    [RECIPIENTS.prins.email, RECIPIENTS.lara.email],
    emailSubject,
    emailHtml
  );

  // 2. Send SMS to Prins
  console.log('');
  console.log('📱 Sending SMS to Prins...');
  const prinsSmsText = `Hi Prins, your CircleTel invoice ${INVOICE.number} (R${INVOICE.amount.toFixed(2)}) is due. Pay securely: ${SHORT_PAYNOW_URL} - CircleTel`;
  await sendSMS(RECIPIENTS.prins.phone, prinsSmsText);

  // 3. Send SMS to Lara
  console.log('');
  console.log('📱 Sending SMS to Lara (PA)...');
  const laraSmsText = `Hi Lara, Prins Mhlanga's CircleTel inv ${INVOICE.number} (R${INVOICE.amount.toFixed(2)}) needs payment. Pay: ${SHORT_PAYNOW_URL} - CircleTel`;
  await sendSMS(RECIPIENTS.lara.phone, laraSmsText);

  console.log('');
  console.log('='.repeat(60));
  console.log('Done!');
  console.log('');
  console.log('Summary:');
  console.log(`- Email sent to: ${RECIPIENTS.prins.email}, ${RECIPIENTS.lara.email}`);
  console.log(`- SMS sent to Prins: ${RECIPIENTS.prins.phone}`);
  console.log(`- SMS sent to Lara: ${RECIPIENTS.lara.phone}`);
  console.log(`- PayNow URL: ${PAYNOW_URL}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
