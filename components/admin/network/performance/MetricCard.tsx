/**
 * Back-compat shim. MetricCard was promoted to the shared backend kit —
 * see components/backend/MetricCard.tsx and docs/design/BACKEND_UI_KIT.md.
 * Imports the file directly (not the @/components/backend barrel) to avoid a cycle.
 */
export { MetricCard } from '@/components/backend/MetricCard';
export type { MetricCardProps } from '@/components/backend/MetricCard';
