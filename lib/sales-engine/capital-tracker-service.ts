/**
 * Capital Tracker Service
 * Tracks CircleTel's R250K startup capital usage, burn rate, and channel-split MRR.
 *
 * Queries:
 * - capital_transactions: all capital movements (spend & inflow)
 * - sales_pipeline_stages: won deals grouped by revenue_source for channel MRR
 * - execution_milestones: current milestone targets and actuals
 *
 * @module lib/sales-engine/capital-tracker-service
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface CapitalSnapshot {
  // Capital position
  initial_capital: number;
  total_spent: number;
  total_revenue_received: number;
  current_balance: number;

  // Burn rate
  avg_monthly_burn: number;
  months_of_runway: number;

  // Spend by category
  spend_by_category: Record<string, number>;

  // Channel-split MRR (from pipeline won deals)
  channel_mrr: {
    tarana: { deals: number; mrr: number };
    arlan: { deals: number; mrr: number };
    dfa: { deals: number; mrr: number };
    managed_it: { deals: number; mrr: number };
    total_mrr: number;
  };

  // MSC status
  msc_current: number;
  msc_coverage_ratio: number;
  tarana_wholesale_spend: number;

  // Next milestones
  current_milestone: {
    month: number;
    target_mrr: number;
    target_arlan_deals: number;
    target_tarana_customers: number;
    attainment_pct: number;
  } | null;

  // Recent transactions (last 10)
  recent_transactions: Array<{
    date: string;
    category: string;
    description: string;
    amount: number;
    balance: number;
  }>;
}

export type TransactionCategory =
  | 'infrastructure'
  | 'installation'
  | 'marketing'
  | 'operations'
  | 'hiring'
  | 'bss_platform'
  | 'contingency'
  | 'revenue';

export interface RecordTransactionInput {
  category: TransactionCategory;
  description: string;
  amount: number; // negative = spend, positive = inflow
  transaction_date?: string;
  related_milestone?: number;
}

export interface CapitalForecastMonth {
  month: string;
  projected_balance: number;
  projected_burn: number;
}

// =============================================================================
// Constants
// =============================================================================

const INITIAL_CAPITAL = 250_000;
const TARANA_WHOLESALE_PER_CUSTOMER = 499; // R499/mo per Tarana RN

// =============================================================================
// Internal Helpers
// =============================================================================

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Compute the first day of a month offset from today.
 * offset=0 → current month, offset=-1 → previous month, etc.
 */
function monthStart(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

/**
 * Format a Date as YYYY-MM for display in forecast output.
 */
function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// =============================================================================
// getCapitalSnapshot
// =============================================================================

export async function getCapitalSnapshot(): Promise<ServiceResult<CapitalSnapshot>> {
  try {
    const supabase = await createClient();

    // ----- 1. Fetch all capital transactions -----
    const { data: transactions, error: txError } = await supabase
      .from('capital_transactions')
      .select('id, transaction_date, category, description, amount, running_balance, related_milestone, created_at')
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (txError) {
      return { data: null, error: `Failed to fetch capital transactions: ${txError.message}` };
    }

    const txRows = transactions ?? [];

    // Compute totals
    let totalSpent = 0;
    let totalRevenueReceived = 0;
    const spendByCategory: Record<string, number> = {};

    for (const tx of txRows) {
      const amt = Number(tx.amount);
      if (amt < 0) {
        totalSpent += Math.abs(amt);
        const cat = tx.category as string;
        spendByCategory[cat] = (spendByCategory[cat] ?? 0) + Math.abs(amt);
      } else {
        totalRevenueReceived += amt;
      }
    }

    // Current balance = running_balance on the most recent transaction
    const latestTx = txRows.length > 0 ? txRows[txRows.length - 1] : null;
    const currentBalance = latestTx ? Number(latestTx.running_balance) : INITIAL_CAPITAL;

    // ----- 2. Burn rate from last 3 months of negative transactions -----
    const threeMonthsAgo = monthStart(-3);
    const recentSpend = txRows.filter(
      (tx) => Number(tx.amount) < 0 && tx.transaction_date >= threeMonthsAgo
    );

    let avgMonthlyBurn = 0;
    if (recentSpend.length > 0) {
      const totalRecentSpend = recentSpend.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
      // Determine how many distinct months are represented
      const months = new Set(recentSpend.map((tx) => (tx.transaction_date as string).slice(0, 7)));
      const monthCount = Math.max(months.size, 1);
      avgMonthlyBurn = totalRecentSpend / monthCount;
    }

    const monthsOfRunway = avgMonthlyBurn > 0 ? currentBalance / avgMonthlyBurn : Infinity;

    // ----- 3. Channel-split MRR from won pipeline deals -----
    const { data: wonDeals, error: pipeError } = await supabase
      .from('sales_pipeline_stages')
      .select('id, revenue_source, quote_mrr')
      .eq('outcome', 'won');

    if (pipeError) {
      return { data: null, error: `Failed to fetch pipeline stages: ${pipeError.message}` };
    }

    const wonRows = wonDeals ?? [];

    const channelMrr = {
      tarana: { deals: 0, mrr: 0 },
      arlan: { deals: 0, mrr: 0 },
      dfa: { deals: 0, mrr: 0 },
      managed_it: { deals: 0, mrr: 0 },
      total_mrr: 0,
    };

    for (const deal of wonRows) {
      const source = (deal.revenue_source as string) ?? 'tarana';
      const mrr = Number(deal.quote_mrr) || 0;

      if (source in channelMrr && source !== 'bundle') {
        const key = source as keyof typeof channelMrr;
        if (typeof channelMrr[key] === 'object') {
          (channelMrr[key] as { deals: number; mrr: number }).deals += 1;
          (channelMrr[key] as { deals: number; mrr: number }).mrr += mrr;
        }
      } else {
        // 'bundle' or unknown — attribute to tarana by default
        channelMrr.tarana.deals += 1;
        channelMrr.tarana.mrr += mrr;
      }

      channelMrr.total_mrr += mrr;
    }

    // ----- 4. MSC from current execution milestone -----
    const today = todayISO();

    const { data: milestones, error: msError } = await supabase
      .from('execution_milestones')
      .select(
        'id, month_number, target_mrr, target_arlan_deals, target_tarana_customers, ' +
        'actual_mrr, msc_commitment, period_start, period_end'
      )
      .lte('period_start', today)
      .gte('period_end', today)
      .order('month_number', { ascending: true })
      .limit(1);

    if (msError) {
      return { data: null, error: `Failed to fetch execution milestones: ${msError.message}` };
    }

    const msRows = (milestones ?? []) as unknown as Record<string, unknown>[];
    const currentMs = msRows.length > 0 ? msRows[0] : null;

    const mscCurrent = currentMs ? Number(currentMs.msc_commitment) : 0;
    const taranaDealCount = channelMrr.tarana.deals;
    const taranaWholesaleSpend = taranaDealCount * TARANA_WHOLESALE_PER_CUSTOMER;
    const mscCoverageRatio = mscCurrent > 0 ? taranaWholesaleSpend / mscCurrent : 0;

    // Current milestone summary
    let currentMilestone: CapitalSnapshot['current_milestone'] = null;
    if (currentMs) {
      const targetMrr = Number(currentMs.target_mrr) || 0;
      const actualMrr = Number(currentMs.actual_mrr) || channelMrr.total_mrr;
      const attainmentPct = targetMrr > 0 ? (actualMrr / targetMrr) * 100 : 0;

      currentMilestone = {
        month: Number(currentMs.month_number),
        target_mrr: targetMrr,
        target_arlan_deals: Number(currentMs.target_arlan_deals) || 0,
        target_tarana_customers: Number(currentMs.target_tarana_customers) || 0,
        attainment_pct: Math.round(attainmentPct * 10) / 10,
      };
    }

    // ----- 5. Recent transactions (last 10) -----
    const recentTransactions = txRows
      .slice(-10)
      .reverse()
      .map((tx) => ({
        date: tx.transaction_date as string,
        category: tx.category as string,
        description: tx.description as string,
        amount: Number(tx.amount),
        balance: Number(tx.running_balance),
      }));

    // ----- Assemble snapshot -----
    const snapshot: CapitalSnapshot = {
      initial_capital: INITIAL_CAPITAL,
      total_spent: Math.round(totalSpent * 100) / 100,
      total_revenue_received: Math.round(totalRevenueReceived * 100) / 100,
      current_balance: Math.round(currentBalance * 100) / 100,
      avg_monthly_burn: Math.round(avgMonthlyBurn * 100) / 100,
      months_of_runway: monthsOfRunway === Infinity ? -1 : Math.round(monthsOfRunway * 10) / 10,
      spend_by_category: Object.fromEntries(
        Object.entries(spendByCategory).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
      channel_mrr: channelMrr,
      msc_current: mscCurrent,
      msc_coverage_ratio: Math.round(mscCoverageRatio * 100) / 100,
      tarana_wholesale_spend: taranaWholesaleSpend,
      current_milestone: currentMilestone,
      recent_transactions: recentTransactions,
    };

    return { data: snapshot, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Capital snapshot failed: ${message}` };
  }
}

// =============================================================================
// recordCapitalTransaction
// =============================================================================

export async function recordCapitalTransaction(
  input: RecordTransactionInput
): Promise<ServiceResult<{ id: string }>> {
  try {
    const supabase = await createClient();

    // 1. Get current balance from latest transaction
    const { data: latest, error: latestErr } = await supabase
      .from('capital_transactions')
      .select('running_balance')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestErr && latestErr.code !== 'PGRST116') {
      // PGRST116 = no rows — acceptable for first transaction
      return { data: null, error: `Failed to fetch latest balance: ${latestErr.message}` };
    }

    const currentBalance = latest ? Number(latest.running_balance) : INITIAL_CAPITAL;
    const newBalance = currentBalance + input.amount;

    // 2. Insert new transaction
    const { data: inserted, error: insertErr } = await supabase
      .from('capital_transactions')
      .insert({
        category: input.category,
        description: input.description,
        amount: input.amount,
        running_balance: newBalance,
        transaction_date: input.transaction_date ?? todayISO(),
        related_milestone: input.related_milestone ?? null,
      })
      .select('id')
      .single();

    if (insertErr) {
      return { data: null, error: `Failed to insert transaction: ${insertErr.message}` };
    }

    return { data: { id: inserted.id as string }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Record transaction failed: ${message}` };
  }
}

// =============================================================================
// getCapitalForecast
// =============================================================================

export async function getCapitalForecast(
  months: number
): Promise<ServiceResult<CapitalForecastMonth[]>> {
  try {
    if (months < 1 || months > 24) {
      return { data: null, error: 'Forecast months must be between 1 and 24' };
    }

    const supabase = await createClient();

    // Fetch transactions from last 3 months to compute burn trend
    const threeMonthsAgo = monthStart(-3);

    const { data: recentTx, error: txErr } = await supabase
      .from('capital_transactions')
      .select('transaction_date, amount')
      .lt('amount', 0)
      .gte('transaction_date', threeMonthsAgo)
      .order('transaction_date', { ascending: true });

    if (txErr) {
      return { data: null, error: `Failed to fetch recent transactions: ${txErr.message}` };
    }

    const txRows = recentTx ?? [];

    // Group spend by month
    const spendByMonth: Record<string, number> = {};
    for (const tx of txRows) {
      const ym = (tx.transaction_date as string).slice(0, 7);
      spendByMonth[ym] = (spendByMonth[ym] ?? 0) + Math.abs(Number(tx.amount));
    }

    const monthlySpends = Object.values(spendByMonth);
    let baseBurn = 0;
    let burnTrendPerMonth = 0;

    if (monthlySpends.length >= 2) {
      // Linear trend: use first and last month to estimate growth in burn
      baseBurn = monthlySpends[monthlySpends.length - 1];
      const totalGrowth = monthlySpends[monthlySpends.length - 1] - monthlySpends[0];
      burnTrendPerMonth = totalGrowth / (monthlySpends.length - 1);
    } else if (monthlySpends.length === 1) {
      baseBurn = monthlySpends[0];
    }

    // Get current balance
    const { data: latestTx, error: balErr } = await supabase
      .from('capital_transactions')
      .select('running_balance')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (balErr && balErr.code !== 'PGRST116') {
      return { data: null, error: `Failed to fetch current balance: ${balErr.message}` };
    }

    let balance = latestTx ? Number(latestTx.running_balance) : INITIAL_CAPITAL;

    // Project forward
    const forecast: CapitalForecastMonth[] = [];
    const now = new Date();

    for (let i = 1; i <= months; i++) {
      const projectedBurn = Math.max(baseBurn + burnTrendPerMonth * i, 0);
      balance = balance - projectedBurn;

      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);

      forecast.push({
        month: formatYearMonth(futureDate),
        projected_balance: Math.round(balance * 100) / 100,
        projected_burn: Math.round(projectedBurn * 100) / 100,
      });
    }

    return { data: forecast, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Capital forecast failed: ${message}` };
  }
}
