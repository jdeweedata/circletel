import { cn } from '@/lib/utils';
import type { TraceTone } from '@/lib/billing/modernist/recon-ledger';

export type { TraceTone };

interface TraceChipProps {
  /** Short system label, e.g. "CT", "BKS", "NC". */
  label: string;
  tone: TraceTone;
  /** Tooltip, e.g. "CT: ok". */
  title?: string;
  className?: string;
}

const TONE_STYLE: Record<TraceTone, React.CSSProperties> = {
  ok: { background: '#13274A', color: '#FFFFFF' },
  warn: {
    background: 'color-mix(in srgb, #CA8A04 18%, #FFFFFF)',
    color: 'color-mix(in srgb, #CA8A04 72%, #000000)',
  },
  bad: { background: '#DC2626', color: '#FFFFFF' },
  none: {
    background: 'transparent',
    color: 'var(--bm-neutral-500, #9B9797)',
    boxShadow: 'inset 0 0 0 1px var(--bm-divider)',
  },
};

/**
 * 34×24 status block used for CT / Books / Netcash trace rows in the
 * three-way recon ledger and queue.
 */
export function TraceChip({ label, tone, title, className }: TraceChipProps) {
  return (
    <span
      title={title}
      className={cn(
        'flex h-6 w-[34px] flex-none items-center justify-center text-[10px] font-extrabold tracking-[0.06em]',
        className
      )}
      style={TONE_STYLE[tone]}
    >
      {label}
    </span>
  );
}
