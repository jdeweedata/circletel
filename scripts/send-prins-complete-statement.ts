/**
 * Send Complete Statement with PayNow links to Prins, Lara, and Jeffrey
 *
 * Invoice Summary:
 * - INV-2026-00001: January 2026 - R999.00 - PAID (Credit Note Applied)
 * - INV-2026-00005: February 2026 - R999.00 - OUTSTANDING
 * - INV-2026-00003: March 2026 - R999.00 - OUTSTANDING
 *
 * Total Outstanding: R1,998.00
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.production.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CLICKATELL_API_KEY = process.env.CLICKATELL_API_KEY;

// Netcash credentials
const NETCASH_SERVICE_KEY = '65251ca3-95d8-47da-bbeb-d7fad8cd9ef1';
const NETCASH_PCI_VAULT_KEY = '6940844b-ea39-44a5-b929-427b205e457e';

// PayNow URLs
const PAYNOW_FEB = `https://paynow.netcash.co.za/site/paynow.aspx?m1=${NETCASH_SERVICE_KEY}&m2=${NETCASH_PCI_VAULT_KEY}&p2=CT-INV2026-00005-1773320769&p3=CircleTel%20-%20INV-2026-00005&p4=999.00`;
const PAYNOW_MAR = `https://paynow.netcash.co.za/site/paynow.aspx?m1=${NETCASH_SERVICE_KEY}&m2=${NETCASH_PCI_VAULT_KEY}&p2=CT-INV2026-00003-1773319726&p3=CircleTel%20-%20INV-2026-00003&p4=999.00`;

// Short URLs for SMS
const SHORT_URL_FEB = 'https://www.circletel.co.za/api/paynow/CT-INV2026-00005-1773320769';
const SHORT_URL_MAR = 'https://www.circletel.co.za/api/paynow/CT-INV2026-00003-1773319726';

// Recipients
const RECIPIENTS = {
  prins: { name: 'Prins Mhlanga', email: 'prins.mhlanga@ocean76.com', phone: '27829910287' },
  lara: { name: 'Lara Buzzi', email: 'lara.buzzi@ocean76.com', phone: '27719923974' },
  jeffrey: { name: 'Jeffrey de Wee', email: 'jeffrey.de.wee@circletel.co.za', phone: null },
};

function buildCompleteStatementHtml(): string {
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
        <table role="presentation" width="650" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #F5831F; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">CircleTel</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Account Statement</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 35px;">

              <!-- Greeting -->
              <p style="color: #1F2937; font-size: 18px; line-height: 28px; margin: 0 0 15px 0;">
                Dear Prins,
              </p>
              <p style="color: #4B5563; font-size: 16px; line-height: 26px; margin: 0 0 25px 0;">
                Please find your complete account statement below. We apologize for any inconvenience caused by installation delays and billing system maintenance.
              </p>

              <!-- Account Details Box -->
              <table role="presentation" width="100%" style="background: linear-gradient(135deg, #1F2937 0%, #374151 100%); border-radius: 10px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="width: 50%;">
                          <p style="margin: 0 0 5px 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Account Number</p>
                          <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">CT-2025-00030</p>
                        </td>
                        <td style="width: 50%; text-align: right;">
                          <p style="margin: 0 0 5px 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Statement Date</p>
                          <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">12 March 2026</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Invoice Table -->
              <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 3px solid #F5831F;">
                Invoice Summary
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 14px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Invoice #</th>
                    <th style="padding: 14px 12px; text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Period</th>
                    <th style="padding: 14px 12px; text-align: right; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Amount</th>
                    <th style="padding: 14px 12px; text-align: center; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Status</th>
                    <th style="padding: 14px 12px; text-align: center; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- January - PAID -->
                  <tr style="border-bottom: 1px solid #E5E7EB;">
                    <td style="padding: 16px 12px; color: #1F2937; font-size: 14px; font-weight: 500;">INV-2026-00001</td>
                    <td style="padding: 16px 12px; color: #4B5563; font-size: 14px;">Jan 2026</td>
                    <td style="padding: 16px 12px; color: #1F2937; font-size: 14px; text-align: right;">R 999.00</td>
                    <td style="padding: 16px 12px; text-align: center;">
                      <span style="background-color: #D1FAE5; color: #065F46; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">PAID</span>
                    </td>
                    <td style="padding: 16px 12px; text-align: center; color: #9CA3AF; font-size: 12px;">Credit Applied</td>
                  </tr>
                  <!-- February - DUE -->
                  <tr style="background-color: #FEF3C7; border-bottom: 1px solid #FCD34D;">
                    <td style="padding: 16px 12px; color: #1F2937; font-size: 14px; font-weight: 700;">INV-2026-00005</td>
                    <td style="padding: 16px 12px; color: #92400E; font-size: 14px; font-weight: 600;">Feb 2026</td>
                    <td style="padding: 16px 12px; color: #92400E; font-size: 14px; text-align: right; font-weight: 700;">R 999.00</td>
                    <td style="padding: 16px 12px; text-align: center;">
                      <span style="background-color: #FEE2E2; color: #991B1B; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">DUE</span>
                    </td>
                    <td style="padding: 16px 12px; text-align: center;">
                      <a href="${PAYNOW_FEB}" style="background-color: #F5831F; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-block;">PAY NOW</a>
                    </td>
                  </tr>
                  <!-- March - DUE -->
                  <tr style="background-color: #FEF3C7;">
                    <td style="padding: 16px 12px; color: #1F2937; font-size: 14px; font-weight: 700;">INV-2026-00003</td>
                    <td style="padding: 16px 12px; color: #92400E; font-size: 14px; font-weight: 600;">Mar 2026</td>
                    <td style="padding: 16px 12px; color: #92400E; font-size: 14px; text-align: right; font-weight: 700;">R 999.00</td>
                    <td style="padding: 16px 12px; text-align: center;">
                      <span style="background-color: #FEE2E2; color: #991B1B; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">DUE</span>
                    </td>
                    <td style="padding: 16px 12px; text-align: center;">
                      <a href="${PAYNOW_MAR}" style="background-color: #F5831F; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-block;">PAY NOW</a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Credit Note Section -->
              <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 3px solid #10B981;">
                Credits Applied
              </h2>

              <table role="presentation" width="100%" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0 0 8px 0; color: #065F46; font-weight: 700; font-size: 16px;">CN-2026-00001</p>
                          <p style="margin: 0 0 5px 0; color: #047857; font-size: 14px;">
                            <strong>Amount:</strong> R 999.00 &nbsp;|&nbsp; <strong>Applied to:</strong> INV-2026-00001
                          </p>
                          <p style="margin: 0; color: #6B7280; font-size: 13px; font-style: italic;">
                            Reason: January 2026 billing waived due to installation delays and pending e-Mandate setup
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Total Outstanding Box -->
              <table role="presentation" width="100%" style="background: linear-gradient(135deg, #1F2937 0%, #374151 100%); border-radius: 10px; margin-bottom: 35px;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Total Amount Due</p>
                    <p style="margin: 0; color: #F5831F; font-size: 48px; font-weight: 800; letter-spacing: -1px;">R 1,998.00</p>
                    <p style="margin: 10px 0 0 0; color: #9CA3AF; font-size: 13px;">(February R999 + March R999)</p>
                  </td>
                </tr>
              </table>

              <!-- Payment Options -->
              <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 20px 0; text-align: center;">
                Choose Your Payment
              </h2>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 35px;">
                <tr>
                  <td style="width: 48%; vertical-align: top;">
                    <table role="presentation" width="100%" style="background-color: #FFF7ED; border: 2px solid #F5831F; border-radius: 10px;">
                      <tr>
                        <td style="padding: 25px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #9A3412; font-size: 12px; text-transform: uppercase; font-weight: 600;">February 2026</p>
                          <p style="margin: 0 0 15px 0; color: #1F2937; font-size: 28px; font-weight: 800;">R 999.00</p>
                          <a href="${PAYNOW_FEB}" style="display: block; background-color: #F5831F; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 8px;">Pay February</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="width: 4%;"></td>
                  <td style="width: 48%; vertical-align: top;">
                    <table role="presentation" width="100%" style="background-color: #FFF7ED; border: 2px solid #F5831F; border-radius: 10px;">
                      <tr>
                        <td style="padding: 25px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #9A3412; font-size: 12px; text-transform: uppercase; font-weight: 600;">March 2026</p>
                          <p style="margin: 0 0 15px 0; color: #1F2937; font-size: 28px; font-weight: 800;">R 999.00</p>
                          <a href="${PAYNOW_MAR}" style="display: block; background-color: #F5831F; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 20px; border-radius: 8px;">Pay March</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #6B7280; font-size: 13px; text-align: center; margin: 0 0 30px 0;">
                Secure payment via Card, EFT, or Instant EFT powered by Netcash
              </p>

              <!-- eMandate Notice -->
              <table role="presentation" width="100%" style="background-color: #FEF3C7; border: 2px solid #F59E0B; border-radius: 10px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="color: #92400E; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
                      ⚠️ New e-Mandate Required
                    </p>
                    <p style="color: #78350F; font-size: 14px; line-height: 22px; margin: 0 0 15px 0;">
                      To enable automatic monthly debit order payments, we need you to sign a new e-Mandate authorization. Our team will send you the e-Mandate link shortly.
                    </p>
                    <p style="color: #78350F; font-size: 14px; line-height: 22px; margin: 0;">
                      <strong>In the meantime, please use the Pay Now buttons above to settle your outstanding invoices.</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Contact Section -->
              <table role="presentation" width="100%" style="background-color: #F9FAFB; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #1F2937; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Need Help?</p>
                    <p style="color: #4B5563; font-size: 14px; line-height: 22px; margin: 0;">
                      📧 Email: <a href="mailto:contactus@circletel.co.za" style="color: #F5831F; text-decoration: none;">contactus@circletel.co.za</a><br>
                      💬 WhatsApp: <a href="https://wa.me/27824873900" style="color: #F5831F; text-decoration: none;">082 487 3900</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1F2937; padding: 25px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 5px 0;">
                CircleTel (Pty) Ltd | South Africa
              </p>
              <p style="color: #6B7280; font-size: 11px; margin: 0;">
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

async function sendEmail(to: string[], subject: string, html: string): Promise<{ success: boolean; messageId?: string }> {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    return { success: false };
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
      return { success: false };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false };
  }
}

async function sendSMS(to: string, text: string): Promise<{ success: boolean; messageId?: string }> {
  if (!CLICKATELL_API_KEY) {
    console.error('❌ CLICKATELL_API_KEY not configured');
    return { success: false };
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
      return { success: false };
    }

    return { success: true, messageId: data.messages[0].apiMessageId };
  } catch (error) {
    console.error('❌ SMS error:', error);
    return { success: false };
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  CircleTel - Complete Statement & PayNow for Prins Mhlanga');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Account: CT-2025-00030 (Prins Mhlanga)');
  console.log('');
  console.log('INVOICES:');
  console.log('  INV-2026-00001  January 2026   R 999.00   PAID (Credit Note Applied)');
  console.log('  INV-2026-00005  February 2026  R 999.00   DUE');
  console.log('  INV-2026-00003  March 2026     R 999.00   DUE');
  console.log('');
  console.log('CREDIT NOTES:');
  console.log('  CN-2026-00001   R 999.00 applied to INV-2026-00001');
  console.log('');
  console.log('TOTAL OUTSTANDING: R 1,998.00');
  console.log('─'.repeat(70));
  console.log('');

  const emailHtml = buildCompleteStatementHtml();
  const emailSubject = '[ACTION REQUIRED] Account Statement - R1,998.00 Outstanding (Feb + Mar 2026)';

  // 1. Send Email to Prins and Lara
  console.log('📧 Sending email to Prins and Lara...');
  const customerEmail = await sendEmail(
    [RECIPIENTS.prins.email, RECIPIENTS.lara.email],
    emailSubject,
    emailHtml
  );
  if (customerEmail.success) {
    console.log(`   ✅ Sent to: ${RECIPIENTS.prins.email}, ${RECIPIENTS.lara.email}`);
    console.log(`   Message ID: ${customerEmail.messageId}`);
  }

  // 2. Send Email to Jeffrey (copy)
  console.log('');
  console.log('📧 Sending copy to Jeffrey...');
  const jeffreyEmail = await sendEmail(
    [RECIPIENTS.jeffrey.email],
    `[FWD] ${emailSubject}`,
    emailHtml
  );
  if (jeffreyEmail.success) {
    console.log(`   ✅ Sent to: ${RECIPIENTS.jeffrey.email}`);
    console.log(`   Message ID: ${jeffreyEmail.messageId}`);
  }

  // 3. Send SMS to Prins
  console.log('');
  console.log('📱 Sending SMS to Prins...');
  const prinsSmsText = `Hi Prins, 2 CircleTel invoices due (R1,998). Feb: ${SHORT_URL_FEB} Mar: ${SHORT_URL_MAR} - CircleTel`;
  const prinsSms = await sendSMS(RECIPIENTS.prins.phone, prinsSmsText);
  if (prinsSms.success) {
    console.log(`   ✅ Sent to: ${RECIPIENTS.prins.phone}`);
    console.log(`   Message ID: ${prinsSms.messageId}`);
  }

  // 4. Send SMS to Lara
  console.log('');
  console.log('📱 Sending SMS to Lara (PA)...');
  const laraSmsText = `Hi Lara, Prins has 2 CircleTel invoices due (R1,998). Feb: ${SHORT_URL_FEB} Mar: ${SHORT_URL_MAR} - CircleTel`;
  const laraSms = await sendSMS(RECIPIENTS.lara.phone, laraSmsText);
  if (laraSms.success) {
    console.log(`   ✅ Sent to: ${RECIPIENTS.lara.phone}`);
    console.log(`   Message ID: ${laraSms.messageId}`);
  }

  console.log('');
  console.log('═'.repeat(70));
  console.log('  SUMMARY');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Emails sent to:');
  console.log(`  • ${RECIPIENTS.prins.email}`);
  console.log(`  • ${RECIPIENTS.lara.email}`);
  console.log(`  • ${RECIPIENTS.jeffrey.email} (copy)`);
  console.log('');
  console.log('SMS sent to:');
  console.log(`  • Prins: ${RECIPIENTS.prins.phone}`);
  console.log(`  • Lara: ${RECIPIENTS.lara.phone}`);
  console.log('');
  console.log('PayNow Links:');
  console.log(`  February: ${SHORT_URL_FEB}`);
  console.log(`  March: ${SHORT_URL_MAR}`);
  console.log('');
  console.log('═'.repeat(70));
}

main().catch(console.error);
