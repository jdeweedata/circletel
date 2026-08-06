import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Billing Modernist page header — eyebrow, large H1, subtitle, action cluster.
 * Matches the mock's `header` block (40px/800 title, 10px tracked eyebrow).
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 px-4 pb-6 pt-6 sm:px-6 lg:px-8',
        className
      )}
    >
      <div className="min-w-0">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D76026]">
          {eyebrow}
        </div>
        <h1 className="text-[40px] font-extrabold leading-none text-[color:var(--bm-navy,#13274A)]">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1.5 text-[13px] leading-snug text-[color:var(--bm-text-muted)]">
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-none flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
