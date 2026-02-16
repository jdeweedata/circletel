import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function sendEmail() {
  const apiKey = process.env.RESEND_API_KEY;

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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CircleTel</h1>
    </div>
    <div class="content">
      <p>Dear Shaun,</p>

      <p>This is a friendly reminder that your monthly internet service payment will be collected via debit order.</p>

      <p><strong>Invoice Details:</strong></p>
      <ul>
        <li>Invoice Number: <strong>INV-000040</strong></li>
        <li>Amount: <span class="amount">R899.00</span></li>
        <li>Debit Date: <span class="date">4 December 2025</span></li>
        <li>Service: SkyFibre Home Plus (100/50 Mbps)</li>
      </ul>

      <p>Please ensure sufficient funds are available in your account on the debit date to avoid any service interruptions.</p>

      <p>If you have any questions or need to update your payment details, please contact us:</p>
      <ul>
        <li>Email: support@circletel.co.za</li>
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

  console.log('Sending email to Shaun...');
  console.log('From: noreply@notify.circletel.co.za');
  console.log('To: shaunr07@gmail.com');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'CircleTel Billing <noreply@notify.circletel.co.za>',
        to: ['shaunr07@gmail.com'],
        reply_to: 'support@circletel.co.za',
        subject: 'Debit Order Reminder - INV-000040 (R899.00) - 4 December 2025',
        html: emailHtml,
      }),
    });

    const data = await response.json();
    console.log('Result:', JSON.stringify(data, null, 2));

    if (data.id) {
      console.log('\n✅ Email sent successfully!');
      console.log('Message ID:', data.id);
    } else {
      console.log('\n❌ Email failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

sendEmail().catch(console.error);
