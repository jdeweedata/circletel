/**
 * Read-only dual-channel check: sales 084 Cloud API + Zoho Desk native IM readiness.
 *
 * Run:
 *   set -a && source .env.local && set +a && npx tsx scripts/whatsapp/verify-dual-channel.ts
 */

const GRAPH = 'https://graph.facebook.com/v21.0';
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const SALES_PHONE_ID =
  process.env.WHATSAPP_SALES_PHONE_NUMBER_ID ||
  process.env.WHATSAPP_PHONE_NUMBER_ID ||
  '1198404656682736';
const SALES_WABA =
  process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '2030687664240306';
const SALES_NATIVE = process.env.WHATSAPP_SALES_NATIVE_IM === 'true';
const BRIDGE = process.env.WHATSAPP_DESK_BRIDGE_ENABLED !== 'false';

async function get(url: string) {
  const res = await fetch(url);
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  if (!TOKEN) {
    console.error('WHATSAPP_ACCESS_TOKEN not set');
    process.exit(1);
  }

  console.log('=== Dual WhatsApp channel verify ===\n');
  console.log('env phone_number_id:', process.env.WHATSAPP_PHONE_NUMBER_ID);
  console.log('env waba:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
  console.log('sales phone id:', SALES_PHONE_ID);
  console.log('WHATSAPP_SALES_NATIVE_IM:', SALES_NATIVE);
  console.log('WHATSAPP_DESK_BRIDGE_ENABLED:', BRIDGE);

  console.log('\n=== 1. Sales phone (expect +27 84 773 9467) ===');
  const phone = await get(
    `${GRAPH}/${SALES_PHONE_ID}?fields=display_phone_number,verified_name,quality_rating,code_verification_status&access_token=${TOKEN}`
  );
  if (!phone.ok) {
    console.log('  FAIL', phone.status, JSON.stringify(phone.json));
  } else {
    console.log('  OK', JSON.stringify(phone.json));
    const display = String(
      (phone.json as { display_phone_number?: string }).display_phone_number ||
        ''
    );
    if (!display.includes('84 773 9467') && !display.includes('847739467')) {
      console.log('  WARN: display number is not 084 773 9467');
    }
  }

  console.log('\n=== 2. WABA subscribed_apps (Zoho vs CircleTel Messaging) ===');
  const subs = await get(
    `${GRAPH}/${SALES_WABA}/subscribed_apps?access_token=${TOKEN}`
  );
  if (!subs.ok) {
    console.log('  FAIL', subs.status, JSON.stringify(subs.json));
  } else {
    const data =
      ((subs.json as { data?: Array<{ whatsapp_business_api_data?: { name?: string; id?: string } }> })
        .data) || [];
    if (!data.length) {
      console.log('  WARN: no subscribed apps');
    }
    let zohoLike = false;
    for (const row of data) {
      const app = row.whatsapp_business_api_data || {};
      const name = app.name || '';
      console.log(`  - ${name} (${app.id})`);
      if (/zoho/i.test(name)) zohoLike = true;
    }
    if (zohoLike) {
      console.log(
        '  → Zoho app subscribed. Set WHATSAPP_SALES_NATIVE_IM=true so CircleTel bridge skips 084 inbound.'
      );
    } else {
      console.log(
        '  → No Zoho app on this WABA (expected if Meta "Connecting phone to Zoho" is stuck).'
      );
      console.log(
        '  → ACTIVE PATH: Cloud API desk-bridge → CircleTel Sales (ZOHO_DESK_SALES_DEPARTMENT_ID).'
      );
      console.log(
        '  → Keep WHATSAPP_SALES_NATIVE_IM=false. Agents reply via Public Comment.'
      );
    }
  }

  console.log('\n=== 2b. Sales department env ===');
  console.log(
    '  ZOHO_DESK_SALES_DEPARTMENT_ID:',
    process.env.ZOHO_DESK_SALES_DEPARTMENT_ID || '(not set)'
  );

  console.log('\n=== 3. Bridge skip policy ===');
  if (SALES_NATIVE && BRIDGE) {
    console.log(
      '  Bridge ON but sales native IM=true → inbound on sales phone_number_id skipped (Flows still handled).'
    );
  } else if (!SALES_NATIVE && BRIDGE) {
    console.log(
      '  Bridge ON, native IM=false → free-text inbound on 084 still creates bridge tickets (contingency).'
    );
  } else {
    console.log('  Bridge disabled globally.');
  }

  console.log('\n=== Done ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
