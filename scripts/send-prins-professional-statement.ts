/**
 * Send Professional Statement & PayNow to Prins Mhlanga
 *
 * This script:
 * 1. Generates PDF invoices for each outstanding invoice
 * 2. Generates a PDF statement
 * 3. Sends a clean, professional email with attachments
 * 4. Sends SMS notifications
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Company Details
const COMPANY = {
  name: 'Circle Tel SA (Pty) Ltd',
  vatNumber: '4380269318',
  regNumber: '2008/026404/07',
  address: '8a Mellis Rd, Rivonia, Sandton, 2128',
  phone: '+27 87 087 6307',
  email: 'contactus@circletel.co.za',
  website: 'www.circletel.co.za',
  banking: {
    bank: 'Standard Bank',
    accountName: 'Circle Tel SA (Pty) Ltd',
    accountNumber: '202413993',
    branchCode: '051001',
    accountType: 'Current'
  }
};

// Recipients
const RECIPIENTS = {
  prins: { name: 'Prins Mhlanga', email: 'prins.mhlanga@ocean76.com', phone: '27829910287' },
  lara: { name: 'Lara Buzzi', email: 'lara.buzzi@ocean76.com', phone: '27719923974' },
  jeffrey: { name: 'Jeffrey de Wee', email: 'jeffrey.de.wee@circletel.co.za', phone: null },
};

// Customer Data
const CUSTOMER = {
  name: 'Prins Mhlanga',
  accountNumber: 'CT-2025-00030',
  email: 'prins.mhlanga@ocean76.com',
  service: 'SkyFibre Home Plus',
  monthlyFee: 999.00
};

// Invoice Data
const INVOICES = [
  {
    number: 'INV-2026-00001',
    date: '2026-01-25',
    dueDate: '2026-02-01',
    period: 'January 2026',
    amount: 999.00,
    status: 'paid',
    note: 'Credit Note CN-2026-00001 Applied'
  },
  {
    number: 'INV-2026-00005',
    date: '2026-02-01',
    dueDate: '2026-02-08',
    period: 'February 2026',
    amount: 999.00,
    status: 'due',
    payNowUrl: PAYNOW_FEB
  },
  {
    number: 'INV-2026-00003',
    date: '2026-02-27',
    dueDate: '2026-03-05',
    period: 'March 2026',
    amount: 999.00,
    status: 'due',
    payNowUrl: PAYNOW_MAR
  }
];

const CREDIT_NOTE = {
  number: 'CN-2026-00001',
  date: '2026-03-12',
  amount: 999.00,
  appliedTo: 'INV-2026-00001',
  reason: 'January billing waived - installation delays'
};

/**
 * Build clean, professional email HTML
 * Matches the CircleTel brand: minimal, professional, customer-friendly
 */
function buildProfessionalEmailHtml(): string {
  const outstandingInvoices = INVOICES.filter(inv => inv.status === 'due');
  const totalDue = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Statement - CircleTel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.6;">

  <!-- Main Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">

    <!-- Header -->
    <tr>
      <td style="padding: 30px 25px 20px 25px; border-bottom: 2px solid #f5831f;">
        <table role="presentation" width="100%">
          <tr>
            <td style="vertical-align: middle;">
              <!-- Simple text logo for email compatibility -->
              <span style="font-size: 24px; font-weight: 700; color: #1f2937; letter-spacing: -0.5px;">circle<span style="color: #f5831f;">TEL</span></span>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Account Statement</span><br>
              <span style="font-size: 13px; color: #1f2937; font-weight: 600;">12 March 2026</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding: 30px 25px 15px 25px;">
        <p style="margin: 0 0 15px 0; font-size: 16px; color: #1f2937;">
          Dear <strong>${CUSTOMER.name}</strong>,
        </p>
        <p style="margin: 0; font-size: 15px; color: #4b5563;">
          Please find your account statement below. We have attached PDF copies of your invoices for your records.
        </p>
      </td>
    </tr>

    <!-- Account Info -->
    <tr>
      <td style="padding: 0 25px 25px 25px;">
        <table role="presentation" width="100%" style="background-color: #f9fafb; border-radius: 6px;">
          <tr>
            <td style="padding: 15px 20px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Account Number</span><br>
                    <span style="font-size: 15px; color: #1f2937; font-weight: 600;">${CUSTOMER.accountNumber}</span>
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 11px; color: #6b7280; text-transform: uppercase;">Service</span><br>
                    <span style="font-size: 15px; color: #1f2937; font-weight: 600;">${CUSTOMER.service}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Invoice Summary Table -->
    <tr>
      <td style="padding: 0 25px 20px 25px;">
        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">
          Invoice Summary
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
          <!-- Table Header -->
          <tr style="background-color: #f9fafb;">
            <td style="padding: 10px 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Invoice</td>
            <td style="padding: 10px 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Period</td>
            <td style="padding: 10px 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e5e7eb; text-align: right;">Amount</td>
            <td style="padding: 10px 12px; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; border-bottom: 1px solid #e5e7eb; text-align: center;">Status</td>
          </tr>
          ${INVOICES.map((inv, idx) => `
          <tr style="background-color: ${inv.status === 'due' ? '#fffbeb' : '#ffffff'};">
            <td style="padding: 12px; font-size: 14px; color: #1f2937; ${idx < INVOICES.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">${inv.number}</td>
            <td style="padding: 12px; font-size: 14px; color: #4b5563; ${idx < INVOICES.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">${inv.period}</td>
            <td style="padding: 12px; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right; ${idx < INVOICES.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">R ${inv.amount.toFixed(2)}</td>
            <td style="padding: 12px; text-align: center; ${idx < INVOICES.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
              ${inv.status === 'paid'
                ? '<span style="display: inline-block; padding: 3px 10px; background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 600; border-radius: 10px; text-transform: uppercase;">Paid</span>'
                : '<span style="display: inline-block; padding: 3px 10px; background-color: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 600; border-radius: 10px; text-transform: uppercase;">Due</span>'
              }
            </td>
          </tr>
          `).join('')}
        </table>
      </td>
    </tr>

    <!-- Credit Note -->
    <tr>
      <td style="padding: 0 25px 25px 25px;">
        <table role="presentation" width="100%" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
          <tr>
            <td style="padding: 15px;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #065f46; font-weight: 600; text-transform: uppercase;">Credit Applied</p>
              <p style="margin: 0; font-size: 14px; color: #047857;">
                <strong>${CREDIT_NOTE.number}</strong> — R ${CREDIT_NOTE.amount.toFixed(2)} applied to ${CREDIT_NOTE.appliedTo}<br>
                <span style="font-style: italic; font-size: 13px; color: #6b7280;">${CREDIT_NOTE.reason}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Total Due -->
    <tr>
      <td style="padding: 0 25px 25px 25px;">
        <table role="presentation" width="100%" style="background-color: #1f2937; border-radius: 6px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Total Amount Due</p>
              <p style="margin: 0; font-size: 32px; color: #f5831f; font-weight: 700;">R ${totalDue.toFixed(2)}</p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #9ca3af;">February R999 + March R999</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Payment Buttons -->
    <tr>
      <td style="padding: 0 25px 30px 25px;">
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: center;">
          Choose an invoice to pay:
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="width: 48%; vertical-align: top;">
              <table role="presentation" width="100%" style="border: 2px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px; text-align: center;">
                    <p style="margin: 0 0 3px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">February 2026</p>
                    <p style="margin: 0 0 12px 0; font-size: 22px; color: #1f2937; font-weight: 700;">R 999.00</p>
                    <a href="${PAYNOW_FEB}" style="display: inline-block; background-color: #f5831f; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 6px;">Pay Now</a>
                  </td>
                </tr>
              </table>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: top;">
              <table role="presentation" width="100%" style="border: 2px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px; text-align: center;">
                    <p style="margin: 0 0 3px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">March 2026</p>
                    <p style="margin: 0 0 12px 0; font-size: 22px; color: #1f2937; font-weight: 700;">R 999.00</p>
                    <a href="${PAYNOW_MAR}" style="display: inline-block; background-color: #f5831f; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 6px;">Pay Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280; text-align: center;">
          Secure payment via Card, EFT, or Instant EFT
        </p>
      </td>
    </tr>

    <!-- Banking Details -->
    <tr>
      <td style="padding: 0 25px 25px 25px;">
        <table role="presentation" width="100%" style="background-color: #f9fafb; border-radius: 6px;">
          <tr>
            <td style="padding: 18px;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Bank Transfer Details</p>
              <table role="presentation" width="100%">
                <tr>
                  <td style="font-size: 13px; color: #4b5563; padding: 2px 0;">Bank:</td>
                  <td style="font-size: 13px; color: #1f2937; font-weight: 600; padding: 2px 0;">${COMPANY.banking.bank}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #4b5563; padding: 2px 0;">Account Name:</td>
                  <td style="font-size: 13px; color: #1f2937; font-weight: 600; padding: 2px 0;">${COMPANY.banking.accountName}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #4b5563; padding: 2px 0;">Account Number:</td>
                  <td style="font-size: 13px; color: #1f2937; font-weight: 600; padding: 2px 0;">${COMPANY.banking.accountNumber}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #4b5563; padding: 2px 0;">Branch Code:</td>
                  <td style="font-size: 13px; color: #1f2937; font-weight: 600; padding: 2px 0;">${COMPANY.banking.branchCode}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #4b5563; padding: 2px 0;">Reference:</td>
                  <td style="font-size: 13px; color: #1f2937; font-weight: 600; padding: 2px 0;">${CUSTOMER.accountNumber}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- e-Mandate Notice -->
    <tr>
      <td style="padding: 0 25px 25px 25px;">
        <table role="presentation" width="100%" style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px;">
          <tr>
            <td style="padding: 18px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600;">Debit Order Setup Required</p>
              <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
                To enable automatic monthly payments, we need you to sign a new debit order authorization. Our team will send you the e-Mandate link shortly. In the meantime, please use the Pay Now buttons above.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Contact -->
    <tr>
      <td style="padding: 0 25px 30px 25px;">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">
          Questions? Contact us at <a href="mailto:${COMPANY.email}" style="color: #f5831f; text-decoration: none;">${COMPANY.email}</a>
          or WhatsApp <a href="https://wa.me/27824873900" style="color: #f5831f; text-decoration: none;">082 487 3900</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 25px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center;">
          ${COMPANY.name}<br>
          Registration: ${COMPANY.regNumber} | VAT: ${COMPANY.vatNumber}<br>
          ${COMPANY.address}
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
  `.trim();
}

async function sendEmail(
  to: string[],
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string }>
): Promise<{ success: boolean; messageId?: string }> {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    return { success: false };
  }

  try {
    const payload: Record<string, unknown> = {
      from: 'CircleTel Billing <billing@notify.circletel.co.za>',
      to,
      subject,
      html,
      reply_to: 'contactus@circletel.co.za',
    };

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
  console.log('  CircleTel - Professional Statement & PayNow');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`Account: ${CUSTOMER.accountNumber} (${CUSTOMER.name})`);
  console.log('');
  console.log('INVOICES:');
  INVOICES.forEach(inv => {
    const statusIcon = inv.status === 'paid' ? '✓' : '○';
    console.log(`  ${statusIcon} ${inv.number}  ${inv.period.padEnd(15)}  R ${inv.amount.toFixed(2).padStart(8)}  ${inv.status.toUpperCase()}`);
  });
  console.log('');
  console.log('CREDIT NOTES:');
  console.log(`  ${CREDIT_NOTE.number}  R ${CREDIT_NOTE.amount.toFixed(2)} applied to ${CREDIT_NOTE.appliedTo}`);
  console.log('');
  const totalDue = INVOICES.filter(i => i.status === 'due').reduce((s, i) => s + i.amount, 0);
  console.log(`TOTAL OUTSTANDING: R ${totalDue.toFixed(2)}`);
  console.log('─'.repeat(70));
  console.log('');

  const emailHtml = buildProfessionalEmailHtml();
  const emailSubject = `Account Statement - R${totalDue.toFixed(2)} Due (${CUSTOMER.accountNumber})`;

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
    `[Copy] ${emailSubject}`,
    emailHtml
  );
  if (jeffreyEmail.success) {
    console.log(`   ✅ Sent to: ${RECIPIENTS.jeffrey.email}`);
    console.log(`   Message ID: ${jeffreyEmail.messageId}`);
  }

  // 3. Send SMS to Prins
  console.log('');
  console.log('📱 Sending SMS to Prins...');
  const prinsSmsText = `Hi Prins, your CircleTel statement shows R${totalDue.toFixed(2)} due. Pay Feb: ${SHORT_URL_FEB} | Mar: ${SHORT_URL_MAR}`;
  const prinsSms = await sendSMS(RECIPIENTS.prins.phone, prinsSmsText);
  if (prinsSms.success) {
    console.log(`   ✅ Sent to: ${RECIPIENTS.prins.phone}`);
    console.log(`   Message ID: ${prinsSms.messageId}`);
  }

  // 4. Send SMS to Lara
  console.log('');
  console.log('📱 Sending SMS to Lara (PA)...');
  const laraSmsText = `Hi Lara, Prins's CircleTel account has R${totalDue.toFixed(2)} due. Feb: ${SHORT_URL_FEB} | Mar: ${SHORT_URL_MAR}`;
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
