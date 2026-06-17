/**
 * One-off: upload a local image to the WhatsApp media endpoint and send it as a
 * free-form image message (with caption) to a test number.
 *
 * NOTE: free-form (non-template) messages — including images — only deliver
 * inside the 24-hour customer-service window. The recipient must have messaged
 * our WABA number in the last 24h, otherwise Meta returns error 131047
 * (re-engagement) / 131026 and nothing is delivered.
 *
 * Usage:
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/whatsapp-send-image-test.ts <e164-number> <image-path>
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'fs';

const API_VERSION = 'v21.0';
const BASE = 'https://graph.facebook.com';

function toWhatsAppNumber(phone: string): string {
  let n = phone.replace(/\D/g, '');
  if (n.startsWith('0')) n = '27' + n.slice(1);
  return n;
}

async function uploadMedia(phoneNumberId: string, token: string, imagePath: string): Promise<string> {
  const bytes = fs.readFileSync(imagePath);
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'image/png');
  form.append('file', new Blob([bytes], { type: 'image/png' }), 'netcash-debicheck-sms.png');

  const res = await fetch(`${BASE}/${API_VERSION}/${phoneNumberId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`Media upload failed: HTTP ${res.status} ${JSON.stringify(data)}`);
  }
  console.log('Uploaded media id:', data.id);
  return data.id;
}

async function sendImage(phoneNumberId: string, token: string, to: string, mediaId: string, caption: string) {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: { id: mediaId, caption },
  };
  const res = await fetch(`${BASE}/${API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const [rawTo, imagePath = '/tmp/netcash-debicheck-sms.png'] = process.argv.slice(2);
  if (!rawTo) {
    console.error('Usage: npx tsx scripts/whatsapp-send-image-test.ts <number> [imagePath]');
    process.exit(1);
  }
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) {
    console.error('WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not set — run with: set -a && source .env.local && set +a && npx tsx ...');
    process.exit(1);
  }
  if (!fs.existsSync(imagePath)) {
    console.error('Image not found:', imagePath);
    process.exit(1);
  }

  const to = toWhatsAppNumber(rawTo);
  const caption =
    'Example of the NetCash DebiCheck SMS your clinic will receive to sign the debit order. ' +
    'It comes from an unfamiliar number with a short link + 6-digit code, "requested by Circle Tel SA" — ' +
    'this is the official signing step, please open it and enter the code. (CircleTel test message)';

  console.log(`\nSending image to ${to} from phone_number_id ${phoneNumberId}...\n`);

  const mediaId = await uploadMedia(phoneNumberId, token, imagePath);
  const result = await sendImage(phoneNumberId, token, to, mediaId, caption);

  console.log('HTTP status:', result.status);
  console.log('Response   :', JSON.stringify(result.data, null, 2));

  if (result.ok && result.data.messages?.[0]?.id) {
    console.log('\n✅ Accepted by Meta. Message id:', result.data.messages[0].id);
    console.log('   (If it does not arrive, the 24h customer-service window is closed — reply "hi" to +27 84 773 9467 and retry.)');
  } else {
    const code = result.data?.error?.code;
    console.log('\n❌ Not sent. Error code:', code, '-', result.data?.error?.message);
    if (code === 131047 || code === 131051 || code === 131026) {
      console.log('   => 24h window closed. Send a WhatsApp to +27 84 773 9467 from this number first, then rerun within 24h.');
    }
  }
}

main().catch((e) => {
  console.error('Failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
