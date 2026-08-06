import { cn } from '@/lib/utils';

export interface KpiItem {
  label: string;
  value: React.ReactNode;
  /** Short colour-coded note under the value (e.g. "17 customers behind"). */
  note?: React.ReactNode;
  /** Muted secondary line under the note. */
  sub?: React.ReactNode;
  /** CSS colour applied to value + note (defaults to body text colour). */
  color?: string;
}

interface KpiStripProps {
  items: KpiItem[];
  className?: string;
}

/**
 * Equal-width flush KPI cells with a 1px left rule between them and a 2px
 * rule under the whole strip.
 */
export function KpiStrip({ items, className }: KpiStripProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap border-b-2 border-[color:var(--bm-divider)]',
        className
      )}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex min-w-[150px] flex-1 flex-col gap-1 border-l border-[color:var(--bm-divider)] px-5 py-4 sm:px-6"
        >
          <div className="whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--bm-text-muted)]">
            {item.label}
          </div>
          <div
            className="text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em]"
            style={{ color: item.color ?? 'var(--bm-text)' }}
          >
            {item.value}
          </div>
          {item.note && (
            <div
              className="text-[11.5px] leading-snug"
              style={{ color: item.color ?? 'var(--bm-text)' }}
            >
              {item.note}
            </div>
          )}
          {item.sub && (
            <div className="text-[11px] leading-snug text-[color:var(--bm-text-faint)]">
              {item.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
