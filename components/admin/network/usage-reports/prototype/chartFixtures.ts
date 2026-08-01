/**
 * PROTOTYPE — throwaway. Fixtures for #692 (chart across 7 / 31 / 60 / 90 days).
 *
 * Coverage mirrors production reality rather than a happy path: Ruijie rollups
 * currently retain ~7 days, so a 31/60/90-day request is mostly gap. Per #689 an
 * uncovered day must read as no-data, never as a zero-height bar.
 */

export interface ChartDay {
  /** 1-based index within the period. */
  index: number;
  /** Day of month, matching the locked PDF axis (#667 Variant A). */
  dayOfMonth: number;
  weekBand: number;
  downloadGb: number;
  covered: boolean;
}

const GB_SHAPE = [
  11.2, 13.8, 14.1, 12.9, 15.4, 6.2, 4.1, 13.6, 15.9, 14.8, 16.2, 15.1, 7.0, 3.8,
  14.9, 16.4, 15.2, 17.1, 16.8, 8.2, 4.4, 15.6, 17.9, 16.1, 18.2, 17.4, 7.8, 4.9,
  16.2, 17.6, 15.9,
];

/**
 * Build a period of `dayCount` days ending today, where only the last
 * `coveredTailDays` carry samples — the shape real retention produces.
 */
export function buildPeriod(dayCount: number, coveredTailDays: number): ChartDay[] {
  const firstCoveredIndex = Math.max(0, dayCount - coveredTailDays);
  // Anchor day-of-month so long periods wrap months like a real range does.
  const startDayOfMonth = ((31 - (dayCount % 31)) % 31) + 1;

  return Array.from({ length: dayCount }, (_, index) => {
    const covered = index >= firstCoveredIndex;
    return {
      index: index + 1,
      dayOfMonth: ((startDayOfMonth + index - 1) % 31) + 1,
      weekBand: Math.floor(index / 7) + 1,
      downloadGb: covered ? GB_SHAPE[index % GB_SHAPE.length] : 0,
      covered,
    };
  });
}

export interface PeriodCase {
  key: string;
  label: string;
  days: ChartDay[];
}

/** The four lengths the report supports, each with realistic coverage. */
export const PERIOD_CASES: PeriodCase[] = [
  { key: 'weekly', label: 'Last complete week — 7 days', days: buildPeriod(7, 7) },
  { key: 'monthly', label: 'Previous month — 31 days', days: buildPeriod(31, 7) },
  { key: 'sixty', label: 'Last 60 days', days: buildPeriod(60, 7) },
  { key: 'custom90', label: 'Custom range — 90 days', days: buildPeriod(90, 7) },
];

export function coverageSummary(days: ChartDay[]): string {
  const covered = days.filter((day) => day.covered).length;
  return `${covered} of ${days.length} days sampled`;
}

/** Contiguous runs of uncovered days, as inclusive index pairs. */
export function gapRanges(days: ChartDay[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let start: number | null = null;

  days.forEach((day, index) => {
    if (!day.covered && start === null) start = index;
    if (day.covered && start !== null) {
      ranges.push([start, index - 1]);
      start = null;
    }
  });
  if (start !== null) ranges.push([start, days.length - 1]);

  return ranges;
}
