/**
 * One-time, idempotent backfill: populate corporate_sites.customer_id so the
 * six onboarding stages in the Unjani Connect guide (v1.22) can be derived per
 * site. Stages 1-4 live on the customer side, stages 5-6 on the site side, and
 * until the customer_id column there was no key joining them.
 *
 * Matching, in priority order:
 *   1. site_contact_email == customers.email (case-insensitive)
 *      Authoritative. Required for clinics trading under another legal entity —
 *      e.g. Fleurhof's customer is "Bhekilanga Health Care", and Cosmo City's is
 *      "Mbali Zwakele Gumbi T/A Unjani Clinic - Cosmo City". A name-only match
 *      misses both.
 *   2. Normalised clinic name, used only when the site has no contact email.
 *
 * If the two rules disagree the site is reported and left untouched — a wrong
 * link is worse than a null one.
 *
 * Sites with neither signal (placeholder rows created before onboarding starts)
 * are expected to stay null.
 *
 * Dry run (default):
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/portal/backfill-corporate-site-customer-id.ts
 *
 * Apply:
 *   ... npx tsx scripts/portal/backfill-corporate-site-customer-id.ts --apply
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';

/** "Unjani Clinic - Lens ext 10" and "Mbali ... T/A Unjani Clinic - Lens ext 10" both → "lensext10". */
function clinicKey(name: string | null): string {
  if (!name) return '';
  const withoutPrefix = name.replace(/^.*[Uu]njani [Cc]linic[ -]*/, '');
  return withoutPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const email = (value: string | null) => value?.trim().toLowerCase() || '';

async function main() {
  const apply = process.argv.includes('--apply');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: sites, error: sitesError } = await supabase
    .from('corporate_sites')
    .select('id, site_name, site_contact_email, status, customer_id')
    .order('site_name');
  if (sitesError) throw new Error(sitesError.message);

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, business_name, email, account_number');
  if (customersError) throw new Error(customersError.message);

  const byEmail = new Map<string, (typeof customers)[number]>();
  const byName = new Map<string, (typeof customers)[number]>();
  for (const customer of customers ?? []) {
    const e = email(customer.email);
    if (e && !byEmail.has(e)) byEmail.set(e, customer);
    const k = clinicKey(customer.business_name);
    if (k && !byName.has(k)) byName.set(k, customer);
  }

  const updates: Array<{ id: string; customer_id: string; site: string; via: string }> = [];
  const conflicts: string[] = [];
  const unmatched: string[] = [];

  for (const site of sites ?? []) {
    const emailHit = byEmail.get(email(site.site_contact_email));
    const nameHit = byName.get(clinicKey(site.site_name));

    if (emailHit && nameHit && emailHit.id !== nameHit.id) {
      conflicts.push(
        `${site.site_name}: email→${emailHit.business_name} (${emailHit.account_number}) ` +
          `vs name→${nameHit.business_name} (${nameHit.account_number})`
      );
      continue;
    }

    const match = emailHit ?? nameHit;
    if (!match) {
      unmatched.push(`${site.site_name} [${site.status}]`);
      continue;
    }

    if (site.customer_id === match.id) continue;

    updates.push({
      id: site.id,
      customer_id: match.id,
      site: site.site_name,
      via: emailHit ? 'email' : 'name',
    });
  }

  console.log(`Sites:      ${sites?.length ?? 0}`);
  console.log(`Customers:  ${customers?.length ?? 0}`);
  console.log(`To link:    ${updates.length}`);
  for (const u of updates) console.log(`  ${u.site} (via ${u.via})`);

  if (conflicts.length) {
    console.log(`\nCONFLICTS — left untouched (${conflicts.length}):`);
    for (const c of conflicts) console.log(`  ${c}`);
  }
  if (unmatched.length) {
    console.log(`\nUnmatched — expected for pre-onboarding placeholders (${unmatched.length}):`);
    for (const u of unmatched) console.log(`  ${u}`);
  }

  if (!apply) {
    console.log('\nDRY RUN — nothing written. Re-run with --apply.');
    return;
  }

  let linked = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from('corporate_sites')
      .update({ customer_id: update.customer_id })
      .eq('id', update.id);
    if (error) {
      console.error(`  ✗ ${update.site}: ${error.message}`);
      continue;
    }
    linked++;
  }

  console.log(`\nDone — ${linked} sites linked.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
