/**
 * Send email notification to Shaun Robertson
 * Run: node scripts/send-email-only.js
 */

require('dotenv').config({ path: '.env.local' });

async function sendEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
    <h1>⏰ Payment Reminder</h1>
    <p>Invoice INV-000040 is 2 days overdue</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb;">
    <h2>Hello Shaun,</h2>
    <p>This is a friendly reminder that payment for your invoice is now <strong>2 days overdue</strong>.</p>
    
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #92400E;">Invoice Details</h3>
      <p><strong>Invoice Number:</strong> INV-000040</p>
      <p><strong>Due Date:</strong> <span style="color: #D97706;">1 December 2025</span></p>
      <p><strong>Amount Due:</strong> <span style="font-size: 24px; color: #F5831F; font-weight: bold;">R 899.00</span></p>
    </div>

    <p style="text-align: center;">
      <a href="https://circletel.co.za/pay/INV-000040" style="display: inline-block; background: #F5831F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now - R 899.00</a>
    </p>

    <h3>💳 Payment Options</h3>
    <p><strong>Online Payment:</strong> Click the button above to pay securely via Credit Card, Debit Card, or Instant EFT.</p>
    
    <p><strong>Manual EFT:</strong></p>
    <ul>
      <li>Bank: First National Bank (FNB)</li>
      <li>Account Name: CircleTel (Pty) Ltd</li>
      <li>Account Number: 62123456789</li>
      <li>Branch Code: 250655</li>
      <li>Reference: <strong>INV-000040</strong></li>
    </ul>

    <p>Please pay promptly to avoid any service interruption.</p>
    
    <p>If you have any questions, please contact us at <a href="mailto:billing@circletel.co.za">billing@circletel.co.za</a>.</p>
    
    <p>Thank you for choosing CircleTel!</p>
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px;">
    <p>CircleTel (Pty) Ltd | Your Trusted Internet Service Provider</p>
    <p>This is an automated payment reminder.</p>
  </div>
</div>
  `;

  console.log('📧 Sending Email to: shaunr07@gmail.com');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel <noreply@notify.circletel.co.za>',
        reply_to: 'support@circletel.co.za',
        to: 'shaunr07@gmail.com',
        subject: 'Payment Reminder: Invoice INV-000040 - R899.00 Overdue',
        html: html,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Email sent successfully! Message ID:', data.id);
    } else {
      console.log('❌ Email failed:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

sendEmail();
