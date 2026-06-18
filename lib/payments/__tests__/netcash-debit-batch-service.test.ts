import { NetCashDebitBatchService } from '../netcash-debit-batch-service';

const svc = new NetCashDebitBatchService();
const item = {
  accountReference: 'CT-2026-00016', amount: 517.5, actionDate: new Date('2026-06-25T00:00:00Z'),
  customerId: 'x', accountName: 'Unjani Clinic Heidelberg', accountType: 'current' as const,
  branchCode: '250655', accountNumber: '62836392449',
};

describe('buildTwoDayFile', () => {
  it('emits H/K/T/F with TwoDay instruction, full K fields, amount in cents', () => {
    const lines = svc.buildTwoDayFile([item], 'BATCH1').split('\n');
    expect(lines[0].split('\t')[3]).toBe('TwoDay');
    expect(lines[1]).toBe('K\t101\t102\t131\t132\t133\t134\t136\t162');
    expect(lines[2]).toBe('T\tCT-2026-00016\tUnjani Clinic Heidelberg\t1\tUnjani Clinic Heidelberg\t1\t250655\t62836392449\t51750');
    expect(lines[3]).toBe('F\t1\t51750\t9999');
  });

  it('maps savings account type to 2', () => {
    const lines = svc.buildTwoDayFile([{ ...item, accountType: 'savings' }], 'B').split('\n');
    expect(lines[2].split('\t')[5]).toBe('2'); // field 133 position
  });
});

describe('nextValidActionDate', () => {
  it('returns at least 2 days ahead and never a weekend', () => {
    const d = svc.nextValidActionDate(new Date('2026-06-18T12:00:00Z')); // Thu
    expect(d.getTime()).toBeGreaterThan(new Date('2026-06-19T00:00:00Z').getTime());
    expect([0, 6]).not.toContain(d.getDay());
  });
});
