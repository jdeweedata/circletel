import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Shared Dashboard Component Types
 *
 * These types are used across all dashboard components (Admin, Consumer, Partner, Business)
 * to ensure consistent styling and behavior.
 */

// =============================================================================
// Stat Card Types
// =============================================================================

export interface StatCardTrend {
  /** The percentage change value */
  value: number;
  /** Whether the trend is positive (true) or negative (false) */
  isPositive: boolean;
  /** Optional label for the trend period (e.g., "vs last month") */
  label?: string;
}

export interface SharedStatCardProps {
  /** Card title displayed at the top */
  title: string;
  /** Main value to display (e.g., "R1,234.00", "42", "Active") */
  value: string | number;
  /** Optional trend indicator with percentage */
  trend?: StatCardTrend;
  /** Subtitle below the main value */
  subtitle?: string;
  /** Description text at the bottom */
  description?: string;
  /** Optional icon to display next to the title */
  icon?: ReactNode;
  /** Optional link - makes the card clickable */
  href?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Quick Action Card Types
// =============================================================================

export type IconColorVariant =
  | 'orange'
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'gray'
  | 'yellow'
  | 'pink';

export interface SharedQuickActionCardProps {
  /** Card title */
  title: string;
  /** Description text */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Link destination (optional - can use onClick instead) */
  href?: string;
  /** Click handler (optional - can use href instead) */
  onClick?: () => void;
  /** Icon color variant - determines background and icon colors */
  colorVariant?: IconColorVariant;
  /** Custom icon background color (overrides colorVariant) */
  iconBg?: string;
  /** Custom icon color (overrides colorVariant) */
  iconColor?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Page Header Types
// =============================================================================

export interface SharedPageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional action slot (e.g., button) */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Empty State Types
// =============================================================================

export interface SharedEmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** CTA button text */
  ctaText?: string;
  /** CTA link destination */
  ctaHref?: string;
  /** CTA click handler */
  ctaOnClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Info Box Types
// =============================================================================

export type InfoBoxVariant = 'orange' | 'blue' | 'green' | 'gray' | 'red' | 'yellow';

export interface SharedInfoBoxProps {
  /** Content to display */
  children: ReactNode;
  /** Color variant */
  variant?: InfoBoxVariant;
  /** Optional title */
  title?: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Icon Color Mappings
// =============================================================================

export const iconColorMap: Record<IconColorVariant, { bg: string; color: string }> = {
  orange: { bg: 'bg-orange-100', color: 'text-circleTel-orange' },
  blue: { bg: 'bg-blue-100', color: 'text-blue-600' },
  green: { bg: 'bg-green-100', color: 'text-green-600' },
  purple: { bg: 'bg-purple-100', color: 'text-purple-600' },
  red: { bg: 'bg-red-100', color: 'text-red-600' },
  gray: { bg: 'bg-gray-100', color: 'text-gray-600' },
  yellow: { bg: 'bg-yellow-100', color: 'text-yellow-600' },
  pink: { bg: 'bg-pink-100', color: 'text-pink-600' },
};

export const infoBoxVariantMap: Record<InfoBoxVariant, string> = {
  orange: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200',
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border-2',
  green: 'bg-green-50 border-green-200',
  gray: 'bg-gray-50 border-gray-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
};
