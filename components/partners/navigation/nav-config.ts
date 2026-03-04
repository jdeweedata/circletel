import { PiCurrencyDollarBold, PiFolderOpenBold, PiHouseBold, PiImageBold, PiMegaphoneBold, PiUserBold, PiUserPlusBold, PiUsersBold } from 'react-icons/pi';

export interface PartnerTab {
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
export const partnerTabs: PartnerTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: PiHouseBold,
    href: '/partner/dashboard',
    routes: ['/partner/dashboard'],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase,
    href: '/partner/leads',
    routes: ['/partner/leads'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: PiMegaphoneBold,
    href: '/partner/marketing',
    routes: ['/partner/marketing'],
  },
  {
    id: 'earnings',
    label: 'Earnings',
    icon: PiCurrencyDollarBold,
    href: '/partner/commissions',
    routes: ['/partner/commissions'],
  },
  {
    id: 'account',
    label: 'Account',
    icon: PiUserBold,
    href: '/partner/profile',
    routes: ['/partner/profile', '/partner/resources'],
  },
];

// Sidebar items per tab - context-aware navigation
export const sidebarConfig: Record<string, SidebarItem[]> = {
  dashboard: [], // No sidebar items - full-width content for dashboard home
  business: [
    { label: 'All Leads', href: '/partner/leads', icon: PiUsersBold },
    { label: 'New Lead', href: '/partner/leads/new', icon: PiUserPlusBold },
  ],
  marketing: [
    { label: 'Marketing Materials', href: '/partner/marketing', icon: PiImageBold },
  ],
  earnings: [
    { label: 'Commissions', href: '/partner/commissions', icon: PiCurrencyDollarBold },
  ],
  account: [
    { label: 'Profile', href: '/partner/profile', icon: PiUserBold },
    { label: 'Resources', href: '/partner/resources', icon: PiFolderOpenBold },
  ],
};

/**
 * Get the active tab based on current pathname
 */
export function getActiveTab(pathname: string): string {
  // Check each tab's routes to find a match
  for (const tab of partnerTabs) {
    // Exact match for dashboard home
    if (tab.id === 'dashboard' && pathname === '/partner/dashboard') {
      return tab.id;
    }

    // Check if pathname starts with any of the tab's routes
    for (const route of tab.routes) {
      if (route !== '/partner/dashboard' && pathname.startsWith(route)) {
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
  // Exact match or starts with (for nested routes like /partner/leads/123)
  return pathname === itemHref ||
         (itemHref !== '/partner/dashboard' && pathname.startsWith(itemHref + '/'));
}
