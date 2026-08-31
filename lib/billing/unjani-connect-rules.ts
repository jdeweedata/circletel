/**
 * Unjani Connect commercial rules from 1 September 2026.
 *
 * CircleTel bills Unjani Clinics NPC (not individual clinics): itemized tax
 * invoice + statement of account, issued last Monday **in advance** for the
 * next calendar month, due that Friday.
 *
 * New sites: RFS starts a 30-calendar-day free period, then pro-rata to month
 * end, then full calendar months. 25-month term then month-to-month (30-day
 * notice). Legacy live sites are a payer switch only — full month, no free.
 */

export const UNJANI_NPC_BILLING_START = '2026-09-01';
export const UNJANI_CONNECT_SKU = 'UNJ-MC-001';
export const UNJANI_CONNECT_PRODUCT_NAME = 'Unjani Connect';
export const UNJANI_CORPORATE_CODE = 'UNJ';
export const UNJANI_MONTHLY_EX_VAT = 450;

/**
 * Live-site cohort after the Feb–14 June 2026 pilot.
 * Pro-rata from 15 June 2026; full months from July 2026.
 */
export const UNJANI_COHORT_BILLING_START = '2026-06-15';

/**
 * Still on hold after the June 2026 cohort: cancel, or first bill 1 October 2026.
 */
export const UNJANI_BILLING_HOLD_SITES = [
  'Alexandra',
  'Sicelo',
  'Oukasie',
  'Phoenix',
  'Chloorkop',
] as const;

export const UNJANI_HOLD_SITE_BILLING_START = '2026-10-01';

export function isUnjaniBillingHoldSite(
  customerName: string | null | undefined
): boolean {
  const name = customerName || '';
  return UNJANI_BILLING_HOLD_SITES.some((site) =>
    new RegExp(`\\b${site}\\b`, 'i').test(name)
  );
}

/** Cohort start, or 1 October 2026 for hold sites. An explicit later date still wins. */
export function unjaniEffectiveBillingStart(
  customerName: string | null | undefined,
  billingStartDate?: string | null
): string {
  const holdFloor = isUnjaniBillingHoldSite(customerName)
    ? UNJANI_HOLD_SITE_BILLING_START
    : UNJANI_COHORT_BILLING_START;
  if (billingStartDate && billingStartDate > holdFloor) return billingStartDate;
  return holdFloor;
}

/** True when this site belongs on the NPC pack for a period ending `periodEnd`. */
export function shouldBillUnjaniSiteOnNpcPeriod(input: {
  siteName?: string | null;
  periodEnd: string;
  billingStartDate?: string | null;
}): boolean {
  return (
    unjaniEffectiveBillingStart(input.siteName, input.billingStartDate) <=
    input.periodEnd
  );
}

/** Bill-to from CircleTel Customer Onboarding Form CT-COF-2026-001 (v1.1). */
export const UNJANI_NPC_BILL_TO = {
  legalName: 'Unjani Clinics NPC',
  tradingName: 'Unjani Clinics NPC',
  entityType: 'Non-Profit Company',
  registrationNumber: '2014/089277/08',
  vatNumber: '4220266250',
  accountCode: UNJANI_CORPORATE_CODE,
  billingEmail: 'finance@unjani.org',
  packTo: 'rbutcher@unjani.org',
  packCc: [
    'Darryl.Langford@unjani.org',
    'tumelom@circletel.co.za',
    'jeffrey.de.wee@circletel.co.za',
  ] as const,
  primaryEmail: 'ltoussaint@unjani.org',
  primaryContact: 'Lynda Toussaint',
  address: {
    line1: 'Central Park Office Block N, Ground Floor',
    line2: '400 16th Road, Randjespark',
    city: 'Midrand',
    province: 'Gauteng',
    postalCode: '1685',
  },
} as const;
export const UNJANI_FREE_CALENDAR_DAYS = 30;
export const UNJANI_CONTRACT_MONTHS = 25;
export const UNJANI_M2M_NOTICE_DAYS = 30;
export const UNJANI_VAT_RATE = 0.15;

export type UnjaniChargeType = 'full' | 'pro_rata' | 'free' | 'not_active';

export interface UnjaniChargeInput {
  rfsIssuedAt: string | null;
  periodStart: string;
  periodEnd: string;
  monthlyExVat?: number;
  /** Already-live sites on 1 Sep 2026 — no new free month. */
  legacyLive?: boolean;
}

export interface UnjaniCharge {
  chargeType: UnjaniChargeType;
  amountExVat: number;
  collectable: boolean;
  daysCharged: number;
  daysInMonth: number;
  suffix?: string;
  periodLabel: string;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utcDate(iso: string): Date {
  const day = iso.slice(0, 10);
  return new Date(`${day}T00:00:00Z`);
}

export function addCalendarDays(iso: string, days: number): string {
  const d = utcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

export function addCalendarMonths(iso: string, months: number): string {
  const d = utcDate(iso);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) {
    d.setUTCDate(0);
  }
  return ymd(d);
}

/** Last calendar day of a 1-indexed month that is still free (RFS is day 1). */
export function freePeriodEnd(rfsIssuedAt: string): string {
  return addCalendarDays(rfsIssuedAt, UNJANI_FREE_CALENDAR_DAYS - 1);
}

export function firstBillableDate(rfsIssuedAt: string): string {
  return addCalendarDays(rfsIssuedAt, UNJANI_FREE_CALENDAR_DAYS);
}

export function lastMondayOfMonth(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0));
  const dow = lastDay.getUTCDay();
  const offset = dow === 0 ? 6 : dow - 1;
  lastDay.setUTCDate(lastDay.getUTCDate() - offset);
  return ymd(lastDay);
}

export function fridayOfSameWeek(mondayIso: string): string {
  return addCalendarDays(mondayIso, 4);
}

export function isLastMondayOfMonth(iso: string): boolean {
  const d = utcDate(iso);
  if (d.getUTCDay() !== 1) return false;
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  return lastMondayOfMonth(year, month) === iso.slice(0, 10);
}

export function npcInvoiceDueDate(invoiceDate: string): string {
  return fridayOfSameWeek(invoiceDate);
}

/** Last Monday of `month` bills the **next** calendar month in advance. */
export function npcPackDates(
  year: number,
  month: number
): {
  invoiceDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
} {
  const invoiceDate = lastMondayOfMonth(year, month);
  const periodStart = ymd(new Date(Date.UTC(year, month, 1)));
  const periodEnd = ymd(new Date(Date.UTC(year, month + 1, 0)));
  return {
    invoiceDate,
    dueDate: fridayOfSameWeek(invoiceDate),
    periodStart,
    periodEnd,
  };
}

function daysInclusive(from: string, to: string): number {
  const a = utcDate(from).getTime();
  const b = utcDate(to).getTime();
  if (b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

function daysInMonth(periodStart: string): number {
  const d = utcDate(periodStart);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function classifyUnjaniConnectCharge(
  input: UnjaniChargeInput
): UnjaniCharge {
  const monthly = input.monthlyExVat ?? UNJANI_MONTHLY_EX_VAT;
  const inMonth = daysInMonth(input.periodStart);
  const periodLabel = `${input.periodStart} to ${input.periodEnd}`;

  if (input.legacyLive && !input.rfsIssuedAt) {
    return {
      chargeType: 'full',
      amountExVat: monthly,
      collectable: true,
      daysCharged: inMonth,
      daysInMonth: inMonth,
      periodLabel,
    };
  }

  if (!input.rfsIssuedAt || input.rfsIssuedAt > input.periodEnd) {
    return {
      chargeType: 'not_active',
      amountExVat: 0,
      collectable: false,
      daysCharged: 0,
      daysInMonth: inMonth,
      periodLabel,
    };
  }

  const billableFrom = firstBillableDate(input.rfsIssuedAt);
  const chargeStart =
    billableFrom > input.periodStart ? billableFrom : input.periodStart;
  const chargedDays =
    chargeStart > input.periodEnd
      ? 0
      : daysInclusive(chargeStart, input.periodEnd);

  if (chargedDays <= 0) {
    return {
      chargeType: 'free',
      amountExVat: 0,
      collectable: false,
      daysCharged: 0,
      daysInMonth: inMonth,
      suffix: 'complimentary — 30-day free period',
      periodLabel,
    };
  }

  if (chargedDays === inMonth && chargeStart === input.periodStart) {
    return {
      chargeType: 'full',
      amountExVat: monthly,
      collectable: true,
      daysCharged: inMonth,
      daysInMonth: inMonth,
      periodLabel,
    };
  }

  const amountExVat = round2((monthly * chargedDays) / inMonth);
  return {
    chargeType: 'pro_rata',
    amountExVat,
    collectable: true,
    daysCharged: chargedDays,
    daysInMonth: inMonth,
    suffix: `pro-rata ${chargedDays}/${inMonth} days`,
    periodLabel,
  };
}

export function contractEndFromRfs(rfsIssuedAt: string): string {
  return addCalendarMonths(rfsIssuedAt, UNJANI_CONTRACT_MONTHS);
}

export function isMonthToMonth(
  rfsIssuedAt: string,
  onDate: string
): boolean {
  return onDate > contractEndFromRfs(rfsIssuedAt);
}

export function isInFreePeriod(
  rfsIssuedAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!rfsIssuedAt) return false;
  const today = ymd(now);
  const rfs = rfsIssuedAt.slice(0, 10);
  if (today < rfs) return false;
  return today <= freePeriodEnd(rfs);
}

export function shouldSkipPerClinicInvoice(input: {
  sku?: string | null;
  invoiceDate: string;
}): boolean {
  if (input.sku !== UNJANI_CONNECT_SKU) return false;
  return input.invoiceDate >= UNJANI_NPC_BILLING_START;
}

export function shouldSkipActivationProRata(
  activatedAt: string,
  sku?: string | null
): boolean {
  if (sku !== UNJANI_CONNECT_SKU) return false;
  return activatedAt.slice(0, 10) >= UNJANI_NPC_BILLING_START;
}

export function collectableSubtotal(
  lines: Array<{ amount: number; chargeType?: UnjaniChargeType | string }>
): number {
  return round2(
    lines.reduce((sum, line) => {
      if (line.chargeType === 'free' || line.chargeType === 'not_active') {
        return sum;
      }
      return sum + line.amount;
    }, 0)
  );
}

export function vatOnExVat(subtotalExVat: number): {
  vatAmount: number;
  totalInclVat: number;
} {
  const vatAmount = round2(subtotalExVat * UNJANI_VAT_RATE);
  return {
    vatAmount,
    totalInclVat: round2(subtotalExVat + vatAmount),
  };
}

export function isLegacyLiveUnjaniSite(input: {
  rfsIssuedAt?: string | null;
  installedAt?: string | null;
  status?: string | null;
}): boolean {
  if (input.status && input.status !== 'active') return false;
  if (input.rfsIssuedAt) return false;
  if (!input.installedAt) return true;
  return input.installedAt.slice(0, 10) < UNJANI_NPC_BILLING_START;
}

export function canIssueRfsCertificate(input: {
  jobCardPath?: string | null;
  jobCardApprovedAt?: string | null;
  surveySpeedtestPath?: string | null;
  commissionSpeedtestPath?: string | null;
}): boolean {
  return Boolean(
    input.jobCardPath &&
      input.jobCardApprovedAt &&
      input.surveySpeedtestPath &&
      input.commissionSpeedtestPath
  );
}

export function includeOnNpcStatement(invoice: {
  invoice_date: string;
  corporate_site_id?: string | null;
}): boolean {
  // Org invoices only (INV-79 and later). Do not use invoice_date >= 1 Sep:
  // the first NPC pack is issued in advance on the last Monday of August.
  return invoice.corporate_site_id == null;
}
