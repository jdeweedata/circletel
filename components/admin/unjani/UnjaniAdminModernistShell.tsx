'use client';

import { Archivo } from 'next/font/google';
import '@/components/portal/modernist/tokens.css';
import { PortalModernistShell } from '@/components/portal/modernist/PortalModernistShell';
import { cn } from '@/lib/utils';

/**
 * Loads the /unjani portal modernist tokens on an admin page.
 *
 * `tokens.css` only applies under `.portal-root` (it resets Manrope headings
 * back to Archivo). PortalModernistShell then sets the --pm-* colours.
 * Negative margins cancel AdminLayoutClient <main> padding so the ground
 * tint can reach the content column edges — same trick as BillingModernistShell.
 */
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export function UnjaniAdminModernistShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'portal-root',
        archivo.variable,
        '-mx-4 -mt-2 px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className
      )}
    >
      <PortalModernistShell>{children}</PortalModernistShell>
    </div>
  );
}
