/**
 * One-time, idempotent backfill: merge incumbent_isp / incumbent_cost /
 * contract_status into each Unjani customer's clinic_details, derived from the
 * network register (matched by clinic name). Other clinic_details keys are
 * preserved. Re-runnable.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/backfill-clinic-incumbent.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { incumbentForClinic } from '@/lib/onboarding/clinic-incumbent';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: clinics, error } = await supabase
    .from('customers')
    .select('id, account_number, business_name, clinic_details')
    .ilike('business_name', '%unjani%');
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const c of clinics ?? []) {
    const details = (c.clinic_details ?? {}) as Record<string, unknown>;
    const name = (details.clinic_name as string) || c.business_name || '';
    const inc = incumbentForClinic(name);
    const merged = { ...details, ...inc };
    const { error: upErr } = await supabase
      .from('customers')
      .update({ clinic_details: merged })
      .eq('id', c.id);
    if (upErr) {
      console.error(`✗ ${c.account_number}: ${upErr.message}`);
      continue;
    }
    updated++;
    console.log(`✓ ${c.account_number} (${name}) -> ${inc.incumbent_isp ?? '—'} / ${inc.contract_status}`);
  }
  console.log(`\nBackfilled ${updated}/${clinics?.length ?? 0} clinics.`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
