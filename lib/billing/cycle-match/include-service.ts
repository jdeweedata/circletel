/**
 * Decide whether a customer_services row belongs in cycle-match / RA.
 * Test, ECHO enabling, and not-yet-billable Unjani clinics are out of scope.
 */

import { isBeforeBillingStart, isCustomerServiceBilledNow } from '@/lib/billing/billing-eligibility';
import { isClinicBillingCategory } from '@/lib/billing/new-clinic-billing-helper';
import {
  UNJANI_COHORT_BILLING_START,
  isUnjaniBillingHoldSite,
} from '@/lib/billing/unjani-connect-rules';

const TEST_PACKAGE = /test package|training demo/i;
const TEST_CUSTOMER = /^(amoeba user|test user)$/i;
const SUBSCRIBER_JUNK = /subscriber\s+[\da-f]+/i;
const ECHO_ENABLING = /echo\s+(connection|service)/i;
const CLINIC_NAME = /unjani|clinicconnect/i;
const ACCOUNT_SUFFIX = /^CT-\d{4}-(\d{5})$/i;
const RESERVED_SUFFIX_FLOOR = 9000;

export interface CycleMatchInclusionInput {
  packageName?: string | null;
  productCategory?: string | null;
  monthlyPrice: number;
  status?: string | null;
  active?: boolean | null;
  billingStartDate?: string | null;
  customerName?: string | null;
  accountNumber?: string | null;
  hasInvoiceThisMonth: boolean;
}

function isReservedTestAccount(accountNumber: string | null | undefined): boolean {
  if (!accountNumber) return false;
  const match = accountNumber.match(ACCOUNT_SUFFIX);
  if (!match) return false;
  return parseInt(match[1], 10) >= RESERVED_SUFFIX_FLOOR;
}

function isTestOrDemo(input: CycleMatchInclusionInput): boolean {
  if (TEST_PACKAGE.test(input.packageName || '')) return true;
  const name = (input.customerName || '').trim();
  if (TEST_CUSTOMER.test(name) || SUBSCRIBER_JUNK.test(name)) return true;
  if (isReservedTestAccount(input.accountNumber)) return true;
  if (input.monthlyPrice <= 0 && !input.hasInvoiceThisMonth) return true;
  return false;
}

function isEchoEnabling(input: CycleMatchInclusionInput): boolean {
  return (
    ECHO_ENABLING.test(input.packageName || '') ||
    ECHO_ENABLING.test(input.customerName || '')
  );
}

function isClinicService(input: CycleMatchInclusionInput): boolean {
  if (isClinicBillingCategory(input.productCategory)) return true;
  return (
    CLINIC_NAME.test(input.packageName || '') ||
    CLINIC_NAME.test(input.customerName || '')
  );
}

export function customerDisplayName(row: {
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
} | null | undefined): string {
  if (!row) return '';
  const business = row.business_name?.trim();
  if (business) return business;
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
}

export function cycleMonthEndDate(endYmd: string): Date {
  return new Date(`${endYmd}T12:00:00Z`);
}

export function includeInCycleMatch(
  input: CycleMatchInclusionInput,
  cycleMonthEnd: Date
): boolean {
  if (isTestOrDemo(input) || isEchoEnabling(input)) return false;

  const cancelledStillBilled =
    (input.status === 'cancelled' || input.active === false) &&
    input.hasInvoiceThisMonth;
  if (cancelledStillBilled) return true;

  if (isClinicService(input)) {
    if (isUnjaniBillingHoldSite(input.customerName)) return false;
    const start = input.billingStartDate || UNJANI_COHORT_BILLING_START;
    if (isBeforeBillingStart(start, cycleMonthEnd)) return false;
    return isCustomerServiceBilledNow(
      {
        billing_start_date: start,
        status: input.status,
        active: input.active,
      },
      cycleMonthEnd
    );
  }

  return isCustomerServiceBilledNow(
    {
      billing_start_date: input.billingStartDate,
      status: input.status,
      active: input.active,
    },
    cycleMonthEnd
  );
}
