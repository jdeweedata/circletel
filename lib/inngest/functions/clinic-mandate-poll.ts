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
    name: 'Clinic Mandate Status Poll (NetCash backstop) - DISABLED',
    retries: 2,
    concurrency: { limit: 1 },
  },
  { cron: 'TZ=Africa/Johannesburg 0 8 * * *' }, // Daily at 08:00 SAST
  async ({ step }) => {
    // DISABLED: billing no longer depends on eMandate signing; click-wrap mandate + TwoDay debit is the path
    // The original mandate polling code is retained below but not executed (unreachable after this return).
    apiLogger.info('[Mandate Poll] DISABLED: billing no longer depends on eMandate signing');
    return { success: true, disabled: true };
  }
);
