'use client';

import { Archivo } from 'next/font/google';
import '@/components/portal/modernist/tokens.css';
import '@/components/admin/modernist/admin-kit.css';
import {
  PORTAL_MODERNIST_STYLE,
} from '@/components/portal/modernist/PortalModernistShell';
import { cn } from '@/lib/utils';

/**
 * Loads the Unjani / portal modernist tokens (Archivo + `--pm-*`) on admin.
 *
 * `tokens.css` only applies under `.portal-root` (it resets Manrope headings
 * back to Archivo). AdminLayoutClient mounts AdminModernistProvider around the
 * authenticated chrome so every /admin page inherits the tokens.
 *
 * AdminModernistShell is a no-op wrapper kept so existing Unjani / quotes /
 * portfolio call sites do not double-apply negative layout offsets.
 */
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export function AdminModernistProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('portal-root', archivo.variable, className)}
      style={PORTAL_MODERNIST_STYLE}
    >
      {children}
    </div>
  );
}

export function AdminModernistShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return className ? <div className={className}>{children}</div> : <>{children}</>;
}
