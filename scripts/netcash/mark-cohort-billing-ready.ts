/**
 * Backfill script: Mark Unjani clinic cohort as billing_ready
 *
 * Finds all customers with:
 * - An active customer_services row
 * - business_name ILIKE 'Unjani%'
 *
 * Calls maybeMarkBillingReady for each, logging which flipped to billing_ready
 * and which did not (with reason if determinable).
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/netcash/mark-cohort-billing-ready.ts
 *
 * This is safe to run repeatedly — the function is idempotent.
 */

import { createClient } from '@/lib/supabase/server';
import { maybeMarkBillingReady } from '@/lib/onboarding/billing-ready';

interface CohortMember {
  customerId: string;
  accountNumber: string;
  businessName: string;
  activeServiceCount: number;
  hasBankDetails: boolean;
  vetted: boolean;
}

async function main() {
  console.log('Starting Unjani cohort billing_ready backfill...\n');

  const supabase = await createClient();

  // Get all active Unjani clinic accounts
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select(
      `
      id,
      account_number,
      business_name,
      onboarding_status,
      customer_services!inner (
        id,
        status
      ),
      customer_payment_methods (
        id,
        is_active,
        method_type,
        encrypted_details
      ),
      onboarding_submissions (
        id,
        document_vetting_status
      )
    `
    )
    .ilike('business_name', 'Unjani%')
    .eq('customer_services.status', 'active');

  if (customerError) {
    console.error('Failed to fetch customers:', customerError);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('No Unjani clinics with active services found.');
    return;
  }

  console.log(`Found ${customers.length} Unjani clinics with active services\n`);

  const cohort: CohortMember[] = customers.map((c: any) => {
    const bankDetails = (c.customer_payment_methods || []).find(
      (pm: any) =>
        pm.is_active &&
        pm.method_type === 'debit_order' &&
        pm.encrypted_details?.account_number
    );

    const latestSubmission = (c.onboarding_submissions || []).sort(
      (a: any, b: any) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )[0];

    return {
      customerId: c.id,
      accountNumber: c.account_number,
      businessName: c.business_name,
      activeServiceCount: (c.customer_services || []).length,
      hasBankDetails: !!bankDetails,
      vetted: latestSubmission?.document_vetting_status === 'approved',
    };
  });

  console.log('Cohort Summary:');
  console.log('==============');
  const vetted = cohort.filter((m) => m.vetted).length;
  const bankDetails = cohort.filter((m) => m.hasBankDetails).length;
  console.log(`  Total: ${cohort.length}`);
  console.log(`  Vetting approved: ${vetted}`);
  console.log(`  Bank details on file: ${bankDetails}`);
  console.log();

  // Process each clinic
  let flipped = 0;
  let unchanged = 0;
  const failures: { accountNumber: string; reason: string }[] = [];

  for (const member of cohort) {
    console.log(`Processing ${member.accountNumber} (${member.businessName})...`);

    const result = await maybeMarkBillingReady(supabase, member.customerId);

    if (result) {
      console.log(`  ✓ Flipped to billing_ready`);
      flipped++;
    } else {
      unchanged++;
      if (!member.vetted) {
        failures.push({
          accountNumber: member.accountNumber,
          reason: 'Vetting not approved',
        });
      } else if (!member.hasBankDetails) {
        failures.push({
          accountNumber: member.accountNumber,
          reason: 'Missing bank details',
        });
      } else if (member.activeServiceCount === 0) {
        failures.push({
          accountNumber: member.accountNumber,
          reason: 'No active service',
        });
      } else {
        failures.push({
          accountNumber: member.accountNumber,
          reason: 'Unknown (check manually)',
        });
      }
      console.log(
        `  ✗ Unchanged (${failures[failures.length - 1].reason})`
      );
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Report
  console.log('\n\nBackfill Summary');
  console.log('================');
  console.log(`Total clinics processed: ${cohort.length}`);
  console.log(`Flipped to billing_ready: ${flipped}`);
  console.log(`Unchanged: ${unchanged}`);

  if (failures.length > 0) {
    console.log('\nFailed to flip (reasons):');
    failures.forEach((f) => {
      console.log(`  ${f.accountNumber}: ${f.reason}`);
    });
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
