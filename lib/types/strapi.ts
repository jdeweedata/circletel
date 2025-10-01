export interface StrapiResponse<T> {
  data: T
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiCollectionResponse<T> {
  data: T[]
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiEntity {
  id: number
  documentId: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  locale?: string
}

export interface StrapiMediaFormat {
  name: string
  hash: string
  ext: string
  mime: string
  width: number
  height: number
  size: number
  path?: string
  url: string
}

export interface StrapiMedia extends StrapiEntity {
  name: string
  alternativeText?: string
  caption?: string
  width: number
  height: number
  formats: {
    thumbnail?: StrapiMediaFormat
    small?: StrapiMediaFormat
    medium?: StrapiMediaFormat
    large?: StrapiMediaFormat
  }
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl?: string
  provider: string
  provider_metadata?: Record<string, unknown>
}

// Example content types - customize based on your needs
export interface BlogPost extends StrapiEntity {
  title: string
  content: string
  excerpt?: string
  slug: string
  featuredImage?: StrapiMedia
  author?: Author
  categories?: Category[]
  tags?: Tag[]
  seo?: SEOComponent
}

export interface Author extends StrapiEntity {
  name: string
  bio?: string
  avatar?: StrapiMedia
  email?: string
  social?: SocialLinks
}

export interface Category extends StrapiEntity {
  name: string
  slug: string
  description?: string
  color?: string
}

export interface Tag extends StrapiEntity {
  name: string
  slug: string
}

export interface Page extends StrapiEntity {
  title: string
  content: string
  slug: string
  featuredImage?: StrapiMedia
  seo?: SEOComponent
  blocks?: Record<string, unknown>[] // Dynamic zones
}

export interface Product extends StrapiEntity {
  name: string
  description: string
  price: number
  sku: string
  images?: StrapiMedia[]
  category?: Category
  specifications?: Record<string, unknown>
  inStock: boolean
}

// Components
export interface SEOComponent {
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  metaImage?: StrapiMedia
  preventIndexing?: boolean
}

export interface SocialLinks {
  twitter?: string
  linkedin?: string
  github?: string
  website?: string
}

// API Query types
export interface StrapiQuery {
  populate?: string | string[] | object
  fields?: string[]
  filters?: Record<string, unknown>
  sort?: string[]
  pagination?: {
    page?: number
    pageSize?: number
    start?: number
    limit?: number
  }
  locale?: string
  publicationState?: 'live' | 'preview'
}

// Marketing content types
export interface Promotion extends StrapiEntity {
  title: string
  slug: string
  shortDescription: string
  description?: string
  category: 'fibre' | 'wireless' | 'voip' | 'hosting' | 'devices' | 'mobile' | 'other'
  badge?: string
  price?: number
  originalPrice?: number
  currency: string
  ctaText: string
  ctaLink?: string
  featuredImage?: StrapiMedia
  backgroundImage?: StrapiMedia
  backgroundColor: string
  textColor: string
  featured: boolean
  priority: number
  startDate?: string
  endDate?: string
  metadata?: Record<string, unknown>
}

export interface HeroSection {
  id: number
  title: string
  subtitle?: string
  backgroundImage?: StrapiMedia
  backgroundColor: string
  textColor: string
  ctaText?: string
  ctaLink?: string
}

export interface PromoGridSection {
  id: number
  title?: string
  columns: number
  showFilter: boolean
  filterCategories?: string[]
}

export interface FeatureItem {
  id: number
  title: string
  description?: string
  icon?: string
}

export interface FeatureListSection {
  id: number
  title?: string
  features: FeatureItem[]
}

export interface TextContentSection {
  id: number
  title?: string
  content: string
  alignment: 'left' | 'center' | 'right'
}

export interface CTABannerSection {
  id: number
  title: string
  description?: string
  ctaText: string
  ctaLink: string
  backgroundColor: string
  backgroundImage?: StrapiMedia
}

export interface ImageTextSection {
  id: number
  title?: string
  content?: string
  image: StrapiMedia
  imagePosition: 'left' | 'right'
  ctaText?: string
  ctaLink?: string
}

export type MarketingPageSection =
  | { __component: 'sections.promo-grid' } & PromoGridSection
  | { __component: 'sections.feature-list' } & FeatureListSection
  | { __component: 'sections.text-content' } & TextContentSection
  | { __component: 'sections.cta-banner' } & CTABannerSection
  | { __component: 'sections.image-text' } & ImageTextSection

export interface MarketingPage extends StrapiEntity {
  title: string
  slug: string
  metaTitle?: string
  metaDescription?: string
  hero?: HeroSection
  sections?: MarketingPageSection[]
  promotions?: Promotion[]
  published: boolean
}

export interface Campaign extends StrapiEntity {
  name: string
  slug: string
  description?: string
  type: 'seasonal' | 'product-launch' | 'flash-sale' | 'bundle' | 'referral' | 'other'
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
  promotions?: Promotion[]
  marketingPages?: MarketingPage[]
  startDate: string
  endDate: string
  budget?: number
  targetAudience?: string
  trackingCode?: string
  analytics?: Record<string, unknown>
}

// Product Package System
export interface TechnicalSpec {
  id: number
  label: string
  value: string
  unit?: string
  highlighted?: boolean
}

export interface PackageTier {
  id: number
  name: string
  description?: string
  price: number
  originalPrice?: number
  currency: string
  billingCycle: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  features: string[]
  highlighted?: boolean
  badge?: string
  ctaText: string
  ctaLink?: string
  sortOrder: number
}

export interface ProductPackage extends StrapiEntity {
  name: string
  slug: string
  category: 'fibre' | 'wireless' | 'voip' | 'devices' | 'hosting' | 'mobile' | 'other'
  shortDescription: string
  description?: string
  featuredImage?: StrapiMedia
  backgroundImage?: StrapiMedia
  tiers?: PackageTier[]
  technicalSpecs?: TechnicalSpec[]
  inStock: boolean
  featured: boolean
  priority: number
  metadata?: Record<string, unknown>
}

export interface FAQItem {
  id: number
  question: string
  answer: string
  category?: string
}

export interface FAQSection {
  id: number
  title?: string
  faqs: FAQItem[]
}

export interface HowItWorksStep {
  id: number
  stepNumber: number
  title: string
  description: string
  icon?: string
  image?: StrapiMedia
}

export interface HowItWorksSection {
  id: number
  title?: string
  subtitle?: string
  steps: HowItWorksStep[]
}

export interface PricingTableColumn {
  id: number
  title: string
  price?: number
  currency?: string
  billingCycle?: string
  features: string[]
  highlighted?: boolean
  ctaText?: string
  ctaLink?: string
}

export interface PricingTableSection {
  id: number
  title?: string
  description?: string
  columns: PricingTableColumn[]
}

export interface SpecGridItem {
  id: number
  icon?: string
  label: string
  value: string
}

export interface SpecGridSection {
  id: number
  title?: string
  items: SpecGridItem[]
  columns: number
}

export interface TestimonialItem {
  id: number
  customerName: string
  customerAvatar?: StrapiMedia
  rating?: number
  content: string
  date?: string
}

export interface TestimonialsSection {
  id: number
  title?: string
  testimonials: TestimonialItem[]
  layout: 'carousel' | 'grid'
}

// Extended page sections
export type ServicePageSection =
  | { __component: 'sections.hero' } & HeroSection
  | { __component: 'sections.promo-grid' } & PromoGridSection
  | { __component: 'sections.feature-list' } & FeatureListSection
  | { __component: 'sections.text-content' } & TextContentSection
  | { __component: 'sections.cta-banner' } & CTABannerSection
  | { __component: 'sections.image-text' } & ImageTextSection
  | { __component: 'sections.faq' } & FAQSection
  | { __component: 'sections.how-it-works' } & HowItWorksSection
  | { __component: 'sections.pricing-table' } & PricingTableSection
  | { __component: 'sections.spec-grid' } & SpecGridSection
  | { __component: 'sections.testimonials' } & TestimonialsSection

export interface ServicePage extends StrapiEntity {
  title: string
  slug: string
  category: 'fibre' | 'wireless' | 'voip' | 'devices' | 'hosting' | 'mobile' | 'other'
  metaTitle?: string
  metaDescription?: string
  hero?: HeroSection
  sections?: ServicePageSection[]
  packages?: ProductPackage[]
  published: boolean
}

export type StrapiCollectionName =
  | 'blog-posts'
  | 'pages'
  | 'authors'
  | 'categories'
  | 'tags'
  | 'products'
  | 'promotions'
  | 'marketing-pages'
  | 'campaigns'
  | 'product-packages'
  | 'service-pages'