/**
 * Flag new registered signups to the Sales desk.
 *
 * Backfill counterpart to lib/inngest/functions/new-signup-followup.ts. Both share
 * lib/sales-engine/new-signup-followup-service.ts so they cannot drift.
 *
 * For each customer who registered but never ordered, this:
 *   1. Creates a Zoho Desk ticket in the SALES department with their journey.
 *   2. Records the flag in sales_followup_flags (idempotency — re-runs create nothing).
 *   3. Sends ONE digest to the internal Sales WhatsApp number.
 *
 * The WhatsApp digest goes to CircleTel's own sales number, never to customers —
 * none of them have opted in to WhatsApp.
 *
 * Usage:
 *   set -a && source /home/circletel/.env.local && set +a
 *
 *   # dry run over the backfill window
 *   DRY_RUN=true npx tsx scripts/flag-new-signups-to-sales.ts --from=2026-08-13 --to=2026-08-20
 *
 *   # create just the first ticket, to verify it lands in the Sales department
 *   ONLY_FIRST=true npx tsx scripts/flag-new-signups-to-sales.ts --from=2026-08-13 --to=2026-08-20
 *
 *   # full run
 *   npx tsx scripts/flag-new-signups-to-sales.ts --from=2026-08-13 --to=2026-08-20
 *
 * Flags:
 *   DRY_RUN=true     print what would happen, touch nothing
 *   ONLY_FIRST=true  process only the first candidate
 *   START_INDEX=N    skip the first N candidates (resume a partial run)
 *   SKIP_WHATSAPP=true  create tickets but send no digest
 */

import { createClient } from '@/lib/supabase/server';
import { createMintedZohoDeskService } from '@/lib/integrations/zoho/desk-service';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import {
  findUnflaggedSignups,
  buildTicketSubject,
  buildTicketDescription,
  buildSalesDigest,
  followUpPriority,
  DEFAULT_FOLLOWUP_REASON,
  type SignupJourney,
} from '@/lib/sales-engine/new-signup-followup-service';

// Zoho rate-limits token refresh under script load — space out the Desk calls.
const DESK_CALL_DELAY_MS = 200;

const DRY_RUN = process.env.DRY_RUN === 'true';
const ONLY_FIRST = process.env.ONLY_FIRST === 'true';
const SKIP_WHATSAPP = process.env.SKIP_WHATSAPP === 'true';
const START_INDEX = Number.parseInt(process.env.START_INDEX ?? '0', 10) || 0;

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const from = arg('from');
  const to = arg('to');

  console.log('='.repeat(72));
  console.log('Flag new signups to Sales');
  console.log('='.repeat(72));
  console.log(`  Window:     ${from ?? '(rolling)'} → ${to ?? '(rolling)'}`);
  console.log(`  Dry run:    ${DRY_RUN}`);
  console.log(`  Only first: ${ONLY_FIRST}`);
  if (START_INDEX) console.log(`  Start index: ${START_INDEX}`);
  console.log('');

  // `to` as a bare date means "end of that day", not midnight.
  const toBound = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to}T23:59:59.999Z` : to;

  const all = await findUnflaggedSignups({ from, to: toBound });

  let candidates = all.slice(START_INDEX);
  if (ONLY_FIRST) candidates = candidates.slice(0, 1);

  if (!candidates.length) {
    console.log('No signups need flagging. Nothing to do.');
    return;
  }

  console.log(`Found ${all.length} signup(s) needing follow-up; processing ${candidates.length}:\n`);
  for (const j of candidates) {
    console.log(`  • ${j.fullName} <${j.email}> — ${j.phone ?? 'no phone'} — ${j.daysSinceSignup}d — ${followUpPriority(j)}`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('--- DRY RUN: sample ticket ---\n');
    console.log(`Subject: ${buildTicketSubject(candidates[0])}`);
    console.log(`Priority: ${followUpPriority(candidates[0])}`);
    console.log('');
    console.log(buildTicketDescription(candidates[0]));
    console.log('\n--- DRY RUN: WhatsApp digest ---\n');
    console.log(buildSalesDigest(candidates, candidates.length));
    console.log('\nDry run complete. Nothing was created.');
    return;
  }

  // createTicket() falls back to ZOHO_DESK_DEPARTMENT_ID (support) before the sales
  // department, so pass this explicitly or every ticket lands in the wrong queue.
  const salesDepartmentId = process.env.ZOHO_DESK_SALES_DEPARTMENT_ID;
  if (!salesDepartmentId) {
    throw new Error(
      'ZOHO_DESK_SALES_DEPARTMENT_ID is not set — refusing to file Sales tickets into the support queue.'
    );
  }

  const desk = await createMintedZohoDeskService();
  const supabase = await createClient();

  const flagged: SignupJourney[] = [];
  const failures: { journey: SignupJourney; error: string }[] = [];

  for (const journey of candidates) {
    console.log(`→ ${journey.fullName}`);

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
      const message = result.error ?? 'unknown error';
      console.error(`   ✗ ticket failed: ${message}`);
      failures.push({ journey, error: message });
      await sleep(DESK_CALL_DELAY_MS);
      continue;
    }

    const ticket = result.ticket;
    console.log(`   ✓ ticket ${ticket.ticketNumber || ticket.id}`);

    const { error: flagError } = await supabase.from('sales_followup_flags').insert({
      customer_id: journey.customerId,
      reason: DEFAULT_FOLLOWUP_REASON,
      desk_ticket_id: ticket.id,
      desk_ticket_number: ticket.ticketNumber,
      journey_snapshot: journey,
    });

    if (flagError) {
      // The ticket exists but isn't recorded — say so loudly, or the next run duplicates it.
      console.error(
        `   ! ticket created but flag insert failed: ${flagError.message} — re-running will DUPLICATE this ticket`
      );
      failures.push({ journey, error: `flag insert: ${flagError.message}` });
    } else {
      flagged.push(journey);
    }

    await sleep(DESK_CALL_DELAY_MS);
  }

  // WhatsApp digest — internal sales number only.
  if (flagged.length && !SKIP_WHATSAPP) {
    const to = process.env.SALES_ALERT_WHATSAPP_TO;
    if (!to) {
      console.warn('\n! SALES_ALERT_WHATSAPP_TO is not set — skipping the WhatsApp digest.');
    } else {
      const digest = buildSalesDigest(flagged, flagged.length);
      console.log('\nSending digest to Sales WhatsApp…');
      // sendText needs an open 24h window: message the CircleTel business number first.
      const send = await whatsAppService.sendText(to, digest);
      if (send.success) {
        console.log('   ✓ digest sent');
        await supabase
          .from('sales_followup_flags')
          .update({ whatsapp_alerted_at: new Date().toISOString() })
          .in('customer_id', flagged.map((j) => j.customerId))
          .eq('reason', DEFAULT_FOLLOWUP_REASON);
      } else {
        console.warn(`   ! digest not sent: ${send.error}`);
        console.warn('     (sendText needs an open 24h window — send any message to the CircleTel number, then re-run with SKIP_WHATSAPP unset.)');
      }
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log(`Flagged: ${flagged.length}   Failed: ${failures.length}`);
  for (const f of failures) {
    console.log(`  ✗ ${f.journey.fullName}: ${f.error}`);
  }
  console.log('='.repeat(72));

  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
