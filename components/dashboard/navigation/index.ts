// Navigation components
export { default as DashboardHeader } from './DashboardHeader';
export { default as DashboardTabs } from './DashboardTabs';
export { default as DashboardSidebar } from './DashboardSidebar';
export { default as MobileBottomNav } from './MobileBottomNav';

// Context
export { DashboardNavProvider, useDashboardNav } from './DashboardNavContext';

// Config and utilities
export {
  dashboardTabs,
  sidebarConfig,
  getActiveTab,
  getSidebarItems,
  isSidebarItemActive,
  type DashboardTab,
  type SidebarItem,
} from './nav-config';
