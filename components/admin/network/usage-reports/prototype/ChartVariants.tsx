'use client';

/**
 * PROTOTYPE — throwaway. Three treatments of the uncovered-day problem (#692),
 * each shown at 7 / 31 / 60 / 90 days inside Variant B's ~768px document column
 * (the composition chosen in #688).
 *
 * The question is not "what colour are the bars" — it is how a gap reads. Real
 * retention means a 31-day request currently carries 7 days of samples, so the
 * gap is the majority of most charts, and a zero-height bar would claim the
 * network was idle.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import {
  PERIOD_CASES,
  coverageSummary,
  gapRanges,
  type ChartDay,
} from './chartFixtures';

const ORANGE = '#E87A1E';
const GAP_INK = '#94A3B8';

/** Fewer ticks as the period grows, so labels never collide at 768px. */
function tickInterval(dayCount: number): number {
  if (dayCount <= 7) return 0;
  if (dayCount <= 31) return 2;
  if (dayCount <= 60) return 5;
  return 8;
}

function Frame({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
          {title}
        </h3>
        <span className="text-xs text-slate-500">{caption}</span>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Chart A — Hatched gap band
 * The axis stays continuous across the whole period; uncovered stretches
 * are filled with a diagonal hatch, so absence reads as texture.
 * ------------------------------------------------------------------ */
export function ChartHatchedGap({ days }: { days: ChartDay[] }) {
  const gaps = gapRanges(days);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={days} margin={{ left: 4, right: 4, top: 4 }}>
        <defs>
          <pattern
            id="gap-hatch"
            width={6}
            height={6}
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <rect width={6} height={6} fill="#F1F5F9" />
            <line x1={0} y1={0} x2={0} y2={6} stroke={GAP_INK} strokeWidth={1.5} />
          </pattern>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        {gaps.map(([from, to]) => (
          <ReferenceArea
            key={`${from}-${to}`}
            x1={days[from].index}
            x2={days[to].index}
            fill="url(#gap-hatch)"
            fillOpacity={1}
            ifOverflow="extendDomain"
          />
        ))}
        <XAxis
          dataKey="dayOfMonth"
          tickLine={false}
          axisLine={false}
          interval={tickInterval(days.length)}
          tickMargin={8}
          fontSize={10}
        />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={10} unit=" GB" />
        <Bar dataKey="downloadGb" fill={ORANGE} radius={2} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Chart B — Clipped span with a position rail
 * Plots only the days that exist, at full width, and shows where that
 * span sits inside the requested period on a rail above.
 * ------------------------------------------------------------------ */
export function ChartClippedSpan({ days }: { days: ChartDay[] }) {
  const covered = days.filter((day) => day.covered);
  const firstCovered = days.findIndex((day) => day.covered);
  const leadingPct = (firstCovered / days.length) * 100;
  const spanPct = (covered.length / days.length) * 100;

  return (
    <div>
      <div className="mb-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-orange-500"
            style={{ marginLeft: `${leadingPct}%`, width: `${spanPct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>day 1 of requested period</span>
          <span>day {days.length}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={covered} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="dayOfMonth"
            tickLine={false}
            axisLine={false}
            interval={tickInterval(covered.length)}
            tickMargin={8}
            fontSize={10}
          />
          <YAxis tickLine={false} axisLine={false} width={40} fontSize={10} unit=" GB" />
          <Bar dataKey="downloadGb" fill={ORANGE} radius={2} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Chart C — Baseline marks plus a coverage ribbon
 * Every requested day keeps its slot. Uncovered days get a small grey
 * baseline mark — visibly not a bar of zero — and a ribbon under the axis
 * shows covered/uncovered continuously.
 * ------------------------------------------------------------------ */
export function ChartBaselineRibbon({ days }: { days: ChartDay[] }) {
  // A tiny constant so uncovered days render a visible mark rather than nothing.
  const plotted = days.map((day) => ({
    ...day,
    plotted: day.covered ? day.downloadGb : 0.35,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={165}>
        <BarChart data={plotted} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="dayOfMonth"
            tickLine={false}
            axisLine={false}
            interval={tickInterval(days.length)}
            tickMargin={8}
            fontSize={10}
          />
          <YAxis tickLine={false} axisLine={false} width={40} fontSize={10} unit=" GB" />
          <Bar dataKey="plotted" radius={2} isAnimationActive={false}>
            {plotted.map((day) => (
              <Cell
                key={day.index}
                fill={day.covered ? ORANGE : GAP_INK}
                fillOpacity={day.covered ? 1 : 0.45}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full pl-[40px]">
        {days.map((day) => (
          <div
            key={day.index}
            className={day.covered ? 'bg-orange-500' : 'bg-slate-300'}
            style={{ width: `${100 / days.length}%` }}
          />
        ))}
      </div>
      <p className="mt-1 pl-[40px] text-[10px] text-slate-500">
        coverage ribbon — orange where a sample exists
      </p>
    </div>
  );
}

const CHART_VARIANTS = {
  A: {
    name: 'Hatched gap band',
    note: 'Full period on the axis; missing stretches filled with hatching.',
    render: (days: ChartDay[]) => <ChartHatchedGap days={days} />,
  },
  B: {
    name: 'Clipped span + rail',
    note: 'Plots only the days that exist; a rail shows where they sit in the period.',
    render: (days: ChartDay[]) => <ChartClippedSpan days={days} />,
  },
  C: {
    name: 'Baseline marks + ribbon',
    note: 'Every day keeps its slot; uncovered days are grey marks, not zero bars.',
    render: (days: ChartDay[]) => <ChartBaselineRibbon days={days} />,
  },
} as const;

export type ChartVariantKey = keyof typeof CHART_VARIANTS;
export const CHART_VARIANT_KEYS = Object.keys(CHART_VARIANTS) as ChartVariantKey[];
export const chartVariantName = (key: ChartVariantKey) => CHART_VARIANTS[key].name;

export function ChartVariantGallery({ variant }: { variant: ChartVariantKey }) {
  const active = CHART_VARIANTS[variant];

  return (
    // Same max-w-3xl document column as Variant B, so density is judged at the
    // width the chart will actually occupy.
    <div className="mx-auto max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <header>
        <h2 className="text-xl font-bold text-slate-900">
          Core site traffic — {active.name}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{active.note}</p>
        <p className="mt-2 text-xs text-slate-500">
          Ruijie rollups retain roughly 7 days, so every period longer than a week
          is mostly gap. An uncovered day must never read as zero traffic.
        </p>
      </header>

      {PERIOD_CASES.map((period) => (
        <Frame
          key={period.key}
          title={period.label}
          caption={coverageSummary(period.days)}
        >
          {active.render(period.days)}
        </Frame>
      ))}
    </div>
  );
}
