'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { getActiveTab } from './nav-config';

interface PartnerNavContextType {
  // Active tab based on current route
  activeTab: string;

  // Sidebar state (desktop only)
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  // Mobile menu state
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const PartnerNavContext = createContext<PartnerNavContextType | null>(null);

export function usePartnerNav() {
  const context = useContext(PartnerNavContext);
  if (!context) {
    throw new Error(
      'usePartnerNav must be used within a PartnerNavProvider'
    );
  }
  return context;
}

interface PartnerNavProviderProps {
  children: ReactNode;
  defaultSidebarCollapsed?: boolean;
}

export function PartnerNavProvider({
  children,
  defaultSidebarCollapsed = false,
}: PartnerNavProviderProps) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  // Sidebar collapsed state (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('partner-sidebar-collapsed');
      return stored ? JSON.parse(stored) : defaultSidebarCollapsed;
    }
    return defaultSidebarCollapsed;
  });

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle sidebar collapsed state
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev: boolean) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'partner-sidebar-collapsed',
          JSON.stringify(newValue)
        );
      }
      return newValue;
    });
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  // Close mobile menu
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Handle sidebar collapsed state change with persistence
  const handleSetSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'partner-sidebar-collapsed',
        JSON.stringify(collapsed)
      );
    }
  }, []);

  return (
    <PartnerNavContext.Provider
      value={{
        activeTab,
        sidebarCollapsed,
        setSidebarCollapsed: handleSetSidebarCollapsed,
        toggleSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </PartnerNavContext.Provider>
  );
}
