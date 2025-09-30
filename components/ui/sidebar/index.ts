/**
 * Sidebar Motion Components - Refactored Version
 *
 * A comprehensive, maintainable sidebar system with:
 * - Type safety
 * - Performance optimizations
 * - Consistent styling
 * - Accessibility features
 * - Mobile responsiveness
 *
 * @example
 * ```tsx
 * import { Sidebar, SidebarBody, SidebarLink, SidebarToggle, useSidebar } from '@/components/ui/sidebar';
 *
 * function MySidebar() {
 *   return (
 *     <Sidebar defaultOpen={true}>
 *       <SidebarBody>
 *         <SidebarToggle />
 *         <SidebarLink link={{ label: "Home", href: "/", icon: <HomeIcon /> }} />
 *       </SidebarBody>
 *     </Sidebar>
 *   );
 * }
 * ```
 */

// Core components
export { Sidebar, SidebarBody, SidebarLink, SidebarToggle } from './components';

// Context and hooks
export { SidebarProvider, useSidebar } from './context';
export {
  useSidebarState,
  useIsMobile,
  useSidebarAnimations,
  useSidebarKeyboard,
  useSidebarStyles,
} from './hooks';

// Types
export type {
  SidebarLink as SidebarLinkType,
  SidebarState,
  SidebarContextValue,
  SidebarProviderProps,
  SidebarProps,
  SidebarBodyProps,
  SidebarLinkProps,
  SidebarToggleProps,
  AnimationVariant,
  SidebarThemeConfig,
} from './types';

// Constants
export { SIDEBAR_CONFIG, SIDEBAR_THEME, SIDEBAR_ANIMATIONS } from './constants';

// Backward compatibility aliases (deprecated - remove in next major version)
/** @deprecated Use `Sidebar` instead */
export { Sidebar as SidebarMotion } from './components';

/** @deprecated Use `SidebarProvider` instead */
export { SidebarProvider as SidebarMotionProvider } from './context';

/** @deprecated Use `SidebarBody` instead */
export { SidebarBody as SidebarMotionBody } from './components';

/** @deprecated Use `SidebarLink` instead */
export { SidebarLink as SidebarMotionLink } from './components';

/** @deprecated Use `SidebarToggle` instead */
export { SidebarToggle as SidebarMotionToggle } from './components';

/** @deprecated Use `useSidebar` instead */
export { useSidebar as useSidebarMotion } from './context';