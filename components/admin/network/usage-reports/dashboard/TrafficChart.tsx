'use client';

/**
 * Core traffic chart (#692): hatched gap band + coverage ribbon.
 *
 * Two rules it exists to honour:
 * - An uncovered day is drawn as a gap, never a zero-height bar. Retention
 *   means most long periods are mostly gap, and a zero bar claims the network
 *   was idle (#689).
 * - Chrome stays minimal to match the printed report — bars on a plain grey
 *   panel, no gridlines, no y-axis, day-of-month ticks only (#667).
 */

import { Bar, BarChart, ReferenceArea, ResponsiveContainer, XAxis } from 'recharts';

const ORANGE = '#E87A1E';
const GAP_INK = '#94A3B8';
const GAP_PATTERN_ID = 'usage-report-gap-hatch';

export interface TrafficChartProps {
  /** Bytes per day, in period order. */
  dailyDownloadBytes: number[];
  /** Sample presence per day — same length and order. */
  dailyCovered: boolean[];
  /** SAST start of the period, used for day-of-month labels. */
  periodStartIso: string;
}

const BYTES_PER_GB = 1024 ** 3;

/** Contiguous runs of uncovered days as inclusive index pairs. */
export function gapRanges(covered: boolean[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let start: number | null = null;

  covered.forEach((isCovered, index) => {
    if (!isCovered && start === null) start = index;
    if (isCovered && start !== null) {
      ranges.push([start, index - 1]);
      start = null;
    }
  });
  if (start !== null) ranges.push([start, covered.length - 1]);

  return ranges;
}

/** Fewer ticks as the period grows so labels never collide in a 768px column. */
export function tickInterval(dayCount: number): number {
  if (dayCount <= 7) return 0;
  if (dayCount <= 31) return 2;
  if (dayCount <= 60) return 5;
  return 8;
}

export function TrafficChart({
  dailyDownloadBytes,
  dailyCovered,
  periodStartIso,
}: TrafficChartProps) {
  const start = new Date(periodStartIso);
  const data = dailyDownloadBytes.map((bytes, index) => {
    const day = new Date(start.getTime() + index * 86_400_000);
    return {
      index: index + 1,
      dayOfMonth: day.getUTCDate(),
      downloadGb: Number((bytes / BYTES_PER_GB).toFixed(2)),
      covered: dailyCovered[index] ?? false,
    };
  });

  const gaps = gapRanges(dailyCovered);
  const coveredCount = dailyCovered.filter(Boolean).length;

  return (
    <div>
      <div className="rounded-md bg-slate-50 p-3">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <pattern
                id={GAP_PATTERN_ID}
                width={6}
                height={6}
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <rect width={6} height={6} fill="#EEF2F7" />
                <line x1={0} y1={0} x2={0} y2={6} stroke={GAP_INK} strokeWidth={1.2} />
              </pattern>
            </defs>

            {gaps.map(([from, to]) => (
              <ReferenceArea
                key={`${from}-${to}`}
                x1={data[from].index}
                x2={data[to].index}
                fill={`url(#${GAP_PATTERN_ID})`}
                fillOpacity={1}
              />
            ))}

            <XAxis
              dataKey="dayOfMonth"
              tickLine={false}
              axisLine={false}
              interval={tickInterval(data.length)}
              tickMargin={6}
              fontSize={9}
              stroke="#94A3B8"
            />
            {/* Animation off: a mid-animation render shows axes with no bars,
                which screenshot-based checks read as a working empty chart. */}
            <Bar
              dataKey="downloadGb"
              fill={ORANGE}
              radius={1}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Coverage ribbon — per-day precision the hatching alone cannot give. */}
      <div
        className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`${coveredCount} of ${dailyCovered.length} days have samples`}
      >
        {dailyCovered.map((isCovered, index) => (
          <div
            key={index}
            className={isCovered ? 'bg-orange-500' : 'bg-slate-300'}
            style={{ width: `${100 / dailyCovered.length}%` }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Daily download (GB) · {coveredCount} of {dailyCovered.length} days sampled ·
        hatched days have no data
      </p>
    </div>
  );
}
