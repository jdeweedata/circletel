'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function PortalModernistShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('portal-modernist space-y-0', className)}
      style={{
        ['--pm-navy' as string]: '#13274A',
        ['--pm-body' as string]: '#1F2937',
        ['--pm-accent' as string]: '#F5841E',
        ['--pm-divider' as string]:
          'color-mix(in srgb, #13274A 28%, transparent)',
        ['--pm-ground' as string]:
          'color-mix(in srgb, #13274A 7%, #FFFFFF)',
        ['--pm-surface' as string]:
          'color-mix(in srgb, #13274A 6%, #FFFFFF)',
        fontFamily: 'var(--font-archivo, ui-sans-serif, system-ui, sans-serif)',
      }}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-6 mb-0"
      style={{ borderBottom: '2px solid var(--pm-divider)' }}
    >
      <div>
        {eyebrow && (
          <p
            className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-2"
            style={{ color: 'var(--pm-navy)' }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="text-3xl sm:text-[40px] font-extrabold leading-tight"
          style={{ color: 'var(--pm-navy)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AlertBand({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 mt-6"
      style={{ background: 'var(--pm-navy)', color: '#FFFFFF' }}
    >
      <div className="text-sm font-medium">{children}</div>
      {action}
    </div>
  );
}

export function KpiStrip({
  items,
}: {
  items: Array<{ label: string; value: string; note?: string }>;
}) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 mt-6"
      style={{ border: '2px solid var(--pm-divider)' }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className="px-4 py-4"
          style={{
            background: 'var(--pm-surface)',
            borderRight:
              i < items.length - 1 ? '1px solid var(--pm-divider)' : undefined,
          }}
        >
          <p
            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            {item.label}
          </p>
          <p
            className="text-2xl font-extrabold mt-1"
            style={{ color: 'var(--pm-navy)' }}
          >
            {item.value}
          </p>
          {item.note && (
            <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--pm-body)' }}>
              {item.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="inline-flex flex-wrap"
      style={{ border: '2px solid var(--pm-divider)' }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-3 py-2 text-xs font-extrabold tracking-wide uppercase"
            style={{
              background: active ? 'var(--pm-navy)' : '#FFFFFF',
              color: active ? '#FFFFFF' : 'var(--pm-navy)',
              borderRight:
                i < options.length - 1
                  ? '1px solid var(--pm-divider)'
                  : undefined,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function RuledTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div
      className="mt-6 overflow-x-auto bg-white"
      style={{ border: '2px solid var(--pm-divider)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '2px solid var(--pm-divider)' }}>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-extrabold text-[11px] tracking-wide uppercase"
                style={{ color: 'var(--pm-navy)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function PmButton({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--pm-accent)',
      color: 'var(--pm-navy)',
      border: 'none',
    },
    secondary: {
      background: '#FFFFFF',
      color: 'var(--pm-navy)',
      border: '2px solid var(--pm-divider)',
    },
    ghost: {
      background: 'transparent',
      color: '#D76026',
      border: 'none',
    },
  };

  const { type = 'button', ...rest } = props;

  return (
    <button
      type={type}
      className={cn(
        'px-4 py-2 text-sm font-extrabold disabled:opacity-50',
        className
      )}
      style={styles[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}
