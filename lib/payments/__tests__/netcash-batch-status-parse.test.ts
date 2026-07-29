/**
 * Tests for parseBatchStatusXml — parsing NetCash RetrieveBatchStatus responses.
 *
 * NetCash responds with an `s:`-prefixed envelope and a tab-delimited string
 * result (same shape as RetrieveMerchantStatement). The old parser assumed an
 * array-style `soap:Envelope` structure and threw on every real response,
 * which silently broke authoriseBatchByName (it could never find a batch).
 */

import { parseBatchStatusXml } from '../netcash-statement-service';

const wrap = (result: string) =>
  `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><RetrieveBatchStatusResponse xmlns="http://tempuri.org/"><RetrieveBatchStatusResult>${result}</RetrieveBatchStatusResult></RetrieveBatchStatusResponse></s:Body></s:Envelope>`;

describe('parseBatchStatusXml', () => {
  it('parses a real-shaped s:Envelope response with tab-delimited batches', async () => {
    const rows = [
      [
        'abc-service-key',
        'guid-batch-1',
        'CircleTel-2026-07-01-123',
        '1',
        '3',
        '1350.00',
        '2026-07-01 06:00:00',
        '1900-01-01 00:00:00',
        '1900-01-01 00:00:00',
      ].join('\t'),
      [
        'abc-service-key',
        'guid-batch-2',
        'Debit batch for 2026-06-26',
        '4',
        '2',
        '552.00',
        '2026-06-24 09:00:00',
        '2026-06-24 10:00:00',
        '1900-01-01 00:00:00',
      ].join('\t'),
    ].join('\n');

    const batches = await parseBatchStatusXml(wrap(rows));

    expect(batches).toHaveLength(2);
    expect(batches[0]).toMatchObject({
      batchId: 'guid-batch-1',
      batchName: 'CircleTel-2026-07-01-123',
      status: 'unauthorised',
      volume: 3,
      value: 1350,
    });
    expect(batches[0].authorisedOn).toBeNull(); // 1900 sentinel = never
    expect(batches[1].status).toBe('processed');
    expect(batches[1].authorisedOn).not.toBeNull();
  });

  it('returns [] for error-code responses', async () => {
    for (const code of ['100', '200', '311']) {
      expect(await parseBatchStatusXml(wrap(code))).toEqual([]);
    }
  });

  it('returns [] for an empty result', async () => {
    expect(await parseBatchStatusXml(wrap(''))).toEqual([]);
  });

  it('tolerates soap:-prefixed envelopes too', async () => {
    const xml = wrap('k\tguid\tname\t2\t1\t276.00\t2026-06-29 06:00:00\t2026-06-29 07:00:00\t1900-01-01 00:00:00').replace(
      /s:/g,
      'soap:'
    );
    const batches = await parseBatchStatusXml(xml);
    expect(batches).toHaveLength(1);
    expect(batches[0].status).toBe('authorised');
  });
});
