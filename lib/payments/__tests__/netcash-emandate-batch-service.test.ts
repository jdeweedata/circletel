import { NetCashEMandateBatchService } from '../netcash-emandate-batch-service';

describe('buildMasterfileLoadFile', () => {
  const svc = new NetCashEMandateBatchService();

  it('builds H/K/T/F with MandateToMasterfile instruction and only field 101', () => {
    const file = svc.buildMasterfileLoadFile(['CT-2026-00016', 'CT-2026-00017'], 'TEST-BATCH');
    const lines = file.split('\n');

    // Header: H \t <serviceKey> \t 1 \t MandateToMasterfile \t <batch> \t <date> \t <vendorKey>
    expect(lines[0].split('\t')[0]).toBe('H');
    expect(lines[0].split('\t')[3]).toBe('MandateToMasterfile');
    expect(lines[0].split('\t')[4]).toBe('TEST-BATCH');

    // Key record: only field 101
    expect(lines[1]).toBe('K\t101');

    // Transaction records: one account reference each
    expect(lines[2]).toBe('T\tCT-2026-00016');
    expect(lines[3]).toBe('T\tCT-2026-00017');

    // Footer: F \t <count> \t 0 \t 9999
    expect(lines[4]).toBe('F\t2\t0\t9999');
  });

  it('truncates account references to 22 chars', () => {
    const file = svc.buildMasterfileLoadFile(['A'.repeat(30)]);
    const tLine = file.split('\n')[2];
    expect(tLine).toBe('T\t' + 'A'.repeat(22));
  });
});
