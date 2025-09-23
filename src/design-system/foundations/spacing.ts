/**
 * CircleTel Design System - Spacing Foundation
 *
 * Defines consistent spacing, padding, margin, and layout utilities
 * used throughout the CircleTel application.
 */

// Base spacing scale (using rem units for consistency)
export const spacingScale = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Semantic spacing for common use cases
export const semanticSpacing = {
  // Component Internal Spacing
  'component-xs': spacingScale[1],      // 4px - Very tight internal spacing
  'component-sm': spacingScale[2],      // 8px - Small internal spacing
  'component-md': spacingScale[4],      // 16px - Default internal spacing
  'component-lg': spacingScale[6],      // 24px - Large internal spacing
  'component-xl': spacingScale[8],      // 32px - Extra large internal spacing

  // Layout Spacing
  'layout-xs': spacingScale[4],         // 16px - Minimal layout spacing
  'layout-sm': spacingScale[6],         // 24px - Small layout spacing
  'layout-md': spacingScale[8],         // 32px - Default layout spacing
  'layout-lg': spacingScale[12],        // 48px - Large layout spacing
  'layout-xl': spacingScale[16],        // 64px - Extra large layout spacing
  'layout-2xl': spacingScale[20],       // 80px - Section spacing
  'layout-3xl': spacingScale[24],       // 96px - Page section spacing

  // Content Spacing
  'content-xs': spacingScale[2],        // 8px - Tight content spacing
  'content-sm': spacingScale[3],        // 12px - Small content spacing
  'content-md': spacingScale[4],        // 16px - Default content spacing
  'content-lg': spacingScale[6],        // 24px - Large content spacing
  'content-xl': spacingScale[8],        // 32px - Extra large content spacing

  // Form Spacing
  'form-field': spacingScale[4],        // 16px - Between form fields
  'form-group': spacingScale[6],        // 24px - Between form groups
  'form-section': spacingScale[8],      // 32px - Between form sections

  // Navigation Spacing
  'nav-item': spacingScale[4],          // 16px - Between nav items
  'nav-group': spacingScale[6],         // 24px - Between nav groups
  'nav-section': spacingScale[8],       // 32px - Between nav sections
} as const;

// Container and wrapper utilities
export const containers = {
  // Max widths for different container types
  'container-sm': '640px',
  'container-md': '768px',
  'container-lg': '1024px',
  'container-xl': '1280px',
  'container-2xl': '1536px',
  'container-full': '100%',

  // Content max widths
  'content-sm': '65ch',     // Optimal reading width for small text
  'content-md': '75ch',     // Optimal reading width for body text
  'content-lg': '85ch',     // Optimal reading width for large text

  // Padding for containers
  'container-padding-sm': spacingScale[4],    // 16px
  'container-padding-md': spacingScale[6],    // 24px
  'container-padding-lg': spacingScale[8],    // 32px
} as const;

// Grid and flexbox spacing utilities
export const gridSpacing = {
  // Gap utilities for CSS Grid and Flexbox
  'gap-xs': spacingScale[1],          // 4px
  'gap-sm': spacingScale[2],          // 8px
  'gap-md': spacingScale[4],          // 16px
  'gap-lg': spacingScale[6],          // 24px
  'gap-xl': spacingScale[8],          // 32px
  'gap-2xl': spacingScale[12],        // 48px

  // Column gaps
  'column-gap-xs': spacingScale[2],   // 8px
  'column-gap-sm': spacingScale[4],   // 16px
  'column-gap-md': spacingScale[6],   // 24px
  'column-gap-lg': spacingScale[8],   // 32px
  'column-gap-xl': spacingScale[12],  // 48px

  // Row gaps
  'row-gap-xs': spacingScale[2],      // 8px
  'row-gap-sm': spacingScale[4],      // 16px
  'row-gap-md': spacingScale[6],      // 24px
  'row-gap-lg': spacingScale[8],      // 32px
  'row-gap-xl': spacingScale[12],     // 48px
} as const;

// Responsive spacing utilities
export const responsiveSpacing = {
  // Padding classes that scale with screen size
  'responsive-padding-sm': 'p-4 md:p-6 lg:p-8',
  'responsive-padding-md': 'p-6 md:p-8 lg:p-12',
  'responsive-padding-lg': 'p-8 md:p-12 lg:p-16',

  // Margin classes that scale with screen size
  'responsive-margin-sm': 'm-4 md:m-6 lg:m-8',
  'responsive-margin-md': 'm-6 md:m-8 lg:m-12',
  'responsive-margin-lg': 'm-8 md:m-12 lg:m-16',

  // Gap classes that scale with screen size
  'responsive-gap-sm': 'gap-2 md:gap-4 lg:gap-6',
  'responsive-gap-md': 'gap-4 md:gap-6 lg:gap-8',
  'responsive-gap-lg': 'gap-6 md:gap-8 lg:gap-12',
} as const;

// Component-specific spacing patterns
export const componentSpacing = {
  // Button spacing
  button: {
    padding: {
      sm: 'px-3 py-1.5',      // Small button
      md: 'px-4 py-2',        // Default button
      lg: 'px-6 py-3',        // Large button
      xl: 'px-8 py-4',        // Extra large button
    },
    gap: spacingScale[2],     // Gap between icon and text
  },

  // Card spacing
  card: {
    padding: {
      sm: spacingScale[4],    // 16px
      md: spacingScale[6],    // 24px
      lg: spacingScale[8],    // 32px
    },
    gap: spacingScale[4],     // Gap between card elements
  },

  // Form spacing
  form: {
    fieldGap: spacingScale[4],        // 16px between fields
    groupGap: spacingScale[6],        // 24px between groups
    sectionGap: spacingScale[8],      // 32px between sections
    labelGap: spacingScale[1],        // 4px between label and input
  },

  // Navigation spacing
  nav: {
    itemGap: spacingScale[4],         // 16px between nav items
    groupGap: spacingScale[6],        // 24px between nav groups
    padding: spacingScale[4],         // 16px internal padding
  },

  // List spacing
  list: {
    itemGap: spacingScale[2],         // 8px between list items
    nestedIndent: spacingScale[6],    // 24px for nested lists
  },
} as const;

// Export combined spacing system
export const spacing = {
  scale: spacingScale,
  semantic: semanticSpacing,
  containers,
  grid: gridSpacing,
  responsive: responsiveSpacing,
  components: componentSpacing,
} as const;

export type SpacingScale = keyof typeof spacingScale;
export type SemanticSpacing = keyof typeof semanticSpacing;