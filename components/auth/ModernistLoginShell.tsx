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

export type AccountLane = 'personal' | 'unjani';

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
  unjani: {
    kicker: 'Unjani Connect',
    title: 'Every clinic on one network.',
    blurb:
      'See coverage, nominate a clinic, follow installation, and pull the NPC statement — without a ticket to CircleTel.',
    points: [
      'Coverage and nomination for clinics not yet on the network',
      'Live and onboarding sites in one list, with on-site contacts',
      'Monthly statement and invoices for Unjani Clinics NPC',
    ],
  },
};

/**
 * Full-viewport login shell (mockup 1a copy/structure).
 * Desktop: edge-to-edge navy brand rail + form column (no outer gutters).
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
      className={`${archivo.variable} min-h-dvh w-full`}
      style={
        {
          background: '#FFFFFF',
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
      {/* Brand ~40% / Sign-in ~60% so the form claims the mid-screen gap */}
      <div className="grid min-h-dvh w-full grid-cols-1 lg:grid-cols-[minmax(280px,40%)_minmax(0,1fr)]">
        {/* Brand panel — full height rail on desktop */}
        <aside
          className="flex flex-col text-white min-h-0 lg:min-h-dvh"
          style={{ background: '#13274A', color: '#FFFFFF' }}
        >
          <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-10 lg:py-12 xl:px-14 xl:py-14 flex flex-col flex-1 w-full">
            <Link
              href="/"
              className="inline-flex items-center mb-8 lg:mb-16 w-fit"
              aria-label="CircleTel home"
            >
              <Image
                src="/images/circletel-logo-white.png"
                alt="CircleTel"
                width={320}
                height={96}
                priority
                className="h-14 w-auto sm:h-16 lg:h-20 xl:h-24"
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
              className="m-0 mb-3 lg:mb-4 font-extrabold tracking-[-0.025em] text-[32px] leading-[1.05] sm:text-[42px] lg:text-[48px] xl:text-[54px] xl:leading-[0.98]"
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
              className="mt-6 lg:mt-10 hidden sm:block"
              style={{ borderTop: '2px solid rgba(255,255,255,0.3)' }}
            >
              {side.points.map((point) => (
                <div
                  key={point}
                  className="flex gap-3.5 py-3.5"
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

        {/* Form panel — grows to fill remaining viewport width */}
        <div className="flex flex-col min-w-0 min-h-0 lg:min-h-dvh px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-16 xl:py-14">
          <div
            className="flex flex-col flex-1 min-h-0 w-full max-w-md mx-auto lg:max-w-xl xl:max-w-2xl lg:mx-0"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
