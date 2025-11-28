import {
  Home,
  Wifi,
  CreditCard,
  User,
  HelpCircle,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Receipt,
  Package,
  FileCheck,
  Shield,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface DashboardTab {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  routes: string[]; // All routes that belong to this tab (for active detection)
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

// Main navigation tabs - displayed in top bar (desktop) and bottom nav (mobile)
export const dashboardTabs: DashboardTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    routes: ['/dashboard'],
  },
  {
    id: 'services',
    label: 'Services',
    icon: Wifi,
    href: '/dashboard/services',
    routes: [
      '/dashboard/services',
      '/dashboard/services/upgrade',
      '/dashboard/services/downgrade',
      '/dashboard/usage',
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    href: '/dashboard/billing',
    routes: [
      '/dashboard/billing',
      '/dashboard/payment-method',
      '/dashboard/orders',
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: User,
    href: '/dashboard/profile',
    routes: [
      '/dashboard/profile',
      '/dashboard/kyc',
      '/dashboard/compliance',
    ],
  },
  {
    id: 'help',
    label: 'Help',
    icon: HelpCircle,
    href: '/dashboard/support',
    routes: [
      '/dashboard/support',
      '/dashboard/tickets',
    ],
  },
];

// Sidebar items per tab - context-aware navigation
export const sidebarConfig: Record<string, SidebarItem[]> = {
  dashboard: [], // No sidebar items - full-width content for dashboard home
  services: [
    { label: 'My Services', href: '/dashboard/services', icon: Wifi },
    { label: 'Usage', href: '/dashboard/usage', icon: BarChart3 },
    { label: 'Upgrade Plan', href: '/dashboard/services/upgrade', icon: ArrowUp },
    { label: 'Downgrade Plan', href: '/dashboard/services/downgrade', icon: ArrowDown },
  ],
  billing: [
    { label: 'Overview', href: '/dashboard/billing', icon: Receipt },
    { label: 'Orders', href: '/dashboard/orders', icon: Package },
    { label: 'Payment Method', href: '/dashboard/payment-method', icon: CreditCard },
  ],
  account: [
    { label: 'Profile', href: '/dashboard/profile', icon: User },
    { label: 'KYC Documents', href: '/dashboard/kyc', icon: FileCheck },
    { label: 'Compliance', href: '/dashboard/compliance', icon: Shield },
  ],
  help: [
    { label: 'Support', href: '/dashboard/support', icon: HelpCircle },
    { label: 'Tickets', href: '/dashboard/tickets', icon: MessageSquare },
  ],
};

/**
 * Get the active tab based on current pathname
 */
export function getActiveTab(pathname: string): string {
  // Check each tab's routes to find a match
  for (const tab of dashboardTabs) {
    // Exact match for dashboard home
    if (tab.id === 'dashboard' && pathname === '/dashboard') {
      return tab.id;
    }

    // Check if pathname starts with any of the tab's routes
    for (const route of tab.routes) {
      if (route !== '/dashboard' && pathname.startsWith(route)) {
        return tab.id;
      }
    }
  }

  // Default to dashboard if no match found
  return 'dashboard';
}

/**
 * Get sidebar items for the active tab
 */
export function getSidebarItems(activeTab: string): SidebarItem[] {
  return sidebarConfig[activeTab] || [];
}

/**
 * Check if a sidebar item is active based on current pathname
 */
export function isSidebarItemActive(pathname: string, itemHref: string): boolean {
  // Exact match or starts with (for nested routes like /dashboard/orders/123)
  return pathname === itemHref ||
         (itemHref !== '/dashboard' && pathname.startsWith(itemHref + '/'));
}
