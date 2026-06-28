/**
 * Unified backend UI kit — shared component primitives for the logged-in console
 * surfaces. Reference look: hybrid console from docs/design/BACKEND_UI_KIT.md.
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
export { ConsoleShell } from './ConsoleShell';
export { ConsoleTopbar } from './ConsoleTopbar';
export { ConsoleNav } from './ConsoleNav';
export { FilterToolbar } from './FilterToolbar';
export { DataTable } from './DataTable';
export { MetricPanel } from './MetricPanel';
export { ChartPanel } from './ChartPanel';
export { EntityHeader } from './EntityHeader';
export { InspectorPanel } from './InspectorPanel';
export { ActivityTimeline } from './ActivityTimeline';
export type { ActivityTimelineItem } from './ActivityTimeline';
export type {
  ConsoleNavItem,
  ConsoleNavSection,
  DataTableColumn,
  DataTableSortDirection,
  DataTableSortState,
} from './console-types';
export {
  flattenConsoleNavItems,
  getNextDataTableSort,
  isConsoleNavItemActive,
} from './console-utils';
