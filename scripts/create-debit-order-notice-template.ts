/**
 * Submit the CircleTel debit-order-notice WhatsApp template to the PROD WABA.
 *
 * Sent to a customer BEFORE an upcoming debit-order collection, so they know the
 * amount + date in advance. Unlike the PayNow templates (invoice_payment /
 * payment_reminder / debit_failed) this has NO "Pay Now" URL button — the money
 * is collected automatically via the registered mandate, so a payment link would
 * be misleading and risk a double payment.
 *
 * Category UTILITY (transactional, per WhatsApp policy — same as the other
 * billing templates).
 *
 * Body var ORDER (must match the future sender in whatsapp-service.ts):
 *   {{1}} firstName  {{2}} amount (Rands, no symbol)  {{3}} debit date  {{4}} invoice/period
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/create-debit-order-notice-template.ts
 */

const GRAPH = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''

const template = {
  name: 'circletel_debit_order_notice',
  language: 'en_ZA',
  category: 'UTILITY',
  components: [
    {
      type: 'BODY',
      text:
        'Hi {{1}}, this is a notice from CircleTel that R{{2}} will be collected by debit order on {{3}} for invoice {{4}}. ' +
        'The amount is debited automatically from your registered bank account — no action is needed. ' +
        'Questions? Email billing@notify.circletel.co.za.',
      example: { body_text: [['Nobulali', '174.00', '13 July 2026', 'INV-2026-00027']] },
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
  if (!res.ok) process.exit(1)
}

main()
