import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.production.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const PAYNOW_URL = 'https://paynow.netcash.co.za/site/paynow.aspx?m1=65251ca3-95d8-47da-bbeb-d7fad8cd9ef1&m2=6940844b-ea39-44a5-b929-427b205e457e&p2=CT-20260227-5a1851c9&p3=CircleTel%20-%20INV-2026-00003&p4=999.00';

const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #F5831F; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CircleTel</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Account Statement</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">Dear Prins,</p>
              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Please find below your account statement and outstanding invoice. We apologize for any inconvenience caused by the installation delays.
              </p>
              <table role="presentation" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 25px;">
                <tr><td style="padding: 15px;"><strong style="color: #1F2937;">Account Number:</strong> <span style="color: #4B5563;">CT-2025-00030</span></td></tr>
              </table>
              <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #F5831F; padding-bottom: 10px;">Invoice Summary</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 12px 10px; text-align: left; color: #6B7280; font-size: 12px;">INVOICE</th>
                    <th style="padding: 12px 10px; text-align: left; color: #6B7280; font-size: 12px;">PERIOD</th>
                    <th style="padding: 12px 10px; text-align: right; color: #6B7280; font-size: 12px;">AMOUNT</th>
                    <th style="padding: 12px 10px; text-align: center; color: #6B7280; font-size: 12px;">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #E5E7EB;">
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px;">INV-2026-00001</td>
                    <td style="padding: 12px 10px; color: #4B5563; font-size: 14px;">January 2026</td>
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px; text-align: right;">R 999.00</td>
                    <td style="padding: 12px 10px; text-align: center;"><span style="background-color: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">PAID</span></td>
                  </tr>
                  <tr style="background-color: #FEF3C7;">
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px; font-weight: bold;">INV-2026-00003</td>
                    <td style="padding: 12px 10px; color: #4B5563; font-size: 14px;">March 2026</td>
                    <td style="padding: 12px 10px; color: #1F2937; font-size: 14px; text-align: right; font-weight: bold;">R 999.00</td>
                    <td style="padding: 12px 10px; text-align: center;"><span style="background-color: #FEE2E2; color: #991B1B; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">DUE</span></td>
                  </tr>
                </tbody>
              </table>
              <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #10B981; padding-bottom: 10px;">Credit Notes Applied</h2>
              <table role="presentation" width="100%" style="background-color: #ECFDF5; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 5px 0; color: #065F46; font-weight: bold;">CN-2026-00001</p>
                    <p style="margin: 0 0 5px 0; color: #047857; font-size: 14px;">Amount: R 999.00 (applied to INV-2026-00001)</p>
                    <p style="margin: 0; color: #6B7280; font-size: 13px; font-style: italic;">Reason: January billing waived due to installation delays and pending e-Mandate setup</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" style="background-color: #1F2937; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 5px 0; color: #9CA3AF; font-size: 14px; text-transform: uppercase;">Total Amount Due</p>
                    <p style="margin: 0; color: #F5831F; font-size: 36px; font-weight: bold;">R 999.00</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${PAYNOW_URL}" style="display: inline-block; background-color: #F5831F; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none; padding: 18px 60px; border-radius: 8px;">Pay Now - R 999.00</a>
                  </td>
                </tr>
                <tr><td style="text-align: center; padding-top: 15px;"><p style="color: #6B7280; font-size: 13px; margin: 0;">Secure payment via Card, EFT, or Instant EFT</p></td></tr>
              </table>
              <table role="presentation" width="100%" style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #92400E; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">New e-Mandate Required</p>
                    <p style="color: #78350F; font-size: 14px; margin: 0 0 15px 0;">We need you to sign a new debit order mandate to enable automatic monthly payments. Our team will send you the e-Mandate link shortly.</p>
                    <p style="color: #78350F; font-size: 14px; margin: 0;">In the meantime, please use the Pay Now button above to settle this invoice.</p>
                  </td>
                </tr>
              </table>
              <p style="color: #6B7280; font-size: 14px; line-height: 22px; margin: 0;">Questions? Contact us:</p>
              <ul style="color: #6B7280; font-size: 14px; line-height: 22px; margin: 10px 0 0 0; padding-left: 20px;">
                <li>Email: <a href="mailto:contactus@circletel.co.za" style="color: #F5831F;">contactus@circletel.co.za</a></li>
                <li>WhatsApp: <a href="https://wa.me/27824873900" style="color: #F5831F;">082 487 3900</a></li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 25px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">CircleTel (Pty) Ltd | South Africa</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

async function main() {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CircleTel Billing <billing@notify.circletel.co.za>',
      to: ['jeffrey.de.wee@circletel.co.za'],
      subject: '[FWD] Account Statement & Payment Due - INV-2026-00003 (Prins Mhlanga)',
      html: emailHtml,
      reply_to: 'contactus@circletel.co.za',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed:', error);
    return;
  }

  const result = await response.json();
  console.log('✅ Email sent to jeffrey.de.wee@circletel.co.za');
  console.log('Message ID:', result.id);
}

main().catch(console.error);
