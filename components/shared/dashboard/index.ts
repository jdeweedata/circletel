/**
 * Shared Dashboard Components
 *
 * Reusable components for consistent styling across all dashboards:
 * - Consumer Dashboard
 * - Admin Dashboard
 * - Partner Dashboard
 * - Business Dashboard
 *
 * @example
 * ```tsx
 * import {
 *   SharedStatCard,
 *   SharedQuickActionCard,
 *   SharedPageHeader,
 *   SharedEmptyState,
 *   SharedInfoBox
 * } from '@/components/shared/dashboard';
 * ```
 */

// Stat Card
export { SharedStatCard } from './SharedStatCard';

// Quick Action Cards
export { SharedQuickActionCard, SharedQuickActionCardCompact } from './SharedQuickActionCard';

// Page Headers
export { SharedPageHeader, SharedSectionHeader } from './SharedPageHeader';

// Empty States
export { SharedEmptyState, SharedEmptyStateInline } from './SharedEmptyState';

// Info Boxes
export { SharedInfoBox, SharedHighlightBox, SharedAlertBox } from './SharedInfoBox';
export type { SharedHighlightBoxProps } from './SharedInfoBox';

// Types
export type {
  SharedStatCardProps,
  StatCardTrend,
  SharedQuickActionCardProps,
  IconColorVariant,
  SharedPageHeaderProps,
  SharedEmptyStateProps,
  SharedInfoBoxProps,
  InfoBoxVariant,
} from './types';

// Utility exports
export { iconColorMap, infoBoxVariantMap } from './types';
