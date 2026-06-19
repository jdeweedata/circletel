import { parseStringPromise } from 'xml2js';

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
}

export const netcashDebitBatchService = new NetCashDebitBatchService();
