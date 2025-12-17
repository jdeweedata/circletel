/**
 * Business Dashboard Navigation Configuration
 *
 * Defines the navigation structure for the B2B customer portal.
 *
 * @module components/business-dashboard/navigation/nav-config
 */

import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Building2,
  Wrench,
  CreditCard,
  HelpCircle,
  Settings,
  TrendingUp,
  FileSignature,
  MapPin,
  Wifi,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Main navigation items for business dashboard
 */
export const BUSINESS_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/business/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and journey status',
  },
  {
    label: 'Journey',
    href: '/business/dashboard/journey',
    icon: TrendingUp,
    description: 'Track your onboarding progress',
  },
  {
    label: 'Quotes',
    href: '/business/dashboard/quotes',
    icon: FileText,
    description: 'View and manage quotes',
  },
  {
    label: 'Verification',
    href: '/business/dashboard/verification',
    icon: CheckSquare,
    description: 'Business verification status',
  },
  {
    label: 'Site Details',
    href: '/business/dashboard/site-details',
    icon: MapPin,
    description: 'Property and installation info',
  },
  {
    label: 'Contracts',
    href: '/business/dashboard/contracts',
    icon: FileSignature,
    description: 'Review and sign contracts',
  },
  {
    label: 'Services',
    href: '/business/dashboard/services',
    icon: Wifi,
    description: 'Active services',
  },
  {
    label: 'Billing',
    href: '/business/dashboard/billing',
    icon: CreditCard,
    description: 'Invoices and payments',
  },
];

/**
 * Secondary navigation items
 */
export const BUSINESS_SECONDARY_NAV: NavItem[] = [
  {
    label: 'Support',
    href: '/business/dashboard/support',
    icon: HelpCircle,
    description: 'Get help',
  },
  {
    label: 'Settings',
    href: '/business/dashboard/settings',
    icon: Settings,
    description: 'Account settings',
  },
];

/**
 * Mobile bottom navigation (most important items)
 */
export const BUSINESS_MOBILE_NAV: NavItem[] = [
  {
    label: 'Home',
    href: '/business/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Journey',
    href: '/business/dashboard/journey',
    icon: TrendingUp,
  },
  {
    label: 'Quotes',
    href: '/business/dashboard/quotes',
    icon: FileText,
  },
  {
    label: 'Services',
    href: '/business/dashboard/services',
    icon: Wifi,
  },
  {
    label: 'Support',
    href: '/business/dashboard/support',
    icon: HelpCircle,
  },
];

/**
 * Journey-based navigation (contextual)
 */
export const JOURNEY_STAGE_NAV: Record<string, NavItem> = {
  quote_request: {
    label: 'Request Quote',
    href: '/business/dashboard/quotes/new',
    icon: FileText,
  },
  business_verification: {
    label: 'Complete Verification',
    href: '/business/dashboard/verification',
    icon: CheckSquare,
  },
  site_details: {
    label: 'Submit Site Details',
    href: '/business/dashboard/site-details',
    icon: MapPin,
  },
  contract: {
    label: 'Sign Contract',
    href: '/business/dashboard/contracts',
    icon: FileSignature,
  },
  installation: {
    label: 'Installation Status',
    href: '/business/dashboard/installation',
    icon: Wrench,
  },
  go_live: {
    label: 'Service Activation',
    href: '/business/dashboard/services',
    icon: Wifi,
  },
};
