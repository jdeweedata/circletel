import {
  parseAvsFlagsFromReport,
  parseCreditReportFlags,
  riskServiceKeyConfigured,
} from '@/lib/credit-risk/netcash-risk-client';
import { deriveCreditDecision, passBlockedReason } from '@/lib/credit-risk/decision';
import { adminFieldsToKeepOnPull } from '@/lib/credit-risk/review-store';

describe('parseCreditReportFlags', () => {
  it('maps the Ishmael Netcash wording to debt review', () => {
    const flags = parseCreditReportFlags({
      comments: 'Principal is under debt review',
      score: null,
      judgements: 0,
      defaults: 0,
    });
    expect(flags.debt_review).toBe(true);
    expect(flags.no_score).toBe(true);
    expect(deriveCreditDecision(flags)).toBe('HARD_FAIL');
  });

  it('maps AVS yes/no onto flags', () => {
    const flags = parseCreditReportFlags({
      avsAccExists: true,
      avsIdMatch: false,
    });
    expect(flags.avs_acc_exists).toBe(true);
    expect(flags.avs_id_match).toBe(false);
    expect(deriveCreditDecision(flags)).toBe('HARD_FAIL');
  });
});

describe('parseAvsFlagsFromReport', () => {
  it('parses Acc Exists / Id Match = No as false, not unknown', () => {
    const flags = parseAvsFlagsFromReport(
      'Account exists: No\nID Match: No\nBankAccountNumberValid: Invalid'
    );
    expect(flags.avs_acc_exists).toBe(false);
    expect(flags.avs_id_match).toBe(false);
    expect(deriveCreditDecision(flags)).toBe('HARD_FAIL');
  });

  it('parses Acc Exists / Id Match = Yes as true', () => {
    const flags = parseAvsFlagsFromReport('Account exists: Yes\nID Match: True');
    expect(flags.avs_acc_exists).toBe(true);
    expect(flags.avs_id_match).toBe(true);
  });
});

describe('passBlockedReason', () => {
  it('blocks PASS on sequestration and AVS no, not only debt review', () => {
    expect(passBlockedReason({ sequestration: true }, false)).toMatch(/hard-fail/);
    expect(passBlockedReason({ avs_id_match: false }, false)).toMatch(/hard-fail/);
    expect(passBlockedReason({ sequestration: true }, true)).toBeNull();
    expect(passBlockedReason({ debt_review: false }, false)).toBeNull();
  });
});

describe('adminFieldsToKeepOnPull', () => {
  it('keeps prepaid, note, and override when a pull upserts', () => {
    const kept = adminFieldsToKeepOnPull({
      consumer_order_id: 'order-1',
      decision: 'HARD_FAIL',
      flags: {},
      financed_router_allowed: false,
      term_24_month_allowed: false,
      hardware_prepaid: true,
      alternatives: [],
      private_note: 'Customer paid the G5C.',
      override_reason: 'MD/CFO dual control',
      override_by: 'admin-1',
    });
    expect(kept).toEqual({
      hardware_prepaid: true,
      private_note: 'Customer paid the G5C.',
      override_reason: 'MD/CFO dual control',
      override_by: 'admin-1',
    });
  });
});

describe('riskServiceKeyConfigured', () => {
  it('is false when the Risk Reports key is missing', () => {
    const previous = process.env.NETCASH_RISK_SERVICE_KEY;
    delete process.env.NETCASH_RISK_SERVICE_KEY;
    expect(riskServiceKeyConfigured()).toBe(false);
    if (previous) process.env.NETCASH_RISK_SERVICE_KEY = previous;
  });
});

function soapResult(action: string, result: string): string {
  return `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><${action}Response xmlns="http://tempuri.org/"><${action}Result>${result}</${action}Result></${action}Response></s:Body></s:Envelope>`;
}

function tinyPdf(text: string): string {
  const stream = `BT /F1 12 Tf 10 100 Td (${text}) Tj ET`;
  const pdf = `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>endobj
4 0 obj<< /Length ${stream.length} >>stream
${stream}
endstream
endobj
trailer<< /Root 1 0 R >>
%%EOF`;
  return Buffer.from(pdf, 'latin1').toString('base64');
}

function xmlResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/xml' } });
}

describe('requestCreditDataReport NIWS flow', () => {
  const previousKey = process.env.NETCASH_RISK_SERVICE_KEY;

  beforeEach(() => {
    process.env.NETCASH_RISK_SERVICE_KEY = 'risk-key-fixture';
  });

  afterEach(() => {
    if (previousKey) process.env.NETCASH_RISK_SERVICE_KEY = previousKey;
    else delete process.env.NETCASH_RISK_SERVICE_KEY;
  });

  it('fails closed when the Risk Reports key is missing (no SOAP)', async () => {
    delete process.env.NETCASH_RISK_SERVICE_KEY;
    const fetchImpl = jest.fn();
    const { requestCreditDataReport } = await import('@/lib/credit-risk/netcash-risk-client');
    await expect(
      requestCreditDataReport(
        {
          idNumber: '8001015009087',
          firstName: 'Ishmael',
          lastName: 'Mthembu',
          accountReference: 'ORD-1',
        },
        { fetchImpl: fetchImpl as unknown as typeof fetch }
      )
    ).rejects.toThrow(/NETCASH_RISK_SERVICE_KEY/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uploads CD11 NIF, polls FILE NOT READY, then RequestCreditDataReport with FileToken only', async () => {
    const { requestCreditDataReport } = await import('@/lib/credit-risk/netcash-risk-client');
    const pdfB64 = tinyPdf('Clear. Principal is under debt review');
    let loadPolls = 0;

    const fetchImpl = jest.fn(async (_url: string, init?: RequestInit) => {
      const body = String(init?.body || '');
      if (body.includes('<tem:BatchFileUpload>')) {
        expect(body).toContain('\tCD11\t');
        expect(body).toMatch(/\t32\n/);
        expect(body).toContain('8001015009087');
        return xmlResponse(soapResult('BatchFileUpload', 'FILETOKEN-CD11'));
      }
      if (body.includes('<tem:RequestFileUploadReport>')) {
        expect(body).toContain('<tem:FileToken>FILETOKEN-CD11</tem:FileToken>');
        loadPolls += 1;
        if (loadPolls === 1) {
          return xmlResponse(soapResult('RequestFileUploadReport', 'FILE NOT READY'));
        }
        return xmlResponse(
          soapResult('RequestFileUploadReport', '###BEGIN\tFILETOKEN-CD11\tSUCCESSFUL\t12:00')
        );
      }
      if (body.includes('<tem:RequestCreditDataReport>')) {
        expect(body).toContain('<tem:FileToken>FILETOKEN-CD11</tem:FileToken>');
        expect(body).not.toMatch(/<tem:IdNumber>/);
        expect(body).not.toMatch(/<tem:FirstName>/);
        expect(body).not.toMatch(/<tem:LastName>/);
        expect(body).not.toMatch(/<tem:Reason>/);
        return xmlResponse(soapResult('RequestCreditDataReport', pdfB64));
      }
      throw new Error(`unexpected SOAP: ${body.slice(0, 200)}`);
    });

    const stored: { token: string; pdf: string }[] = [];
    const result = await requestCreditDataReport(
      {
        idNumber: '8001015009087',
        firstName: 'Ishmael',
        lastName: 'Mthembu',
        accountReference: 'ORD-20260821-9026',
      },
      {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep: async () => undefined,
        storePdf: (fileToken, pdfBase64) => {
          stored.push({ token: fileToken, pdf: pdfBase64 });
          return `.private/credit-reports/${fileToken}.pdf`;
        },
      }
    );

    expect(loadPolls).toBe(2);
    expect(result.fileToken).toBe('FILETOKEN-CD11');
    expect(result.pdfStoragePath).toBe('.private/credit-reports/FILETOKEN-CD11.pdf');
    expect(result.flags.debt_review).toBe(true);
    expect(result.decision).toBe('HARD_FAIL');
    expect(stored[0]?.pdf).toBe(pdfB64);
  });

  it('uploads CD32 NIF then pulls the report by FileToken', async () => {
    const { requestCompanyCreditReport } = await import('@/lib/credit-risk/netcash-risk-client');
    const pdfB64 = tinyPdf('CIPC status: In Business');
    const fetchImpl = jest.fn(async (_url: string, init?: RequestInit) => {
      const body = String(init?.body || '');
      if (body.includes('<tem:BatchFileUpload>')) {
        expect(body).toContain('\tCD32\t');
        expect(body).toContain('202012345607');
        return xmlResponse(soapResult('BatchFileUpload', 'FILETOKEN-CD32'));
      }
      if (body.includes('<tem:RequestFileUploadReport>')) {
        return xmlResponse(
          soapResult('RequestFileUploadReport', '###BEGIN\tFILETOKEN-CD32\tSUCCESSFUL\t12:01')
        );
      }
      if (body.includes('<tem:RequestCreditDataReport>')) {
        expect(body).toContain('<tem:FileToken>FILETOKEN-CD32</tem:FileToken>');
        expect(body).not.toMatch(/<tem:IdNumber>/);
        return xmlResponse(soapResult('RequestCreditDataReport', pdfB64));
      }
      throw new Error(`unexpected SOAP: ${body.slice(0, 200)}`);
    });

    const result = await requestCompanyCreditReport(
      {
        registrationNumber: '2020/123456/07',
        accountReference: 'Q-1001',
      },
      {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep: async () => undefined,
        storePdf: () => null,
      }
    );
    expect(result.fileToken).toBe('FILETOKEN-CD32');
    expect(result.flags.debt_review).toBe(false);
  });
});

describe('AVSRealtimeQuery', () => {
  const previousKey = process.env.NETCASH_RISK_SERVICE_KEY;

  beforeEach(() => {
    process.env.NETCASH_RISK_SERVICE_KEY = 'risk-key-fixture';
  });

  afterEach(() => {
    if (previousKey) process.env.NETCASH_RISK_SERVICE_KEY = previousKey;
    else delete process.env.NETCASH_RISK_SERVICE_KEY;
  });

  it('calls AVSRealtimeQuery synchronously and maps Id Match = Invalid to HARD_FAIL flags', async () => {
    const { requestAvsRealtime } = await import('@/lib/credit-risk/netcash-risk-client');
    const fetchImpl = jest.fn(async (_url: string, init?: RequestInit) => {
      const body = String(init?.body || '');
      expect(body).toContain('<tem:AVSRealtimeQuery>');
      expect(body).toContain('<tem:BankAccountNumber>1234567890</tem:BankAccountNumber>');
      expect(body).toContain('<tem:BranchCode>250655</tem:BranchCode>');
      expect(body).not.toContain('<tem:RequestAVSReport>');
      return xmlResponse(`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><AVSRealtimeQueryResponse xmlns="http://tempuri.org/"><AVSRealtimeQueryResult><BankAccountNumberValid>Valid</BankAccountNumberValid><IdNumberMatch>Invalid</IdNumberMatch><ErrorCode>000</ErrorCode></AVSRealtimeQueryResult></AVSRealtimeQueryResponse></s:Body></s:Envelope>`);
    });

    const result = await requestAvsRealtime(
      {
        accountReference: 'ORD-1',
        idNumber: '8001015009087',
        accountNumber: '1234567890',
        branchCode: '250655',
        enquiryName: 'Mthembu',
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(result.flags.avs_acc_exists).toBe(true);
    expect(result.flags.avs_id_match).toBe(false);
    expect(deriveCreditDecision(result.flags)).toBe('HARD_FAIL');
  });
});
