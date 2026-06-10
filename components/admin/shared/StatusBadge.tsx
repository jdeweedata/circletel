// Re-export shim — canonical implementation lives in components/backend/StatusBadge.tsx.
// Kept so existing `@/components/admin/shared/StatusBadge` imports keep working.
export { StatusBadge, getStatusVariant } from '@/components/backend/StatusBadge';
export type { StatusVariant } from '@/components/backend/StatusBadge';
