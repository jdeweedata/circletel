/**
 * CircleTel Design System - Typography Foundation
 *
 * Defines the typography scale, hierarchy, and semantic text styles
 * used throughout the CircleTel application.
 */

import { cva } from "class-variance-authority";

// Typography Scale Classes using CVA
export const typographyVariants = cva("", {
  variants: {
    variant: {
      // Headings
      h1: "scroll-m-20 text-4xl font-bold tracking-tight font-inter lg:text-5xl",
      h2: "scroll-m-20 text-2xl font-bold tracking-tight font-inter lg:text-3xl",
      h3: "scroll-m-20 text-xl font-semibold tracking-tight font-inter lg:text-2xl",
      h4: "scroll-m-20 text-lg font-semibold tracking-tight font-inter lg:text-xl",
      h5: "scroll-m-20 text-base font-semibold tracking-tight font-inter lg:text-lg",
      h6: "scroll-m-20 text-sm font-semibold tracking-tight font-inter lg:text-base",

      // Body Text
      "body-large": "text-lg leading-relaxed font-inter",
      "body-medium": "text-base leading-normal font-inter",
      "body-small": "text-sm leading-normal font-inter",

      // UI Text
      "ui-large": "text-base font-medium font-inter",
      "ui-medium": "text-sm font-medium font-inter",
      "ui-small": "text-xs font-medium font-inter",

      // Labels
      "label-large": "text-sm font-semibold font-inter uppercase tracking-wide",
      "label-medium": "text-xs font-semibold font-inter uppercase tracking-wide",

      // Code/Monospace
      "code-large": "text-base font-space-mono leading-normal",
      "code-medium": "text-sm font-space-mono leading-normal",
      "code-small": "text-xs font-space-mono leading-normal",

      // Special
      "display": "text-5xl font-bold font-inter tracking-tight lg:text-6xl",
      "caption": "text-xs text-muted-foreground font-inter",
      "overline": "text-xs font-semibold font-inter uppercase tracking-wide",
    },
    color: {
      primary: "text-foreground",
      secondary: "text-muted-foreground",
      accent: "text-circleTel-orange",
      inverse: "text-white",
      success: "text-green-600",
      warning: "text-yellow-600",
      error: "text-red-600",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    }
  },
  defaultVariants: {
    variant: "body-medium",
    color: "primary",
    weight: "normal",
    align: "left",
  },
});

// Typography Semantic Styles
export const typographyStyles = {
  // Page Headings
  pageTitle: "scroll-m-20 text-4xl font-bold tracking-tight font-inter lg:text-5xl",
  sectionTitle: "scroll-m-20 text-2xl font-bold tracking-tight font-inter lg:text-3xl",
  subsectionTitle: "scroll-m-20 text-xl font-semibold tracking-tight font-inter lg:text-2xl",

  // Content
  heroText: "text-lg leading-relaxed font-inter text-muted-foreground lg:text-xl",
  bodyText: "text-base leading-normal font-inter",
  supportingText: "text-sm leading-normal font-inter text-muted-foreground",

  // UI Components
  buttonText: "text-sm font-medium font-inter",
  inputLabel: "text-sm font-medium font-inter",
  helperText: "text-xs text-muted-foreground font-inter",
  errorText: "text-xs text-red-600 font-inter",

  // Navigation
  navLink: "text-sm font-medium font-inter transition-colors hover:text-circleTel-orange",
  breadcrumb: "text-sm text-muted-foreground font-inter",

  // Cards & Components
  cardTitle: "text-lg font-semibold font-inter",
  cardDescription: "text-sm text-muted-foreground font-inter",
  cardLabel: "text-xs font-semibold font-inter uppercase tracking-wide text-circleTel-orange",

  // Code
  codeBlock: "text-sm font-space-mono bg-muted p-2 rounded-md",
  inlineCode: "text-sm font-space-mono bg-muted px-1 py-0.5 rounded",
} as const;

// Typography Hierarchy for Semantic HTML
export const headingHierarchy = {
  h1: "scroll-m-20 text-4xl font-bold tracking-tight font-inter lg:text-5xl",
  h2: "scroll-m-20 text-2xl font-bold tracking-tight font-inter lg:text-3xl",
  h3: "scroll-m-20 text-xl font-semibold tracking-tight font-inter lg:text-2xl",
  h4: "scroll-m-20 text-lg font-semibold tracking-tight font-inter lg:text-xl",
  h5: "scroll-m-20 text-base font-semibold tracking-tight font-inter lg:text-lg",
  h6: "scroll-m-20 text-sm font-semibold tracking-tight font-inter lg:text-base",
} as const;

// Responsive Typography Utilities
export const responsiveText = {
  // Mobile-first responsive sizes
  "responsive-display": "text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-inter",
  "responsive-title": "text-2xl md:text-3xl lg:text-4xl font-bold font-inter",
  "responsive-heading": "text-xl md:text-2xl lg:text-3xl font-semibold font-inter",
  "responsive-subheading": "text-lg md:text-xl lg:text-2xl font-medium font-inter",
  "responsive-body": "text-sm md:text-base lg:text-lg font-inter",
} as const;

// Export combined typography system
export const typography = {
  variants: typographyVariants,
  styles: typographyStyles,
  hierarchy: headingHierarchy,
  responsive: responsiveText,
} as const;

export type TypographyVariant = keyof typeof typographyStyles;
export type TypographyHierarchy = keyof typeof headingHierarchy;