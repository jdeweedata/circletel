import {
  CREDIT_APPLICATION_REASON_CODE,
  buildCompanyCreditNif,
  buildConsumerCreditNif,
  formatNifActionDate,
  sanitizeNifName,
} from '@/lib/credit-risk/nif';

const VENDOR_FIXTURE = 'netcash-vendor-fixture';

const SERVICE_KEY = 'risk-key-0000-0000-0000';
const ACTION = new Date('2026-08-27T10:00:00Z');

describe('NIF name sanitiser', () => {
  it('strips special characters and caps at 15 letters', () => {
    expect(sanitizeNifName("O'Neil-Smith & Co!!")).toBe('ONeil-Smith  Co');
    expect(sanitizeNifName('BartholomewJonathan')).toBe('BartholomewJona');
  });
});

describe('buildConsumerCreditNif', () => {
  it('builds a CD11 H/K/T/F file with reason code 32', () => {
    const nif = buildConsumerCreditNif({
      serviceKey: SERVICE_KEY,
      accountReference: 'ORD-20260821-9026',
      idNumber: '8001015009087',
      surname: 'Mthembu',
      firstName: 'Ishmael',
      actionDate: ACTION,
      batchName: 'CircleTel-CD11-Ishmael',
      softwareVendorKey: VENDOR_FIXTURE,
    });

    const lines = nif.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[0].split('\t')).toEqual([
      'H',
      SERVICE_KEY,
      '1',
      'CD11',
      'CircleTel-CD11-Ishmael',
      '20260827',
      VENDOR_FIXTURE,
    ]);
    expect(lines[1].split('\t')).toEqual(['K', '101', '111', '113', '114', '450']);
    expect(lines[2].split('\t')).toEqual([
      'T',
      'ORD-20260821-9026',
      '8001015009087',
      'Mthembu',
      'Ishmael',
      CREDIT_APPLICATION_REASON_CODE,
    ]);
    expect(lines[3].split('\t')).toEqual(['F', '1', '0', '9999']);
  });

  it('never writes a free-text reason into field 450', () => {
    const nif = buildConsumerCreditNif({
      serviceKey: SERVICE_KEY,
      accountReference: 'CT-1',
      idNumber: '8001015009087',
      surname: 'Test',
      firstName: 'User',
      actionDate: ACTION,
      reasonCode: 'Credit Risk Assessment',
    });
    expect(nif.split('\n')[2].split('\t')[5]).toBe(CREDIT_APPLICATION_REASON_CODE);
  });
});

describe('buildCompanyCreditNif', () => {
  it('builds a CD32 H/K/T/F file with field 122 and reason 32', () => {
    const nif = buildCompanyCreditNif({
      serviceKey: SERVICE_KEY,
      accountReference: 'Q-1001',
      registrationNumber: '2020/123456/07',
      actionDate: ACTION,
      batchName: 'CircleTel-CD32-Q1001',
    });

    const lines = nif.split('\n');
    expect(lines[0].split('\t')[3]).toBe('CD32');
    expect(lines[1].split('\t')).toEqual(['K', '101', '122', '450']);
    expect(lines[2].split('\t')).toEqual([
      'T',
      'Q-1001',
      '202012345607',
      CREDIT_APPLICATION_REASON_CODE,
    ]);
    expect(lines[3].split('\t')).toEqual(['F', '1', '0', '9999']);
  });
});

describe('formatNifActionDate', () => {
  it('emits CCYYMMDD', () => {
    expect(formatNifActionDate(ACTION)).toBe('20260827');
  });
});
