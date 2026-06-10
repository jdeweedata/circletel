// Re-export shim — ModernStatCard is now the unified backend StatCard.
// Canonical implementation lives in components/backend/StatCard.tsx.
// Kept so existing `@/components/dashboard/ModernStatCard` imports keep working.
export { StatCard as ModernStatCard, StatCard } from '@/components/backend/StatCard';
export type { StatCardProps } from '@/components/backend/StatCard';
