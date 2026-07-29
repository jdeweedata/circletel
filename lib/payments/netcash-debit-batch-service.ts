import { parseStringPromise } from 'xml2js';
import { netcashStatementService } from './netcash-statement-service';

export interface DebitOrderItem {
  accountReference: string;
  amount: number;            // Rands
  actionDate: Date;
  customerId: string;
  invoiceId?: string;
  orderId?: string;
  accountName: string;       // holder / mandate name (fields 102 + 132)
  accountType: 'current' | 'savings';
  branchCode: string;
  accountNumber: string;
}

export interface BatchSubmissionResult {
  success: boolean;
  fileToken?: string;
  itemsSubmitted: number;
  errors: string[];
  warnings: string[];
}

const VENDOR_KEY = '24ade73c-98cf-47b3-99be-cc7b867b3080';

// ============================================================================
// NetCash collection limits (profile 52552945156, observed 2026-06-27).
// Env-overridable so a NetCash limit increase is a config change, not a code
// change. See docs/netcash/2026-06-27_netcash-debit-limit-increase-request.md.
//   LINE_LIMIT  — max per debit-order item; NetCash rejects any line above it
//   DAILY_LIMIT — max batch total per action date
//   WARN_RATIO  — warn once a batch crosses this fraction of the daily cap
// ============================================================================
const LINE_LIMIT_RANDS = Number(process.env.NETCASH_LINE_LIMIT_RANDS) || 1500;
const DAILY_LIMIT_RANDS = Number(process.env.NETCASH_DAILY_LIMIT_RANDS) || 20000;
const DAILY_WARN_RATIO = Number(process.env.NETCASH_DAILY_WARN_RATIO) || 0.8;

// ============================================================================
// Batch authorisation (RequestBatchAuthorise)
//
// Uploaded TwoDay batches sit UNAUTHORISED and expire if not released within
// the action-date window. RequestBatchAuthorise releases them programmatically
// so recurring billing needs no manual portal step.
//
// NOTE: this requires "Auto Authorisation" to be enabled on the NetCash profile.
// Until NetCash enables it, RequestBatchAuthorise returns code 322
// (AutoAuthNotAllowed) — handled gracefully so the upload still succeeds and the
// batch can be authorised manually in the meantime.
// ============================================================================

export interface BatchAuthoriseOptions {
  sendEmail?: boolean;     // NetCash emails a confirmation — default off
  fromName?: string;
  fromAddress?: string;
  sendSMS?: boolean;       // NetCash SMSes a confirmation — default off
  releaseFunds?: boolean;  // release the batch for processing — default ON
  bankTransfer?: boolean;  // debit collection, not a payment — default off
}

export interface BatchAuthoriseResult {
  success: boolean;
  code: string;               // raw NetCash result code / token
  message: string;            // human-readable
  authoriseNotAllowed: boolean; // true when code 322 (Auto Auth not enabled on profile)
}

/** Known NetCash batch-authorise web-service response codes. */
export const BATCH_AUTH_CODES: Record<string, string> = {
  '100': 'Authentication failure — check service key',
  '101': 'Parameter / format error',
  '102': 'Parameter error',
  '200': 'General code exception — contact NetCash',
  '320': 'Batch not found / invalid batch indicator',
  '321': 'Batch authorisation via RMS not allowed',
  '322': 'Auto Authorisation not allowed — enable it on the NetCash profile',
  '323': 'Insufficient funds available to release',
};

const BATCH_AUTH_ERROR_CODES = new Set(['100', '101', '102', '200', '320', '321', '322', '323']);

/** Build the RequestBatchAuthorise SOAP envelope. Pure — unit-tested. */
export function buildBatchAuthoriseEnvelope(
  serviceKey: string,
  batchIndicator: string,
  opts: Required<BatchAuthoriseOptions>,
): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const b = (v: boolean) => (v ? 'true' : 'false');
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:RequestBatchAuthorise><tem:ServiceKey>${esc(serviceKey)}</tem:ServiceKey><tem:BatchIndicator>${esc(batchIndicator)}</tem:BatchIndicator><tem:SendEmail>${b(opts.sendEmail)}</tem:SendEmail><tem:FromName>${esc(opts.fromName)}</tem:FromName><tem:FromAddress>${esc(opts.fromAddress)}</tem:FromAddress><tem:SendSMS>${b(opts.sendSMS)}</tem:SendSMS><tem:ReleaseFunds>${b(opts.releaseFunds)}</tem:ReleaseFunds><tem:BankTransfer>${b(opts.bankTransfer)}</tem:BankTransfer></tem:RequestBatchAuthorise></soap:Body></soap:Envelope>`;
}

/** Parse a RequestBatchAuthorise response into a result. Pure — unit-tested.
 * Treats the documented error codes as failures and any other (non-empty)
 * response as success (NetCash returns a token/0 once Auto Auth is enabled —
 * confirm the exact success token on the first real authorisation). */
export function parseBatchAuthoriseResult(xml: string): BatchAuthoriseResult {
  const code = (xml.match(/<RequestBatchAuthoriseResult>([\s\S]*?)<\/RequestBatchAuthoriseResult>/)?.[1] || '').trim();
  if (!code) {
    return { success: false, code: '', message: 'Empty response from NetCash', authoriseNotAllowed: false };
  }
  const isError = BATCH_AUTH_ERROR_CODES.has(code);
  return {
    success: !isError,
    code,
    message: BATCH_AUTH_CODES[code] || (isError ? `Authorisation failed (code ${code})` : `Authorised (response ${code})`),
    authoriseNotAllowed: code === '322',
  };
}

export interface BatchLimitPartition {
  submittable: DebitOrderItem[];  // items within the per-item line limit — safe to upload
  overLine: DebitOrderItem[];     // items above the line limit — cannot be collected as a debit-order line
  totalRands: number;             // total of the SUBMITTABLE items only
  dailyExceeded: boolean;         // submittable total breaches the daily cap
  warning?: string;               // advisory when the submittable total approaches the cap
}

/** Partition a batch by the NetCash collection limits. Pure — unit-tested.
 * Over-line items are split out (caller skips & flags them — they can't be
 * collected as a single debit-order line); `dailyExceeded` blocks the run. */
export function partitionByLimits(items: DebitOrderItem[]): BatchLimitPartition {
  const overLine = items.filter((i) => i.amount > LINE_LIMIT_RANDS);
  const submittable = items.filter((i) => i.amount <= LINE_LIMIT_RANDS);
  const totalRands = submittable.reduce((sum, i) => sum + i.amount, 0);
  const dailyExceeded = totalRands > DAILY_LIMIT_RANDS;
  const warning =
    !dailyExceeded && totalRands > DAILY_LIMIT_RANDS * DAILY_WARN_RATIO
      ? `Batch total R${totalRands.toFixed(2)} is over ${Math.round(
          DAILY_WARN_RATIO * 100,
        )}% of the NetCash daily limit R${DAILY_LIMIT_RANDS.toFixed(2)} — approaching the cap.`
      : undefined;
  return { submittable, overLine, totalRands, dailyExceeded, warning };
}

export class NetCashDebitBatchService {
  private serviceKey: string;
  private webServiceUrl: string;

  constructor() {
    this.serviceKey = process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY || '';
    this.webServiceUrl = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';
    if (!this.serviceKey) console.warn('NetCash Debit Order Service Key not configured');
  }

  isConfigured(): boolean { return !!this.serviceKey; }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Next valid TwoDay action date: >= 3 business days ahead, never a weekend.
   * Empirically verified against the NetCash TwoDay service: +2 business days is
   * REJECTED ("Action date is not valid for this instruction"); +3 is the minimum
   * accepted. NOTE: this skips weekends only — SA public holidays in the lead
   * window are NOT excluded and could still push the true minimum out by a day. */
  nextValidActionDate(from: Date): Date {
    const d = new Date(from);
    let added = 0;
    while (added < 3) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
    return d;
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  buildTwoDayFile(items: DebitOrderItem[], batchName: string): string {
    const TAB = '\t';
    const actionDate = this.formatDate(items[0].actionDate);
    const header = ['H', this.serviceKey, '1', 'TwoDay', batchName, actionDate, VENDOR_KEY].join(TAB);
    const key = ['K', '101', '102', '131', '132', '133', '134', '136', '162'].join(TAB);
    let totalCents = 0;
    const rows = items.map(i => {
      const cents = Math.round(i.amount * 100);
      totalCents += cents;
      const acctType = i.accountType === 'savings' ? '2' : '1';
      return ['T', i.accountReference.substring(0, 22), i.accountName.substring(0, 50), '1',
        i.accountName.substring(0, 50), acctType, i.branchCode, i.accountNumber, cents.toString()].join(TAB);
    });
    const footer = ['F', items.length.toString(), totalCents.toString(), '9999'].join(TAB);
    return [header, key, ...rows, footer].join('\n');
  }

  async submitBatch(items: DebitOrderItem[], batchName?: string): Promise<BatchSubmissionResult> {
    const result: BatchSubmissionResult = { success: false, itemsSubmitted: 0, errors: [], warnings: [] };
    if (!this.serviceKey) { result.errors.push('NetCash Debit Order Service Key not configured'); return result; }
    if (items.length === 0) { result.warnings.push('No items to submit'); result.success = true; return result; }

    const file = this.buildTwoDayFile(items, batchName || `CircleTel-${this.formatDate(items[0].actionDate)}`);
    const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:BatchFileUpload><tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey><tem:File>${this.escapeXml(file)}</tem:File></tem:BatchFileUpload></soap:Body></soap:Envelope>`;

    try {
      const res = await fetch(this.webServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/BatchFileUpload' },
        body: envelope,
      });
      const text = await res.text();
      if (!res.ok) { result.errors.push(`NetCash API returned ${res.status}: ${res.statusText} ${text.substring(0, 300)}`); return result; }
      const token = text.match(/<BatchFileUploadResult>([\s\S]*?)<\/BatchFileUploadResult>/)?.[1] || '';
      if (!token || ['100', '101', '102', '200'].includes(token)) {
        result.errors.push(`BatchFileUpload rejected (code ${token})`); return result;
      }
      result.success = true; result.fileToken = token; result.itemsSubmitted = items.length;
      return result;
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : 'Unknown error'); return result;
    }
  }

  /** Poll the file upload report — confirms whether the batch loaded SUCCESSFULLY. */
  async requestLoadReport(fileToken: string): Promise<{ result?: string; errors: { message: string }[] }> {
    const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:RequestFileUploadReport><tem:ServiceKey>${this.escapeXml(this.serviceKey)}</tem:ServiceKey><tem:FileToken>${this.escapeXml(fileToken)}</tem:FileToken></tem:RequestFileUploadReport></soap:Body></soap:Envelope>`;
    const res = await fetch(this.webServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/RequestFileUploadReport' },
      body: envelope,
    });
    const xml = await res.text();
    const body = (await parseStringPromise(xml).catch(() => null));
    const raw = xml.match(/<RequestFileUploadReportResult>([\s\S]*?)<\/RequestFileUploadReportResult>/)?.[1] || '';
    const errors: { message: string }[] = [];
    let result: string | undefined;
    for (const line of raw.split(/&#xD;|\r?\n/).map(l => l.trim()).filter(Boolean)) {
      if (line.startsWith('###BEGIN')) {
        const p = line.split('\t');
        result = /SUCCESSFUL WITH ERRORS/.test(p[2]) ? 'SUCCESSFUL WITH ERRORS' : /UNSUCCESSFUL/.test(p[2]) ? 'UNSUCCESSFUL' : /SUCCESSFUL/.test(p[2]) ? 'SUCCESSFUL' : undefined;
      } else if (line.startsWith('###ERROR')) {
        errors.push({ message: line.replace(/^###ERROR:?\s*/, '') });
      }
    }
    void body;
    return { result, errors };
  }

  /** Authorise (release) a previously uploaded batch by its NetCash GUID.
   * Requires Auto Authorisation enabled on the profile (else code 322). */
  async requestBatchAuthorise(batchIndicator: string, opts: BatchAuthoriseOptions = {}): Promise<BatchAuthoriseResult> {
    if (!this.serviceKey) {
      return { success: false, code: '', message: 'NetCash Debit Order Service Key not configured', authoriseNotAllowed: false };
    }
    const full: Required<BatchAuthoriseOptions> = {
      sendEmail: opts.sendEmail ?? false,
      fromName: opts.fromName ?? 'CircleTel',
      fromAddress: opts.fromAddress ?? 'billing@circletel.co.za',
      sendSMS: opts.sendSMS ?? false,
      releaseFunds: opts.releaseFunds ?? true,
      bankTransfer: opts.bankTransfer ?? false,
    };
    const envelope = buildBatchAuthoriseEnvelope(this.serviceKey, batchIndicator, full);
    try {
      const res = await fetch(this.webServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'http://tempuri.org/INIWS_NIF/RequestBatchAuthorise' },
        body: envelope,
      });
      const text = await res.text();
      if (!res.ok) {
        return { success: false, code: String(res.status), message: `NetCash API returned ${res.status}: ${text.substring(0, 300)}`, authoriseNotAllowed: false };
      }
      return parseBatchAuthoriseResult(text);
    } catch (e) {
      return { success: false, code: '', message: e instanceof Error ? e.message : 'Unknown error', authoriseNotAllowed: false };
    }
  }

  /** Resolve a batch name to its NetCash GUID (via RetrieveBatchStatus) and authorise it.
   * Only authorises a batch that is still UNAUTHORISED (never re-touches authorised/processed). */
  async authoriseBatchByName(batchName: string, opts: BatchAuthoriseOptions = {}): Promise<BatchAuthoriseResult & { batchIndicator?: string }> {
    const batches = await netcashStatementService.getBatchStatus();
    const match = batches.find((b) => b.batchName === batchName);
    if (!match) {
      return { success: false, code: '', message: `Batch "${batchName}" not found in NetCash batch status`, authoriseNotAllowed: false };
    }
    if (match.status !== 'unauthorised') {
      return { success: false, code: '', message: `Batch "${batchName}" is already ${match.status} — not authorising`, authoriseNotAllowed: false, batchIndicator: match.batchId };
    }
    const result = await this.requestBatchAuthorise(match.batchId, opts);
    return { ...result, batchIndicator: match.batchId };
  }
}

export const netcashDebitBatchService = new NetCashDebitBatchService();
