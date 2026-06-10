/**
 * Clinic Mandate Status Poll (NetCash eMandate backstop)
 *
 * Daily cron that reconciles clinics stuck on `mandate_status='pending'` against
 * NetCash's authoritative mandate statuses, so a MISSED postback never strands a
 * clinic. Pulls the bulk mandate-data file from NetCash and matches by account ref.
 *
 * Primary feedback is still the postback (/api/webhooks/netcash/emandate); this is
 * the safety net.
 *
 * Trigger: Daily at 08:00 SAST.
 * IMPORTANT: must be wired in Coolify's cron settings (vercel.json crons are inactive).
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { fetchMandateStatuses } from '@/lib/payments/netcash-mandate-status';
import { maybeMarkBillingReady } from '@/lib/onboarding/billing-ready';

export const clinicMandatePollFunction = inngest.createFunction(
  {
    id: 'clinic-mandate-poll',
    name: 'Clinic Mandate Status Poll (NetCash backstop)',
    retries: 2,
    concurrency: { limit: 1 },
  },
  { cron: 'TZ=Africa/Johannesburg 0 8 * * *' }, // Daily at 08:00 SAST
  async ({ step }) => {
    const supabase = await createClient();
    apiLogger.info('[Mandate Poll] Reconciling pending eMandates against NetCash');

    // 1) Pending debit-order mandates + the clinic's account_number (the match key)
    const { data: pending, error } = await supabase
      .from('customer_payment_methods')
      .select('id, customer_id, encrypted_details, customers:customer_id ( account_number )')
      .eq('method_type', 'debit_order')
      .eq('mandate_status', 'pending');

    if (error) {
      apiLogger.error('[Mandate Poll] Failed to load pending mandates', { error });
      return { success: false, error: error.message };
    }
    if (!pending || pending.length === 0) {
      apiLogger.info('[Mandate Poll] No pending mandates');
      return { success: true, pending: 0, activated: 0, failed: 0 };
    }

    // 2) Pull NetCash statuses (async file; poll inside)
    const rows = await step.run('fetch-netcash-mandate-statuses', async () => {
      try {
        const r = await fetchMandateStatuses({ maxWaitMs: 180_000 });
        return { ok: true as const, rows: r };
      } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
      }
    });

    if (!rows.ok) {
      apiLogger.error('[Mandate Poll] NetCash fetch failed', { error: rows.error });
      return { success: false, error: rows.error, pending: pending.length };
    }

    const byRef = new Map(rows.rows.map((r) => [r.accountRef.toUpperCase(), r]));

    let activated = 0;
    let failed = 0;

    // 3) Reconcile each pending mandate
    for (const pm of pending) {
      const customer = Array.isArray(pm.customers) ? pm.customers[0] : pm.customers;
      const accountNumber = (customer as any)?.account_number as string | undefined;
      if (!accountNumber) continue;

      const match = byRef.get(accountNumber.toUpperCase());
      if (!match) continue; // not in the file yet

      if (match.outcome === 'active') {
        const enc = { ...(pm.encrypted_details || {}), verified: true };
        await supabase
          .from('customer_payment_methods')
          .update({ mandate_status: 'active', is_active: true, encrypted_details: enc })
          .eq('id', pm.id);
        await maybeMarkBillingReady(supabase, pm.customer_id);
        activated++;
        apiLogger.info('[Mandate Poll] Activated mandate from NetCash status', {
          accountNumber, statusCode: match.statusCode, label: match.label,
        });
      } else if (match.outcome === 'failed') {
        await supabase
          .from('customer_payment_methods')
          .update({ mandate_status: 'failed' })
          .eq('id', pm.id);
        failed++;
        apiLogger.warn('[Mandate Poll] Marked mandate failed from NetCash status', {
          accountNumber, statusCode: match.statusCode, label: match.label,
        });
      }
      // outcome 'pending' → leave as-is
    }

    apiLogger.info('[Mandate Poll] Done', { pending: pending.length, activated, failed });
    return { success: true, pending: pending.length, activated, failed };
  }
);
