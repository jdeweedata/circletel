/**
 * Read-only diagnostic for wiring 084 773 9467 as the production WhatsApp sender.
 * Checks whether the current WHATSAPP_ACCESS_TOKEN can see the new phone number
 * and what templates exist on the new WABA. Sends NOTHING.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/check-whatsapp-prod-number.ts
 */

const GRAPH = 'https://graph.facebook.com/v21.0'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''
const PROD_PHONE_ID = '1198404656682736' // +27 84 773 9467
const PROD_WABA_ID = '2030687664240306'

async function get(url: string) {
  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

async function main() {
  if (!TOKEN) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN not set. Run with: set -a && source .env.local && set +a && npx tsx ...')
    process.exit(1)
  }

  console.log('=== 1. Token access (debug_token) ===')
  const dbg = await get(`${GRAPH}/debug_token?input_token=${TOKEN}&access_token=${TOKEN}`)
  if (dbg.ok) {
    const d = dbg.json.data || {}
    console.log('  type:', d.type, '| valid:', d.is_valid, '| expires:', d.expires_at === 0 ? 'never' : d.expires_at)
    console.log('  scopes:', (d.scopes || []).join(', '))
  } else {
    console.log('  ⚠️', dbg.status, JSON.stringify(dbg.json.error || dbg.json))
  }

  console.log('\n=== 2. Can token read the PROD phone number (084 773 9467)? ===')
  const phone = await get(`${GRAPH}/${PROD_PHONE_ID}?fields=display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput&access_token=${TOKEN}`)
  if (phone.ok) {
    console.log('  ✅', JSON.stringify(phone.json))
  } else {
    console.log('  ❌', phone.status, JSON.stringify(phone.json.error || phone.json))
    console.log('     → token likely lacks asset access to this WABA (expect #131005 on send).')
  }

  console.log('\n=== 3. Templates on the PROD WABA ===')
  const tpl = await get(`${GRAPH}/${PROD_WABA_ID}/message_templates?fields=name,status,language,category&limit=50&access_token=${TOKEN}`)
  if (tpl.ok) {
    const list = tpl.json.data || []
    if (!list.length) {
      console.log('  ⚠️ No templates on this WABA — circletel_invoice_payment must be re-created & approved here.')
    } else {
      for (const t of list) console.log(`  - ${t.name} [${t.language}] ${t.status} (${t.category})`)
    }
  } else {
    console.log('  ❌', tpl.status, JSON.stringify(tpl.json.error || tpl.json))
  }

  console.log('\n=== 4. WABA subscribed apps (webhook wiring) ===')
  const subs = await get(`${GRAPH}/${PROD_WABA_ID}/subscribed_apps?access_token=${TOKEN}`)
  console.log(subs.ok ? `  ${JSON.stringify(subs.json.data || [])}` : `  ❌ ${subs.status} ${JSON.stringify(subs.json.error || subs.json)}`)
}

main()
