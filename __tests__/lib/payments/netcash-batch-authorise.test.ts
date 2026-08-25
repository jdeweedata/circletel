import {
  buildBatchAuthoriseEnvelope,
  parseBatchAuthoriseResult,
  partitionByLimits,
  BATCH_AUTH_CODES,
  type BatchAuthoriseOptions,
  type DebitOrderItem,
} from '@/lib/payments/netcash-debit-batch-service';

const FULL_OPTS: Required<BatchAuthoriseOptions> = {
  sendEmail: false,
  fromName: 'CircleTel',
  fromAddress: 'billing@circletel.co.za',
  sendSMS: false,
  releaseFunds: true,
  bankTransfer: false,
};

const SERVICE_KEY = '3213bddd-0000-0000-0000-000000004116';
const BATCH_GUID = 'a1b2c3d4-1111-2222-3333-444455556666';

describe('buildBatchAuthoriseEnvelope', () => {
  const xml = buildBatchAuthoriseEnvelope(SERVICE_KEY, BATCH_GUID, FULL_OPTS);

  it('targets the RequestBatchAuthorise operation in the tempuri namespace', () => {
    expect(xml).toContain('<tem:RequestBatchAuthorise>');
    expect(xml).toContain('xmlns:tem="http://tempuri.org/"');
  });

  it('includes the service key and batch indicator (GUID)', () => {
    expect(xml).toContain(`<tem:ServiceKey>${SERVICE_KEY}</tem:ServiceKey>`);
    expect(xml).toContain(`<tem:BatchIndicator>${BATCH_GUID}</tem:BatchIndicator>`);
  });

  it('serialises booleans as lowercase true/false and releases funds by default', () => {
    expect(xml).toContain('<tem:ReleaseFunds>true</tem:ReleaseFunds>');
    expect(xml).toContain('<tem:SendEmail>false</tem:SendEmail>');
    expect(xml).toContain('<tem:SendSMS>false</tem:SendSMS>');
    expect(xml).toContain('<tem:BankTransfer>false</tem:BankTransfer>');
  });

  it('emits the parameters in the WSDL sequence order', () => {
    const order = ['ServiceKey', 'BatchIndicator', 'SendEmail', 'FromName', 'FromAddress', 'SendSMS', 'ReleaseFunds', 'BankTransfer'];
    const positions = order.map((p) => xml.indexOf(`<tem:${p}>`));
    expect(positions.every((pos) => pos >= 0)).toBe(true);
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });

  it('escapes XML-significant characters in string params', () => {
    const escaped = buildBatchAuthoriseEnvelope(SERVICE_KEY, BATCH_GUID, { ...FULL_OPTS, fromName: 'Circle & Tel <SA>' });
    expect(escaped).toContain('<tem:FromName>Circle &amp; Tel &lt;SA&gt;</tem:FromName>');
  });
});

function authoriseResponse(code: string): string {
  return `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><RequestBatchAuthoriseResponse xmlns="http://tempuri.org/"><RequestBatchAuthoriseResult>${code}</RequestBatchAuthoriseResult></RequestBatchAuthoriseResponse></s:Body></s:Envelope>`;
}

describe('parseBatchAuthoriseResult', () => {
  it('flags 322 as Auto-Auth-not-allowed and not successful', () => {
    const r = parseBatchAuthoriseResult(authoriseResponse('322'));
    expect(r.success).toBe(false);
    expect(r.authoriseNotAllowed).toBe(true);
    expect(r.code).toBe('322');
    expect(r.message).toBe(BATCH_AUTH_CODES['322']);
  });

  it('treats other documented error codes as failures (not auto-auth)', () => {
    for (const code of ['100', '200', '320', '321', '323']) {
      const r = parseBatchAuthoriseResult(authoriseResponse(code));
      expect(r.success).toBe(false);
      expect(r.authoriseNotAllowed).toBe(false);
      expect(r.message).toBe(BATCH_AUTH_CODES[code]);
    }
  });

  it('treats a non-error response (token/0) as success', () => {
    const r = parseBatchAuthoriseResult(authoriseResponse('0'));
    expect(r.success).toBe(true);
    expect(r.authoriseNotAllowed).toBe(false);
    expect(r.code).toBe('0');
  });

  it('trims whitespace/newlines around the result code', () => {
    const r = parseBatchAuthoriseResult(authoriseResponse('\n  322 \r\n'));
    expect(r.code).toBe('322');
    expect(r.authoriseNotAllowed).toBe(true);
  });

  it('fails safely on an empty/garbled response', () => {
    const r = parseBatchAuthoriseResult('<html>gateway error</html>');
    expect(r.success).toBe(false);
    expect(r.code).toBe('');
    expect(r.message).toMatch(/empty response/i);
  });
});

// Default NetCash profile limits (no env overrides): line R1,500, daily R20,000,
// warn at 80% (R16,000). See netcash-debit-batch-service.ts.
function item(ref: string, amount: number): DebitOrderItem {
  return {
    accountReference: ref,
    amount,
    actionDate: new Date('2026-06-29'),
    customerId: `cust-${ref}`,
    accountName: 'Test Account',
    accountType: 'current',
    branchCode: '250655',
    accountNumber: '1234567890',
  };
}

describe('partitionByLimits', () => {
  it('keeps a normal batch fully submittable with no warning or daily breach', () => {
    const p = partitionByLimits([item('A', 450), item('B', 999), item('C', 450)]);
    expect(p.submittable).toHaveLength(3);
    expect(p.overLine).toHaveLength(0);
    expect(p.totalRands).toBe(1899);
    expect(p.dailyExceeded).toBe(false);
    expect(p.warning).toBeUndefined();
  });

  it('splits out items above the per-item line limit (skip & flag) but keeps the rest', () => {
    const p = partitionByLimits([item('clinic', 450), item('bizfibre', 4373), item('clinic2', 999)]);
    expect(p.overLine.map((i) => i.accountReference)).toEqual(['bizfibre']);
    expect(p.submittable.map((i) => i.accountReference)).toEqual(['clinic', 'clinic2']);
    // total reflects SUBMITTABLE only — the over-line item is excluded
    expect(p.totalRands).toBe(1449);
    expect(p.dailyExceeded).toBe(false);
  });

  it('treats an item exactly at the line limit as submittable (boundary)', () => {
    const p = partitionByLimits([item('edge', 1500)]);
    expect(p.overLine).toHaveLength(0);
    expect(p.submittable).toHaveLength(1);
  });

  it('warns when the submittable total crosses 80% of the daily cap but still submits', () => {
    // 40 x R450 = R18,000 (> R16,000 warn threshold, <= R20,000 cap)
    const items = Array.from({ length: 40 }, (_, i) => item(`x${i}`, 450));
    const p = partitionByLimits(items);
    expect(p.totalRands).toBe(18000);
    expect(p.dailyExceeded).toBe(false);
    expect(p.warning).toMatch(/approaching the cap/i);
  });

  it('flags dailyExceeded when the submittable total breaches the daily cap', () => {
    // 50 x R450 = R22,500 (> R20,000)
    const items = Array.from({ length: 50 }, (_, i) => item(`x${i}`, 450));
    const p = partitionByLimits(items);
    expect(p.totalRands).toBe(22500);
    expect(p.dailyExceeded).toBe(true);
    expect(p.warning).toBeUndefined(); // breach takes precedence over the warn band
  });

  it('computes the daily cap AFTER excluding over-line items', () => {
    // One R5,000 over-line item would push a naive sum over R20k, but it is
    // excluded; the submittable R15,000 is under the cap.
    const items = [item('big', 5000), ...Array.from({ length: 30 }, (_, i) => item(`x${i}`, 500))];
    const p = partitionByLimits(items);
    expect(p.overLine.map((i) => i.accountReference)).toEqual(['big']);
    expect(p.totalRands).toBe(15000);
    expect(p.dailyExceeded).toBe(false);
  });

  it('handles an empty batch', () => {
    const p = partitionByLimits([]);
    expect(p.submittable).toHaveLength(0);
    expect(p.overLine).toHaveLength(0);
    expect(p.totalRands).toBe(0);
    expect(p.dailyExceeded).toBe(false);
  });
});
