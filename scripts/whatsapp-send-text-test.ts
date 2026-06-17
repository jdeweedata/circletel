/**
 * One-off: send a free-form WhatsApp TEXT message to a test number, so we can
 * preview exactly what a clinic nurse will receive.
 *
 * Free-form text only delivers inside the 24h customer-service window (recipient
 * must have messaged our WABA in the last 24h).
 *
 * Usage:
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/whatsapp-send-text-test.ts <e164-number>
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const API_VERSION = 'v21.0';
const BASE = 'https://graph.facebook.com';

function toWhatsAppNumber(phone: string): string {
  let n = phone.replace(/\D/g, '');
  if (n.startsWith('0')) n = '27' + n.slice(1);
  return n;
}

// The nurse heads-up message (Template-F, personalised). Sample clinic = Barcelona.
const NURSE_NAME = 'Lesedi';
const CLINIC_NAME = 'Unjani Clinic – Barcelona';
const AMOUNT = 'R517.50';

const MESSAGE =
`Hi ${NURSE_NAME} 👋 One last step to activate your CircleTel ClinicConnect line for ${CLINIC_NAME}.

Your bank will send you a *DebiCheck request* to approve the ${AMOUNT}/month debit order. It arrives as an SMS from an unfamiliar number with a short link and a 6-digit code, and will say "requested by Circle Tel SA" — this is the official, secure signing step, *not spam*. Please open the link, enter the code, and approve it. Your bank may also ask you to confirm it in your banking app.

Your billing only starts once this is approved — nothing is ever debited without your approval.

If you don't receive it within a few hours, reply here and we'll resend it. Thanks! – CircleTel`;

async function main() {
  const rawTo = process.argv[2];
  if (!rawTo) {
    console.error('Usage: npx tsx scripts/whatsapp-send-text-test.ts <number>');
    process.exit(1);
  }
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) {
    console.error('WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not set.');
    process.exit(1);
  }

  const to = toWhatsAppNumber(rawTo);
  console.log(`\nSending nurse heads-up text to ${to}...\n`);
  console.log('--- message preview ---');
  console.log(MESSAGE);
  console.log('-----------------------\n');

  const res = await fetch(`${BASE}/${API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: MESSAGE, preview_url: false },
    }),
  });
  const data = await res.json();
  console.log('HTTP status:', res.status);
  console.log('Response   :', JSON.stringify(data, null, 2));

  if (res.ok && data.messages?.[0]?.id) {
    console.log('\n✅ Accepted by Meta. Message id:', data.messages[0].id);
  } else {
    const code = data?.error?.code;
    console.log('\n❌ Not sent. Error code:', code, '-', data?.error?.message);
    if (code === 131047 || code === 131051 || code === 131026) {
      console.log('   => 24h window closed. Message +27 84 773 9467 from this number first, then rerun.');
    }
  }
}

main().catch((e) => {
  console.error('Failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
