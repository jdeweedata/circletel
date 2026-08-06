import { cn } from '@/lib/utils';

/** Base classes for a Billing Modernist ruled table (header + row rules from tokens.css). */
export const bmTableClass = 'bm-table w-full text-[13px]';

interface RuledTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

/**
 * Themed `<table>` — flat header (uppercase, tracked), 1px row rules, no
 * rounded shell. Use with plain `<thead>`/`<tbody>`/`<tr>`/`<th>`/`<td>`.
 */
export function RuledTable({ children, className, ...props }: RuledTableProps) {
  return (
    <table className={cn(bmTableClass, className)} {...props}>
      {children}
    </table>
  );
}
