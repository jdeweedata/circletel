'use client';

import { Archivo } from 'next/font/google';
import './tokens.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-billing-modernist',
  display: 'swap',
});

/**
 * Wraps a billing page's content in the CircleTel "Modernist ruled ledger"
 * theme (tokens.css + Archivo). Negative margins counteract the padding
 * `AdminLayoutClient`'s <main> applies (`p-4 sm:p-6 lg:p-8`) so bands and
 * rules can run edge-to-edge within the content column.
 */
export function BillingModernistShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`billing-modernist ${archivo.variable} -mx-4 -mt-2 bg-[color:var(--bm-ground)] text-[color:var(--bm-text)] sm:-mx-6 lg:-mx-8`}
      style={
        {
          '--font-heading': 'var(--font-billing-modernist), system-ui, sans-serif',
          '--font-body': 'var(--font-billing-modernist), system-ui, sans-serif',
          fontFamily: 'var(--font-body)',
        } as React.CSSProperties
      }
    >
      <div className="bg-white">{children}</div>
    </div>
  );
}
