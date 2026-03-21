/**
 * Execution Plan Service
 * Tracks CircleTel's Bootstrap Execution Plan — MRR vs targets, MSC coverage,
 * phase gates, and hiring triggers.
 *
 * @module lib/sales-engine/execution-plan-service
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ExecutionPhase,
  MilestoneStatus,
  ExecutionMilestone,
  ExecutionSnapshot,
  ExecutionAlert,
  ExecutionAlertType,
  ExecutionAlertSeverity,
} from './types';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Determine today's date as an ISO string (YYYY-MM-DD) for period comparisons.
 */
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Find the milestone whose period_start..period_end contains today.
 * Falls back to the latest milestone by month_number if none matches.
 */
function findCurrentMilestone(milestones: ExecutionMilestone[]): ExecutionMilestone | null {
  if (milestones.length === 0) return null;

  const today = todayISO();

  const current = milestones.find(
    (m) => m.period_start <= today && m.period_end >= today
  );

  if (current) return current;

  // Fallback: latest milestone by month_number
  return milestones[milestones.length - 1];
}

/**
 * Generate execution alerts based on current milestone state and MSC coverage.
 */
function getExecutionAlerts(
  currentMilestone: ExecutionMilestone | null,
  totalMRR: number,
  mscCoverageRatio: number,
  hiringTriggersReady: string[],
  milestones: ExecutionMilestone[]
): ExecutionAlert[] {
  const alerts: ExecutionAlert[] = [];

  if (!currentMilestone) return alerts;

  const targetMRR = currentMilestone.target_mrr;

  // MRR behind target checks
  if (targetMRR > 0) {
    const attainmentPct = (totalMRR / targetMRR) * 100;

    if (attainmentPct < 80) {
      alerts.push({
        type: 'mrr_behind' as ExecutionAlertType,
        severity: 'critical' as ExecutionAlertSeverity,
        message: `MRR is ${Math.round(100 - attainmentPct)}% behind target (R${totalMRR.toLocaleString()} vs R${targetMRR.toLocaleString()})`,
        recommendation: 'Accelerate pipeline conversion — focus on quote-sent and objection-stage deals. Consider promotional pricing for quick wins.',
      });
    } else if (attainmentPct < 90) {
      alerts.push({
        type: 'mrr_behind' as ExecutionAlertType,
        severity: 'warning' as ExecutionAlertSeverity,
        message: `MRR is ${Math.round(100 - attainmentPct)}% behind target (R${totalMRR.toLocaleString()} vs R${targetMRR.toLocaleString()})`,
        recommendation: 'Review pipeline velocity and prioritize high-probability deals to close the gap.',
      });
    }
  }

  // MSC coverage checks
  if (mscCoverageRatio < 1.0) {
    alerts.push({
      type: 'msc_risk' as ExecutionAlertType,
      severity: 'critical' as ExecutionAlertSeverity,
      message: `MSC coverage ratio is ${mscCoverageRatio.toFixed(2)}x — actual MRR does not cover MSC commitment`,
      recommendation: 'Urgent: activate more customers or reduce MSC exposure. Review deals closest to closing.',
    });
  } else if (mscCoverageRatio < 1.5) {
    alerts.push({
      type: 'msc_risk' as ExecutionAlertType,
      severity: 'warning' as ExecutionAlertSeverity,
      message: `MSC coverage ratio is ${mscCoverageRatio.toFixed(2)}x — thin margin above MSC commitment`,
      recommendation: 'Build pipeline buffer to maintain safe MSC coverage. Target 1.5x ratio minimum.',
    });
  }

  // Hiring trigger alerts
  for (const trigger of hiringTriggersReady) {
    alerts.push({
      type: 'hiring_trigger' as ExecutionAlertType,
      severity: 'info' as ExecutionAlertSeverity,
      message: `Hiring trigger met: ${trigger}`,
      recommendation: `MRR threshold reached — begin recruitment process for: ${trigger}`,
    });
  }

  // Phase gate transition check
  const today = todayISO();
  if (currentMilestone.period_end <= today && currentMilestone.status !== 'met') {
    const nextPhase = milestones.find(
      (m) => m.month_number > currentMilestone.month_number && m.phase !== currentMilestone.phase
    );
    if (nextPhase) {
      alerts.push({
        type: 'phase_gate' as ExecutionAlertType,
        severity: 'info' as ExecutionAlertSeverity,
        message: `Current milestone period has ended. Phase transition to "${nextPhase.phase}" pending.`,
        recommendation: `Review phase gate criteria for ${currentMilestone.phase} before advancing to ${nextPhase.phase}.`,
      });
    }
  }

  return alerts;
}

// =============================================================================
// Public Functions
// =============================================================================

/**
 * Get a comprehensive execution plan snapshot including MRR tracking,
 * MSC coverage, alerts, and monthly trend data.
 */
export async function getExecutionSnapshot(): Promise<ServiceResult<ExecutionSnapshot>> {
  try {
    const supabase = await createClient();

    // Fetch all milestones ordered by month_number
    const { data: milestones, error: milestonesError } = await supabase
      .from('execution_milestones')
      .select('*')
      .order('month_number', { ascending: true });

    if (milestonesError) {
      return { data: null, error: milestonesError.message };
    }

    const allMilestones = (milestones ?? []) as ExecutionMilestone[];

    if (allMilestones.length === 0) {
      return { data: null, error: 'No execution milestones found' };
    }

    // Determine current milestone
    const currentMilestone = findCurrentMilestone(allMilestones);
    if (!currentMilestone) {
      return { data: null, error: 'Could not determine current milestone' };
    }

    // Sum won pipeline deals for total current MRR
    const { data: wonDeals, error: wonError } = await supabase
      .from('sales_pipeline_stages')
      .select('quote_mrr')
      .eq('outcome', 'won');

    if (wonError) {
      return { data: null, error: wonError.message };
    }

    const pipelineWonMRR = (wonDeals ?? []).reduce(
      (sum, deal) => sum + (Number(deal.quote_mrr) || 0),
      0
    );

    // Get latest zone_metrics for total active customers
    const { data: latestMetrics, error: metricsError } = await supabase
      .from('zone_metrics')
      .select('active_customers, total_zone_mrr, week_start')
      .order('week_start', { ascending: false })
      .limit(50);

    if (metricsError) {
      return { data: null, error: metricsError.message };
    }

    // Get most recent week's data — group by week_start and sum
    const metricsRows = latestMetrics ?? [];
    let totalActiveCustomers = 0;
    let zonesMRR = 0;

    if (metricsRows.length > 0) {
      const latestWeek = metricsRows[0].week_start;
      const latestWeekMetrics = metricsRows.filter((m) => m.week_start === latestWeek);
      totalActiveCustomers = latestWeekMetrics.reduce(
        (sum, m) => sum + (Number(m.active_customers) || 0),
        0
      );
      zonesMRR = latestWeekMetrics.reduce(
        (sum, m) => sum + (Number(m.total_zone_mrr) || 0),
        0
      );
    }

    // Use the higher of pipeline won MRR vs zone metrics MRR as total MRR
    const totalMRR = Math.max(pipelineWonMRR, zonesMRR, currentMilestone.actual_mrr);
    const targetMRR = currentMilestone.target_mrr;
    const mrrGap = Math.max(0, targetMRR - totalMRR);
    const mrrAttainmentPct = targetMRR > 0 ? Math.round((totalMRR / targetMRR) * 100) : 0;

    // MSC coverage ratio
    const mscCommitment = currentMilestone.msc_commitment;
    const mscCoverageRatio = mscCommitment > 0
      ? Math.round((totalMRR / mscCommitment) * 100) / 100
      : 0;

    // Next milestone (first upcoming after current)
    const nextMilestone = allMilestones.find(
      (m) => m.status === 'upcoming' && m.month_number > currentMilestone.month_number
    ) ?? null;

    // Hiring triggers that are met
    const hiringTriggersMet: string[] = allMilestones
      .filter(
        (m) =>
          m.hiring_trigger !== null &&
          m.actual_mrr >= m.target_mrr
      )
      .map((m) => m.hiring_trigger as string);

    // Generate alerts
    const alerts = getExecutionAlerts(
      currentMilestone,
      totalMRR,
      mscCoverageRatio,
      hiringTriggersMet,
      allMilestones
    );

    // Active milestones (status = 'active' or 'at_risk')
    const activeMilestones = allMilestones.filter(
      (m) => m.status === 'active' || m.status === 'at_risk'
    );

    // Monthly trend
    const monthlyTrend = allMilestones.map((m) => ({
      month: m.month_number,
      target_mrr: m.target_mrr,
      actual_mrr: m.actual_mrr,
    }));

    const snapshot: ExecutionSnapshot = {
      current_phase: currentMilestone.phase,
      current_month: currentMilestone.month_number,
      total_mrr: totalMRR,
      target_mrr: targetMRR,
      mrr_gap: mrrGap,
      mrr_attainment_pct: mrrAttainmentPct,
      total_customers: Math.max(totalActiveCustomers, currentMilestone.actual_customers),
      msc_current: mscCommitment,
      msc_coverage_ratio: mscCoverageRatio,
      active_milestones: activeMilestones,
      next_milestone: nextMilestone,
      hiring_triggers_met: hiringTriggersMet,
      alerts,
      monthly_trend: monthlyTrend,
    };

    return { data: snapshot, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Execution snapshot error: ${message}` };
  }
}

/**
 * Update the current active milestone's actual_mrr and actual_customers
 * from pipeline won deals and zone metrics. Also updates milestone status.
 */
export async function updateMilestoneActuals(): Promise<ServiceResult<{ updated: number }>> {
  try {
    const supabase = await createClient();

    // Sum won pipeline deals MRR
    const { data: wonDeals, error: wonError } = await supabase
      .from('sales_pipeline_stages')
      .select('quote_mrr')
      .eq('outcome', 'won');

    if (wonError) {
      return { data: null, error: wonError.message };
    }

    const totalWonMRR = (wonDeals ?? []).reduce(
      (sum, deal) => sum + (Number(deal.quote_mrr) || 0),
      0
    );

    // Sum active_customers from latest zone_metrics week
    const { data: latestMetrics, error: metricsError } = await supabase
      .from('zone_metrics')
      .select('active_customers, week_start')
      .order('week_start', { ascending: false })
      .limit(50);

    if (metricsError) {
      return { data: null, error: metricsError.message };
    }

    const metricsRows = latestMetrics ?? [];
    let totalCustomers = 0;

    if (metricsRows.length > 0) {
      const latestWeek = metricsRows[0].week_start;
      const latestWeekMetrics = metricsRows.filter((m) => m.week_start === latestWeek);
      totalCustomers = latestWeekMetrics.reduce(
        (sum, m) => sum + (Number(m.active_customers) || 0),
        0
      );
    }

    // Find current active milestone (period contains today)
    const today = todayISO();
    const { data: milestones, error: milestonesError } = await supabase
      .from('execution_milestones')
      .select('*')
      .lte('period_start', today)
      .gte('period_end', today)
      .order('month_number', { ascending: true })
      .limit(1);

    if (milestonesError) {
      return { data: null, error: milestonesError.message };
    }

    const currentMilestone = (milestones ?? [])[0] as ExecutionMilestone | undefined;

    if (!currentMilestone) {
      return { data: null, error: 'No active milestone found for current period' };
    }

    // Determine new status
    let newStatus: MilestoneStatus;
    if (totalWonMRR >= currentMilestone.target_mrr) {
      newStatus = 'met';
    } else if (totalWonMRR < currentMilestone.target_mrr * 0.7) {
      newStatus = 'at_risk';
    } else {
      newStatus = 'active';
    }

    // Update the milestone
    const { error: updateError } = await supabase
      .from('execution_milestones')
      .update({
        actual_mrr: totalWonMRR,
        actual_customers: totalCustomers,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentMilestone.id);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: { updated: 1 }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Update milestone actuals error: ${message}` };
  }
}

/**
 * Check whether all milestones in a given phase have been met (phase gate).
 */
export async function getPhaseGateStatus(
  phase: ExecutionPhase
): Promise<ServiceResult<{ passed: boolean; milestones_met: number; milestones_total: number }>> {
  try {
    const supabase = await createClient();

    const { data: milestones, error: milestonesError } = await supabase
      .from('execution_milestones')
      .select('id, status')
      .eq('phase', phase);

    if (milestonesError) {
      return { data: null, error: milestonesError.message };
    }

    const allMilestones = milestones ?? [];
    const milestonesMet = allMilestones.filter((m) => m.status === 'met').length;
    const milestonesTotal = allMilestones.length;
    const passed = milestonesTotal > 0 && milestonesMet === milestonesTotal;

    return {
      data: {
        passed,
        milestones_met: milestonesMet,
        milestones_total: milestonesTotal,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Phase gate status error: ${message}` };
  }
}

/**
 * Get all hiring triggers and whether their MRR thresholds have been reached.
 */
export async function getHiringTriggers(): Promise<
  ServiceResult<Array<{ trigger: string; mrr_threshold: number; current_mrr: number; ready: boolean }>>
> {
  try {
    const supabase = await createClient();

    const { data: milestones, error: milestonesError } = await supabase
      .from('execution_milestones')
      .select('hiring_trigger, target_mrr, actual_mrr')
      .not('hiring_trigger', 'is', null)
      .order('month_number', { ascending: true });

    if (milestonesError) {
      return { data: null, error: milestonesError.message };
    }

    const triggers = (milestones ?? []).map((m) => ({
      trigger: m.hiring_trigger as string,
      mrr_threshold: Number(m.target_mrr) || 0,
      current_mrr: Number(m.actual_mrr) || 0,
      ready: (Number(m.actual_mrr) || 0) >= (Number(m.target_mrr) || 0),
    }));

    return { data: triggers, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Hiring triggers error: ${message}` };
  }
}

/**
 * Calculate the MSC coverage ratio — how well current MRR covers the MSC commitment.
 */
export async function getMSCCoverageRatio(): Promise<
  ServiceResult<{ ratio: number; actual_mrr: number; msc_amount: number; status: 'safe' | 'warning' | 'critical' }>
> {
  try {
    const supabase = await createClient();

    // Find current milestone
    const today = todayISO();
    const { data: milestones, error: milestonesError } = await supabase
      .from('execution_milestones')
      .select('actual_mrr, msc_commitment')
      .lte('period_start', today)
      .gte('period_end', today)
      .order('month_number', { ascending: true })
      .limit(1);

    if (milestonesError) {
      return { data: null, error: milestonesError.message };
    }

    const currentMilestone = (milestones ?? [])[0] as
      | Pick<ExecutionMilestone, 'actual_mrr' | 'msc_commitment'>
      | undefined;

    if (!currentMilestone) {
      // Fallback: get the latest milestone
      const { data: fallbackMilestones, error: fallbackError } = await supabase
        .from('execution_milestones')
        .select('actual_mrr, msc_commitment')
        .order('month_number', { ascending: false })
        .limit(1);

      if (fallbackError) {
        return { data: null, error: fallbackError.message };
      }

      const fallback = (fallbackMilestones ?? [])[0] as
        | Pick<ExecutionMilestone, 'actual_mrr' | 'msc_commitment'>
        | undefined;

      if (!fallback) {
        return { data: null, error: 'No execution milestones found' };
      }

      const mscAmount = Number(fallback.msc_commitment) || 0;
      const actualMRR = Number(fallback.actual_mrr) || 0;
      const ratio = mscAmount > 0 ? Math.round((actualMRR / mscAmount) * 100) / 100 : 0;

      let status: 'safe' | 'warning' | 'critical';
      if (ratio < 1.0) {
        status = 'critical';
      } else if (ratio < 1.5) {
        status = 'warning';
      } else {
        status = 'safe';
      }

      return {
        data: { ratio, actual_mrr: actualMRR, msc_amount: mscAmount, status },
        error: null,
      };
    }

    const mscAmount = Number(currentMilestone.msc_commitment) || 0;
    const actualMRR = Number(currentMilestone.actual_mrr) || 0;
    const ratio = mscAmount > 0 ? Math.round((actualMRR / mscAmount) * 100) / 100 : 0;

    let status: 'safe' | 'warning' | 'critical';
    if (ratio < 1.0) {
      status = 'critical';
    } else if (ratio < 1.5) {
      status = 'warning';
    } else {
      status = 'safe';
    }

    return {
      data: { ratio, actual_mrr: actualMRR, msc_amount: mscAmount, status },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `MSC coverage ratio error: ${message}` };
  }
}
