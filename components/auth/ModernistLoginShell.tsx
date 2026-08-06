'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

export type AccountLane = 'personal' | 'business';

const SIDE_COPY: Record<
  AccountLane,
  { kicker: string; title: string; blurb: string; points: string[] }
> = {
  personal: {
    kicker: 'Personal account',
    title: 'Your line, your bill, in one place.',
    blurb:
      'Check what you owe, pay it, watch your usage and log a fault without phoning anyone.',
    points: [
      'One invoice and payment history for the line at your address',
      'Live status on your connection, plus fault tickets you can follow',
      'Change package or debit-order date without a call centre queue',
    ],
  },
  business: {
    kicker: 'Business account',
    title: 'Every site on one statement.',
    blurb:
      'Add sites, invite users, set PO references and pull VAT invoices — your team runs the account without logging a ticket.',
    points: [
      'One consolidated statement across every branch and circuit',
      'Users and roles: who can view invoices, who can pay, who can log faults',
      'VAT invoices, PO references and SLA credits on the account',
    ],
  },
};

export function ModernistLoginShell({
  account,
  children,
}: {
  account: AccountLane;
  children: ReactNode;
}) {
  const side = SIDE_COPY[account];

  return (
    <div
      className="min-h-screen flex items-stretch justify-center p-0 lg:p-6"
      style={{
        background: 'color-mix(in srgb, #13274A 7%, #FFFFFF)',
        fontFamily: 'var(--font-archivo, ui-sans-serif, system-ui, sans-serif)',
        ['--pm-navy' as string]: '#13274A',
        ['--pm-accent' as string]: '#F5841E',
        ['--pm-body' as string]: '#1F2937',
        ['--pm-divider' as string]:
          'color-mix(in srgb, #13274A 28%, transparent)',
        ['--pm-surface' as string]:
          'color-mix(in srgb, #13274A 6%, #FFFFFF)',
      }}
    >
      <div
        className="w-full max-w-[1180px] grid lg:grid-cols-[1fr_520px] min-h-screen lg:min-h-[800px] bg-white"
        style={{ border: '2px solid color-mix(in srgb, #13274A 28%, transparent)' }}
      >
        {/* Brand panel */}
        <aside
          className="hidden lg:flex flex-col text-white"
          style={{ background: '#13274A' }}
        >
          <div className="px-11 pt-11 pb-8 flex flex-col flex-1">
            <div className="flex items-center gap-2.5 font-extrabold text-base mb-14">
              <span
                className="w-3 h-3 shrink-0"
                style={{ background: '#F5841E' }}
              />
              CircleTel
            </div>
            <p
              className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4"
              style={{ color: '#F5841E' }}
            >
              {side.kicker}
            </p>
            <h1 className="text-[54px] font-extrabold leading-[0.98] tracking-tight mb-4">
              {side.title}
            </h1>
            <p className="text-[15px] leading-relaxed text-white/80 max-w-[420px]">
              {side.blurb}
            </p>
            <div
              className="mt-8"
              style={{ borderTop: '2px solid rgba(255,255,255,0.3)' }}
            >
              {side.points.map((point) => (
                <div
                  key={point}
                  className="flex gap-3.5 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.18)' }}
                >
                  <span
                    className="w-2 h-2 shrink-0 mt-1.5"
                    style={{ background: '#F5841E' }}
                  />
                  <span className="text-[13.5px] leading-snug text-white/85">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <div className="flex flex-col px-6 py-8 sm:px-11 sm:py-11 min-w-0">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 font-extrabold text-base mb-8"
            style={{ color: '#13274A' }}
          >
            <span className="w-3 h-3" style={{ background: '#F5841E' }} />
            CircleTel
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
