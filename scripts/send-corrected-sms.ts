import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function sendSMS() {
  const apiKey = process.env.CLICKATELL_API_KEY;
  const phone = '27826574256';
  const message = 'Hi Shaun, your CircleTel invoice INV-000040 (R899.00) will be debited on 4 December 2025. Questions? Call 087 087 6305.';

  console.log('Sending corrected SMS...');
  console.log('To:', phone);
  console.log('Message:', message);

  const response = await fetch('https://platform.clickatell.com/v1/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': apiKey!,
    },
    body: JSON.stringify({
      messages: [{ channel: 'sms', to: phone, content: message }]
    }),
  });

  const data = await response.json();
  console.log('Result:', JSON.stringify(data, null, 2));

  if (data.messages?.[0]?.apiMessageId) {
    console.log('\n✅ SMS sent successfully!');
  } else {
    console.log('\n❌ SMS failed');
  }
}

sendSMS().catch(console.error);
