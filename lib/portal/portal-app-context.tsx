'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import {
  PORTAL_APP_BASE,
  UNJANI_APP_BASE,
} from '@/lib/portal/paths';

export type PortalAppVariant = 'business' | 'unjani';
export type PortalAppBase = typeof PORTAL_APP_BASE | typeof UNJANI_APP_BASE;

interface PortalAppContextValue {
  variant: PortalAppVariant;
  base: PortalAppBase;
  isUnjani: boolean;
  href: (path?: string) => string;
}

const PortalAppContext = createContext<PortalAppContextValue | undefined>(
  undefined
);

export function PortalAppProvider({
  variant,
  children,
}: {
  variant: PortalAppVariant;
  children: React.ReactNode;
}) {
  const base: PortalAppBase =
    variant === 'unjani' ? UNJANI_APP_BASE : PORTAL_APP_BASE;

  const href = useCallback(
    (path = '') => {
      const rest = !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
      return rest ? `${base}${rest}` : base;
    },
    [base]
  );

  const value = useMemo(
    () => ({
      variant,
      base,
      isUnjani: variant === 'unjani',
      href,
    }),
    [variant, base, href]
  );

  return (
    <PortalAppContext.Provider value={value}>
      {children}
    </PortalAppContext.Provider>
  );
}

export function usePortalApp(): PortalAppContextValue {
  const context = useContext(PortalAppContext);
  if (!context) {
    throw new Error('usePortalApp must be used within a PortalAppProvider');
  }
  return context;
}
