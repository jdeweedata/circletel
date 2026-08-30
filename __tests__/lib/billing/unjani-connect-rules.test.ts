import {
  UNJANI_NPC_BILLING_START,
  UNJANI_CONNECT_SKU,
  UNJANI_CONNECT_PRODUCT_NAME,
  UNJANI_NPC_BILL_TO,
  lastMondayOfMonth,
  fridayOfSameWeek,
  isLastMondayOfMonth,
  npcPackDates,
  addCalendarDays,
  freePeriodEnd,
  firstBillableDate,
  classifyUnjaniConnectCharge,
  contractEndFromRfs,
  isMonthToMonth,
  shouldSkipPerClinicInvoice,
  shouldSkipActivationProRata,
  collectableSubtotal,
  npcInvoiceDueDate,
  isLegacyLiveUnjaniSite,
  canIssueRfsCertificate,
  includeOnNpcStatement,
  shouldBillUnjaniSiteOnNpcPeriod,
  UNJANI_HOLD_SITE_BILLING_START,
} from '@/lib/billing/unjani-connect-rules';

describe('Unjani Connect NPC billing calendar', () => {
  it('uses 1 September 2026 as the NPC billing start', () => {
    expect(UNJANI_NPC_BILLING_START).toBe('2026-09-01');
  });

  it('finds the last Monday of September 2026', () => {
    expect(lastMondayOfMonth(2026, 9)).toBe('2026-09-28');
  });

  it('finds the last Monday of August 2026', () => {
    expect(lastMondayOfMonth(2026, 8)).toBe('2026-08-31');
  });

  it('puts Friday of the same week after last Monday in October when Monday is 28 Sep', () => {
    expect(fridayOfSameWeek('2026-09-28')).toBe('2026-10-02');
  });

  it('detects last Monday of the month', () => {
    expect(isLastMondayOfMonth('2026-09-28')).toBe(true);
    expect(isLastMondayOfMonth('2026-09-21')).toBe(false);
    expect(isLastMondayOfMonth('2026-09-29')).toBe(false);
  });

  it('bills the next month in advance on the last Monday', () => {
    const augustIssue = npcPackDates(2026, 8);
    expect(augustIssue.invoiceDate).toBe('2026-08-31');
    expect(augustIssue.dueDate).toBe('2026-09-04');
    expect(augustIssue.periodStart).toBe('2026-09-01');
    expect(augustIssue.periodEnd).toBe('2026-09-30');

    const septemberIssue = npcPackDates(2026, 9);
    expect(septemberIssue.invoiceDate).toBe('2026-09-28');
    expect(septemberIssue.dueDate).toBe('2026-10-02');
    expect(septemberIssue.periodStart).toBe('2026-10-01');
    expect(septemberIssue.periodEnd).toBe('2026-10-31');
  });

  it('uses Friday of the issue week as the invoice due date', () => {
    expect(npcInvoiceDueDate('2026-09-28')).toBe('2026-10-02');
  });
});

describe('Unjani Connect free period and pro-rata', () => {
  it('treats the RFS date as day 1 of a 30-calendar-day free period', () => {
    expect(freePeriodEnd('2026-09-12')).toBe('2026-10-11');
    expect(firstBillableDate('2026-09-12')).toBe('2026-10-12');
  });

  it('adds calendar days without shifting timezone', () => {
    expect(addCalendarDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addCalendarDays('2026-09-12', 29)).toBe('2026-10-11');
  });

  it('lists a new site as free (R0) for the RFS month', () => {
    const charge = classifyUnjaniConnectCharge({
      rfsIssuedAt: '2026-09-12',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      monthlyExVat: 450,
    });
    expect(charge.chargeType).toBe('free');
    expect(charge.amountExVat).toBe(0);
    expect(charge.collectable).toBe(false);
    expect(charge.suffix).toMatch(/complimentary|free/i);
  });

  it('bills pro-rata from day 31 to month-end after the free period', () => {
    const charge = classifyUnjaniConnectCharge({
      rfsIssuedAt: '2026-09-12',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      monthlyExVat: 450,
    });
    expect(charge.chargeType).toBe('pro_rata');
    expect(charge.daysCharged).toBe(20);
    expect(charge.daysInMonth).toBe(31);
    expect(charge.amountExVat).toBeCloseTo((450 * 20) / 31, 2);
    expect(charge.collectable).toBe(true);
  });

  it('bills a full month from the 1st after the pro-rata stub', () => {
    const charge = classifyUnjaniConnectCharge({
      rfsIssuedAt: '2026-09-12',
      periodStart: '2026-11-01',
      periodEnd: '2026-11-30',
      monthlyExVat: 450,
    });
    expect(charge.chargeType).toBe('full');
    expect(charge.amountExVat).toBe(450);
    expect(charge.collectable).toBe(true);
  });

  it('bills legacy live sites (no RFS) in full from 1 September 2026', () => {
    const charge = classifyUnjaniConnectCharge({
      rfsIssuedAt: null,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      monthlyExVat: 450,
      legacyLive: true,
    });
    expect(charge.chargeType).toBe('full');
    expect(charge.amountExVat).toBe(450);
  });

  it('does not put a site on the invoice before RFS', () => {
    const charge = classifyUnjaniConnectCharge({
      rfsIssuedAt: '2026-10-05',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      monthlyExVat: 450,
    });
    expect(charge.chargeType).toBe('not_active');
  });
});

describe('Unjani Connect contract term', () => {
  it('ends 25 months after RFS', () => {
    expect(contractEndFromRfs('2026-09-12')).toBe('2028-10-12');
  });

  it('is month-to-month after the 25-month term', () => {
    expect(isMonthToMonth('2026-09-12', '2028-10-12')).toBe(false);
    expect(isMonthToMonth('2026-09-12', '2028-10-13')).toBe(true);
  });
});

describe('Unjani Connect collection cutover', () => {
  it('skips per-clinic invoices from 1 September 2026 for Unjani Connect SKU', () => {
    expect(
      shouldSkipPerClinicInvoice({
        sku: UNJANI_CONNECT_SKU,
        invoiceDate: '2026-09-01',
      })
    ).toBe(true);
    expect(
      shouldSkipPerClinicInvoice({
        sku: UNJANI_CONNECT_SKU,
        invoiceDate: '2026-08-31',
      })
    ).toBe(false);
    expect(
      shouldSkipPerClinicInvoice({
        sku: 'SKY-100',
        invoiceDate: '2026-09-01',
      })
    ).toBe(false);
  });

  it('skips activation pro-rata invoices for Unjani Connect from 1 September', () => {
    expect(shouldSkipActivationProRata('2026-09-01', UNJANI_CONNECT_SKU)).toBe(
      true
    );
    expect(shouldSkipActivationProRata('2026-08-31', UNJANI_CONNECT_SKU)).toBe(
      false
    );
  });

  it('excludes free lines from the collectable subtotal', () => {
    expect(
      collectableSubtotal([
        { amount: 450, chargeType: 'full' },
        { amount: 0, chargeType: 'free' },
        { amount: 145.16, chargeType: 'pro_rata' },
      ])
    ).toBe(595.16);
  });

  it('keeps the customer-facing product name Unjani Connect', () => {
    expect(UNJANI_CONNECT_PRODUCT_NAME).toBe('Unjani Connect');
    expect(UNJANI_CONNECT_SKU).toBe('UNJ-MC-001');
  });
});

describe('Unjani Connect site eligibility on the NPC invoice', () => {
  it('treats active sites without RFS installed before 1 Sep as legacy live', () => {
    expect(
      isLegacyLiveUnjaniSite({
        rfsIssuedAt: null,
        installedAt: '2026-05-15',
        status: 'active',
      })
    ).toBe(true);
  });

  it('does not treat post-1-Sep installs without RFS as billable', () => {
    expect(
      isLegacyLiveUnjaniSite({
        rfsIssuedAt: null,
        installedAt: '2026-09-05',
        status: 'active',
      })
    ).toBe(false);
  });
});

describe('Unjani Connect RFS gate', () => {
  it('issues RFS only after a job card is uploaded and approved', () => {
    expect(
      canIssueRfsCertificate({ jobCardPath: null, jobCardApprovedAt: null })
    ).toBe(false);
    expect(
      canIssueRfsCertificate({
        jobCardPath: 'unjani-connect/site/job-card.pdf',
        jobCardApprovedAt: null,
      })
    ).toBe(false);
    expect(
      canIssueRfsCertificate({
        jobCardPath: 'unjani-connect/site/job-card.pdf',
        jobCardApprovedAt: '2026-09-12T10:00:00Z',
      })
    ).toBe(false);
    expect(
      canIssueRfsCertificate({
        jobCardPath: 'unjani-connect/site/job-card.pdf',
        jobCardApprovedAt: '2026-09-12T10:00:00Z',
        surveySpeedtestPath: 'unjani-connect/site/ookla-before.png',
        commissionSpeedtestPath: 'unjani-connect/site/ookla-after.png',
      })
    ).toBe(true);
  });
});

describe('Unjani NPC bill-to (onboarding form CT-COF-2026-001)', () => {
  it('uses CIPC, VAT and Midrand head office from the signed onboarding form', () => {
    expect(UNJANI_NPC_BILL_TO.legalName).toBe('Unjani Clinics NPC');
    expect(UNJANI_NPC_BILL_TO.registrationNumber).toBe('2014/089277/08');
    expect(UNJANI_NPC_BILL_TO.vatNumber).toBe('4220266250');
    expect(UNJANI_NPC_BILL_TO.accountCode).toBe('UNJ');
    expect(UNJANI_NPC_BILL_TO.billingEmail).toBe('finance@unjani.org');
    expect(UNJANI_NPC_BILL_TO.address.city).toBe('Midrand');
    expect(UNJANI_NPC_BILL_TO.address.postalCode).toBe('1685');
    expect(UNJANI_NPC_BILL_TO.address.line1).toContain('Central Park');
  });
});

describe('NPC statement invoice filter', () => {
  it('keeps historical per-clinic invoices before 1 Sep and only org invoices after', () => {
    expect(
      includeOnNpcStatement({
        invoice_date: '2026-08-15',
        corporate_site_id: 'site-1',
      })
    ).toBe(true);
    expect(
      includeOnNpcStatement({
        invoice_date: '2026-09-28',
        corporate_site_id: 'site-1',
      })
    ).toBe(false);
    expect(
      includeOnNpcStatement({
        invoice_date: '2026-09-28',
        corporate_site_id: null,
      })
    ).toBe(true);
  });
});

describe('Unjani hold sites — first bill 1 October 2026', () => {
  it('holds Alexandra, Sicelo, Oukasie, Phoenix, Chloorkop until October', () => {
    expect(UNJANI_HOLD_SITE_BILLING_START).toBe('2026-10-01');
    for (const site of [
      'Unjani Clinic - Alexandra',
      'Unjani Clinic - Sicelo',
      'Unjani Clinic - Oukasie',
      'Unjani Clinic - Phoenix',
      'Unjani Clinic - Chloorkop',
    ]) {
      expect(
        shouldBillUnjaniSiteOnNpcPeriod({
          siteName: site,
          periodEnd: '2026-09-30',
          billingStartDate: '2026-09-01',
        })
      ).toBe(false);
      expect(
        shouldBillUnjaniSiteOnNpcPeriod({
          siteName: site,
          periodEnd: '2026-10-31',
          billingStartDate: '2026-10-01',
        })
      ).toBe(true);
    }
  });

  it('still bills a live non-hold clinic on the September pack', () => {
    expect(
      shouldBillUnjaniSiteOnNpcPeriod({
        siteName: 'Unjani Clinic - Barcelona',
        periodEnd: '2026-09-30',
        billingStartDate: '2026-09-01',
      })
    ).toBe(true);
  });
});
