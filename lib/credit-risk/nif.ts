import { getNetcashSoftwareVendorKey } from '@/lib/payments/netcash-debit-batch-service';

/** Env override, else the same public ISV key debit NIF uploads already use. */
export function defaultSoftwareVendorKey(): string {
  return process.env.NETCASH_SOFTWARE_VENDOR_KEY || getNetcashSoftwareVendorKey();
}

/** NIF field 450: credit application. Numeric only — never free text. */
export const CREDIT_APPLICATION_REASON_CODE = '32';

export type ConsumerRiskInstruction = 'CD11' | 'CD12' | 'CD13';
export type CompanyRiskInstruction = 'CD32' | 'CD31';

const TAB = '\t';
const NEWLINE = '\n';

export function formatNifActionDate(date: Date): string {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
}

/** NIF type A15: letters, spaces, hyphens only. */
export function sanitizeNifName(value: string, maxLen = 15): string {
  return (value || '').replace(/[^A-Za-z -]/g, '').slice(0, maxLen);
}

export function sanitizeNifDigits(value: string, maxLen = 13): string {
  return (value || '').replace(/\D/g, '').slice(0, maxLen);
}

export function sanitizeAccountReference(value: string): string {
  return (value || 'CT').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 22) || 'CT';
}

export function nifReasonCode(value?: string): string {
  if (value && /^\d{2}$/.test(value)) return value;
  return CREDIT_APPLICATION_REASON_CODE;
}

function headerRecord(params: {
  serviceKey: string;
  instruction: string;
  batchName: string;
  actionDate: Date;
  softwareVendorKey?: string;
}): string {
  return [
    'H',
    params.serviceKey,
    '1',
    params.instruction,
    params.batchName,
    formatNifActionDate(params.actionDate),
    params.softwareVendorKey || defaultSoftwareVendorKey(),
  ].join(TAB);
}

export function buildConsumerCreditNif(params: {
  serviceKey: string;
  accountReference: string;
  idNumber: string;
  surname: string;
  firstName: string;
  instruction?: ConsumerRiskInstruction;
  reasonCode?: string;
  batchName?: string;
  actionDate?: Date;
  softwareVendorKey?: string;
}): string {
  const instruction = params.instruction || 'CD11';
  const actionDate = params.actionDate || new Date();
  const accountReference = sanitizeAccountReference(params.accountReference);
  const batchName = params.batchName || `CircleTel-${instruction}-${accountReference}`;
  const header = headerRecord({
    serviceKey: params.serviceKey,
    instruction,
    batchName,
    actionDate,
    softwareVendorKey: params.softwareVendorKey,
  });
  const key = ['K', '101', '111', '113', '114', '450'].join(TAB);
  const txn = [
    'T',
    accountReference,
    sanitizeNifDigits(params.idNumber, 13),
    sanitizeNifName(params.surname),
    sanitizeNifName(params.firstName),
    nifReasonCode(params.reasonCode),
  ].join(TAB);
  const footer = ['F', '1', '0', '9999'].join(TAB);
  return [header, key, txn, footer].join(NEWLINE);
}

export function buildCompanyCreditNif(params: {
  serviceKey: string;
  accountReference: string;
  registrationNumber: string;
  instruction?: CompanyRiskInstruction;
  reasonCode?: string;
  batchName?: string;
  actionDate?: Date;
  softwareVendorKey?: string;
}): string {
  const instruction = params.instruction || 'CD32';
  const actionDate = params.actionDate || new Date();
  const accountReference = sanitizeAccountReference(params.accountReference);
  const batchName = params.batchName || `CircleTel-${instruction}-${accountReference}`;
  const header = headerRecord({
    serviceKey: params.serviceKey,
    instruction,
    batchName,
    actionDate,
    softwareVendorKey: params.softwareVendorKey,
  });
  const key = ['K', '101', '122', '450'].join(TAB);
  const txn = [
    'T',
    accountReference,
    sanitizeNifDigits(params.registrationNumber, 14),
    nifReasonCode(params.reasonCode),
  ].join(TAB);
  const footer = ['F', '1', '0', '9999'].join(TAB);
  return [header, key, txn, footer].join(NEWLINE);
}
