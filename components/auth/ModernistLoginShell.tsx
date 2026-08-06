'use client';

import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Archivo } from 'next/font/google';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-login-modernist',
  display: 'swap',
});

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

/**
 * Mockup 1a shell: 1180px card, navy brand rail + 520px form column.
 * Loads Archivo so global Manrope/Inter heading rules cannot leak in.
 */
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
      className={`${archivo.variable} min-h-dvh w-full flex items-center justify-center px-3 py-4 sm:px-5 sm:py-6 lg:px-6 lg:py-8`}
      style={
        {
          background: 'color-mix(in srgb, #13274A 7%, #FFFFFF)',
          '--font-heading':
            'var(--font-login-modernist), ui-sans-serif, system-ui, sans-serif',
          '--font-body':
            'var(--font-login-modernist), ui-sans-serif, system-ui, sans-serif',
          fontFamily: 'var(--font-body)',
          ['--pm-navy' as string]: '#13274A',
          ['--pm-accent' as string]: '#F5841E',
          ['--pm-body' as string]: '#1F2937',
          ['--pm-divider' as string]:
            'color-mix(in srgb, #13274A 28%, transparent)',
          ['--pm-surface' as string]:
            'color-mix(in srgb, #13274A 6%, #FFFFFF)',
        } as CSSProperties
      }
    >
      <div
        className="w-full max-w-[1180px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] bg-white overflow-hidden lg:min-h-[800px]"
        style={{
          border: '2px solid color-mix(in srgb, #13274A 28%, transparent)',
        }}
      >
        {/* Brand panel — compact on mobile, full rail on lg */}
        <aside
          className="flex flex-col text-white"
          style={{ background: '#13274A', color: '#FFFFFF' }}
        >
          <div className="px-6 py-7 sm:px-10 sm:py-9 lg:px-11 lg:pt-11 lg:pb-8 flex flex-col flex-1">
            <Link
              href="/"
              className="inline-flex items-center mb-6 lg:mb-14 w-fit"
              aria-label="CircleTel home"
            >
              <Image
                src="/images/circletel-logo-white.png"
                alt="CircleTel"
                width={180}
                height={48}
                priority
                className="h-8 sm:h-9 w-auto"
              />
            </Link>

            <p
              className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3 lg:mb-4"
              style={{
                color: '#F5841E',
                fontFamily: 'var(--font-body)',
              }}
            >
              {side.kicker}
            </p>

            {/* Explicit white — globals.css h1 sets navy Manrope */}
            <h1
              className="m-0 mb-3 lg:mb-4 font-extrabold tracking-[-0.025em] text-[32px] leading-[1.05] sm:text-[42px] lg:text-[54px] lg:leading-[0.98]"
              style={{
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
              }}
            >
              {side.title}
            </h1>

            <p
              className="text-[14px] sm:text-[15px] leading-[1.55] max-w-[420px] m-0"
              style={{
                color: 'rgba(255,255,255,0.78)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {side.blurb}
            </p>

            <div
              className="mt-6 lg:mt-8 hidden sm:block"
              style={{ borderTop: '2px solid rgba(255,255,255,0.3)' }}
            >
              {side.points.map((point) => (
                <div
                  key={point}
                  className="flex gap-3.5 py-3"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.18)',
                  }}
                >
                  <span
                    className="w-2 h-2 shrink-0 mt-1.5"
                    style={{ background: '#F5841E' }}
                    aria-hidden
                  />
                  <span
                    className="text-[13.5px] leading-[1.45]"
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel — natural height; footer pins only within the 800px rail */}
        <div className="flex flex-col min-w-0 min-h-0 px-5 py-7 sm:px-10 sm:py-9 lg:px-11 lg:pt-11 lg:pb-8">
          <div
            className="flex flex-col flex-1 min-h-0"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
