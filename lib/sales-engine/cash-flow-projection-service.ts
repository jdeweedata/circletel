/**
 * Cash Flow Projection Service
 * Projects 12 months of cash flow for CircleTel's bootstrap execution,
 * tracking dual revenue streams (Arlan MTN + Tarana FWB) against MSC
 * obligations, infrastructure costs, and installation CAPEX.
 *
 * Starting capital: R250,000
 * Revenue channels:
 *   - Arlan MTN: Commission (R40/deal/month, paid month+1) + Markup (R96/deal/month)
 *   - Tarana FWB: R1,748/month retail, R499/month wholesale, R2,550 NRC per install
 *
 * @module lib/sales-engine/cash-flow-projection-service
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface MonthProjection {
  month: number;
  month_label: string;
  // Revenue inflows
  arlan_commission_revenue: number;
  arlan_markup_revenue: number;
  tarana_subscription_revenue: number;
  total_inflow: number;
  // Cost outflows
  tarana_wholesale_cost: number;
  infrastructure_cost: number;
  installation_cost: number;
  msc_commitment: number;
  msc_shortfall: number;
  operations_cost: number;
  total_outflow: number;
  // Net
  net_cash_flow: number;
  cumulative_cash: number;
  // Metrics
  arlan_deals_cumulative: number;
  tarana_customers_cumulative: number;
  msc_coverage_ratio: number;
  months_of_runway: number;
}

export interface CashFlowProjectionResult {
  projections: MonthProjection[];
  summary: {
    starting_capital: number;
    total_12mo_inflow: number;
    total_12mo_outflow: number;
    net_12mo_cash: number;
    breakeven_month: number;
    self_funding_month: number;
    peak_capital_needed: number;
  };
}

// =============================================================================
// Constants
// =============================================================================

const STARTING_CAPITAL = 250_000;
const ARLAN_COMMISSION_PER_DEAL = 40;   // R40/deal/month
const ARLAN_MARKUP_PER_DEAL = 96;       // R96/deal/month
const TARANA_RETAIL_PRICE = 1_748;      // R1,748/month avg retail
const TARANA_WHOLESALE_COST = 499;      // R499/month wholesale to MTN
const TARANA_INSTALL_NRC = 2_550;       // R2,550 per new installation
const INFRASTRUCTURE_MONTHLY = 3_200;   // NNI R2,500 + IP transit R700

/** Month labels: Apr 2026 through Mar 2027 */
const MONTH_LABELS = [
  'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026',
  'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026',
  'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027',
];

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Determine the infrastructure cost for a given month.
 * Months 1-2: R0 (no NNI yet), Month 3+: R3,200/month.
 */
function getInfrastructureCost(month: number): number {
  return month >= 3 ? INFRASTRUCTURE_MONTHLY : 0;
}

/**
 * Determine the operations cost for a given month.
 * Months 1-2: R500, Months 3-6: R2,000, Months 7-9: R5,000, Months 10-12: R10,000.
 */
function getOperationsCost(month: number): number {
  if (month <= 2) return 500;
  if (month <= 6) return 2_000;
  if (month <= 9) return 5_000;
  return 10_000;
}

/**
 * Compute cumulative new Tarana installs this month (delta from previous month).
 */
function getNewTaranaInstalls(
  currentCumulative: number,
  previousCumulative: number
): number {
  return Math.max(0, currentCumulative - previousCumulative);
}

// =============================================================================
// Internal Types (for milestone row mapping)
// =============================================================================

interface MilestoneRow {
  month_number: number;
  target_arlan_deals: number;
  target_tarana_customers: number;
  msc_commitment: number;
}

// =============================================================================
// Public Functions
// =============================================================================

/**
 * Project cash flow across the bootstrap execution timeline.
 *
 * Fetches execution milestones from the database and computes monthly
 * inflows, outflows, cumulative cash position, and runway metrics.
 *
 * @param months - Number of months to project (default: 12, max: 12)
 * @returns ServiceResult containing projections and summary
 */
export async function getCashFlowProjection(
  months: number = 12
): Promise<ServiceResult<CashFlowProjectionResult>> {
  try {
    const supabase = await createClient();

    // Clamp months to valid range
    const projectionMonths = Math.min(Math.max(1, months), 12);

    // Fetch all execution milestones ordered by month_number
    const { data: milestones, error: milestonesError } = await supabase
      .from('execution_milestones')
      .select('month_number, target_arlan_deals, target_tarana_customers, msc_commitment')
      .order('month_number', { ascending: true })
      .limit(12);

    if (milestonesError) {
      return { data: null, error: `Failed to fetch execution milestones: ${milestonesError.message}` };
    }

    if (!milestones || milestones.length === 0) {
      return { data: null, error: 'No execution milestones found — seed execution_milestones table first' };
    }

    // Map to typed rows with safe number coercion
    const rows: MilestoneRow[] = (milestones as unknown as Record<string, unknown>[]).map((m) => ({
      month_number: Number(m.month_number) || 0,
      target_arlan_deals: Number(m.target_arlan_deals) || 0,
      target_tarana_customers: Number(m.target_tarana_customers) || 0,
      msc_commitment: Number(m.msc_commitment) || 0,
    }));

    // Build month-indexed lookup (month_number → MilestoneRow)
    const milestoneByMonth = new Map<number, MilestoneRow>();
    for (const row of rows) {
      milestoneByMonth.set(row.month_number, row);
    }

    // Compute projections
    const projections: MonthProjection[] = [];
    let cumulativeCash = STARTING_CAPITAL;
    const burnHistory: number[] = [];

    for (let month = 1; month <= projectionMonths; month++) {
      const milestone = milestoneByMonth.get(month);
      const previousMilestone = milestoneByMonth.get(month - 1);

      // Cumulative deal/customer targets from milestones
      const arlanDealsCumulative = milestone?.target_arlan_deals ?? 0;
      const taranaCustomersCumulative = milestone?.target_tarana_customers ?? 0;
      const mscCommitment = milestone?.msc_commitment ?? 0;
      const previousTaranaCustomers = previousMilestone?.target_tarana_customers ?? 0;

      // --- Revenue Inflows ---

      // Arlan commission is lagged 1 month (paid month+1)
      // Month 1 gets R0 commission; month N gets commission based on month N-1's deals
      const previousArlanDeals = previousMilestone?.target_arlan_deals ?? 0;
      const arlanCommissionRevenue = previousArlanDeals * ARLAN_COMMISSION_PER_DEAL;

      // Arlan markup is collected from customers in the current month
      const arlanMarkupRevenue = arlanDealsCumulative * ARLAN_MARKUP_PER_DEAL;

      // Tarana subscription revenue from active customers
      const taranaSubscriptionRevenue = taranaCustomersCumulative * TARANA_RETAIL_PRICE;

      const totalInflow = arlanCommissionRevenue + arlanMarkupRevenue + taranaSubscriptionRevenue;

      // --- Cost Outflows ---

      // Tarana wholesale cost for active customers
      const taranaWholesaleCost = taranaCustomersCumulative * TARANA_WHOLESALE_COST;

      // Infrastructure (NNI + IP transit)
      const infrastructureCost = getInfrastructureCost(month);

      // Installation NRC for new Tarana customers this month
      const newTaranaInstalls = getNewTaranaInstalls(taranaCustomersCumulative, previousTaranaCustomers);
      const installationCost = newTaranaInstalls * TARANA_INSTALL_NRC;

      // MSC shortfall: the gap between MSC obligation and actual wholesale spend
      const mscShortfall = Math.max(0, mscCommitment - taranaWholesaleCost);

      // Operations (BSS, marketing, support)
      const operationsCost = getOperationsCost(month);

      const totalOutflow =
        taranaWholesaleCost +
        infrastructureCost +
        installationCost +
        mscShortfall +
        operationsCost;

      // --- Net ---
      const netCashFlow = totalInflow - totalOutflow;
      cumulativeCash += netCashFlow;

      // --- Metrics ---
      // Track burn for runway calculation (only count outflow months)
      burnHistory.push(totalOutflow);
      const recentBurn = burnHistory.slice(-3);
      const avgMonthlyBurn =
        recentBurn.length > 0
          ? recentBurn.reduce((sum, b) => sum + b, 0) / recentBurn.length
          : 0;
      const monthsOfRunway =
        avgMonthlyBurn > 0 ? Math.round((cumulativeCash / avgMonthlyBurn) * 10) / 10 : 999;

      const mscCoverageRatio =
        mscCommitment > 0
          ? Math.round((taranaWholesaleCost / mscCommitment) * 100) / 100
          : 0;

      const monthLabel = MONTH_LABELS[month - 1] ?? `Month ${month}`;

      projections.push({
        month,
        month_label: monthLabel,
        arlan_commission_revenue: Math.round(arlanCommissionRevenue),
        arlan_markup_revenue: Math.round(arlanMarkupRevenue),
        tarana_subscription_revenue: Math.round(taranaSubscriptionRevenue),
        total_inflow: Math.round(totalInflow),
        tarana_wholesale_cost: Math.round(taranaWholesaleCost),
        infrastructure_cost: Math.round(infrastructureCost),
        installation_cost: Math.round(installationCost),
        msc_commitment: Math.round(mscCommitment),
        msc_shortfall: Math.round(mscShortfall),
        operations_cost: Math.round(operationsCost),
        total_outflow: Math.round(totalOutflow),
        net_cash_flow: Math.round(netCashFlow),
        cumulative_cash: Math.round(cumulativeCash),
        arlan_deals_cumulative: arlanDealsCumulative,
        tarana_customers_cumulative: taranaCustomersCumulative,
        msc_coverage_ratio: mscCoverageRatio,
        months_of_runway: monthsOfRunway,
      });
    }

    // --- Summary ---
    const totalInflow12mo = projections.reduce((sum, p) => sum + p.total_inflow, 0);
    const totalOutflow12mo = projections.reduce((sum, p) => sum + p.total_outflow, 0);
    const netCash12mo = totalInflow12mo - totalOutflow12mo;

    // Breakeven month: first month where net_cash_flow > 0
    const breakevenProjection = projections.find((p) => p.net_cash_flow > 0);
    const breakevenMonth = breakevenProjection?.month ?? 0;

    // Self-funding month: first month where total_inflow > total_outflow for 2 consecutive months
    let selfFundingMonth = 0;
    for (let i = 1; i < projections.length; i++) {
      const current = projections[i];
      const previous = projections[i - 1];
      if (
        current.total_inflow > current.total_outflow &&
        previous.total_inflow > previous.total_outflow
      ) {
        selfFundingMonth = previous.month;
        break;
      }
    }

    // Peak capital needed: how deep the cumulative cash dips below starting capital
    const lowestCumulativeCash = Math.min(...projections.map((p) => p.cumulative_cash));
    const peakCapitalNeeded = Math.max(0, STARTING_CAPITAL - lowestCumulativeCash);

    const result: CashFlowProjectionResult = {
      projections,
      summary: {
        starting_capital: STARTING_CAPITAL,
        total_12mo_inflow: Math.round(totalInflow12mo),
        total_12mo_outflow: Math.round(totalOutflow12mo),
        net_12mo_cash: Math.round(netCash12mo),
        breakeven_month: breakevenMonth,
        self_funding_month: selfFundingMonth,
        peak_capital_needed: Math.round(peakCapitalNeeded),
      },
    };

    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Cash flow projection error: ${message}` };
  }
}
