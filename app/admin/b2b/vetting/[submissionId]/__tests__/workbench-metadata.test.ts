import {
  buildAutomatedChecks,
  buildDocumentDrawerSummary,
  buildVettingSummaryItems,
} from '../workbench-utils';

describe('buildAutomatedChecks', () => {
  const base = {
    nameMatch: true,
    mismatchAcknowledged: false,
    regNumber: '2023/547010/10',
    hasSelectedDocument: true,
    submittedAt: '2026-06-18T10:00:00.000Z',
    slaDays: 2,
    now: Date.parse('2026-06-18T12:00:00.000Z'),
  };

  it('passes holder check when names match', () => {
    const holder = buildAutomatedChecks(base).find((c) => c.key === 'holderMatch')!;
    expect(holder.pass).toBe(true);
    expect(holder.note).toBe('Match');
  });

  it('fails holder check on mismatch, passes once acknowledged', () => {
    const mismatch = buildAutomatedChecks({ ...base, nameMatch: false });
    const h1 = mismatch.find((c) => c.key === 'holderMatch')!;
    expect(h1.pass).toBe(false);
    expect(h1.note).toBe('Names differ');

    const ack = buildAutomatedChecks({ ...base, nameMatch: false, mismatchAcknowledged: true });
    const h2 = ack.find((c) => c.key === 'holderMatch')!;
    expect(h2.pass).toBe(true);
    expect(h2.note).toBe('Overridden by reviewer');
  });

  it('fails registration check when reg number missing', () => {
    const checks = buildAutomatedChecks({ ...base, regNumber: '' });
    expect(checks.find((c) => c.key === 'regNumber')!.pass).toBe(false);
  });

  it('fails document-ready check when no document selected', () => {
    const checks = buildAutomatedChecks({ ...base, hasSelectedDocument: false });
    expect(checks.find((c) => c.key === 'documentReady')!.pass).toBe(false);
  });

  it('passes SLA check within window and fails when overdue', () => {
    const withinSla = buildAutomatedChecks(base).find((c) => c.key === 'withinSla')!;
    expect(withinSla.pass).toBe(true);
    expect(withinSla.note).toBe('0 days overdue');

    const overdue = buildAutomatedChecks({
      ...base,
      submittedAt: '2026-06-10T10:00:00.000Z', // 8 days before `now`
    }).find((c) => c.key === 'withinSla')!;
    expect(overdue.pass).toBe(false);
    expect(overdue.note).toBe('6 days overdue');
  });
});

describe('buildVettingSummaryItems', () => {
  it('formats compact reviewer status items for the workbench header', () => {
    const items = buildVettingSummaryItems({
      approved: 2,
      total: 5,
      needsDecision: 3,
      missing: 1,
      changesRequested: 1,
      lastReviewedAt: '2026-06-12T15:27:00',
    });

    expect(items).toEqual([
      {
        label: 'Approved',
        value: '2/5',
        helper: 'Required docs',
        tone: 'neutral',
      },
      {
        label: 'Needs decision',
        value: '3',
        helper: '1 changes requested',
        tone: 'warning',
      },
      {
        label: 'Missing',
        value: '1',
        helper: 'Required uploads',
        tone: 'danger',
      },
      {
        label: 'Last reviewed',
        value: '12 Jun 2026',
        helper: '15:27',
        tone: 'neutral',
      },
    ]);
  });
});

describe('buildDocumentDrawerSummary', () => {
  it('builds the document drawer title and subtitle from the selected document context', () => {
    const summary = buildDocumentDrawerSummary({
      requirementLabel: 'CIPC registration certificate',
      documentType: 'company_registration',
      fileType: 'Image',
    });

    expect(summary).toEqual({
      title: 'CIPC registration certificate',
      subtitle: 'Image · company_registration',
    });
  });
});
