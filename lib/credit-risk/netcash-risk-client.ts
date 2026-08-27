import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { deriveCreditDecision } from './decision';
import {
  buildCompanyCreditNif,
  buildConsumerCreditNif,
  type CompanyRiskInstruction,
  type ConsumerRiskInstruction,
} from './nif';
import type { CreditDecision, CreditFlags } from './types';

const WS_URL = process.env.NETCASH_WS_URL || 'https://ws.netcash.co.za/NIWS/niws_nif.svc';
const BATCH_ERROR_CODES = new Set(['100', '101', '102', '200']);
const DEFAULT_MAX_WAIT_MS = 180_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;

export interface NiwsClientDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  storePdf?: (fileToken: string, pdfBase64: string) => string | null | Promise<string | null>;
  maxWaitMs?: number;
  pollIntervalMs?: number;
}

export interface CreditPullResult {
  fileToken: string;
  pdfBase64: string;
  pdfStoragePath: string | null;
  loadReport: string;
  flags: CreditFlags;
  decision: CreditDecision;
}

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
    sequestration: Boolean(input.sequestration) || comments.includes('sequestrat'),
    admin_order: Boolean(input.adminOrder) || comments.includes('admin order'),
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
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function requireServiceKey(): string {
  const key = process.env.NETCASH_RISK_SERVICE_KEY;
  if (!key) {
    throw new Error('NETCASH_RISK_SERVICE_KEY is not configured');
  }
  return key;
}

function extractSoapResult(xml: string, action: string): string {
  const re = new RegExp(`<${action}Result>([\\s\\S]*?)</${action}Result>`, 'i');
  return (xml.match(re)?.[1] || '').trim();
}

function xmlTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

export function extractPdfText(pdfBase64: string): string {
  const bytes = Buffer.from(pdfBase64.replace(/\s/g, ''), 'base64');
  const raw = bytes.toString('latin1');
  const parens = [...raw.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).join(' ');
  return `${raw}\n${parens}`;
}

export function parseAvsToken(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (/^(yes|true|1|valid)$/.test(v)) return true;
  if (/^(no|false|0|invalid)$/.test(v)) return false;
  return null;
}

export function parseAvsFlagsFromReport(raw: string): Pick<CreditFlags, 'avs_acc_exists' | 'avs_id_match'> {
  const acc = /acc(?:ount)?\s*exists[^a-z0-9]*(yes|true|1|no|false|0|valid|invalid)/i.exec(raw);
  const idMatch = /id\s*match[^a-z0-9]*(yes|true|1|no|false|0|valid|invalid)/i.exec(raw);
  return {
    avs_acc_exists: acc ? parseAvsToken(acc[1]) : null,
    avs_id_match: idMatch ? parseAvsToken(idMatch[1]) : null,
  };
}

function flagsFromReportPayload(payload: string): CreditFlags {
  const scoreMatch = payload.match(/score[:\s]*([0-9]{3})\b/i);
  const score = scoreMatch ? Number(scoreMatch[1]) : null;
  const avs = parseAvsFlagsFromReport(payload);
  return parseCreditReportFlags({
    comments: payload,
    debtReview: /debt review/i.test(payload),
    judgements: /judgements?[^0-9]*[1-9]/i.test(payload),
    defaults: /defaults?[^0-9]*[1-9]/i.test(payload),
    score,
    avsAccExists: avs.avs_acc_exists,
    avsIdMatch: avs.avs_id_match,
  });
}

function avsFlag(value: string | null): boolean | null {
  if (!value) return null;
  return parseAvsToken(value);
}

async function sleepMs(ms: number, deps: NiwsClientDeps): Promise<void> {
  if (deps.sleep) {
    await deps.sleep(ms);
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultStorePdf(fileToken: string, pdfBase64: string): string {
  const safe = fileToken.replace(/[^A-Za-z0-9._-]/g, '_');
  const rel = path.join('.private', 'credit-reports', `${safe}.pdf`);
  const abs = path.join(process.cwd(), rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, Buffer.from(pdfBase64.replace(/\s/g, ''), 'base64'));
  return rel.replace(/\\/g, '/');
}

async function callNiws(
  action: string,
  innerXml: string,
  deps: NiwsClientDeps = {}
): Promise<string> {
  const key = requireServiceKey();
  const fetchImpl = deps.fetchImpl ?? fetch;
  const envelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"><soap:Body><tem:${action}><tem:ServiceKey>${escapeXml(key)}</tem:ServiceKey>${innerXml}</tem:${action}></soap:Body></soap:Envelope>`;
  const res = await fetchImpl(WS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
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

async function uploadAndPoll(nif: string, deps: NiwsClientDeps): Promise<{ fileToken: string; loadReport: string }> {
  const uploadXml = await callNiws('BatchFileUpload', `<tem:File>${escapeXml(nif)}</tem:File>`, deps);
  const fileToken = extractSoapResult(uploadXml, 'BatchFileUpload');
  if (!fileToken || BATCH_ERROR_CODES.has(fileToken)) {
    throw new Error(`BatchFileUpload rejected (code ${fileToken || 'empty'})`);
  }

  const maxWaitMs = deps.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const pollIntervalMs = deps.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxAttempts = Math.max(1, Math.ceil(maxWaitMs / pollIntervalMs));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const reportXml = await callNiws(
      'RequestFileUploadReport',
      `<tem:FileToken>${escapeXml(fileToken)}</tem:FileToken>`,
      deps
    );
    const loadReport = extractSoapResult(reportXml, 'RequestFileUploadReport');
    if (/FILE NOT READY/i.test(loadReport) || !loadReport) {
      await sleepMs(pollIntervalMs, deps);
      continue;
    }
    if (/UNSUCCESSFUL/i.test(loadReport) && !/SUCCESSFUL WITH ERRORS/i.test(loadReport)) {
      throw new Error(`File upload report unsuccessful: ${loadReport.slice(0, 300)}`);
    }
    return { fileToken, loadReport };
  }

  throw new Error('RequestFileUploadReport timed out (FILE NOT READY)');
}

async function pullCreditPdf(
  fileToken: string,
  loadReport: string,
  deps: NiwsClientDeps
): Promise<CreditPullResult> {
  const reportXml = await callNiws(
    'RequestCreditDataReport',
    `<tem:FileToken>${escapeXml(fileToken)}</tem:FileToken>`,
    deps
  );
  const pdfBase64 = extractSoapResult(reportXml, 'RequestCreditDataReport').replace(/\s/g, '');
  if (!pdfBase64 || BATCH_ERROR_CODES.has(pdfBase64)) {
    throw new Error(`RequestCreditDataReport rejected (code ${pdfBase64 || 'empty'})`);
  }

  const payload = `${loadReport}\n${extractPdfText(pdfBase64)}\n${reportXml}`;
  const flags = flagsFromReportPayload(payload);
  const store = deps.storePdf ?? defaultStorePdf;
  const pdfStoragePath = (await store(fileToken, pdfBase64)) ?? null;

  return {
    fileToken,
    pdfBase64,
    pdfStoragePath,
    loadReport,
    flags,
    decision: deriveCreditDecision(flags),
  };
}

export async function requestCreditDataReport(
  params: {
    idNumber: string;
    firstName: string;
    lastName: string;
    accountReference?: string;
    reason?: string;
    instruction?: ConsumerRiskInstruction;
  },
  deps: NiwsClientDeps = {}
): Promise<CreditPullResult> {
  const serviceKey = requireServiceKey();
  const nif = buildConsumerCreditNif({
    serviceKey,
    instruction: params.instruction || 'CD11',
    accountReference: params.accountReference || params.idNumber,
    idNumber: params.idNumber,
    surname: params.lastName,
    firstName: params.firstName,
    reasonCode: params.reason,
  });
  const { fileToken, loadReport } = await uploadAndPoll(nif, deps);
  return pullCreditPdf(fileToken, loadReport, deps);
}

export async function requestCompanyCreditReport(
  params: {
    registrationNumber: string;
    accountReference: string;
    instruction?: CompanyRiskInstruction;
    reason?: string;
  },
  deps: NiwsClientDeps = {}
): Promise<CreditPullResult> {
  const serviceKey = requireServiceKey();
  const nif = buildCompanyCreditNif({
    serviceKey,
    instruction: params.instruction || 'CD32',
    accountReference: params.accountReference,
    registrationNumber: params.registrationNumber,
    reasonCode: params.reason,
  });
  const { fileToken, loadReport } = await uploadAndPoll(nif, deps);
  return pullCreditPdf(fileToken, loadReport, deps);
}

export async function requestAvsRealtime(
  params: {
    accountReference: string;
    idNumber: string;
    accountNumber: string;
    branchCode: string;
    enquiryName: string;
    accountType?: 'current' | 'savings' | 'transmission';
    isIdNumber?: boolean;
  },
  deps: NiwsClientDeps = {}
): Promise<{ raw: string; flags: Pick<CreditFlags, 'avs_acc_exists' | 'avs_id_match'> }> {
  requireServiceKey();
  const accountType =
    params.accountType === 'savings'
      ? 'Savings'
      : params.accountType === 'transmission'
        ? 'Transmission'
        : 'Current';
  const inner = [
    `<tem:AccountReference>${escapeXml(params.accountReference)}</tem:AccountReference>`,
    `<tem:BankAccountNumber>${escapeXml(params.accountNumber)}</tem:BankAccountNumber>`,
    `<tem:BranchCode>${escapeXml(params.branchCode)}</tem:BranchCode>`,
    `<tem:BankAccountType>${accountType}</tem:BankAccountType>`,
    `<tem:EnquiryName>${escapeXml(params.enquiryName)}</tem:EnquiryName>`,
    `<tem:IDNumber>${escapeXml(params.idNumber)}</tem:IDNumber>`,
    `<tem:IsIdNumber>${params.isIdNumber === false ? 'false' : 'true'}</tem:IsIdNumber>`,
  ].join('');
  const raw = await callNiws('AVSRealtimeQuery', inner, deps);
  const fromText = parseAvsFlagsFromReport(raw);
  const acc = avsFlag(
    xmlTag(raw, 'BankAccountNumberValid') || xmlTag(raw, 'AccountActive')
  );
  const idMatch = avsFlag(xmlTag(raw, 'IdNumberMatch') || xmlTag(raw, 'IDNumberValid'));
  return {
    raw,
    flags: {
      avs_acc_exists: acc ?? fromText.avs_acc_exists,
      avs_id_match: idMatch ?? fromText.avs_id_match,
    },
  };
}

/** @deprecated Use requestAvsRealtime. Kept for the admin pull route. */
export async function requestAvsReport(
  params: {
    idNumber: string;
    accountNumber: string;
    branchCode?: string;
    enquiryName?: string;
    accountReference?: string;
  },
  deps: NiwsClientDeps = {}
): Promise<{ raw: string; flags: Pick<CreditFlags, 'avs_acc_exists' | 'avs_id_match'> }> {
  if (!params.branchCode) {
    throw new Error('branchCode is required for AVSRealtimeQuery');
  }
  return requestAvsRealtime(
    {
      accountReference: params.accountReference || params.idNumber,
      idNumber: params.idNumber,
      accountNumber: params.accountNumber,
      branchCode: params.branchCode,
      enquiryName: params.enquiryName || 'Account Holder',
    },
    deps
  );
}
