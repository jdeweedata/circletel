/**
 * Submit the CircleTel docs-received WhatsApp template to the PROD WABA.
 * Sent right after a clinic completes the onboarding wizard: confirms receipt,
 * gives the account number, and sets the vetting expectation.
 *
 * Body var ORDER must match lib/integrations/whatsapp/whatsapp-service.ts
 * sendClinicDocsReceived(): {{1}} firstName, {{2}} clinicName, {{3}} accountNumber.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/create-docs-received-template.ts
 */

const GRAPH = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''

const template = {
  // sendClinicDocsReceived -> body [firstName, clinicName, accountNumber]
  name: 'circletel_docs_received',
  language: 'en_ZA',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text:
        'Hi {{1}}, thank you — your CircleTel ClinicConnect setup for {{2}} is complete and your documents have been received. ' +
        'Your account number is {{3}}. Our team is now reviewing your submission, which usually takes 2 business days. ' +
        "We'll message you as soon as the review is done — no further action is needed from you right now.",
      example: { body_text: [['Lesedi', 'Unjani Clinic - Delmas', 'CT-2026-00033']] },
    },
    { type: 'FOOTER', text: 'CircleTel SA (Pty) Ltd' },
  ],
}

async function main() {
  if (!TOKEN || !WABA) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN / WHATSAPP_BUSINESS_ACCOUNT_ID not set. Did you source .env.local?')
    process.exit(1)
  }
  console.log(`Submitting '${template.name}' to WABA ${WABA}…`)
  const res = await fetch(`${GRAPH}/${WABA}/message_templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(template),
  })
  const json = await res.json().catch(() => ({}))
  console.log(`${template.name}: ${res.ok ? '✅ submitted (PENDING Meta review)' : '❌'} ${JSON.stringify(json)}`)
}

main()
