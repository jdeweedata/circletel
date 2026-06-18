/**
 * Clean test: does a TwoDay debit with INLINE bank details collect on a brand-new
 * reference that was NEVER submitted as a mandate and NEVER masterfile-loaded?
 * If SUCCESSFUL, billing needs neither eMandate signature nor MandateToMasterfile.
 * TEST PROFILE ONLY.
 *
 * Run: set -a && source .env.local && set +a && \
 *   NETCASH_DEBIT_ORDER_SERVICE_KEY="<test key>" npx tsx scripts/netcash/verify-direct-debit.ts
 */
import { NetCashEMandateBatchService } from '@/lib/payments/netcash-emandate-batch-service';

const VENDOR = '24ade73c-98cf-47b3-99be-cc7b867b3080';
const WS = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';
const REF = `CTDIRECT${Date.now()}`.substring(0, 22);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ccyymmdd = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

async function main() {
  const key = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
  const file = [
    ['H', key, '1', 'TwoDay', `DIRECT-${REF}`, ccyymmdd(new Date(Date.now() + 7 * 864e5)), VENDOR].join('\t'),
    ['K', '101', '102', '131', '132', '133', '134', '136', '162'].join('\t'),
    ['T', REF, 'Direct Test Biz', '1', 'Direct Test Biz', '1', '250655', '62836392449', '100'].join('\t'),
    ['F', '1', '100', '9999'].join('\t'),
  ].join('\n');
  console.log('Brand-new ref (no mandate, no masterfile):', REF);
  console.log('file:\n' + file);

  const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:BatchFileUpload><tem:ServiceKey>${esc(key)}</tem:ServiceKey><tem:File>${esc(file)}</tem:File></tem:BatchFileUpload></soap:Body></soap:Envelope>`;
  const res = await fetch(WS, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/BatchFileUpload' },
    body: envelope,
  });
  const text = await res.text();
  const token = text.match(/<BatchFileUploadResult>([\s\S]*?)<\/BatchFileUploadResult>/)?.[1] || '';
  console.log('upload status:', res.status, 'token/code:', token);
  if (!token || ['100', '101', '102', '200'].includes(token)) return console.log('REJECTED at upload.');

  await new Promise(r => setTimeout(r, 30_000));
  const rep = await new NetCashEMandateBatchService().requestLoadReport(token);
  console.log('report:', JSON.stringify(rep, null, 2));
  console.log(rep.result === 'SUCCESSFUL'
    ? '\n=== CONFIRMED: direct TwoDay debit (inline bank details) collects with NO mandate and NO masterfile load. ==='
    : '\n=== NOT independent — review report. ===');
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
