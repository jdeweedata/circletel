/**
 * Test email sending endpoint
 */

const quoteId = '40604a97-53cf-45bf-960a-36d6d1d45217';
const baseUrl = 'http://localhost:3001';

async function testEmailSend() {
  console.log('\n🧪 Testing Email Send Endpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const response = await fetch(`${baseUrl}/api/quotes/business/${quoteId}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientEmail: 'jeffrey.de.wee@circletel.co.za', // Verified email for Resend sandbox
        recipientName: 'Jeffrey de Wee',
        message: 'This is a test email from the CircleTel quote system'
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('\n❌ Email send failed');
      console.log('Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    } else {
      console.log('\n✅ Email sent successfully');
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testEmailSend();
