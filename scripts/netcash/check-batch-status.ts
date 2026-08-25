/**
 * Read-only: show the current NetCash debit-order batch status (last ~10 batches).
 * Raw SOAP call + regex extraction (the statement-service xml2js parser mis-handles
 * NetCash's `s:` namespace). Tells us per batch whether it will actually run.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/netcash/check-batch-status.ts
 */
const WS_URL = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';
const KEY = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';

const STATUS: Record<string, string> = {
  '1': 'UNAUTHORISED', '2': 'AUTHORISED', '3': 'LOCKED', '4': 'PROCESSED', '5': 'INSUFFICIENT_FUNDS',
};

function willItRun(code: string): string {
  switch (code) {
    case '2': return 'YES — authorised, will process on action date';
    case '4': return 'ALREADY PROCESSED';
    case '1': return 'NO — UNAUTHORISED (expires if not released)';
    case '5': return 'NO — insufficient funds';
    default:  return 'NO';
  }
}

function fmt(d: string): string {
  if (!d || d.includes('1900') || d.includes('0001')) return '—';
  return d.replace('T', ' ').slice(0, 16);
}

async function main() {
  if (!KEY) { console.log('NETCASH_DEBIT_ORDER_SERVICE_KEY not set'); return; }
  const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:RetrieveBatchStatus><tem:ServiceKey>${KEY}</tem:ServiceKey></tem:RetrieveBatchStatus></soap:Body></soap:Envelope>`;

  const res = await fetch(WS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/RetrieveBatchStatus' },
    body: envelope,
  });
  const xml = await res.text();
  const raw = xml.match(/<RetrieveBatchStatusResult>([\s\S]*?)<\/RetrieveBatchStatusResult>/)?.[1] || '';
  if (!raw) { console.log('No result element. Raw response:\n', xml.slice(0, 800)); return; }
  if (['100', '200', '311'].includes(raw.trim())) { console.log(`NetCash error code: ${raw.trim()}`); return; }

  // Tab-delimited, lines separated by &#xD; or newlines
  const lines = raw.split(/&#xD;|\r?\n/).map((l) => l.trim()).filter(Boolean);
  console.log(`\nProfile debit-order batches (${lines.length}):\n`);
  for (const line of lines) {
    const f = line.split('\t');
    if (f.length < 9) continue;
    const [, batchId, batchName, statusCode, volume, value, createdOn, authorisedOn] = f;
    console.log(`• ${batchName}`);
    console.log(`    status:      ${STATUS[statusCode] || statusCode}   →   ${willItRun(statusCode)}`);
    console.log(`    value:       R${(parseFloat(value) || 0).toFixed(2)}   items: ${volume}`);
    console.log(`    created:     ${fmt(createdOn)}    authorised: ${fmt(authorisedOn)}`);
    console.log(`    batchId:     ${batchId}\n`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
