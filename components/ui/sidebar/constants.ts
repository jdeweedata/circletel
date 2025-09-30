/**
 * Sidebar Motion Constants
 * Centralized configuration for consistent behavior across all sidebar components
 */

export const SIDEBAR_CONFIG = {
  // Dimensions
  EXPANDED_WIDTH: '300px',
  COLLAPSED_WIDTH: '60px',
  MOBILE_HEIGHT: '2.5rem',

  // Animation
  ANIMATION_DURATION: 0.3,
  TEXT_ANIMATION_DURATION: 0.2,
  EASING: 'easeInOut' as const,

  // Z-index layers
  Z_INDEX: {
    MOBILE_MENU: 20,
    MOBILE_OVERLAY: 100,
    CLOSE_BUTTON: 50,
  },

  // Breakpoints
  MOBILE_BREAKPOINT: 'md',
} as const;

export const SIDEBAR_THEME = {
  // Base colors
  BACKGROUND: {
    LIGHT: 'bg-neutral-100',
    DARK: 'dark:bg-neutral-800',
  },

  // Mobile overlay
  MOBILE_BACKGROUND: {
    LIGHT: 'bg-white',
    DARK: 'dark:bg-neutral-900',
  },

  // Text colors
  TEXT: {
    PRIMARY: 'text-neutral-700 dark:text-neutral-200',
    SECONDARY: 'text-neutral-800 dark:text-neutral-200',
  },

  // Button styles
  BUTTON: {
    BACKGROUND: 'bg-white dark:bg-neutral-800',
    BORDER: 'border-neutral-200 dark:border-neutral-700',
    HOVER: 'hover:bg-neutral-100 dark:hover:bg-neutral-700',
  },
} as const;

export const SIDEBAR_ANIMATIONS = {
  // Desktop sidebar width animation
  DESKTOP_WIDTH: {
    duration: SIDEBAR_CONFIG.ANIMATION_DURATION,
    ease: SIDEBAR_CONFIG.EASING,
    type: 'tween' as const,
  },

  // Text fade animation
  TEXT_FADE: {
    duration: SIDEBAR_CONFIG.TEXT_ANIMATION_DURATION,
    ease: SIDEBAR_CONFIG.EASING,
  },

  // Mobile slide animation
  MOBILE_SLIDE: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
    transition: {
      duration: SIDEBAR_CONFIG.ANIMATION_DURATION,
      ease: SIDEBAR_CONFIG.EASING,
    },
  },
} as const;