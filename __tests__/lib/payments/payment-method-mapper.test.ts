/**
 * Tests for the payment-method mapper (debit-order cutover W1.1).
 * Pure functions — real assertions, no mocking of the unit under test.
 */

import {
  mapPostbackToPaymentMethod,
  mapPaymentMethodToDisplay,
  extractLastFour,
  type CustomerPaymentMethodRow,
} from '@/lib/payments/payment-method-mapper';
import type { EMandatePostback } from '@/lib/payments/netcash-emandate-service';

const SIGNED_AT = '2026-06-03T10:00:00.000Z';
const CUSTOMER_ID = 'cc22f925-8cf9-4e03-98dd-3ebd86ef230b';

/** Build a complete, valid postback; override per-test. */
function buildPostback(overrides: Partial<EMandatePostback> = {}): EMandatePostback {
  return {
    MandateSuccessful: '1',
    AccountRef: 'CT-2026-00011',
    AccountName: 'Ashwyn Watkins',
    DefaultAmount: '517.50',
    AllowVariableAmounts: 'False',
    IsActive: 'True',
    IsValid: 'True',
    IsFromWebService: 'True',
    MandateStatus: 'Active',
    FirstName: 'Ashwyn',
    LastName: 'Watkins',
    ContactPerson: 'Ashwyn Watkins',
    Email: 'watkins.ashwyn@gmail.com',
    CellNo: '0713511820',
    IsRSAId: 'True',
    NotificationByEmailActive: 'True',
    NotificationByCellNoActive: 'True',
    AgreementDate: '2026-06-03',
    DebitDay: '1',
    DecemberDebitDay: '1',
    DebitOnLastDay: 'False',
    MandateReferenceNumber: 'MND-12345',
    NoticeDays: '0',
    LuMandatePublicHolidayOptionId: '1',
    DoAVS: 'True',
    MandateDebitFrequencyId: '1',
    SignBy_FirstName: 'Ashwyn',
    SignBy_LastName: 'Watkins',
    SignBy_Email: 'watkins.ashwyn@gmail.com',
    SignBy_CellNo: '0713511820',
    IsCreditCard: 'False',
    IsDeclined: '0',
    MandatePDFLink: 'https://netcash.example/mandate/MND-12345.pdf',
    ...overrides,
  };
}

describe('mapPostbackToPaymentMethod — bank account mandate', () => {
  const result = mapPostbackToPaymentMethod(
    buildPostback({
      BankName: 'FNB',
      BankAccountName: 'A Watkins',
      BankAccountNo: '321*****7890',
      BankAccountType: 'Current',
      BranchCode: '250655',
    }),
    CUSTOMER_ID,
    SIGNED_AT
  );

  it('produces a debit-order method the batch will recognise', () => {
    expect(result.method_type).toBe('debit_order');
    expect(result.is_active).toBe(true);
    expect(result.is_primary).toBe(true);
    expect(result.mandate_status).toBe('active');
    expect(result.encrypted_details.verified).toBe(true);
  });

  it('captures mandate identity and amount', () => {
    expect(result.mandate_id).toBe('MND-12345');
    expect(result.max_debit_amount).toBe(517.5);
    expect(result.mandate_approved_at).toBe(SIGNED_AT);
    expect(result.encrypted_details.mandate_pdf_link).toBe(
      'https://netcash.example/mandate/MND-12345.pdf'
    );
  });

  it('stores bank details in encrypted_details and derives last_four', () => {
    expect(result.encrypted_details.bank_name).toBe('FNB');
    expect(result.encrypted_details.bank_account_number_masked).toBe('321*****7890');
    expect(result.encrypted_details.bank_account_type).toBe('current');
    expect(result.encrypted_details.branch_code).toBe('250655');
    expect(result.encrypted_details.debit_day).toBe(1);
    expect(result.last_four).toBe('7890');
  });

  it('leaves card fields null for a bank mandate', () => {
    expect(result.card_token).toBeNull();
    expect(result.card_type).toBeNull();
    expect(result.encrypted_details.is_credit_card).toBe(false);
  });
});

describe('mapPostbackToPaymentMethod — credit card mandate', () => {
  const result = mapPostbackToPaymentMethod(
    buildPostback({
      IsCreditCard: 'True',
      CCType: 'VISA',
      CCAccountName: 'A Watkins',
      CCAccountNo: '448300******9809',
      CCExpMM: '08',
      CCExpYYYY: '2028',
      CCToken: '408137452',
    }),
    CUSTOMER_ID,
    SIGNED_AT
  );

  it('captures the card token and expiry', () => {
    expect(result.encrypted_details.is_credit_card).toBe(true);
    expect(result.card_token).toBe('408137452');
    expect(result.card_type).toBe('visa');
    expect(result.card_expiry_month).toBe(8);
    expect(result.card_expiry_year).toBe(2028);
    expect(result.token_status).toBe('active');
    expect(result.last_four).toBe('9809');
  });
});

describe('mapPostbackToPaymentMethod — debit day normalisation', () => {
  it('coerces an invalid debit day to 1', () => {
    const result = mapPostbackToPaymentMethod(
      buildPostback({ DebitDay: '15' }),
      CUSTOMER_ID,
      SIGNED_AT
    );
    expect(result.encrypted_details.debit_day).toBe(1);
  });

  it('keeps a valid debit day', () => {
    const result = mapPostbackToPaymentMethod(
      buildPostback({ DebitDay: '25' }),
      CUSTOMER_ID,
      SIGNED_AT
    );
    expect(result.encrypted_details.debit_day).toBe(25);
  });
});

describe('mapPaymentMethodToDisplay — round trip', () => {
  it('renders bank details from a stored mandate row', () => {
    const write = mapPostbackToPaymentMethod(
      buildPostback({
        BankName: 'FNB',
        BankAccountName: 'A Watkins',
        BankAccountNo: '321*****7890',
        BankAccountType: 'Current',
        BranchCode: '250655',
      }),
      CUSTOMER_ID,
      SIGNED_AT
    );

    // Simulate the persisted row (DB adds id + created_at)
    const row: CustomerPaymentMethodRow = {
      id: 'ddff8c36-e2fa-41c7-b354-ffeee0a1e749',
      method_type: write.method_type,
      display_name: write.display_name,
      last_four: write.last_four,
      mandate_status: write.mandate_status,
      mandate_approved_at: write.mandate_approved_at,
      max_debit_amount: write.max_debit_amount,
      is_primary: write.is_primary,
      created_at: SIGNED_AT,
      encrypted_details: write.encrypted_details,
    };

    const display = mapPaymentMethodToDisplay(row);

    expect(display.method_type).toBe('bank_account'); // debit_order → bank_account for UI
    expect(display.status).toBe('active');
    expect(display.bank_name).toBe('FNB');
    expect(display.bank_account_number_masked).toBe('321*****7890');
    expect(display.bank_account_type).toBe('current');
    expect(display.branch_code).toBe('250655');
    expect(display.mandate_amount).toBe(517.5);
    expect(display.mandate_debit_day).toBe(1);
    expect(display.netcash_mandate_pdf_link).toBe(
      'https://netcash.example/mandate/MND-12345.pdf'
    );
    expect(display._verified).toBe(true);
  });

  it('prefers the stored PDF path over the live link once W4.1 populates it', () => {
    const row: CustomerPaymentMethodRow = {
      id: 'x',
      method_type: 'debit_order',
      created_at: SIGNED_AT,
      encrypted_details: {
        provider: 'netcash',
        verified: true,
        mandate_pdf_link: 'https://netcash.example/live.pdf',
        mandate_pdf_path: 'debit-order-mandates/cc22/MND-12345.pdf',
      } as Record<string, unknown>,
    };
    expect(mapPaymentMethodToDisplay(row).netcash_mandate_pdf_link).toBe(
      'debit-order-mandates/cc22/MND-12345.pdf'
    );
  });
});

describe('extractLastFour', () => {
  it('returns last 4 digits, ignoring mask characters', () => {
    expect(extractLastFour('448300******9809')).toBe('9809');
    expect(extractLastFour('321*****7890')).toBe('7890');
  });
  it('handles null/empty/no-digit input', () => {
    expect(extractLastFour(null)).toBeNull();
    expect(extractLastFour('')).toBeNull();
    expect(extractLastFour('****')).toBeNull();
  });
});
