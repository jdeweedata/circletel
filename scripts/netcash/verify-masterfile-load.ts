/**
 * GO/NO-GO spike: does MandateToMasterfile promote an UNSIGNED mandate so it
 * becomes collectable? Run against the NetCash TEST profile ONLY.
 *
 * Run:
 *   set -a && source .env.local && set +a && \
 *   NETCASH_DEBIT_ORDER_SERVICE_KEY="$NETCASH_TEST_DEBIT_ORDER_SERVICE_KEY" \
 *   npx tsx scripts/netcash/verify-masterfile-load.ts
 */
import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';
import { netcashDebitBatchService } from '@/lib/payments/netcash-debit-batch-service';

const REF = `CTTEST${Date.now()}`.substring(0, 22);

async function main() {
  const svc = new NetCashEMandateBatchService();

  // 1. Submit a fresh test mandate (Mandates instruction) — leave it UNSIGNED.
  console.log(`[1] Submitting test mandate ${REF} (will remain unsigned)...`);
  const mandate = await svc.submitMandate({
    accountReference: REF,
    mandateName: 'Masterfile Spike Test',
    isConsumer: false,
    firstName: 'Spike',
    surname: 'Test',
    mobileNumber: '0820000000',
    mandateAmount: 1.0, // minimal
    debitFrequency: 1,
    commencementMonth: new Date().getMonth() + 1,
    commencementDay: '01',
    agreementDate: new Date(),
    agreementReference: `SPIKE-${REF}`,
    tradingName: 'Spike Test Biz',
    registrationNumber: '0000/000000/07',
    registeredName: 'Spike Test Biz',
    bankDetailType: 1,
    bankAccountName: 'Spike Test Biz',
    bankAccountType: 1, // 1 = Current
    branchCode: '250655',
    bankAccountNumber: '62836392449', // test/dummy — use a NetCash test account number
    sendMandate: false, // do NOT send the signing link in the spike
  });
  console.log('    mandate submit:', mandate);
  if (!mandate.success) return console.log('NO-GO: mandate submit failed.');

  // 2. Promote to masterfile WITHOUT signing.
  console.log('[2] Firing MandateToMasterfile (no signature)...');
  const load = await svc.loadMandateToMasterfile([REF], `SPIKE-MF-${REF}`);
  console.log('    masterfile load:', load);
  if (!load.success || !load.fileToken) return console.log('NO-GO: masterfile load rejected.');

  // 3. Poll the load report.
  console.log('[3] Polling load report (~30-90s)...');
  await new Promise(r => setTimeout(r, 30_000));
  const report = await svc.requestLoadReport(load.fileToken);
  console.log('    load report:', JSON.stringify(report, null, 2));

  // 4. Attempt a minimal collection against the (hopefully) loaded masterfile ref.
  console.log('[4] Attempting R1.00 test collection...');
  const batch = await netcashDebitBatchService.submitBatch(
    [{ accountReference: REF, amount: 1.0, actionDate: new Date(Date.now() + 2 * 864e5), customerId: 'spike' }],
    `SPIKE-COLLECT-${REF}`,
  );
  console.log('    collection submit:', batch);

  const verdict = batch.success && !batch.errors.some(e => e.includes('316'));
  console.log(verdict
    ? '\n=== GO: unsigned mandate was promoted and is collectable. ==='
    : '\n=== NO-GO: collection blocked (likely err 316 — masterfile requires signature first). ===');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
