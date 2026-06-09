'use client';

import { PiCheckCircleBold, PiWarningCircleBold, PiXCircleBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type { RuleLevel } from '@/lib/products/rules';

const LEVEL_STYLE: Record<RuleLevel, { cls: string; Icon: typeof PiCheckCircleBold }> = {
  pass: { cls: 'bg-emerald-50 text-emerald-700', Icon: PiCheckCircleBold },
  warning: { cls: 'bg-amber-50 text-amber-700', Icon: PiWarningCircleBold },
  fail: { cls: 'bg-red-50 text-red-700', Icon: PiXCircleBold },
};

const BASE = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

/** Badge for a single rule result level. */
export function RuleLevelBadge({
  level,
  label,
  className,
}: {
  level: RuleLevel;
  label?: string;
  className?: string;
}) {
  const { cls, Icon } = LEVEL_STYLE[level];
  return (
    <span className={cn(BASE, cls, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label ?? level}
    </span>
  );
}

/** Matches `ProductRuleEvaluation['summary']` from the rules engine. */
export interface RuleSummary {
  pass: number;
  warning: number;
  fail: number;
}

/** Roll-up badge summarising a product's whole rule evaluation. */
export function RuleHealthBadge({ summary, className }: { summary: RuleSummary; className?: string }) {
  const level: RuleLevel = summary.fail > 0 ? 'fail' : summary.warning > 0 ? 'warning' : 'pass';
  const { cls, Icon } = LEVEL_STYLE[level];
  const label =
    summary.fail > 0
      ? `${summary.fail} blocking`
      : summary.warning > 0
        ? `${summary.warning} warning${summary.warning > 1 ? 's' : ''}`
        : 'All clear';
  return (
    <span className={cn(BASE, cls, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
}
