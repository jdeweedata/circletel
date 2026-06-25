import {
  buildBatchAuthoriseEnvelope,
  parseBatchAuthoriseResult,
  BATCH_AUTH_CODES,
  type BatchAuthoriseOptions,
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
