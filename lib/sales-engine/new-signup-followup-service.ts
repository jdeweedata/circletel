/**
 * New Signup Follow-up Service
 *
 * Finds customers who registered an account but never progressed — no order, no
 * service, no onboarding submission — so Sales can reach out before the lead goes
 * cold.
 *
 * Why this exists: a review of 13–20 Aug 2026 found six registered accounts whose
 * entire journey was "created an account, then nothing", with no contact attempt
 * from anyone. This is the same failure as the March 2026 campaign where leads
 * arrived and 60% got zero follow-up.
 *
 * Single source of truth for both callers, so they cannot drift:
 *  - scripts/flag-new-signups-to-sales.ts   (backfill, explicit date window)
 *  - lib/inngest/functions/new-signup-followup.ts (daily, rolling age threshold)
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// TYPES
// =============================================================================

export interface SignupJourney {
  customerId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  accountType: string | null;
  createdAt: string;
  emailVerified: boolean;
  hasLoggedIn: boolean;
  lastLogin: string | null;
  /** Email domain is not a known free consumer provider — treat as a B2B signal. */
  isBusinessDomain: boolean;
  hasOrder: boolean;
  hasService: boolean;
  hasOnboardingSubmission: boolean;
  daysSinceSignup: number;
  /** Human-readable journey summary used in the Desk ticket body. */
  gap: string;
}

export interface FindSignupsOptions {
  /** Backfill mode: inclusive start date (ISO date or timestamp). */
  from?: string;
  /** Backfill mode: inclusive end date (ISO date or timestamp). */
  to?: string;
  /** Cron mode: only flag signups older than this many hours. Default 24. */
  minAgeHours?: number;
  /** Cron mode: ignore signups older than this many days. Default 30. */
  maxAgeDays?: number;
  reason?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Internal + placeholder domains. Never ticket these — they are our own traffic. */
const INTERNAL_EMAIL_DOMAINS = ['circletel.co.za', 'temp.circletel.co.za'];

/** Free consumer mailbox providers — anything else is a business-domain signal. */
const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.za',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.za',
  'live.com',
  'live.co.za',
  'icloud.com',
  'me.com',
  'webmail.co.za',
  'vodamail.co.za',
  'mweb.co.za',
  'telkomsa.net',
  'protonmail.com',
  'proton.me',
  'aol.com',
  'zoho.com',
];

export const DEFAULT_FOLLOWUP_REASON = 'registered_no_order';

// =============================================================================
// HELPERS
// =============================================================================

function emailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase().trim();
}

export function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = emailDomain(email);
  return INTERNAL_EMAIL_DOMAINS.some(
    (internal) => domain === internal || domain.endsWith(`.${internal}`)
  );
}

function isBusinessDomain(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.includes(domain);
}

function daysBetween(from: string, to: Date): number {
  const started = new Date(from).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((to.getTime() - started) / 86_400_000));
}

/** Build the journey summary Sales reads in the ticket. */
function describeGap(journey: Omit<SignupJourney, 'gap'>): string {
  const parts: string[] = [];

  parts.push(
    journey.hasLoggedIn
      ? `Signed in at least once (last: ${journey.lastLogin ?? 'unknown'}).`
      : 'Never signed in after registering.'
  );
  parts.push(
    journey.emailVerified ? 'Email verified.' : 'Email never verified.'
  );
  parts.push(
    journey.phone
      ? `Phone on file: ${journey.phone}.`
      : 'No phone number on file — email is the only channel.'
  );
  parts.push('No order, no active service, and no onboarding submission.');

  if (journey.isBusinessDomain) {
    parts.push(
      `Registered with a company domain (${emailDomain(journey.email)}) — likely a business prospect.`
    );
  }

  return parts.join(' ');
}

/** Ticket priority: warmer or business-looking signups first. */
export function followUpPriority(
  journey: SignupJourney
): 'Low' | 'Medium' | 'High' | 'Urgent' {
  if (journey.isBusinessDomain) return 'High';
  if (journey.hasLoggedIn && journey.emailVerified) return 'High';
  return 'Medium';
}

// =============================================================================
// MAIN QUERY
// =============================================================================

/**
 * Find registered customers who still need a Sales follow-up.
 *
 * Excludes, in order:
 *  1. Internal / placeholder email domains (our own test traffic).
 *  2. Anyone with a consumer order, a customer service, or an onboarding
 *     submission — they are already in a real pipeline.
 *  3. Anyone already recorded in sales_followup_flags.
 */
export async function findUnflaggedSignups(
  options: FindSignupsOptions = {}
): Promise<SignupJourney[]> {
  const {
    from,
    to,
    minAgeHours = 24,
    maxAgeDays = 30,
    reason = DEFAULT_FOLLOWUP_REASON,
  } = options;

  const supabase = await createClient();
  const now = new Date();

  let query = supabase
    .from('customers')
    .select(
      'id, first_name, last_name, email, phone, account_type, email_verified, last_login, created_at'
    )
    .order('created_at', { ascending: true });

  if (from) {
    query = query.gte('created_at', from);
  } else {
    // Rolling window: don't trawl the entire history on every cron run.
    const oldest = new Date(now.getTime() - maxAgeDays * 86_400_000);
    query = query.gte('created_at', oldest.toISOString());
  }

  if (to) {
    query = query.lte('created_at', to);
  } else {
    // Give them minAgeHours to convert on their own before nagging Sales.
    const newest = new Date(now.getTime() - minAgeHours * 3_600_000);
    query = query.lte('created_at', newest.toISOString());
  }

  const { data: customers, error } = await query;
  if (error) {
    throw new Error(`Failed to load customers: ${error.message}`);
  }
  if (!customers?.length) return [];

  // Drop our own traffic before doing any further work.
  const candidates = customers.filter(
    (c) => c.email && !isInternalEmail(c.email)
  );
  if (!candidates.length) return [];

  const ids = candidates.map((c) => c.id);

  // Batch the exclusion lookups — no N+1.
  const [orders, services, submissions, flags] = await Promise.all([
    supabase.from('consumer_orders').select('customer_id').in('customer_id', ids),
    supabase.from('customer_services').select('customer_id').in('customer_id', ids),
    supabase
      .from('onboarding_submissions')
      .select('customer_id')
      .in('customer_id', ids),
    supabase
      .from('sales_followup_flags')
      .select('customer_id')
      .eq('reason', reason)
      .in('customer_id', ids),
  ]);

  for (const [label, result] of [
    ['consumer_orders', orders],
    ['customer_services', services],
    ['onboarding_submissions', submissions],
    ['sales_followup_flags', flags],
  ] as const) {
    if (result.error) {
      throw new Error(`Failed to load ${label}: ${result.error.message}`);
    }
  }

  const toIdSet = (rows: { customer_id: string | null }[] | null) =>
    new Set(
      (rows ?? [])
        .map((r) => r.customer_id)
        .filter((id): id is string => Boolean(id))
    );

  const orderIds = toIdSet(orders.data);
  const serviceIds = toIdSet(services.data);
  const submissionIds = toIdSet(submissions.data);
  const flaggedIds = toIdSet(flags.data);

  const journeys: SignupJourney[] = [];

  for (const customer of candidates) {
    if (flaggedIds.has(customer.id)) continue;

    const hasOrder = orderIds.has(customer.id);
    const hasService = serviceIds.has(customer.id);
    const hasOnboardingSubmission = submissionIds.has(customer.id);

    // Already in a real pipeline — Sales doesn't need a cold nudge.
    if (hasOrder || hasService || hasOnboardingSubmission) continue;

    const email = customer.email as string;
    const firstName = (customer.first_name ?? '').trim();
    const lastName = (customer.last_name ?? '').trim();
    const phone = customer.phone?.trim() ? customer.phone.trim() : null;

    const base = {
      customerId: customer.id,
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(' ') || email,
      email,
      phone,
      accountType: customer.account_type ?? null,
      createdAt: customer.created_at as string,
      emailVerified: Boolean(customer.email_verified),
      hasLoggedIn: Boolean(customer.last_login),
      lastLogin: customer.last_login ?? null,
      isBusinessDomain: isBusinessDomain(email),
      hasOrder,
      hasService,
      hasOnboardingSubmission,
      daysSinceSignup: daysBetween(customer.created_at as string, now),
    };

    journeys.push({ ...base, gap: describeGap(base) });
  }

  return journeys;
}

// =============================================================================
// TICKET CONTENT
// =============================================================================

export function buildTicketSubject(journey: SignupJourney): string {
  const age =
    journey.daysSinceSignup === 0
      ? 'today'
      : journey.daysSinceSignup === 1
        ? '1 day'
        : `${journey.daysSinceSignup} days`;
  return `New signup — no order yet: ${journey.fullName} (${age})`;
}

export function buildTicketDescription(journey: SignupJourney): string {
  const signedUp = new Date(journey.createdAt).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
  });

  return [
    `${journey.fullName} registered a CircleTel account but has not progressed.`,
    '',
    'JOURNEY',
    `  Registered:    ${signedUp} (SAST)`,
    `  Email:         ${journey.email}${journey.emailVerified ? ' (verified)' : ' (NOT verified)'}`,
    `  Phone:         ${journey.phone ?? 'none on file'}`,
    `  Account type:  ${journey.accountType ?? 'unknown'}`,
    `  Signed in:     ${journey.hasLoggedIn ? `yes — last ${journey.lastLogin}` : 'never'}`,
    `  Order:         none`,
    `  Service:       none`,
    `  Onboarding:    not started`,
    '',
    'SUMMARY',
    `  ${journey.gap}`,
    '',
    'SUGGESTED NEXT ACTION',
    `  ${suggestedAction(journey)}`,
    '',
    `Flagged automatically — customer ID ${journey.customerId}.`,
    'Note: this customer has NOT opted in to WhatsApp. Contact by phone or email only.',
  ].join('\n');
}

function suggestedAction(journey: SignupJourney): string {
  if (!journey.phone) {
    return 'No phone number — email them to ask what they were looking for and offer a coverage check.';
  }
  if (journey.isBusinessDomain) {
    return `Call ${journey.phone} — company domain suggests a business requirement. Qualify for a B2B package.`;
  }
  if (journey.hasLoggedIn) {
    return `Call ${journey.phone} — they came back to sign in, so intent is warm. Ask what stopped them ordering.`;
  }
  return `Call ${journey.phone} — they registered but never returned. Confirm coverage and walk them through packages.`;
}

/** Digest for the Sales team. Internal only — never sent to customers. */
export function buildSalesDigest(
  journeys: SignupJourney[],
  ticketsCreated: number
): string {
  if (!journeys.length) {
    return 'CircleTel sales alert: no new signups needing follow-up.';
  }

  const oldest = journeys.reduce((a, b) =>
    a.daysSinceSignup >= b.daysSinceSignup ? a : b
  );

  const lines = [
    `CircleTel sales alert: ${journeys.length} new signup(s) with no order need follow-up.`,
    `Oldest: ${oldest.fullName}, ${oldest.daysSinceSignup} day(s).`,
    `Zoho Desk Sales tickets created: ${ticketsCreated}.`,
    '',
  ];

  for (const j of journeys) {
    lines.push(
      `• ${j.fullName} — ${j.phone ?? 'no phone'} — ${j.daysSinceSignup}d${j.isBusinessDomain ? ' (business)' : ''}`
    );
  }

  return lines.join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** HTML digest emailed to the Sales team. */
export function buildSalesDigestHtml(
  journeys: SignupJourney[],
  ticketsCreated: number
): string {
  const rows = journeys
    .map((j) => {
      const ticketNote = j.isBusinessDomain
        ? ' <span style="color:#E87A1E;font-weight:600">business</span>'
        : '';
      return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">
          <strong>${escapeHtml(j.fullName)}</strong>${ticketNote}<br>
          <span style="color:#666;font-size:13px">${escapeHtml(j.email)}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(j.phone ?? 'no phone')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${j.daysSinceSignup}d</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#444">
          ${escapeHtml(j.hasLoggedIn ? 'signed in' : 'never signed in')},
          ${escapeHtml(j.emailVerified ? 'email verified' : 'email unverified')}
        </td>
      </tr>`;
    })
    .join('');

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:720px;color:#1B2A4A">
  <h2 style="color:#1B2A4A;margin-bottom:4px">New signups needing follow-up</h2>
  <p style="color:#444;margin-top:0">
    ${journeys.length} customer(s) registered a CircleTel account but have no order,
    no active service, and no onboarding submission.
    <strong>${ticketsCreated}</strong> Zoho Desk ticket(s) were opened in the Sales queue.
  </p>
  <table style="border-collapse:collapse;width:100%;font-size:14px">
    <thead>
      <tr style="background:#f6f7f9;text-align:left">
        <th style="padding:8px 12px">Customer</th>
        <th style="padding:8px 12px">Phone</th>
        <th style="padding:8px 12px;text-align:center">Age</th>
        <th style="padding:8px 12px">Journey</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="color:#888;font-size:12px;margin-top:20px">
    None of these customers have opted in to WhatsApp — contact by phone or email only.
    Work them from the Sales queue in Zoho Desk.
  </p>
</div>`.trim();
}

// =============================================================================
// ORCHESTRATION
// =============================================================================

export interface FollowupRunResult {
  candidates: number;
  ticketed: string[];
  errors: string[];
  salesAlerted: boolean;
  durationMs: number;
}

/** Zoho rate-limits token refresh under load — space out the Desk calls. */
const DESK_CALL_DELAY_MS = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Full run: find unflagged signups, open one Sales ticket each, record the flags,
 * then email a single digest to the Sales team.
 *
 * Shared by the cron route (app/api/cron/new-signup-followup) and the Inngest
 * function, so the two cannot drift. The backfill script reuses the builders
 * directly because it needs DRY_RUN / ONLY_FIRST ergonomics.
 */
export async function runNewSignupFollowup(
  options: FindSignupsOptions & { skipAlert?: boolean } = {}
): Promise<FollowupRunResult> {
  const startedAt = Date.now();

  const candidates = await findUnflaggedSignups(options);
  if (!candidates.length) {
    return {
      candidates: 0,
      ticketed: [],
      errors: [],
      salesAlerted: false,
      durationMs: Date.now() - startedAt,
    };
  }

  // createTicket() falls back to ZOHO_DESK_DEPARTMENT_ID (support) before the sales
  // department, so pass this explicitly or every ticket lands in the wrong queue.
  const salesDepartmentId = process.env.ZOHO_DESK_SALES_DEPARTMENT_ID;
  if (!salesDepartmentId) {
    throw new Error(
      'ZOHO_DESK_SALES_DEPARTMENT_ID is not set — refusing to file Sales tickets into the support queue.'
    );
  }

  const { createMintedZohoDeskService } = await import(
    '@/lib/integrations/zoho/desk-service'
  );
  const desk = await createMintedZohoDeskService();
  const supabase = await createClient();

  const ticketed: string[] = [];
  const errors: string[] = [];

  for (const journey of candidates) {
    const result = await desk.createTicket({
      subject: buildTicketSubject(journey),
      description: buildTicketDescription(journey),
      customerEmail: journey.email,
      customerName: journey.fullName,
      phone: journey.phone ?? undefined,
      priority: followUpPriority(journey),
      departmentId: salesDepartmentId,
      category: 'Sales',
      subCategory: 'New signup follow-up',
    });

    if (!result.success || !result.ticket) {
      errors.push(`${journey.email}: ${result.error ?? 'unknown error'}`);
      await sleep(DESK_CALL_DELAY_MS);
      continue;
    }

    const { error: flagError } = await supabase.from('sales_followup_flags').insert({
      customer_id: journey.customerId,
      reason: options.reason ?? DEFAULT_FOLLOWUP_REASON,
      desk_ticket_id: result.ticket.id,
      desk_ticket_number: result.ticket.ticketNumber,
      journey_snapshot: journey,
    });

    if (flagError) {
      // Ticket exists but isn't recorded — the next run would duplicate it.
      errors.push(
        `${journey.email}: ticket ${result.ticket.ticketNumber} created but flag insert failed (${flagError.message}) — WILL DUPLICATE on next run`
      );
    } else {
      ticketed.push(journey.customerId);
    }

    await sleep(DESK_CALL_DELAY_MS);
  }

  const salesAlerted =
    options.skipAlert || !ticketed.length
      ? false
      : await sendSalesDigest(
          candidates.filter((j) => ticketed.includes(j.customerId)),
          ticketed,
          options.reason ?? DEFAULT_FOLLOWUP_REASON
        );

  return {
    candidates: candidates.length,
    ticketed,
    errors,
    salesAlerted,
    durationMs: Date.now() - startedAt,
  };
}

/**
 * Digest emailed to the Sales team. Best effort — the Desk tickets are the
 * deliverable, so a failed notification never fails the run.
 *
 * Email rather than WhatsApp: none of these customers opted in to WhatsApp, and an
 * internal WhatsApp alert would need an open 24h window (unreliable on a schedule)
 * plus a Meta-approved template. Email has neither constraint.
 */
export async function sendSalesDigest(
  flaggedJourneys: SignupJourney[],
  ticketedIds: string[],
  reason: string
): Promise<boolean> {
  const to = process.env.SALES_TEAM_EMAIL || 'sales@circletel.co.za';

  try {
    const { EmailChannel } = await import('@/lib/notifications/channels/email-channel');

    const oldest = flaggedJourneys.reduce((a, b) =>
      a.daysSinceSignup >= b.daysSinceSignup ? a : b
    );

    const result = await EmailChannel.send({
      to,
      subject: `[Sales] ${flaggedJourneys.length} new signup(s) with no order — oldest ${oldest.daysSinceSignup}d`,
      html: buildSalesDigestHtml(flaggedJourneys, ticketedIds.length),
      // notify.circletel.co.za is the only Resend-verified domain — do not change
      // this to notifications.circletelsa.co.za, which is unverified and hard-fails.
      from: 'CircleTel Alerts <alerts@notify.circletel.co.za>',
    });

    if (!result.success) {
      console.warn(`[NewSignupFollowup] Digest email failed: ${result.error}`);
      return false;
    }

    const supabase = await createClient();
    await supabase
      .from('sales_followup_flags')
      .update({ sales_alerted_at: new Date().toISOString() })
      .in('customer_id', ticketedIds)
      .eq('reason', reason);

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[NewSignupFollowup] Digest failed: ${message}`);
    return false;
  }
}
