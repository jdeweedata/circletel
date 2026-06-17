/**
 * NetCash eMandate Load Report
 *
 * Pulls the batch load report for a given eMandate file token so you can verify
 * whether the mandate rows (including bank account / branch fields) were accepted
 * by NetCash, or rejected with errors.
 *
 * The file token is stored on the onboarding submission as `netcash_file_token`
 * after a successful BatchFileUpload (see app/api/onboarding/submit/route.ts).
 *
 * Usage:
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/netcash-emandate-load-report.ts <fileToken>
 *
 *   # or look the token up by clinic account number:
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/netcash-emandate-load-report.ts --account CT-2026-00017
 *
 * Requires: NETCASH_DEBIT_ORDER_SERVICE_KEY, NETCASH_WS_URL
 * For --account lookup also: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // CircleTel credentials live in .env.local
dotenv.config();                        // fallback to .env

import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';

async function resolveTokenForAccount(accountNumber: string): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for --account lookup');
  }
  const supabase = createClient(url, key);

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('id')
    .eq('account_number', accountNumber)
    .single();
  if (custErr || !customer) throw new Error(`Customer not found for account ${accountNumber}: ${custErr?.message ?? ''}`);

  const { data: submission, error: subErr } = await supabase
    .from('onboarding_submissions')
    .select('netcash_file_token')
    .eq('customer_id', customer.id)
    .not('netcash_file_token', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subErr) throw new Error(`Failed to read submission: ${subErr.message}`);
  if (!submission?.netcash_file_token) throw new Error(`No netcash_file_token on submission for ${accountNumber} (mandate may not have been submitted)`);

  console.log(`Resolved file token for ${accountNumber}: ${submission.netcash_file_token}`);
  return submission.netcash_file_token;
}

async function main() {
  const args = process.argv.slice(2);
  let fileToken: string | undefined;

  const accountFlagIdx = args.indexOf('--account');
  if (accountFlagIdx !== -1) {
    const accountNumber = args[accountFlagIdx + 1];
    if (!accountNumber) {
      console.error('Usage: --account <CT-YYYY-NNNNN>');
      process.exit(1);
    }
    fileToken = await resolveTokenForAccount(accountNumber);
  } else {
    fileToken = args[0];
  }

  if (!fileToken) {
    console.error('Provide a file token or --account <accountNumber>.');
    console.error('  npx tsx scripts/netcash-emandate-load-report.ts <fileToken>');
    console.error('  npx tsx scripts/netcash-emandate-load-report.ts --account CT-2026-00017');
    process.exit(1);
  }

  if (!process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY) {
    console.error('NETCASH_DEBIT_ORDER_SERVICE_KEY is not set — run with: set -a && source .env.local && set +a && npx tsx ...');
    process.exit(1);
  }

  console.log('\nRequesting NetCash load report for file token:', fileToken, '\n');

  const service = new NetCashEMandateBatchService();
  const report = await service.requestLoadReport(fileToken);

  console.log('========================================');
  console.log('Batch name :', report.batchName ?? '(none)');
  console.log('Result     :', report.result ?? '(unknown)');
  console.log('Success    :', report.success);
  console.log('Error count:', report.errors.length);
  console.log('========================================');

  if (report.errors.length > 0) {
    console.log('\nErrors / warnings (these would include any rejected bank/branch fields):');
    report.errors.forEach((e, i) => {
      console.log(`  ${i + 1}. account=${e.accountReference || '-'} line=${e.lineNumber || '-'} :: ${e.message}`);
    });
    console.log('\n=> Bank fields were NOT all accepted cleanly. Review the messages above.');
  } else if (report.result === 'SUCCESSFUL') {
    console.log('\n=> Batch loaded SUCCESSFULLY with no errors — bank account, branch code and all mandate fields were accepted by NetCash.');
  } else {
    console.log('\n=> No row-level errors reported, but result was not "SUCCESSFUL". Check the raw result above.');
  }
}

main().catch((err) => {
  console.error('Failed to pull load report:', err instanceof Error ? err.message : err);
  process.exit(1);
});
