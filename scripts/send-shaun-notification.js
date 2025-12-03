/**
 * Send invoice notification (Email + SMS) to Shaun Robertson
 * Run: node scripts/send-shaun-notification.js
 */

require('dotenv').config({ path: '.env.local' });

// Customer and Invoice details
const customer = {
  id: '96cbba3b-bfc8-4324-a3fe-1283f5f01689',
  first_name: 'Shaun',
  last_name: 'Robertson',
  email: 'shaunr07@gmail.com',
  phone: '0826574256',
  account_number: 'CT-2025-00012'
};

const invoice = {
  id: '9af1d593-ce38-4b34-8d2b-446a7f7f57ad',
  invoice_number: 'INV-000040',
  invoice_date: '2025-11-25',
  due_date: '2025-12-01',
  total_amount: 899,
  amount_paid: 0,
  amount_due: 899,
  status: 'sent'
};

// Calculate days overdue
const today = new Date();
const dueDate = new Date(invoice.due_date);
const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

console.log('📧 Sending notifications to:', customer.first_name, customer.last_name);
console.log('Invoice:', invoice.invoice_number);
console.log('Amount Due: R', invoice.amount_due.toFixed(2));
console.log('Days Overdue:', daysOverdue);
console.log('---');

// 1. Send SMS via Clickatell
async function sendSMS() {
  const apiKey = process.env.CLICKATELL_API_KEY;
  const baseUrl = process.env.CLICKATELL_BASE_URL || 'https://platform.clickatell.com/v1/message';
  
  // Format phone number
  let phone = customer.phone.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '27' + phone.substring(1);
  }

  const message = `Hi ${customer.first_name}, your CircleTel invoice ${invoice.invoice_number} for R${invoice.amount_due.toFixed(2)} is ${daysOverdue} day(s) overdue. Pay now: circletel.co.za/pay/${invoice.invoice_number} or email us on billing@circletel.co.za`;

  console.log('📱 Sending SMS to:', phone);
  console.log('Message:', message);

  try {
    const response = await fetch(baseUrl, {
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
          content: message,
        }]
      }),
    });

    const data = await response.json();
    
    if (data.messages && data.messages[0]?.accepted) {
      console.log('✅ SMS sent successfully! Message ID:', data.messages[0].apiMessageId);
      return { success: true, messageId: data.messages[0].apiMessageId };
    } else {
      console.log('❌ SMS failed:', data.messages?.[0]?.error?.description || data.error);
      return { success: false, error: data.messages?.[0]?.error?.description };
    }
  } catch (error) {
    console.log('❌ SMS error:', error.message);
    return { success: false, error: error.message };
  }
}

// 2. Send Email via Resend
async function sendEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .amount { font-size: 24px; color: #F5831F; font-weight: bold; }
    .btn { display: inline-block; background: #F5831F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Payment Reminder</h1>
      <p>Invoice ${invoice.invoice_number} is ${daysOverdue} days overdue</p>
    </div>
    <div class="content">
      <h2>Hello ${customer.first_name},</h2>
      <p>This is a friendly reminder that payment for your invoice is now <strong>${daysOverdue} days overdue</strong>.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #92400E;">Invoice Details</h3>
        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
        <p><strong>Invoice Date:</strong> ${formatDate(invoice.invoice_date)}</p>
        <p><strong>Due Date:</strong> <span style="color: #D97706;">${formatDate(invoice.due_date)}</span></p>
        <p><strong>Amount Due:</strong> <span class="amount">R ${invoice.amount_due.toFixed(2)}</span></p>
      </div>

      <p style="text-align: center;">
        <a href="https://circletel.co.za/pay/${invoice.invoice_number}" class="btn">Pay Now - R ${invoice.amount_due.toFixed(2)}</a>
      </p>

      <h3>💳 Payment Options</h3>
      <p><strong>Online Payment:</strong> Click the button above to pay securely via Credit Card, Debit Card, or Instant EFT.</p>
      
      <p><strong>Manual EFT:</strong></p>
      <ul>
        <li>Bank: First National Bank (FNB)</li>
        <li>Account Name: CircleTel (Pty) Ltd</li>
        <li>Account Number: 62123456789</li>
        <li>Branch Code: 250655</li>
        <li>Reference: <strong>${invoice.invoice_number}</strong></li>
      </ul>

      <p>Please pay promptly to avoid any service interruption.</p>
      
      <p>If you have any questions, please contact us at <a href="mailto:billing@circletel.co.za">billing@circletel.co.za</a>.</p>
      
      <p>Thank you for choosing CircleTel!</p>
    </div>
    <div class="footer">
      <p>CircleTel (Pty) Ltd | Your Trusted Internet Service Provider</p>
      <p>This is an automated payment reminder. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  console.log('\n📧 Sending Email to:', customer.email);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel <noreply@notifications.circletelsa.co.za>',
        to: customer.email,
        subject: `Payment Reminder: Invoice ${invoice.invoice_number} - R${invoice.amount_due.toFixed(2)} Overdue`,
        html: html,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Email sent successfully! Message ID:', data.id);
      return { success: true, messageId: data.id };
    } else {
      console.log('❌ Email failed:', data.message || data.error);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run both
async function main() {
  console.log('\n========== SENDING NOTIFICATIONS ==========\n');
  
  const smsResult = await sendSMS();
  const emailResult = await sendEmail();
  
  console.log('\n========== SUMMARY ==========');
  console.log('SMS:', smsResult.success ? '✅ Sent' : '❌ Failed');
  console.log('Email:', emailResult.success ? '✅ Sent' : '❌ Failed');
}

main();
