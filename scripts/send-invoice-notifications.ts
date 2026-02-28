/**
 * Direct Invoice Notification Script
 * Sends email and SMS for specific invoices using Resend and Clickatell APIs
 *
 * Run with: npx tsx scripts/send-invoice-notifications.ts
 */
import { config } from 'dotenv';
// Load production env vars (pulled from Vercel)
config({ path: '.env.production.local' });
// Also load local overrides
config({ path: '.env.local' });

// Invoice data
const invoices = [
  {
    invoiceId: '8fc309dc-0192-4286-abb9-7a80d2aee71d',
    invoiceNumber: 'INV-2026-00003',
    customer: 'Prins Mhlanga',
    firstName: 'Prins',
    email: 'prins.mhlanga@ocean76.com',
    phone: '0829910287',
    amount: 999.00,
    dueDate: '2026-03-05',
    transactionRef: 'CT-20260227-5a1851c9',
    paynowUrl: 'https://paynow.netcash.co.za/site/paynow.aspx?m1=65251ca3-95d8-47da-bbeb-d7fad8cd9ef1&m2=6940844b-ea39-44a5-b929-427b205e457e&p2=CT-20260227-5a1851c9&p3=CircleTel%20-%20INV-2026-00003&p4=999.00'
  },
  {
    invoiceId: 'b770a33b-14e3-4ec6-8992-440ef12b80a2',
    invoiceNumber: 'INV-2026-00004',
    customer: 'Shaun Robertson',
    firstName: 'Shaun',
    email: 'shaunr07@gmail.com',
    phone: '0826574256',
    amount: 899.00,
    dueDate: '2026-03-05',
    transactionRef: 'CT-20260227-52bd7f62',
    paynowUrl: 'https://paynow.netcash.co.za/site/paynow.aspx?m1=65251ca3-95d8-47da-bbeb-d7fad8cd9ef1&m2=6940844b-ea39-44a5-b929-427b205e457e&p2=CT-20260227-52bd7f62&p3=CircleTel%20-%20INV-2026-00004&p4=899.00'
  }
];

// Short URL for SMS
function getShortUrl(ref: string): string {
  return `https://www.circletel.co.za/api/paynow/${ref}`;
}

// Send Email via Resend
async function sendEmail(invoice: typeof invoices[0]): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'billing@notify.circletel.co.za';

  if (!RESEND_API_KEY) {
    console.error('   ❌ RESEND_API_KEY not configured');
    return false;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CircleTel Invoice</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #F5841E 0%, #FF9F45 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">CircleTel</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your Internet Service Provider</p>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1F2937; margin-top: 0;">Hi ${invoice.firstName},</h2>

    <p style="color: #4B5563; line-height: 1.6;">
      Your invoice <strong>${invoice.invoiceNumber}</strong> for <strong>R${invoice.amount.toFixed(2)}</strong> is ready.
    </p>

    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #6B7280; padding: 8px 0;">Invoice Number:</td>
          <td style="color: #1F2937; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color: #6B7280; padding: 8px 0;">Amount Due:</td>
          <td style="color: #1F2937; font-weight: bold; text-align: right;">R${invoice.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="color: #6B7280; padding: 8px 0;">Due Date:</td>
          <td style="color: #1F2937; font-weight: bold; text-align: right;">${invoice.dueDate}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${invoice.paynowUrl}"
         style="display: inline-block; background: #F5841E; color: white; padding: 14px 32px;
                text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Pay Now
      </a>
    </div>

    <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
      Click the button above to pay securely via NetCash Pay Now.
      We accept card payments, EFT, and instant EFT.
    </p>

    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

    <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
      Questions? Contact us on WhatsApp: 082 487 3900<br>
      CircleTel SA (Pty) Ltd
    </p>
  </div>
</body>
</html>
`;

  const textContent = `
Hi ${invoice.firstName},

Your CircleTel invoice ${invoice.invoiceNumber} for R${invoice.amount.toFixed(2)} is ready.

Invoice: ${invoice.invoiceNumber}
Amount: R${invoice.amount.toFixed(2)}
Due: ${invoice.dueDate}

Pay securely here: ${invoice.paynowUrl}

Questions? WhatsApp: 082 487 3900
CircleTel SA
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `CircleTel <${FROM_EMAIL}>`,
        to: invoice.email,
        subject: `CircleTel Invoice ${invoice.invoiceNumber} - R${invoice.amount.toFixed(2)} Due`,
        html: html,
        text: textContent,
        reply_to: 'contactus@circletel.co.za'
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`   📧 Email sent: ${result.id}`);
      return true;
    } else {
      console.error(`   ❌ Email failed: ${result.message || JSON.stringify(result)}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Email error: ${error}`);
    return false;
  }
}

// Send SMS via Clickatell Platform API v1
async function sendSms(invoice: typeof invoices[0]): Promise<boolean> {
  const CLICKATELL_API_KEY = process.env.CLICKATELL_API_KEY;
  const BASE_URL = process.env.CLICKATELL_BASE_URL || 'https://platform.clickatell.com/v1/message';

  if (!CLICKATELL_API_KEY) {
    console.error('   ❌ CLICKATELL_API_KEY not configured');
    return false;
  }

  // Format phone to international (27...)
  let phone = invoice.phone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '27' + phone.substring(1);
  }

  const shortUrl = getShortUrl(invoice.transactionRef);
  const message = `Hi ${invoice.firstName}, your CircleTel inv ${invoice.invoiceNumber} (R${invoice.amount.toFixed(2)}) is due. Pay: ${shortUrl}`;

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': CLICKATELL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          channel: 'sms',
          to: phone,
          content: message
        }]
      })
    });

    const result = await response.json();

    if (response.ok && result.messages?.[0]?.apiMessageId) {
      console.log(`   📱 SMS sent: ${result.messages[0].apiMessageId}`);
      return true;
    } else {
      const errorMsg = result.error?.description || result.messages?.[0]?.error?.description || JSON.stringify(result);
      console.error(`   ❌ SMS failed: ${errorMsg}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ SMS error: ${error}`);
    return false;
  }
}

// Update invoice with notification timestamps
async function updateInvoice(invoice: typeof invoices[0], emailSent: boolean, smsSent: boolean): Promise<void> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('   ⚠️ Supabase not configured, skipping DB update');
    return;
  }

  const sentVia: string[] = [];
  if (emailSent) sentVia.push('email');
  if (smsSent) sentVia.push('sms');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/customer_invoices?id=eq.${invoice.invoiceId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        paynow_sent_at: new Date().toISOString(),
        paynow_sent_via: sentVia,
        emailed_at: emailSent ? new Date().toISOString() : null
      })
    });

    if (response.ok) {
      console.log(`   ✅ Invoice updated with notification tracking`);
    }
  } catch (error) {
    console.error(`   ⚠️ Failed to update invoice: ${error}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Sending Invoice Notifications\n');
  console.log('=' .repeat(60) + '\n');

  for (const invoice of invoices) {
    console.log(`📄 ${invoice.customer} - ${invoice.invoiceNumber} (R${invoice.amount.toFixed(2)})`);
    console.log(`   Email: ${invoice.email}`);
    console.log(`   Phone: ${invoice.phone}`);
    console.log(`   PayNow: ${getShortUrl(invoice.transactionRef)}`);
    console.log('');

    const emailSent = await sendEmail(invoice);
    const smsSent = await sendSms(invoice);

    await updateInvoice(invoice, emailSent, smsSent);

    console.log('');
    console.log('-'.repeat(60) + '\n');
  }

  console.log('✅ Done!\n');
}

main().catch(console.error);
