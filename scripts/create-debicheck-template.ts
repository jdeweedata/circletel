/**
 * Create + submit the DebiCheck "approve your debit order" WhatsApp template
 * to the production WABA, with the branded card as an IMAGE header.
 *
 * Steps:
 *   1. Discover the app id from the access token (debug_token).
 *   2. Resumable-upload the header card -> header_handle.
 *   3. POST the template to /{WABA}/message_templates (PENDING Meta review).
 *
 * Body variables (positional): {{1}} nurse first name, {{2}} clinic name, {{3}} amount.
 *
 * Run:
 *   set -a && source .env.local && set +a && npx tsx scripts/create-debicheck-template.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'fs';

const V = 'v21.0';
const GRAPH = `https://graph.facebook.com/${V}`;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
const CARD = 'public/images/onboarding/debicheck-whatsapp-header.png';

const TEMPLATE_NAME = 'circletel_debicheck_reminder';

const BODY_TEXT =
`Hi {{1}} 👋 One last step to activate your CircleTel ClinicConnect line for {{2}}.

Your bank will send you a *DebiCheck request* to approve the {{3}}/month debit order. It arrives as an SMS from an unknown number with a short link and a 6-digit code, "requested by Circle Tel SA" — this is the official, secure signing step, *not spam*. Please open the link, enter the code, and approve it.

Your billing only starts once this is approved — nothing is ever debited without your approval. Reply here if you don't receive it.`;

async function discoverAppId(): Promise<string> {
  const res = await fetch(`${GRAPH}/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`);
  const data = await res.json();
  const appId = data?.data?.app_id;
  if (!appId) throw new Error(`Could not discover app id: ${JSON.stringify(data)}`);
  console.log('App id:', appId);
  return appId;
}

async function uploadHeaderHandle(appId: string): Promise<string> {
  const bytes = fs.readFileSync(CARD);
  // 1. start an upload session
  const startRes = await fetch(
    `${GRAPH}/${appId}/uploads?file_name=debicheck-header.png&file_length=${bytes.length}&file_type=image/png`,
    { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const start = await startRes.json();
  if (!start.id) throw new Error(`upload session failed: ${JSON.stringify(start)}`);
  console.log('Upload session:', start.id);

  // 2. upload the bytes -> returns { h: handle }
  const upRes = await fetch(`${GRAPH}/${start.id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${TOKEN}`, file_offset: '0' },
    body: bytes,
  });
  const up = await upRes.json();
  if (!up.h) throw new Error(`byte upload failed: ${JSON.stringify(up)}`);
  console.log('Header handle obtained.');
  return up.h;
}

async function main() {
  if (!TOKEN || !WABA) {
    console.error('WHATSAPP_ACCESS_TOKEN / WHATSAPP_BUSINESS_ACCOUNT_ID not set. Source .env.local first.');
    process.exit(1);
  }
  if (!fs.existsSync(CARD)) {
    console.error('Card not found:', CARD, '- run python3 scripts/make-debicheck-card.py first');
    process.exit(1);
  }

  const appId = await discoverAppId();
  const handle = await uploadHeaderHandle(appId);

  const payload = {
    name: TEMPLATE_NAME,
    language: 'en_ZA',
    category: 'UTILITY',
    components: [
      { type: 'HEADER', format: 'IMAGE', example: { header_handle: [handle] } },
      {
        type: 'BODY',
        text: BODY_TEXT,
        example: { body_text: [['Lesedi', 'Unjani Clinic – Barcelona', 'R517.50']] },
      },
      { type: 'FOOTER', text: 'CircleTel SA (Pty) Ltd' },
    ],
  };

  console.log(`\nSubmitting template '${TEMPLATE_NAME}' to WABA ${WABA}...\n`);
  const res = await fetch(`${GRAPH}/${WABA}/message_templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  console.log('HTTP', res.status);
  console.log(JSON.stringify(data, null, 2));

  if (res.ok && data.id) {
    console.log(`\n✅ Submitted. Template id: ${data.id} · status: ${data.status || 'PENDING'}`);
    console.log('   Meta review usually completes within ~24h. Check status in WhatsApp Manager or via GET /{WABA}/message_templates.');
  } else {
    console.log('\n❌ Submission failed:', data?.error?.message || data?.error?.error_user_msg || 'see response above');
  }
}

main().catch((e) => { console.error('Failed:', e instanceof Error ? e.message : e); process.exit(1); });
