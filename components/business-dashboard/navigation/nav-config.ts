import { IconType } from 'react-icons';
import { PiBuildingsBold, PiCheckSquareBold, PiCreditCardBold, PiFileTextBold, PiGearBold, PiMapPinBold, PiQuestionBold, PiSignatureBold, PiSquaresFourBold, PiTrendUpBold, PiWifiHighBold, PiWrenchBold } from 'react-icons/pi';
/**
 * Business Dashboard Navigation Configuration
 *
 * Defines the navigation structure for the B2B customer portal.
 *
 * @module components/business-dashboard/navigation/nav-config
 */


export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
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
    icon: PiSquaresFourBold,
    description: 'Overview and journey status',
  },
  {
    label: 'Journey',
    href: '/business/dashboard/journey',
    icon: PiTrendUpBold,
    description: 'Track your onboarding progress',
  },
  {
    label: 'Quotes',
    href: '/business/dashboard/quotes',
    icon: PiFileTextBold,
    description: 'View and manage quotes',
  },
  {
    label: 'Verification',
    href: '/business/dashboard/verification',
    icon: PiCheckSquareBold,
    description: 'Business verification status',
  },
  {
    label: 'Site Details',
    href: '/business/dashboard/site-details',
    icon: PiMapPinBold,
    description: 'Property and installation info',
  },
  {
    label: 'Contracts',
    href: '/business/dashboard/contracts',
    icon: PiSignatureBold,
    description: 'Review and sign contracts',
  },
  {
    label: 'Services',
    href: '/business/dashboard/services',
    icon: PiWifiHighBold,
    description: 'Active services',
  },
  {
    label: 'Billing',
    href: '/business/dashboard/billing',
    icon: PiCreditCardBold,
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
    icon: PiQuestionBold,
    description: 'Get help',
  },
  {
    label: 'Settings',
    href: '/business/dashboard/settings',
    icon: PiGearBold,
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
    icon: PiSquaresFourBold,
  },
  {
    label: 'Journey',
    href: '/business/dashboard/journey',
    icon: PiTrendUpBold,
  },
  {
    label: 'Quotes',
    href: '/business/dashboard/quotes',
    icon: PiFileTextBold,
  },
  {
    label: 'Services',
    href: '/business/dashboard/services',
    icon: PiWifiHighBold,
  },
  {
    label: 'Support',
    href: '/business/dashboard/support',
    icon: PiQuestionBold,
  },
];

/**
 * Journey-based navigation (contextual)
 */
export const JOURNEY_STAGE_NAV: Record<string, NavItem> = {
  quote_request: {
    label: 'Request Quote',
    href: '/business/dashboard/quotes/new',
    icon: PiFileTextBold,
  },
  business_verification: {
    label: 'Complete Verification',
    href: '/business/dashboard/verification',
    icon: PiCheckSquareBold,
  },
  site_details: {
    label: 'Submit Site Details',
    href: '/business/dashboard/site-details',
    icon: PiMapPinBold,
  },
  contract: {
    label: 'Sign Contract',
    href: '/business/dashboard/contracts',
    icon: PiSignatureBold,
  },
  installation: {
    label: 'Installation Status',
    href: '/business/dashboard/installation',
    icon: PiWrenchBold,
  },
  go_live: {
    label: 'Service Activation',
    href: '/business/dashboard/services',
    icon: PiWifiHighBold,
  },
};
