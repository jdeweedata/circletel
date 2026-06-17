/**
 * Faithful preview of the REAL clinic template (before Meta approval):
 * sends the branded card as the image header WITH the personalised body text
 * as the caption — one bubble, image-on-top + body-below, exactly how the
 * approved image-header template will render.
 *
 * Free-form, so only delivers inside the 24h customer-service window.
 *
 * Usage:
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/whatsapp-send-template-preview.ts <e164-number>
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'fs';

const API_VERSION = 'v21.0';
const BASE = 'https://graph.facebook.com';
const CARD = 'public/images/onboarding/debicheck-whatsapp-header.png';

// Body = what the template body will say (variables already filled for the sample)
const NURSE = 'Lesedi';
const CLINIC = 'Unjani Clinic – Barcelona';
const AMOUNT = 'R517.50';
const BODY =
`Hi ${NURSE} 👋 One last step to activate your CircleTel ClinicConnect line for ${CLINIC}.

Your bank will send you a *DebiCheck request* to approve the ${AMOUNT}/month debit order. It arrives as an SMS from an unknown number with a short link and a 6-digit code, "requested by Circle Tel SA" — this is the official, secure signing step, *not spam*. Please open the link, enter the code, and approve it.

Your billing only starts once this is approved — nothing is ever debited without your approval. Reply here if you don't receive it. – CircleTel`;

function toWa(p: string) {
  let n = p.replace(/\D/g, '');
  if (n.startsWith('0')) n = '27' + n.slice(1);
  return n;
}

async function uploadMedia(pid: string, token: string): Promise<string> {
  const bytes = fs.readFileSync(CARD);
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'image/png');
  form.append('file', new Blob([bytes], { type: 'image/png' }), 'card.png');
  const res = await fetch(`${BASE}/${API_VERSION}/${pid}/media`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(`upload failed: ${JSON.stringify(data)}`);
  return data.id;
}

async function main() {
  const rawTo = process.argv[2];
  if (!rawTo) { console.error('Usage: ... <number>'); process.exit(1); }
  const pid = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!pid || !token) { console.error('WhatsApp creds not set'); process.exit(1); }

  const to = toWa(rawTo);
  console.log(`\nSending template-preview (card + body caption) to ${to}...\n`);
  console.log('--- body ---\n' + BODY + '\n------------\n');

  const mediaId = await uploadMedia(pid, token);
  const res = await fetch(`${BASE}/${API_VERSION}/${pid}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { id: mediaId, caption: BODY },
    }),
  });
  const data = await res.json();
  console.log('HTTP', res.status, JSON.stringify(data, null, 2));
  if (res.ok && data.messages?.[0]?.id) console.log('\n✅ Sent. id:', data.messages[0].id);
  else console.log('\n❌', data?.error?.code, data?.error?.message);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
