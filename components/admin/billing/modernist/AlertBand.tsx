import { cn } from '@/lib/utils';

interface AlertBandProps {
  /** Copy — use a nested `<span className="text-[#F5841E]">…</span>` to highlight a figure. */
  children: React.ReactNode;
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

/**
 * Navy full-bleed strip with an orange CTA button, used for the "needs
 * attention" summary at the top of a billing page (past due, exceptions, …).
 */
export function AlertBand({
  children,
  ctaLabel,
  onCtaClick,
  className,
}: AlertBandProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-stretch border-b-2 border-[color:var(--bm-divider)] bg-[#13274A] text-white',
        className
      )}
    >
      <div className="flex-1 px-6 py-4 text-[15px] font-extrabold leading-snug sm:px-7 lg:px-8">
        {children}
      </div>
      {ctaLabel && (
        <button
          type="button"
          onClick={onCtaClick}
          className="whitespace-nowrap bg-[#F5841E] px-6 py-4 text-[13px] font-extrabold text-[#13274A] transition-colors hover:bg-[#E97B26] active:bg-[#D76026]"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
