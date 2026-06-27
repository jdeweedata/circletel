/**
 * One-off ops script: log the 6 unresolved Unjani clinic Wi-Fi/connectivity
 * issues (from Ruth Butcher's "Unresolved concerns" email thread, 10–19 June 2026)
 * as Zoho Desk tickets so support staff have a tracked, owned record.
 *
 * Auth: reuses the production-proven createZohoDeskAuthService() + getAccessToken()
 * (refreshes the DB-cached token, omits the orgId header when ZOHO_DESK_ORG_ID is empty).
 * We do NOT use lib/integrations/zoho/desk-service.ts createTicket() — its payload is
 * incomplete for real Zoho Desk (no departmentId, no contact object) and it uses a
 * static hourly-expiring token.
 *
 * Usage (NOTE: source .env.local — dotenv/config does not load it):
 *   set -a && source .env.local && set +a && DRY_RUN=true   npx tsx scripts/log-unjani-support-tickets.ts
 *   set -a && source .env.local && set +a && ONLY_FIRST=true npx tsx scripts/log-unjani-support-tickets.ts
 *   set -a && source .env.local && set +a &&                 npx tsx scripts/log-unjani-support-tickets.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const DRY_RUN = process.env.DRY_RUN === 'true';
const ONLY_FIRST = process.env.ONLY_FIRST === 'true';
// Skip the first N issues (e.g. START_INDEX=1 after Lens Ext 10 was already created in a prior run).
const START_INDEX = Number.parseInt(process.env.START_INDEX || '0', 10) || 0;

const REGION = process.env.ZOHO_REGION || 'US';
const REGION_SUFFIX =
  ({ US: '', EU: '.eu', IN: '.in', AU: '.com.au', CN: '.com.cn' } as Record<string, string>)[REGION] ?? '';
const BASE_URL = `https://desk.zoho${REGION_SUFFIX}.com/api/v1`;
const ORG_ID = process.env.ZOHO_DESK_ORG_ID || '';
const ACCOUNTS_HOST =
  ({ US: 'accounts.zoho.com', EU: 'accounts.zoho.eu', IN: 'accounts.zoho.in', AU: 'accounts.zoho.com.au', CN: 'accounts.zoho.com.cn' } as Record<string, string>)[REGION] ??
  'accounts.zoho.com';

// Mint a Desk access token directly from the Desk refresh token, ONCE per run.
// We deliberately bypass lib/integrations/zoho/auth-service's getAccessToken(): it caches
// into the shared singleton `zoho_tokens` row, which a background CRM process overwrites with
// a CRM-scoped token (read-only for Desk) — causing settings/create calls to 403/401.
let ACCESS_TOKEN = '';
async function mintDeskAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_DESK_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_DESK_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_DESK_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing ZOHO_DESK_REFRESH_TOKEN / ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET.');
  }
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  const res = await fetch(`https://${ACCOUNTS_HOST}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Desk token refresh failed: ${JSON.stringify(data)}`);
  }
  if (data.scope) console.log(`   token scope: ${data.scope}`);
  return data.access_token;
}

const RUTH_EMAIL = 'rbutcher@unjani.org';
const SOURCE_LINE =
  'Source: Email thread "Unresolved concerns" (10–19 June 2026), from Ruth Butcher (Unjani Clinic, Business Development Manager) <rbutcher@unjani.org>';

type Priority = 'High' | 'Medium' | 'Low';

interface ClinicIssue {
  clinic: string;
  account: string;
  priority: Priority;
  nurse: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}

// Split "First Last" → { firstName, lastName }. Zoho Desk contact requires lastName.
function splitName(full: string): { firstName?: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

function footer(issue: ClinicIssue): string {
  return `\n\n---\nReported by: Ruth Butcher (Unjani Clinic, Business Development Manager) <${RUTH_EMAIL}>\nClinic account: ${issue.account} — ${issue.clinic}\nClinic nurse: ${issue.nurse} (${issue.phone})\n${SOURCE_LINE}`;
}

// Order: Lens Ext 10 first so ONLY_FIRST validates a High-priority, representative ticket.
const CLINIC_ISSUES: ClinicIssue[] = [
  {
    clinic: 'Lens Ext 10',
    account: 'CT-2026-00020',
    priority: 'High',
    nurse: 'Tsabeng Ramalope',
    email: 'lensext10@unjani.org',
    phone: '071 898 8722',
    subject: 'Lens Ext 10 — Cannot connect to clinic Wi-Fi in consultation room (weak/unstable signal)',
    description:
      'The nurse cannot reliably connect her laptop to the clinic Wi-Fi line in her consultation room. ' +
      'When she does connect, the line is constantly up and down and the signal-strength bar is very low. ' +
      'The router was initially placed on a table (not working), then moved onto the windowsill — it has not ' +
      'been mounted/shelved in the correct position and she reports it is still not positioned correctly. ' +
      'As a result she is forced to use the patient line (where unrelated streaming/adverts are also appearing). ' +
      'She wants to continue on the service but needs the connectivity and router placement resolved.',
  },
  {
    clinic: 'Umsinga',
    account: 'CT-2026-00027',
    priority: 'High',
    nurse: 'Nolwazi Dlamini',
    email: 'umsinga@unjani.org',
    phone: '061 509 5966',
    subject: 'Umsinga — New clinic has no Wi-Fi (network radius does not reach new building)',
    description:
      'The network radius does not reach the new clinic. Coverage of the new building was requested at ' +
      'installation, but the clinic was installed without Wi-Fi in the new clinic — staff currently have to ' +
      'walk to the old clinic modular/container to access Wi-Fi. Needs a range extension/relocation so the ' +
      'new clinic building is covered.',
  },
  {
    clinic: 'New Hanover',
    account: 'CT-2026-00026',
    priority: 'Medium',
    nurse: 'Nolwazi Dlamini',
    email: 'newhanover@unjani.org',
    phone: '060 995 3428',
    subject: 'New Hanover — Move cameras to new Wi-Fi and cancel old Wi-Fi subscription',
    description:
      'The security cameras are still operating on the old Wi-Fi. The nurse wants the cameras moved onto the ' +
      'new CircleTel Wi-Fi, and the old Wi-Fi subscription cancelled once the cameras are migrated.',
  },
  {
    clinic: 'Sky City',
    account: 'CT-2026-00013',
    priority: 'Medium',
    nurse: 'Philisiwe Modise',
    email: 'skycity@unjani.org',
    phone: '076 071 4887',
    subject: 'Sky City — Assistance connecting all devices/systems to Wi-Fi',
    description:
      'The nurse needs assistance connecting everything to the Wi-Fi. She has previously raised needing help ' +
      'connecting the camera, alarm and solar system to the Wi-Fi (the same issue affects both her clinics — ' +
      'see Sweetwaters). At present she can only use it to connect the system and clients, and needs to use it ' +
      'effectively to continue.\n\n' +
      'ONBOARDING NOTE (for sales/onboarding, not support): once Sky City is sorted, the nurse wants to onboard ' +
      'the Tokoza clinic next (Tokoza = account CT-2026-00014). Please flag to the onboarding team.',
  },
  {
    clinic: 'Sweetwaters',
    account: 'CT-2026-00024',
    priority: 'Medium',
    nurse: 'Thandi Mbandlwa',
    email: 'sweetwaters@unjani.org',
    phone: '082 822 2343',
    subject: 'Sweetwaters — Router to be moved to another location',
    description:
      'The router needs to be relocated to another location within the clinic. The nurse has also flagged ' +
      'needing assistance connecting the camera, alarm and solar system to the Wi-Fi (the same issue she raised ' +
      'for Sky City — same nurse owner across both clinics).',
  },
  {
    clinic: 'Phoenix',
    account: 'CT-2026-00025',
    priority: 'Low',
    nurse: 'Philile Mthethwa',
    email: 'pheonix@unjani.org',
    phone: '083 534 2194',
    subject: 'Phoenix — Surrounding school children consuming clinic data (needs access control)',
    description:
      'Surrounding school children are using the clinic data. Needs Wi-Fi access control (e.g. password change, ' +
      'captive portal, or device whitelisting / data-usage restriction) so external users cannot consume the ' +
      "clinic's data allowance.",
  },
];

interface DeskResult<T> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function deskRequest<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
): Promise<DeskResult<T>> {
  const headers: Record<string, string> = {
    Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
  if (ORG_ID) headers['orgId'] = ORG_ID;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    return { success: false, status: response.status, error: text };
  }
  return { success: true, status: response.status, data: text ? (JSON.parse(text) as T) : undefined };
}

interface ZohoDepartment {
  id: string;
  name: string;
  isEnabled?: boolean;
}

async function resolveDepartmentId(): Promise<{ id: string; name: string }> {
  if (process.env.ZOHO_DESK_DEPARTMENT_ID) {
    return { id: process.env.ZOHO_DESK_DEPARTMENT_ID, name: '(from ZOHO_DESK_DEPARTMENT_ID env)' };
  }

  // Preferred: list departments. Requires Desk.settings.READ / Desk.basic.READ scope.
  const result = await deskRequest<{ data: ZohoDepartment[] }>('/departments');
  if (result.success && result.data?.data?.length) {
    const departments = result.data.data;
    console.log(`   Departments available: ${departments.map((d) => `${d.name} (${d.id})`).join(', ')}`);
    // Prefer an enabled department named like Support / CircleTel; else first enabled; else first.
    const preferred =
      departments.find((d) => d.isEnabled !== false && /support|circletel/i.test(d.name)) ||
      departments.find((d) => d.isEnabled !== false) ||
      departments[0];
    return { id: preferred.id, name: preferred.name };
  }

  // Fallback: the token may only have Desk.tickets.READ (no settings scope). Derive the
  // departmentId from an existing ticket — tickets carry the field the create call needs.
  console.log(
    `   /departments unavailable (status ${result.status}); deriving departmentId from an existing ticket...`,
  );
  const tickets = await deskRequest<{ data: Array<{ departmentId?: string; ticketNumber?: string }> }>(
    '/tickets?limit=10',
  );
  if (!tickets.success || !tickets.data?.data?.length) {
    throw new Error(
      `Could not resolve a Zoho Desk department. /departments → ${result.status} ${result.error ?? ''}; ` +
        `/tickets → ${tickets.status} ${tickets.error ?? 'no tickets returned'}. ` +
        `Set ZOHO_DESK_DEPARTMENT_ID, or regenerate the Desk OAuth token with Desk.settings.READ.`,
    );
  }
  const withDept = tickets.data.data.find((t) => t.departmentId);
  if (!withDept?.departmentId) {
    throw new Error(
      'Read existing tickets but none exposed a departmentId. Set ZOHO_DESK_DEPARTMENT_ID explicitly.',
    );
  }
  return { id: withDept.departmentId, name: `(derived from existing ticket #${withDept.ticketNumber})` };
}

async function main() {
  console.log(`\n🎫 Log Unjani support tickets to Zoho Desk${DRY_RUN ? ' [DRY RUN]' : ''}${ONLY_FIRST ? ' [ONLY FIRST]' : ''}`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   orgId header: ${ORG_ID ? 'SET' : 'omitted (empty ZOHO_DESK_ORG_ID)'}\n`);

  // 0. Mint a fresh Desk access token (bypasses the shared zoho_tokens cache).
  console.log('🔐 Minting Desk access token...');
  ACCESS_TOKEN = await mintDeskAccessToken();
  console.log('   ✓ Token minted\n');

  // 1. Resolve department (also acts as an auth smoke test).
  console.log('🏢 Resolving Zoho Desk department...');
  const department = await resolveDepartmentId();
  console.log(`   ✓ Using department: ${department.name} (${department.id})\n`);

  // Optional cleanup of a stray ticket (e.g. one created in the wrong department).
  // Zoho Desk has no single-ticket DELETE (405); it uses a move-to-trash batch endpoint.
  // If that is unavailable, fall back to closing the ticket with a duplicate note.
  if (process.env.CLEANUP_TICKET_IDS && !DRY_RUN) {
    const ids = process.env.CLEANUP_TICKET_IDS.split(',').map((s) => s.trim()).filter(Boolean);
    console.log(`🗑️  Cleaning up ticket(s) ${ids.join(', ')}...`);
    const trashed = await deskRequest('/tickets/moveToTrash', 'POST', { ticketIds: ids });
    if (trashed.success) {
      console.log(`   ✓ Moved to trash: ${ids.join(', ')}`);
    } else {
      console.log(`   ⚠️  moveToTrash unavailable (${trashed.status}); closing instead.`);
      for (const id of ids) {
        const note = process.env.CLEANUP_NOTE || 'Duplicate — superseded.';
        const closed = await deskRequest(`/tickets/${id}`, 'PATCH', { status: 'Closed', subject: `[CLOSED – ${note}]` });
        console.log(closed.success ? `   ✓ Closed ${id}` : `   ✗ Could not close ${id} (${closed.status}): ${closed.error}`);
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    console.log('');
  }

  const issues = (ONLY_FIRST ? CLINIC_ISSUES.slice(0, 1) : CLINIC_ISSUES).slice(START_INDEX);
  const created: Array<{ clinic: string; ticketNumber?: string; id?: string }> = [];
  const failures: Array<{ clinic: string; error: string }> = [];

  for (const issue of issues) {
    const { firstName, lastName } = splitName(issue.nurse);
    const payload: Record<string, unknown> = {
      subject: issue.subject,
      description: issue.description + footer(issue),
      departmentId: department.id,
      priority: issue.priority,
      status: 'Open',
      channel: 'Email',
      contact: {
        ...(firstName ? { firstName } : {}),
        lastName,
        email: issue.email,
        phone: issue.phone,
      },
      // NOTE: Zoho Desk v1 POST /tickets rejects a top-level `cc` field
      // ("extra parameter 'cc' is found"). CC only exists on email replies/threads,
      // not on ticket creation. Ruth is recorded as the reporter in the description footer.
    };

    if (DRY_RUN) {
      console.log(`— ${issue.clinic} [${issue.priority}]`);
      console.log(JSON.stringify(payload, null, 2));
      console.log('');
      continue;
    }

    console.log(`📨 Creating ticket: ${issue.clinic} [${issue.priority}]...`);
    const result = await deskRequest<{ id: string; ticketNumber: string; webUrl?: string }>('/tickets', 'POST', payload);

    if (!result.success) {
      console.error(`   ✗ FAILED (status ${result.status}): ${result.error}`);
      failures.push({ clinic: issue.clinic, error: `${result.status} ${result.error}` });
    } else {
      const tn = result.data?.ticketNumber;
      const id = result.data?.id;
      console.log(`   ✓ Created ticket #${tn} (id ${id})`);
      if (result.data?.webUrl) console.log(`     ${result.data.webUrl}`);
      created.push({ clinic: issue.clinic, ticketNumber: tn, id });
    }

    // Rate-limit buffer between calls.
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n──────── Summary ────────');
  if (DRY_RUN) {
    console.log(`[DRY RUN] ${issues.length} ticket payload(s) printed, nothing created.`);
    return;
  }
  console.log(`Created: ${created.length}`);
  created.forEach((c) => console.log(`  ✓ ${c.clinic} → #${c.ticketNumber} (${c.id})`));
  if (failures.length) {
    console.log(`Failed: ${failures.length}`);
    failures.forEach((f) => console.log(`  ✗ ${f.clinic} → ${f.error}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
