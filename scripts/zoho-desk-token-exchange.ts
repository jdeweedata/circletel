/**
 * One-off helper: exchange a Zoho Self Client GRANT TOKEN (code) for a long-lived
 * REFRESH TOKEN with Desk write scopes, so scripts/log-unjani-support-tickets.ts can
 * create tickets.
 *
 * Why: the existing ZOHO_DESK_REFRESH_TOKEN is read-only (campaign pipeline only needed
 * Desk.tickets.READ). Ticket creation needs Desk.tickets.CREATE + Desk.contacts.CREATE.
 *
 * Generate the grant token first:
 *   1. https://api-console.zoho.com  → open the Self Client for the app matching ZOHO_CLIENT_ID
 *   2. "Generate Code" tab → Scope:
 *        Desk.tickets.ALL,Desk.contacts.ALL,Desk.settings.READ,Desk.basic.READ
 *      → pick a duration (10 min is fine) → Create → copy the code.
 *   3. Run within that window:
 *        set -a && source .env.local && set +a && GRANT_TOKEN='1000.xxxx.yyyy' npx tsx scripts/zoho-desk-token-exchange.ts
 *
 * It prints the new refresh_token and the granted scope. It does NOT write to .env.local
 * (you/I update ZOHO_DESK_REFRESH_TOKEN after confirming the scope looks right).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const GRANT_TOKEN = process.env.GRANT_TOKEN;
const CLIENT_ID = process.env.ZOHO_DESK_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_DESK_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
const REGION = process.env.ZOHO_REGION || 'US';
const ACCOUNTS_HOST =
  ({ US: 'accounts.zoho.com', EU: 'accounts.zoho.eu', IN: 'accounts.zoho.in', AU: 'accounts.zoho.com.au', CN: 'accounts.zoho.com.cn' } as Record<string, string>)[REGION] ??
  'accounts.zoho.com';

async function main() {
  if (!GRANT_TOKEN) throw new Error('Set GRANT_TOKEN env (the code from the Self Client console).');
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Missing ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET.');

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: GRANT_TOKEN,
  });
  // Self Client grant tokens do not require a redirect_uri; include only if explicitly set.
  if (process.env.ZOHO_REDIRECT_URI) params.set('redirect_uri', process.env.ZOHO_REDIRECT_URI);

  const res = await fetch(`https://${ACCOUNTS_HOST}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();
  if (data.error) {
    console.error('❌ Exchange failed:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('\n✅ Token exchange succeeded.');
  console.log('   scope         :', data.scope);
  console.log('   api_domain    :', data.api_domain);
  console.log('   expires_in    :', data.expires_in);
  console.log('   access_token  :', (data.access_token || '').slice(0, 12) + '…');
  console.log('\n🔑 NEW REFRESH TOKEN (set this as ZOHO_DESK_REFRESH_TOKEN in .env.local):\n');
  console.log(data.refresh_token);
  console.log('');
}

main().catch((e) => {
  console.error('💥', e instanceof Error ? e.message : e);
  process.exit(1);
});
