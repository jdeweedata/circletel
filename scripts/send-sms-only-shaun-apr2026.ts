import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production.local' });

async function main() {
  const transactionRef = 'CT-20260406-katbvlj7';
  const shortUrl = `https://www.circletel.co.za/api/paynow/${transactionRef}`;
  const smsMessage = `Hi Shaun, your CircleTel inv INV-2026-00006 (R899.00) is due 10 Apr 2026. Pay: ${shortUrl}`;

  console.log(`Message (${smsMessage.length} chars): ${smsMessage}`);

  const phone = '27826574256';
  const apiKey = process.env.CLICKATELL_API_KEY!;

  const response = await fetch('https://platform.clickatell.com/v1/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify({
      messages: [{ channel: 'sms', to: phone, content: smsMessage }],
    }),
  });

  const data = await response.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
