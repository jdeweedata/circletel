import {
  Home,
  Briefcase,
  DollarSign,
  User,
  Users,
  FolderOpen,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

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
    icon: Home,
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
    id: 'earnings',
    label: 'Earnings',
    icon: DollarSign,
    href: '/partner/commissions',
    routes: ['/partner/commissions'],
  },
  {
    id: 'account',
    label: 'Account',
    icon: User,
    href: '/partner/profile',
    routes: ['/partner/profile', '/partner/resources'],
  },
];

// Sidebar items per tab - context-aware navigation
export const sidebarConfig: Record<string, SidebarItem[]> = {
  dashboard: [], // No sidebar items - full-width content for dashboard home
  business: [
    { label: 'All Leads', href: '/partner/leads', icon: Users },
    { label: 'New Lead', href: '/partner/leads/new', icon: UserPlus },
  ],
  earnings: [
    { label: 'Commissions', href: '/partner/commissions', icon: DollarSign },
  ],
  account: [
    { label: 'Profile', href: '/partner/profile', icon: User },
    { label: 'Resources', href: '/partner/resources', icon: FolderOpen },
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
