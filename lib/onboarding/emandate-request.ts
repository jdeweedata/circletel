import type { EMandateBatchRequest } from '@/lib/payments/netcash-emandate-batch-service';

export interface EMandateBuildInput {
  accountNumber: string;       // -> accountReference + field3
  paymentMethodId: string;     // -> field1
  submissionId: string;        // -> field2
  /** Person who signs the mandate (NetCash fields 113/114) — the nurse, NOT the bank account holder. */
  signerName?: string;
  accountHolder: string;
  isConsumer: boolean;
  entityName: string;
  registrationNumber?: string;
  mobile: string;
  bank: string;
  accountType: string;         // 'Cheque / Current' | 'Savings' | 'Transmission'
  accountNumber2: string;      // bank account number
  branchCode: string;
  monthlyExVat: number;
  vatPct: number;
  paymentDay: string;          // '1' | '15' | '20' | '25'
  agreementDate: string;       // YYYY-MM-DD (service activation / acceptance date)
}

/** Map onboarding submission data to a NetCash EMandateBatchRequest. */
export function buildEMandateRequest(i: EMandateBuildInput): EMandateBatchRequest {
  const amountInclVat = Number((i.monthlyExVat * (1 + i.vatPct / 100)).toFixed(2));
  const agreement = new Date(i.agreementDate + 'T00:00:00Z');
  // Commencement month = the month the first debit should run (next month after agreement)
  const commencementMonth = ((agreement.getUTCMonth() + 1) % 12) + 1;
  // NetCash fields 113/114 identify the mandate SIGNER — prefer the nurse's name,
  // falling back to the account-holder string for older callers.
  const signer = (i.signerName || i.accountHolder).trim();
  const [first = '', ...rest] = signer.split(/\s+/);
  return {
    accountReference: i.accountNumber.substring(0, 22),
    mandateName: i.accountHolder.substring(0, 50),
    isConsumer: i.isConsumer,
    firstName: first,
    surname: rest.join(' ') || i.entityName.substring(0, 50),
    mobileNumber: i.mobile,
    mandateAmount: amountInclVat,
    debitFrequency: 1, // monthly
    commencementMonth,
    commencementDay: i.paymentDay,
    agreementDate: agreement,
    agreementReference: `CT-UNJ-${i.accountNumber}`.substring(0, 50),
    sendMandate: true,
    tradingName: i.isConsumer ? undefined : i.entityName.substring(0, 50),
    registrationNumber: i.isConsumer ? undefined : i.registrationNumber,
    registeredName: i.isConsumer ? undefined : i.entityName.substring(0, 50),
    bankDetailType: 1,
    bankAccountName: i.accountHolder.substring(0, 50),
    bankAccountType: i.accountType.toLowerCase().startsWith('savings') ? 2 : 1,
    branchCode: i.branchCode,
    bankAccountNumber: i.accountNumber2,
    field1: i.paymentMethodId,
    field2: i.submissionId,
    field3: i.accountNumber,
  };
}
