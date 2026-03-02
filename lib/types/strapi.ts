/**
 * Strapi/CMS Type Definitions
 * Types for product page components (FAQ, Pricing, Specs, etc.)
 * These were originally from Strapi CMS but now used with Prismic/internal CMS
 */

// FAQ Section Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FAQSection {
  title?: string;
  faqs: FAQ[];
}

// Package/Pricing Types
export interface PackageTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  billingCycle: 'monthly' | 'annually' | 'once-off';
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface PricingTableColumn {
  title: string;
  price?: number;
  currency?: string;
  billingCycle?: string;
  period?: string;
  highlighted?: boolean;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  features?: string[];
}

export interface PricingTableSection {
  title?: string;
  subtitle?: string;
  description?: string;
  tiers?: PackageTier[];
  columns?: PricingTableColumn[];
  showComparison?: boolean;
}

// Spec Grid Types
export interface Spec {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

export interface SpecGridSection {
  title?: string;
  specs?: Spec[];
  items?: Spec[];
  columns?: number;
}

// Image type for steps
export interface StepImage {
  url: string;
  alternativeText?: string;
}

// How It Works Types
export interface Step {
  id: string;
  number?: number;
  stepNumber?: number;
  title: string;
  description: string;
  icon?: string;
  image?: StepImage;
}

export interface HowItWorksSection {
  title?: string;
  subtitle?: string;
  steps: Step[];
}

// Generic Section Types
export interface Section {
  __component: string;
  id: string;
}

// Promotion Types
export interface Promotion {
  id: number;
  documentId: string;
  title: string;
  shortDescription: string;
  description: string;
  category: 'mobile' | 'fibre' | 'wireless' | 'devices' | 'voip' | 'hosting' | string;
  badge: string;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  ctaText: string;
  ctaLink: string;
  backgroundColor: string;
  textColor: string;
  imageUrl: string;
  featured: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Re-export for backward compatibility
export type { HowItWorksSection as HowItWorksSectionType };
