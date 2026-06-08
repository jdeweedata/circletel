/**
 * Submit the 3 remaining CircleTel WhatsApp message templates to the PROD WABA.
 * Body variable ORDER must match lib/integrations/whatsapp/whatsapp-service.ts
 * (positional {{1}}.. == the order params are pushed into bodyParams).
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/create-whatsapp-templates.ts
 */

const GRAPH = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
const PAYNOW = 'https://www.circletel.co.za/api/paynow/{{1}}'
const PAYNOW_EXAMPLE = 'https://www.circletel.co.za/api/paynow/09de69d1-test'
const FOOTER = { type: 'FOOTER', text: 'CircleTel SA (Pty) Ltd' }

const templates = [
  {
    // sendPaymentReminder -> [invoiceNumber, amount, daysOverdue]
    name: 'circletel_payment_reminder',
    language: 'en_ZA',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Hi there, a friendly reminder that your CircleTel invoice {{1}} for R{{2}} is now {{3}} days overdue. Please tap the button below to settle it securely, or reply to this message if you need help.',
        example: { body_text: [['INV-2026-00011', '419.07', '5']] },
      },
      FOOTER,
      {
        type: 'BUTTONS',
        buttons: [{ type: 'URL', text: 'Pay Now', url: PAYNOW, example: [PAYNOW_EXAMPLE] }],
      },
    ],
  },
  {
    // sendDebitFailed -> [customerName, invoiceNumber, amount]; button[0] dynamic, button[1] static
    name: 'circletel_debit_failed',
    language: 'en_ZA',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, we were unable to collect payment for your CircleTel invoice {{2}} of R{{3}} via debit order. Please tap Pay Now to settle it securely, or update your payment details below.',
        example: { body_text: [['Ashwyn', 'INV-2026-00011', '419.07']] },
      },
      FOOTER,
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Pay Now', url: PAYNOW, example: [PAYNOW_EXAMPLE] },
          { type: 'URL', text: 'Update Payment', url: 'https://www.circletel.co.za/dashboard/billing' },
        ],
      },
    ],
  },
  {
    // sendPaymentReceived -> [customerName, invoiceNumber, amount, paymentDate]; no button
    name: 'circletel_payment_received',
    language: 'en_ZA',
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, thank you! Your payment for invoice {{2}} of R{{3}} was received on {{4}}. Your CircleTel account is now up to date.',
        example: { body_text: [['Ashwyn', 'INV-2026-00011', '419.07', '10 June 2026']] },
      },
      FOOTER,
    ],
  },
]

async function main() {
  if (!TOKEN || !WABA) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN / WHATSAPP_BUSINESS_ACCOUNT_ID not set. Did you source .env.local?')
    process.exit(1)
  }
  for (const tpl of templates) {
    const res = await fetch(`${GRAPH}/${WABA}/message_templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(tpl),
    })
    const json = await res.json().catch(() => ({}))
    console.log(`${tpl.name}: ${res.ok ? '✅' : '❌'} ${JSON.stringify(json)}`)
  }
}

main()
