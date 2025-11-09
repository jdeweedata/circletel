/**
 * Pro-rata Billing Calculator
 * Calculates partial month billing based on activation date
 */

export interface ProrataCalculation {
  prorataAmount: number;
  prorataDays: number;
  nextBillingDate: Date;
  dailyRate: number;
  monthlyPrice: number;
  activationDate: Date;
  billingCycleDay: number;
}

export interface BillingCycle {
  startDate: Date;
  endDate: Date;
  days: number;
  amount: number;
  isProrata: boolean;
}

/**
 * Calculate pro-rata billing for first partial month
 *
 * @param activationDate - Date when service was activated
 * @param monthlyPrice - Regular monthly price
 * @param billingCycleDay - Day of month for billing (1, 5, 15, or 25)
 * @returns Pro-rata calculation details
 *
 * @example
 * // Activated on Nov 15, monthly price R899, billing on 1st of month
 * const calc = calculateProrataAmount(new Date('2025-11-15'), 899, 1);
 * // Returns: { prorataAmount: 479.52, prorataDays: 16, ... }
 */
export function calculateProrataAmount(
  activationDate: Date,
  monthlyPrice: number,
  billingCycleDay: number = 1
): ProrataCalculation {
  // Validate inputs
  if (!activationDate || isNaN(activationDate.getTime())) {
    throw new Error('Invalid activation date');
  }
  if (monthlyPrice <= 0) {
    throw new Error('Monthly price must be greater than 0');
  }
  if (![1, 5, 15, 25].includes(billingCycleDay)) {
    throw new Error('Billing cycle day must be 1, 5, 15, or 25');
  }

  // Get days in activation month
  const year = activationDate.getFullYear();
  const month = activationDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Calculate next billing date
  const activationDay = activationDate.getDate();
  let nextBillingDate: Date;

  if (activationDay >= billingCycleDay) {
    // Next billing is next month
    const nextMonth = month + 1;
    const nextMonthYear = nextMonth > 11 ? year + 1 : year;
    const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
    nextBillingDate = new Date(nextMonthYear, nextMonthIndex, billingCycleDay);
  } else {
    // Next billing is this month
    nextBillingDate = new Date(year, month, billingCycleDay);
  }

  // Calculate days remaining (inclusive of activation date)
  const daysRemaining = Math.ceil(
    (nextBillingDate.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Calculate daily rate (rounded to 2 decimals)
  const dailyRate = parseFloat((monthlyPrice / daysInMonth).toFixed(2));

  // Calculate pro-rata amount (rounded to 2 decimals)
  const prorataAmount = parseFloat((dailyRate * daysRemaining).toFixed(2));

  return {
    prorataAmount,
    prorataDays: daysRemaining,
    nextBillingDate,
    dailyRate,
    monthlyPrice,
    activationDate,
    billingCycleDay,
  };
}

/**
 * Calculate pro-rata amount with VAT
 *
 * @param activationDate - Date when service was activated
 * @param monthlyPrice - Regular monthly price (excluding VAT)
 * @param billingCycleDay - Day of month for billing
 * @param vatRate - VAT rate (default 0.15 for South Africa)
 * @returns Pro-rata calculation with VAT
 */
export function calculateProrataWithVAT(
  activationDate: Date,
  monthlyPrice: number,
  billingCycleDay: number = 1,
  vatRate: number = 0.15
): ProrataCalculation & { vat: number; totalWithVAT: number } {
  const prorata = calculateProrataAmount(activationDate, monthlyPrice, billingCycleDay);
  const vat = parseFloat((prorata.prorataAmount * vatRate).toFixed(2));
  const totalWithVAT = parseFloat((prorata.prorataAmount + vat).toFixed(2));

  return {
    ...prorata,
    vat,
    totalWithVAT,
  };
}

/**
 * Get billing cycle dates for a given month
 *
 * @param year - Year
 * @param month - Month (0-11)
 * @param billingCycleDay - Day of month for billing
 * @returns Billing cycle start and end dates
 */
export function getBillingCycleDates(
  year: number,
  month: number,
  billingCycleDay: number
): { startDate: Date; endDate: Date } {
  // Current cycle starts on billing day
  const startDate = new Date(year, month, billingCycleDay);

  // Next cycle starts on billing day of next month
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
  const endDate = new Date(nextYear, nextMonthIndex, billingCycleDay - 1);

  return { startDate, endDate };
}

/**
 * Generate billing cycles for first year
 * Includes pro-rata first cycle and 11 full cycles
 *
 * @param activationDate - Date when service was activated
 * @param monthlyPrice - Regular monthly price
 * @param billingCycleDay - Day of month for billing
 * @returns Array of billing cycles
 */
export function generateFirstYearBillingCycles(
  activationDate: Date,
  monthlyPrice: number,
  billingCycleDay: number = 1
): BillingCycle[] {
  const cycles: BillingCycle[] = [];

  // First cycle (pro-rata)
  const prorata = calculateProrataAmount(activationDate, monthlyPrice, billingCycleDay);
  cycles.push({
    startDate: activationDate,
    endDate: new Date(prorata.nextBillingDate.getTime() - 24 * 60 * 60 * 1000), // Day before
    days: prorata.prorataDays,
    amount: prorata.prorataAmount,
    isProrata: true,
  });

  // Next 11 full cycles
  let currentDate = prorata.nextBillingDate;
  for (let i = 0; i < 11; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
    const nextBillingDate = new Date(nextYear, nextMonthIndex, billingCycleDay);

    const daysInCycle = Math.ceil(
      (nextBillingDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    cycles.push({
      startDate: new Date(currentDate),
      endDate: new Date(nextBillingDate.getTime() - 24 * 60 * 60 * 1000),
      days: daysInCycle,
      amount: monthlyPrice,
      isProrata: false,
    });

    currentDate = nextBillingDate;
  }

  return cycles;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Format date as "15 Nov 2025"
 */
export function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format date range as "15 Nov - 30 Nov 2025"
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    // Same month and year
    return `${startDate.getDate()} ${months[startDate.getMonth()]} - ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
  } else if (startDate.getFullYear() === endDate.getFullYear()) {
    // Same year, different months
    return `${startDate.getDate()} ${months[startDate.getMonth()]} - ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
  } else {
    // Different years
    return `${startDate.getDate()} ${months[startDate.getMonth()]} ${startDate.getFullYear()} - ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
  }
}
