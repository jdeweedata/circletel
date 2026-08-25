import { cn } from '@/lib/utils';

export interface FilterChipOption<T extends string = string> {
  key: T;
  label: string;
  count?: number | string;
}

interface FilterChipsProps<T extends string = string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

/**
 * Joined-border filter chip group. Only the first chip carries a left
 * border (`.bm-chip` + `:first-child` in tokens.css) so the group reads as
 * one continuous strip; active chip = navy fill + white text.
 */
export function FilterChips<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn('flex flex-wrap', className)}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.key)}
            className={cn('bm-chip', active && 'bm-chip-active')}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className="ml-1.5 font-extrabold text-[11px] opacity-75">
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
