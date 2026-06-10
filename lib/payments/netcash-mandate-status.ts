/**
 * NetCash eMandate status polling (backstop for missed postbacks).
 *
 * The eMandate postback (`/api/webhooks/netcash/emandate`) is the primary feedback
 * channel, but NetCash postbacks have been unreliable. This module pulls the bulk
 * "mandate data" file from NetCash (NIWS_NIF: RequestMandateData -> RetrieveMandateData)
 * and exposes each mandate's current status so a cron can reconcile clinics stuck on
 * `mandate_status='pending'`.
 *
 * File format (tab-delimited, wrapped in ###BEGIN / ###END):
 *   field[0] = Status code, field[1] = Account Reference (= our customers.account_number)
 * Status codes (per NetCash docs):
 *   1,8,11 Capturing · 2 Awaiting authorisation · 3 Expired · 4 Failed · 5 Declined
 *   6 Accepted · 7 Details changed · 9 Verified · 10 Unverified
 *
 * @module lib/payments/netcash-mandate-status
 */

export type MandateOutcome = 'active' | 'failed' | 'pending';

/** Map a NetCash mandate status code to our reconciliation outcome. */
export function mapMandateStatusCode(code: string): { outcome: MandateOutcome; verified: boolean; label: string } {
  switch (code.trim()) {
    case '6': return { outcome: 'active', verified: false, label: 'Accepted' };
    case '9': return { outcome: 'active', verified: true, label: 'Verified' };
    case '3': return { outcome: 'failed', verified: false, label: 'Expired' };
    case '4': return { outcome: 'failed', verified: false, label: 'Failed' };
    case '5': return { outcome: 'failed', verified: false, label: 'Declined' };
    case '1': case '8': case '11': return { outcome: 'pending', verified: false, label: 'Capturing' };
    case '2': return { outcome: 'pending', verified: false, label: 'Awaiting authorisation' };
    case '7': return { outcome: 'pending', verified: false, label: 'Details changed' };
    case '10': return { outcome: 'pending', verified: false, label: 'Unverified' };
    default: return { outcome: 'pending', verified: false, label: `Unknown(${code})` };
  }
}

export interface MandateStatusRow {
  accountRef: string;   // field[1] — matches customers.account_number
  statusCode: string;   // field[0]
  outcome: MandateOutcome;
  verified: boolean;
  label: string;
}

const WS_URL = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/NIWS_NIF.svc';
const SERVICE_KEY = () => process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';

function escapeXml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function soapCall(method: string, inner: string): Promise<string> {
  const env = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body><tem:${method}>${inner}</tem:${method}></soap:Body>
</soap:Envelope>`;
  const res = await fetch(WS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': `http://tempuri.org/INIWS_NIF/${method}` },
    body: env,
  });
  return res.text();
}

function extractResult(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : null;
}

/** Parse the tab-delimited mandate-data file into status rows. */
export function parseMandateDataFile(file: string): MandateStatusRow[] {
  const rows: MandateStatusRow[] = [];
  // Lines are separated by the CR entity (&#xD;) and/or newlines.
  const lines = file.split(/&#xD;|\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith('###BEGIN') || line.startsWith('###END')) continue;
    const cols = line.split('\t');
    if (cols.length < 2) continue;
    const statusCode = (cols[0] || '').trim();
    const accountRef = (cols[1] || '').trim();
    if (!accountRef || !/^\d+$/.test(statusCode)) continue; // first col must be a numeric status code
    const m = mapMandateStatusCode(statusCode);
    rows.push({ accountRef, statusCode, outcome: m.outcome, verified: m.verified, label: m.label });
  }
  return rows;
}

/**
 * Pull the current mandate statuses from NetCash.
 * RequestMandateData returns a file token; RetrieveMandateData returns "FILE NOT READY"
 * until the async file is generated (~30-90s), so we poll with a timeout.
 */
export async function fetchMandateStatuses(opts: { maxWaitMs?: number } = {}): Promise<MandateStatusRow[]> {
  const key = SERVICE_KEY();
  if (!key) throw new Error('NETCASH_DEBIT_ORDER_SERVICE_KEY not configured');
  const maxWaitMs = opts.maxWaitMs ?? 180_000; // 3 min

  const reqXml = await soapCall('RequestMandateData', `<tem:ServiceKey>${escapeXml(key)}</tem:ServiceKey>`);
  const token = extractResult(reqXml, 'RequestMandateDataResult');
  if (!token) throw new Error(`RequestMandateData returned no token: ${reqXml.slice(0, 200)}`);

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 20_000));
    let retXml: string;
    try {
      retXml = await soapCall(
        'RetrieveMandateData',
        `<tem:ServiceKey>${escapeXml(key)}</tem:ServiceKey><tem:FileToken>${escapeXml(token)}</tem:FileToken>`,
      );
    } catch {
      continue; // transient network error — retry
    }
    const result = extractResult(retXml, 'RetrieveMandateDataResult') || '';
    if (result && !/FILE NOT READY/i.test(result)) {
      return parseMandateDataFile(result);
    }
  }
  throw new Error('RetrieveMandateData timed out (file not ready)');
}
