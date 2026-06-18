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

const REF = `CTTEST${Date.now()}`.substring(0, 22);
const VENDOR = '24ade73c-98cf-47b3-99be-cc7b867b3080';
const WS = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ccyymmdd = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

/** Submit a debit-order collection via BatchFileUpload + TwoDay instruction.
 * TwoDay requires bank details inline: K 101 102 131 132 133 134 136 162. */
async function collectTwoDay(key: string, ref: string, amountCents: number, actionDate: Date): Promise<string> {
  const file = [
    ['H', key, '1', 'TwoDay', `SPIKE-COLLECT-${ref}`, ccyymmdd(actionDate), VENDOR].join('\t'),
    // 101 ref · 102 name · 131 bankDetailType · 132 acct name · 133 acct type · 134 branch · 136 acct no · 162 amount(cents)
    ['K', '101', '102', '131', '132', '133', '134', '136', '162'].join('\t'),
    ['T', ref, 'Spike Test Biz', '1', 'Spike Test Biz', '1', '250655', '62836392449', amountCents.toString()].join('\t'),
    ['F', '1', amountCents.toString(), '9999'].join('\t'),
  ].join('\n');
  console.log('    collection file:\n' + file);
  const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:BatchFileUpload><tem:ServiceKey>${esc(key)}</tem:ServiceKey><tem:File>${esc(file)}</tem:File></tem:BatchFileUpload></soap:Body></soap:Envelope>`;
  const res = await fetch(WS, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/BatchFileUpload' },
    body: envelope,
  });
  const text = await res.text();
  console.log('    collection upload status:', res.status);
  console.log('    collection upload body:', text.substring(0, 600));
  return text.match(/<BatchFileUploadResult>([\s\S]*?)<\/BatchFileUploadResult>/)?.[1] || '';
}

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

  // 4. Attempt a minimal collection via BatchFileUpload/TwoDay against the loaded ref.
  console.log('[4] Attempting R1.00 test collection (BatchFileUpload/TwoDay)...');
  const key = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
  const collToken = await collectTwoDay(key, REF, 100, new Date(Date.now() + 7 * 864e5));
  if (!collToken || ['100', '101', '102', '200'].includes(collToken)) {
    return console.log(`\n=== INCONCLUSIVE: collection upload rejected (code ${collToken}). ===`);
  }

  // 5. Poll the collection load report — this is the authoritative GO/NO-GO signal.
  console.log('[5] Polling collection load report (~30-90s)...');
  await new Promise(r => setTimeout(r, 30_000));
  const collReport = await svc.requestLoadReport(collToken);
  console.log('    collection load report:', JSON.stringify(collReport, null, 2));

  const masterfileMiss = collReport.errors.some(e => /masterfile|not found|does not exist|316/i.test(e.message));
  const go = (collReport.result === 'SUCCESSFUL' || collReport.result === 'SUCCESSFUL WITH ERRORS') && !masterfileMiss;
  console.log(go
    ? '\n=== GO: unsigned mandate promoted via MandateToMasterfile IS collectable. ==='
    : '\n=== NO-GO: collection load report shows the account is not collectable (likely masterfile injection deferred until signature). Review report above. ===');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
