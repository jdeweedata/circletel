import { parseMandateDataFile, mapMandateStatusCode } from '@/lib/payments/netcash-mandate-status';

// Real NetCash RetrieveMandateData sample shape (tab-delimited, &#xD; line breaks).
const SAMPLE = [
  '###BEGIN\t20260610&#xD;',
  '2\tCT-2025-00006\tMELVIN WATKINS\t999.00\t1\tMELVIN\tWATKINS&#xD;',
  '6\tCT-2025-00099\tACCEPTED CLINIC\t517.50\t0&#xD;',
  '9\tCT-2025-00088\tVERIFIED CLINIC\t517.50\t0&#xD;',
  '4\tCT-2025-00077\tFAILED CLINIC\t517.50\t0&#xD;',
  '2\tCT-2026-00020\tUNJANI LENS\t517.50\t0\tUNJANI\tLENS&#xD;',
  '###END&#xD;',
].join('');

describe('mapMandateStatusCode', () => {
  it('maps accepted (6) and verified (9) to active', () => {
    expect(mapMandateStatusCode('6').outcome).toBe('active');
    expect(mapMandateStatusCode('9').outcome).toBe('active');
    expect(mapMandateStatusCode('9').verified).toBe(true);
    expect(mapMandateStatusCode('6').verified).toBe(false);
  });
  it('maps expired/failed/declined (3/4/5) to failed', () => {
    expect(mapMandateStatusCode('3').outcome).toBe('failed');
    expect(mapMandateStatusCode('4').outcome).toBe('failed');
    expect(mapMandateStatusCode('5').outcome).toBe('failed');
  });
  it('maps capturing/awaiting (1/2/8/10/11) to pending', () => {
    for (const c of ['1', '2', '8', '10', '11']) {
      expect(mapMandateStatusCode(c).outcome).toBe('pending');
    }
  });
});

describe('parseMandateDataFile', () => {
  const rows = parseMandateDataFile(SAMPLE);

  it('skips ###BEGIN/###END and parses each mandate row', () => {
    expect(rows.length).toBe(5);
    expect(rows.map((r) => r.accountRef)).toContain('CT-2026-00020');
  });

  it('reads status code from field[0] and account ref from field[1]', () => {
    const lens = rows.find((r) => r.accountRef === 'CT-2026-00020')!;
    expect(lens.statusCode).toBe('2');
    expect(lens.outcome).toBe('pending');
    expect(lens.label).toBe('Awaiting authorisation');
  });

  it('maps outcomes correctly for accepted/verified/failed rows', () => {
    expect(rows.find((r) => r.accountRef === 'CT-2025-00099')!.outcome).toBe('active');
    expect(rows.find((r) => r.accountRef === 'CT-2025-00088')!.outcome).toBe('active');
    expect(rows.find((r) => r.accountRef === 'CT-2025-00088')!.verified).toBe(true);
    expect(rows.find((r) => r.accountRef === 'CT-2025-00077')!.outcome).toBe('failed');
  });
});
