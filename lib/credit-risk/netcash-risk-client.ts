import { deriveCreditDecision } from './decision';
import type { CreditFlags } from './types';

const WS_URL = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';

export function riskServiceKeyConfigured(): boolean {
  return Boolean(process.env.NETCASH_RISK_SERVICE_KEY);
}

export function parseCreditReportFlags(input: {
  debtReview?: boolean | string;
  sequestration?: boolean;
  adminOrder?: boolean;
  judgements?: number | boolean;
  defaults?: number | boolean;
  score?: number | null;
  avsAccExists?: boolean | null;
  avsIdMatch?: boolean | null;
  comments?: string;
}): CreditFlags {
  const comments = (input.comments || '').toLowerCase();
  const debtReview =
    input.debtReview === true ||
    input.debtReview === 'true' ||
    comments.includes('debt review');
  const judgements =
    typeof input.judgements === 'number' ? input.judgements > 0 : Boolean(input.judgements);
  const defaults =
    typeof input.defaults === 'number' ? input.defaults > 0 : Boolean(input.defaults);

  return {
    debt_review: debtReview,
    sequestration: Boolean(input.sequestration),
    admin_order: Boolean(input.adminOrder),
    judgements,
    defaults,
    score: input.score ?? null,
    no_score: input.score == null,
    avs_acc_exists: input.avsAccExists ?? null,
    avs_id_match: input.avsIdMatch ?? null,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function callNiws(action: string, innerXml: string): Promise<string> {
  const key = process.env.NETCASH_RISK_SERVICE_KEY;
  if (!key) {
    throw new Error('NETCASH_RISK_SERVICE_KEY is not configured');
  }
  const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/"><soap:Body><tem:${action}><tem:ServiceKey>${escapeXml(key)}</tem:ServiceKey>${innerXml}</tem:${action}></soap:Body></soap:Envelope>`;
  const res = await fetch(WS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      SOAPAction: `http://tempuri.org/INIWS_NIF/${action}`,
    },
    body: envelope,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Netcash Risk ${action} failed (${res.status})`);
  }
  return text;
}

export async function requestCreditDataReport(params: {
  idNumber: string;
  firstName: string;
  lastName: string;
  reason?: string;
}): Promise<{ raw: string; flags: CreditFlags; decision: ReturnType<typeof deriveCreditDecision> }> {
  const inner = `<tem:IdNumber>${escapeXml(params.idNumber)}</tem:IdNumber><tem:FirstName>${escapeXml(params.firstName)}</tem:FirstName><tem:LastName>${escapeXml(params.lastName)}</tem:LastName><tem:Reason>${escapeXml(params.reason || 'Credit Risk Assessment')}</tem:Reason>`;
  const raw = await callNiws('RequestCreditDataReport', inner);
  const comments = raw.match(/<(?:debtreview|DebtReview|Comments)[^>]*>([\s\S]*?)<\//i)?.[1] || raw;
  const flags = parseCreditReportFlags({
    comments,
    debtReview: /debt review/i.test(raw),
    judgements: /<Judgements?>[^<]*[1-9]/i.test(raw),
    defaults: /<Defaults?>[^<]*[1-9]/i.test(raw),
  });
  return { raw, flags, decision: deriveCreditDecision(flags) };
}

export async function requestAvsReport(params: {
  idNumber: string;
  accountNumber: string;
  branchCode?: string;
}): Promise<{ raw: string; flags: Pick<CreditFlags, 'avs_acc_exists' | 'avs_id_match'> }> {
  const inner = `<tem:IdNumber>${escapeXml(params.idNumber)}</tem:IdNumber><tem:AccountNumber>${escapeXml(params.accountNumber)}</tem:AccountNumber>`;
  const raw = await callNiws('RequestAVSReport', inner);
  const acc = /acc(?:ount)?\s*exists[^<]*(yes|true|1)/i.exec(raw);
  const idMatch = /id\s*match[^<]*(yes|true|1)/i.exec(raw);
  return {
    raw,
    flags: {
      avs_acc_exists: acc ? /yes|true|1/i.test(acc[1]) : null,
      avs_id_match: idMatch ? /yes|true|1/i.test(idMatch[1]) : null,
    },
  };
}
