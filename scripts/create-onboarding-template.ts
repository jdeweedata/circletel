/**
 * Submit the CircleTel clinic-onboarding WhatsApp template to the PROD WABA.
 * Body var ORDER must match lib/integrations/whatsapp/whatsapp-service.ts
 * sendClinicOnboarding(): body {{1}} = clinicName; URL button {{1}} = magic-link token.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/create-onboarding-template.ts
 */

const GRAPH = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
const ONBOARD_URL = 'https://www.circletel.co.za/onboarding/{{1}}'
const ONBOARD_EXAMPLE = 'https://www.circletel.co.za/onboarding/9UND2s3z-test'
const FOOTER = { type: 'FOOTER', text: 'CircleTel SA (Pty) Ltd' }

const template = {
  // sendClinicOnboarding -> body [clinicName]; button[0] dynamic URL = token
  name: 'circletel_clinic_onboarding',
  language: 'en_ZA',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text: "Hi {{1}}, let's set up your CircleTel ClinicConnect billing. Tap the button below to confirm your clinic details, add your banking and documents, and activate your account. It only takes a few minutes, and the link is valid for 7 days.",
      example: { body_text: [['Unjani Clinic - Lens ext 10']] },
    },
    FOOTER,
    {
      type: 'BUTTONS',
      buttons: [{ type: 'URL', text: 'Start setup', url: ONBOARD_URL, example: [ONBOARD_EXAMPLE] }],
    },
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
  console.log(`${template.name}: ${res.ok ? '✅ submitted (PENDING Meta review ~24h)' : '❌'} ${JSON.stringify(json)}`)
}

main()
