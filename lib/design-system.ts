/**
 * CircleTel Design System Constants
 *
 * Use these constants for programmatic color/typography access.
 * For CSS/Tailwind usage, use the corresponding utility classes.
 *
 * @see app/globals.css for CSS class definitions
 * @see tailwind.config.ts for Tailwind color definitions
 */

// ===========================================
// Official Brand Colors
// ===========================================

export const BRAND_COLORS = {
  // Primary Palette
  orange: '#F5841E',        // Circle Tel Orange - rgb(245, 132, 30)
  gray: '#747474',          // Circle Tel Grey - rgb(116, 116, 116)
  navy: '#13274A',          // Deep Navy - rgb(19, 39, 74)
  black: '#000000',
  white: '#FFFFFF',

  // Secondary Palette
  burntOrange: '#D76026',   // rgb(215, 96, 38)
  warmOrange: '#E97B26',    // rgb(233, 123, 38)
  brightOrange: '#F4742B',  // rgb(244, 116, 43)
  lightGray: '#8B8B8B',     // rgb(139, 139, 139)
  darkGray: '#606261',      // rgb(96, 98, 97)
  midnightNavy: '#0F1427',  // rgb(15, 20, 39)
} as const;

// ===========================================
// UI Colors (for backgrounds, text, borders)
// ===========================================

export const UI_COLORS = {
  // Backgrounds
  pageBg: '#F9FAFB',        // Very light gray - page background
  cardBg: '#FFFFFF',        // White - card/section background
  sidebarBg: '#1F2937',     // Dark charcoal - sidebar/nav

  // Text
  textPrimary: '#111827',   // Near-black - primary text
  textSecondary: '#4B5563', // Medium gray - secondary text
  textMuted: '#6B7280',     // Lighter gray - muted text
  textDark: '#1F2937',      // Dark gray - headings

  // Borders
  border: '#E5E7EB',        // Default border color
  borderLight: '#F3F4F6',   // Light border
} as const;

// ===========================================
// Typography Scale
// ===========================================

export const TYPOGRAPHY = {
  pageTitle: {
    fontSize: '30px',
    fontWeight: 700,
    lineHeight: '36px',
    color: '#1F2937',
    className: 'page-title',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: '28px',
    color: '#111827',
    className: 'header-title',
  },
  sectionHeading: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: '28px',
    color: '#111827',
    className: 'section-heading',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    color: '#4B5563',
    className: 'card-title',
  },
  bodyText: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    color: '#374151',
    className: 'body-text',
  },
  bodyTextLg: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    color: '#374151',
    className: 'body-text-lg',
  },
  mutedText: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    color: '#6B7280',
    className: 'muted-text',
  },
  mutedTextSm: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    color: '#6B7280',
    className: 'muted-text-sm',
  },
} as const;

// ===========================================
// Tailwind Class Helpers
// ===========================================

/**
 * Get Tailwind classes for a typography style
 */
export function getTypographyClasses(style: keyof typeof TYPOGRAPHY): string {
  return TYPOGRAPHY[style].className;
}

/**
 * Common page layout classes
 */
export const LAYOUT_CLASSES = {
  page: 'page-container',           // min-h-screen bg-[#F9FAFB]
  card: 'card-container',           // bg-white rounded-lg border shadow-sm
  sidebar: 'sidebar-container',     // bg-[#1F2937] text-white
} as const;

// ===========================================
// Chart Colors (for data visualization)
// ===========================================

export const CHART_COLORS = {
  primary: BRAND_COLORS.orange,
  secondary: BRAND_COLORS.warmOrange,
  tertiary: BRAND_COLORS.navy,
  quaternary: BRAND_COLORS.brightOrange,
  quinary: BRAND_COLORS.burntOrange,
} as const;

// Type exports
export type BrandColor = keyof typeof BRAND_COLORS;
export type UIColor = keyof typeof UI_COLORS;
export type TypographyStyle = keyof typeof TYPOGRAPHY;
