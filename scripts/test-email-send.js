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
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        message: 'This is a test email'
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
