/**
 * Send SMS and Email notification to Shaun Robertson
 * about his debit order scheduled for Dec 4
 *
 * Run with: npx tsx scripts/notify-shaun-debit-order.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Shaun's details
const SHAUN = {
  firstName: 'Shaun',
  lastName: 'Robertson',
  email: 'shaunr07@gmail.com',
  phone: '0826574256',
  invoiceNumber: 'INV-000040',
  amount: 899.00,
  dueDate: '4 December 2025',
};

async function sendSMS() {
  console.log('\n=== Sending SMS ===');

  const apiKey = process.env.CLICKATELL_API_KEY;
  if (!apiKey) {
    console.error('CLICKATELL_API_KEY not configured');
    return false;
  }

  // Format phone to international
  let phone = SHAUN.phone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '27' + phone.substring(1);
  }

  const smsMessage = `Hi ${SHAUN.firstName}, your CircleTel invoice ${SHAUN.invoiceNumber} (R${SHAUN.amount.toFixed(2)}) will be debited on ${SHAUN.dueDate}. Questions? WhatsApp 082 487 3900.`;

  console.log(`To: ${phone}`);
  console.log(`Message: ${smsMessage}`);
  console.log(`Length: ${smsMessage.length} chars`);

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
        }]
      }),
    });

    const data = await response.json();

    if (!response.ok || data.messages?.[0]?.error) {
      console.error('SMS failed:', data);
      return false;
    }

    console.log('SMS sent successfully!');
    console.log('Message ID:', data.messages?.[0]?.apiMessageId);
    return true;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}

async function sendEmail() {
  console.log('\n=== Sending Email ===');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #F5831F; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .amount { font-size: 24px; font-weight: bold; color: #F5831F; }
    .date { font-size: 18px; font-weight: bold; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background: #F5831F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CircleTel</h1>
    </div>
    <div class="content">
      <p>Dear ${SHAUN.firstName},</p>

      <p>This is a friendly reminder that your monthly internet service payment will be collected via debit order.</p>

      <p><strong>Invoice Details:</strong></p>
      <ul>
        <li>Invoice Number: <strong>${SHAUN.invoiceNumber}</strong></li>
        <li>Amount: <span class="amount">R${SHAUN.amount.toFixed(2)}</span></li>
        <li>Debit Date: <span class="date">${SHAUN.dueDate}</span></li>
        <li>Service: SkyFibre Home Plus (100/50 Mbps)</li>
      </ul>

      <p>Please ensure sufficient funds are available in your account on the debit date to avoid any service interruptions.</p>

      <p>If you have any questions or need to update your payment details, please contact us:</p>
      <ul>
        <li>Email: billing@circletel.co.za</li>
        <li>WhatsApp: 082 487 3900</li>
      </ul>

      <p>Thank you for choosing CircleTel!</p>

      <p>Best regards,<br>
      <strong>CircleTel Billing Team</strong></p>
    </div>
    <div class="footer">
      <p>CircleTel (Pty) Ltd | www.circletel.co.za</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  console.log(`To: ${SHAUN.email}`);
  console.log(`Subject: CircleTel Debit Order Notification - ${SHAUN.invoiceNumber}`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'CircleTel <onboarding@resend.dev>',
        to: [SHAUN.email],
        subject: `Debit Order Reminder - ${SHAUN.invoiceNumber} (R${SHAUN.amount.toFixed(2)}) - ${SHAUN.dueDate}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email failed:', data);
      return false;
    }

    console.log('Email sent successfully!');
    console.log('Message ID:', data.id);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

async function main() {
  console.log('===========================================');
  console.log('Notifying Shaun Robertson about Debit Order');
  console.log('===========================================');
  console.log(`Customer: ${SHAUN.firstName} ${SHAUN.lastName}`);
  console.log(`Invoice: ${SHAUN.invoiceNumber}`);
  console.log(`Amount: R${SHAUN.amount.toFixed(2)}`);
  console.log(`Debit Date: ${SHAUN.dueDate}`);

  const smsResult = await sendSMS();
  const emailResult = await sendEmail();

  console.log('\n=== Summary ===');
  console.log(`SMS: ${smsResult ? '✅ Sent' : '❌ Failed'}`);
  console.log(`Email: ${emailResult ? '✅ Sent' : '❌ Failed'}`);

  if (smsResult && emailResult) {
    console.log('\n✅ All notifications sent successfully!');
  } else {
    console.log('\n⚠️ Some notifications failed. Check logs above.');
  }
}

main().catch(console.error);
