// Test script for client confirmation email
// Run with: node test-client-email.js

import https from 'https';

const API_KEY = 're_6iZ9mzS5_F4mjSkQYHyYP6teateSeknUV';

// Sample audit data (simulating a real submission)
const testData = {
  clinicName: 'Soweto',
  province: 'Gauteng',
  contactName: 'Dr. Sarah Mthembu',
  contactEmail: 'unjaniclinic@circletel.co.za',
  migrationPriority: 'high',
  contractStatus: 'month-to-month-active',
  auditDate: '2025-09-23',
  submissionId: 'UCN-TEST-' + Date.now()
};

// Generate client confirmation email template
function generateClientConfirmationTemplate(data) {
  return {
    subject: `Thank you for your Network Assessment - ${data.clinicName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Audit Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <!-- Header -->
          <div style="background: white; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <img src="https://unjaniclinic.com/wp-content/uploads/2025/03/unjani-logo.png" alt="Unjani Clinic" style="height: 60px; margin-bottom: 20px;" />
            <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 600;">
              Thank You for Your Network Assessment
            </h1>
            <p style="color: #64748b; margin: 10px 0 0 0; font-size: 16px;">
              ${data.clinicName} - Next Steps Outlined Below
            </p>
          </div>

          <!-- Confirmation Message -->
          <div style="padding: 30px 0; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
              Network Assessment Successfully Submitted
            </h2>
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Dear ${data.contactName},
            </p>
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Thank you for taking the time to complete the network assessment for <strong>${data.clinicName}</strong>.
              Your information has been successfully submitted and is now in our technical review queue.
            </p>
            <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
              <strong>What's Next:</strong> Our CircleTel technical team will carefully review your current network setup
              and contact you within <strong>2-3 business days</strong> to discuss your customized migration plan and next steps.
            </p>
          </div>

          <!-- What Happens Next -->
          <div style="padding: 30px 0; margin-bottom: 30px; border-top: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin: 0 0 30px 0; font-size: 18px; font-weight: 600;">
              Your Migration Journey - Next Steps
            </h3>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="width: 40px; vertical-align: top; padding: 0 20px 25px 0;">
                  <div style="background-color: #1e293b; color: white; border-radius: 50%; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; font-size: 14px;">1</div>
                </td>
                <td style="vertical-align: top; padding: 0 0 25px 0;">
                  <h4 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Technical Assessment (Days 1-2)</h4>
                  <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">Our engineers analyze your current network setup, contract status, and migration requirements</p>
                </td>
              </tr>
              <tr>
                <td style="width: 40px; vertical-align: top; padding: 0 20px 25px 0;">
                  <div style="background-color: #1e293b; color: white; border-radius: 50%; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; font-size: 14px;">2</div>
                </td>
                <td style="vertical-align: top; padding: 0 0 25px 0;">
                  <h4 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Consultation & Planning (Day 3)</h4>
                  <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">We contact you to discuss findings and create a customized network solution for your clinic</p>
                </td>
              </tr>
              <tr>
                <td style="width: 40px; vertical-align: top; padding: 0 20px 0 0;">
                  <div style="background-color: #1e293b; color: white; border-radius: 50%; width: 30px; height: 30px; text-align: center; line-height: 30px; font-weight: bold; font-size: 14px;">3</div>
                </td>
                <td style="vertical-align: top; padding: 0;">
                  <h4 style="color: #1e293b; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Professional Installation</h4>
                  <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.5;">Scheduled installation of your new network with minimal disruption to clinic operations</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Contact Information -->
          <div style="padding: 30px 0; margin-bottom: 30px; border-top: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
              Questions or Concerns?
            </h3>
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Our dedicated Unjani support team is here to help! If you have any questions about your assessment,
              the migration process, or need to update any information, please reach out to us:
            </p>
            <p style="color: #1e293b; margin: 0; font-size: 16px;">
              <strong>CircleTel Unjani Support Team</strong><br>
              Email: <a href="mailto:unjaniclinic@circletel.co.za" style="color: #1e293b; text-decoration: underline;">unjaniclinic@circletel.co.za</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px 0; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
              <strong style="color: #1e293b;">CircleTel Partnership</strong>
            </p>
            <p style="margin: 0; color: #94a3b8;">
              Assessment Reference: <strong style="color: #64748b;">${data.submissionId}</strong><br>
              <em>Please save this reference number for your records.</em>
            </p>
          </div>

        </body>
      </html>
    `,
    text: `
THANK YOU FOR YOUR NETWORK ASSESSMENT

Dear ${data.contactName},

Thank you for taking the time to complete the network assessment for ${data.clinicName}.

Your information has been successfully submitted and is now in our technical review queue. Our CircleTel technical team will carefully review your current network setup and contact you within 2-3 business days to discuss your customized migration plan and next steps.

YOUR MIGRATION JOURNEY - NEXT STEPS:

1. Technical Assessment (Days 1-2)
   Our engineers analyze your current network setup, contract status, and migration requirements

2. Consultation & Planning (Day 3)
   We contact you to discuss findings and create a customized network solution for your clinic

3. Professional Installation
   Scheduled installation of your new network with minimal disruption to clinic operations

QUESTIONS OR CONCERNS?
Our dedicated Unjani support team is here to help! If you have any questions about your assessment, the migration process, or need to update any information, please reach out to us:

CircleTel Unjani Support Team
Email: unjaniclinic@circletel.co.za

Assessment Reference: ${data.submissionId}
Please save this reference number for your records.

CircleTel & ThinkWiFi Partnership
    `
  };
}

// Test email data
const template = generateClientConfirmationTemplate(testData);

const emailData = {
  from: 'CircleTel Notifications <noreply@notifications.circletelsa.co.za>',
  to: ['unjaniclinic@circletel.co.za'], // Your shared inbox
  reply_to: 'unjaniclinic@circletel.co.za',
  subject: template.subject,
  html: template.html,
  text: template.text
};

function sendTestEmail() {
  const postData = JSON.stringify(emailData);

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('📧 Sending CLIENT CONFIRMATION email simulation...');
  console.log(`👤 Simulated Client: ${testData.contactName} (${testData.clinicName})`);
  console.log(`📬 To: ${emailData.to.join(', ')}`);
  console.log(`📝 Subject: ${emailData.subject}`);
  console.log(`🆔 Reference: ${testData.submissionId}`);

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const result = JSON.parse(responseData);

      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Client confirmation email sent successfully!');
        console.log(`📬 Email ID: ${result.id}`);
        console.log('\n🎯 This is what your clinic clients will receive after submitting the audit form:');
        console.log('   ✅ Professional Unjani-branded email');
        console.log('   ✅ Clear next steps and timeline');
        console.log('   ✅ Support contact information');
        console.log('   ✅ Assessment reference number');
        console.log('\n📋 Check your inbox at unjaniclinic@circletel.co.za');
      } else {
        console.log('\n❌ ERROR sending client confirmation email:');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${responseData}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Run the test
sendTestEmail();