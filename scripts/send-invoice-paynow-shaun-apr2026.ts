/**
 * Send April 2026 invoice Pay Now link to Shaun Robertson
 * Invoice: INV-2026-00006 | R899.00 | Due: 2026-04-10
 *
 * Run with: npx tsx scripts/send-invoice-paynow-shaun-apr2026.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production.local' }); // keys like RESEND_API_KEY, CLICKATELL_API_KEY

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONSTANTS
// =============================================================================

const INVOICE = {
  id: '168cd835-5e0d-4a59-bc49-dd218f7e2cb4',
  number: 'INV-2026-00006',
  amount: 899.00,
  dueDate: '10 April 2026',
  period: 'April 2026',
};

const CUSTOMER = {
  firstName: 'Shaun',
  lastName: 'Robertson',
  email: 'shaunr07@gmail.com',
  phone: '0826574256',
  accountNumber: 'CT-2025-00012',
};

const SERVICE = 'SkyFibre Home Plus (100/50 Mbps)';

// NetCash Pay Now keys (from netcash-config.ts)
const NETCASH = {
  serviceKey: process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY || '65251ca3-95d8-47da-bbeb-d7fad8cd9ef1',
  pciVaultKey: process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY || '6940844b-ea39-44a5-b929-427b205e457e',
};

// =============================================================================
// HELPERS
// =============================================================================

function generateTransactionRef(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 10);
  return `CT-${dateStr}-${rand}`;
}

function buildPayNowUrl(transactionRef: string): string {
  const params = new URLSearchParams({
    m1: NETCASH.serviceKey,
    m2: NETCASH.pciVaultKey,
    p2: transactionRef,
    p3: `CircleTel - ${INVOICE.number}`,
    p4: INVOICE.amount.toFixed(2),
    Budget: 'N',
    CustomerEmailAddress: CUSTOMER.email,
    m9: 'https://www.circletel.co.za/api/payments/netcash/redirect',
    m10: 'https://www.circletel.co.za/payment/cancelled',
    m4: transactionRef,
  });
  return `https://paynow.netcash.co.za/site/paynow.aspx?${params.toString()}`;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? '27' + digits.substring(1) : digits;
}

// =============================================================================
// STEP 1: Generate Pay Now URL and update invoice
// =============================================================================

async function generateAndStorePayNowUrl(): Promise<string | null> {
  console.log('\n=== Step 1: Generating Pay Now URL ===');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const transactionRef = generateTransactionRef();
  const paymentUrl = buildPayNowUrl(transactionRef);

  console.log('Transaction Ref:', transactionRef);
  console.log('Pay Now URL:', paymentUrl);

  const { error } = await supabase
    .from('customer_invoices')
    .update({
      paynow_url: paymentUrl,
      paynow_transaction_ref: transactionRef,
      paynow_sent_at: new Date().toISOString(),
      paynow_sent_via: ['email', 'sms'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', INVOICE.id);

  if (error) {
    console.error('❌ Failed to update invoice with Pay Now URL:', error.message);
    return null;
  }

  console.log('✅ Invoice updated with Pay Now URL');
  return paymentUrl;
}

// =============================================================================
// STEP 2: Send Email via Resend
// =============================================================================

async function sendEmail(paymentUrl: string): Promise<boolean> {
  console.log('\n=== Step 2: Sending Email via Resend ===');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not configured');
    return false;
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #F5831F; color: white; padding: 24px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 28px 24px; background: #ffffff; }
    .invoice-box { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .invoice-box table { width: 100%; border-collapse: collapse; }
    .invoice-box td { padding: 6px 0; font-size: 14px; }
    .invoice-box td:last-child { text-align: right; font-weight: 600; }
    .amount-total { font-size: 22px; font-weight: bold; color: #F5831F; }
    .pay-button { display: block; background: #F5831F; color: white !important; text-align: center; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; margin: 24px 0; }
    .alt-link { font-size: 12px; color: #666; word-break: break-all; }
    .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .contact { background: #f8f8f8; padding: 16px; border-radius: 6px; font-size: 13px; }
    .footer { padding: 16px 24px; text-align: center; font-size: 11px; color: #999; background: #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CircleTel</h1>
      <p>Connected South Africa</p>
    </div>

    <div class="content">
      <p>Dear ${CUSTOMER.firstName},</p>

      <p>Your <strong>${INVOICE.period}</strong> invoice is ready. Please make payment by <strong>${INVOICE.dueDate}</strong> to avoid any service interruption.</p>

      <div class="invoice-box">
        <table>
          <tr>
            <td>Invoice Number</td>
            <td>${INVOICE.number}</td>
          </tr>
          <tr>
            <td>Account</td>
            <td>${CUSTOMER.accountNumber}</td>
          </tr>
          <tr>
            <td>Service</td>
            <td>${SERVICE}</td>
          </tr>
          <tr>
            <td>Period</td>
            <td>${INVOICE.period}</td>
          </tr>
          <tr>
            <td>Due Date</td>
            <td>${INVOICE.dueDate}</td>
          </tr>
          <tr>
            <td colspan="2"><hr style="border:none;border-top:1px solid #ddd;margin:8px 0;"></td>
          </tr>
          <tr>
            <td>Amount Due</td>
            <td class="amount-total">R${INVOICE.amount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <a href="${paymentUrl}" class="pay-button">Pay Now — R${INVOICE.amount.toFixed(2)}</a>

      <p class="alt-link">Or copy this link: <a href="${paymentUrl}">${paymentUrl}</a></p>

      <p>You can pay using credit/debit card, EFT, or any of the 20+ payment methods available on the NetCash secure payment page.</p>

      <hr class="divider">

      <div class="contact">
        <strong>Need help?</strong><br>
        📧 <a href="mailto:billing@circletel.co.za">billing@circletel.co.za</a><br>
        💬 WhatsApp: <a href="https://wa.me/27824873900">082 487 3900</a> (Mon–Fri, 8am–5pm)
      </div>

      <p>Thank you for choosing CircleTel!</p>

      <p>Best regards,<br><strong>CircleTel Billing Team</strong></p>
    </div>

    <div class="footer">
      <p>CircleTel (Pty) Ltd | <a href="https://www.circletel.co.za">www.circletel.co.za</a></p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;

  console.log(`To: ${CUSTOMER.email}`);
  console.log(`Subject: Invoice ${INVOICE.number} — R${INVOICE.amount.toFixed(2)} due ${INVOICE.dueDate}`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'CircleTel Billing <billing@notify.circletel.co.za>',
        to: [CUSTOMER.email],
        reply_to: 'billing@circletel.co.za',
        subject: `Invoice ${INVOICE.number} — R${INVOICE.amount.toFixed(2)} due ${INVOICE.dueDate}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.statusCode) {
      console.error('❌ Email failed:', JSON.stringify(data));
      return false;
    }

    console.log('✅ Email sent! Message ID:', data.id);

    // Update invoice emailed_at
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await supabase
      .from('customer_invoices')
      .update({ emailed_at: new Date().toISOString(), email_attempts: 1 })
      .eq('id', INVOICE.id);

    return true;
  } catch (error) {
    console.error('❌ Email error:', error);
    return false;
  }
}

// =============================================================================
// STEP 3: Send SMS via Clickatell
// =============================================================================

async function sendSMS(paymentUrl: string): Promise<boolean> {
  console.log('\n=== Step 3: Sending SMS via Clickatell ===');

  const apiKey = process.env.CLICKATELL_API_KEY;
  if (!apiKey) {
    console.error('❌ CLICKATELL_API_KEY not configured');
    return false;
  }

  const phone = formatPhone(CUSTOMER.phone);

  // Use short redirect URL: /api/paynow/[ref] redirects to full NetCash URL
  // This keeps SMS under 160 chars (single segment)
  const baseUrl = 'https://www.circletel.co.za';
  // Extract the transaction ref from the paymentUrl p2 param
  const p2Match = paymentUrl.match(/p2=([^&]+)/);
  const transactionRef = p2Match ? decodeURIComponent(p2Match[1]) : INVOICE.number;
  const shortUrl = `${baseUrl}/api/paynow/${transactionRef}`;

  const smsMessage = `Hi ${CUSTOMER.firstName}, your CircleTel inv ${INVOICE.number} (R${INVOICE.amount.toFixed(2)}) is due ${INVOICE.dueDate}. Pay: ${shortUrl}`;

  // SMS should be under 160 chars for single segment; log length
  console.log(`To: ${phone}`);
  console.log(`Message (${smsMessage.length} chars): ${smsMessage}`);

  try {
    const response = await fetch('https://platform.clickatell.com/v1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        messages: [{
          channel: 'sms',
          to: phone,
          content: smsMessage,
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.messages?.[0]?.error) {
      console.error('❌ SMS failed:', JSON.stringify(data, null, 2));
      return false;
    }

    const messageId = data.messages?.[0]?.apiMessageId;
    console.log('✅ SMS sent! Message ID:', messageId);
    return true;
  } catch (error) {
    console.error('❌ SMS error:', error);
    return false;
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('============================================');
  console.log('CircleTel — Send Invoice Pay Now Link');
  console.log('============================================');
  console.log(`Customer : ${CUSTOMER.firstName} ${CUSTOMER.lastName} (${CUSTOMER.accountNumber})`);
  console.log(`Invoice  : ${INVOICE.number}`);
  console.log(`Amount   : R${INVOICE.amount.toFixed(2)}`);
  console.log(`Due      : ${INVOICE.dueDate}`);
  console.log(`Period   : ${INVOICE.period}`);

  // Verify env vars
  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
  if (!process.env.CLICKATELL_API_KEY) missing.push('CLICKATELL_API_KEY');

  if (missing.length > 0) {
    console.error('\n❌ Missing env vars:', missing.join(', '));
    process.exit(1);
  }

  // Run steps
  const paymentUrl = await generateAndStorePayNowUrl();
  if (!paymentUrl) {
    console.error('\n❌ Aborting — could not generate Pay Now URL');
    process.exit(1);
  }

  const [emailResult, smsResult] = await Promise.all([
    sendEmail(paymentUrl),
    sendSMS(paymentUrl),
  ]);

  console.log('\n============================================');
  console.log('Summary');
  console.log('============================================');
  console.log(`Pay Now URL : ✅ Generated`);
  console.log(`Email       : ${emailResult ? '✅ Sent' : '❌ Failed'}`);
  console.log(`SMS         : ${smsResult ? '✅ Sent' : '❌ Failed'}`);

  if (paymentUrl && emailResult && smsResult) {
    console.log('\n✅ All done! Shaun will receive email and SMS with Pay Now link.');
  } else {
    console.log('\n⚠️  Completed with some failures. Check logs above.');
    process.exit(1);
  }
}

main().catch(console.error);
