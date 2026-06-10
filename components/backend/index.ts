/**
 * Unified backend UI kit — shared component primitives for the admin (`/admin/*`)
 * and consumer (`/dashboard/*`) dashboards. Reference look: app/dashboard/billing.
 * See docs/design/BACKEND_UI_KIT.md for the spec.
 */
export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';
export { StatusBadge, getStatusVariant } from './StatusBadge';
export type { StatusVariant } from './StatusBadge';
export { PageHeader } from './PageHeader';
export { SectionCard } from './SectionCard';
export { InfoRow } from './InfoRow';
export { LoadingState, EmptyState, ErrorState } from './states';
export {
  ConsoleTabsList,
  ConsoleTabsContent,
  Tabs,
  TabsContent,
} from './ConsoleTabs';
export type { ConsoleTabItem } from './ConsoleTabs';
