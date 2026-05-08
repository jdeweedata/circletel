export type BlockType =
  | 'heroBlock'
  | 'featureGridBlock'
  | 'pricingBlock'
  | 'faqBlock'
  | 'comparisonBlock'
  | 'testimonialBlock'
  | 'productShowcaseBlock'
  | 'textBlock'
  | 'imageBlock'
  | 'ctaBlock'
  | 'formBlock'
  | 'separatorBlock'
  | 'galleryBlock'
  | 'bundleGridBlock'
  | 'trustStripBlock'
  | 'dualListBlock'
  | 'whatsappQuoteBlock'

export interface BlockCommonFields {
  _key: string
  _type: BlockType
  anchorId?: string
  theme?: 'default' | 'light' | 'dark' | 'brand'
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hideOn?: 'none' | 'mobile' | 'desktop'
}

export type ContentSection = BlockCommonFields & Record<string, unknown>

export interface ProductPricing {
  startingPrice?: number
  priceNote?: string
  showContactForPricing?: boolean
}

export interface KeyFeature {
  _key: string
  title: string
  description: string
  icon?: string
}

export interface Specification {
  _key: string
  label: string
  value: string
}

export interface SeoFields {
  metaTitle?: string
  metaDescription?: string
}

export interface ProductData {
  _id: string
  name: string
  slug: string
  category: 'consumer' | 'business' | 'soho' | 'enterprise'
  tagline?: string
  description?: unknown
  heroImage?: string | null
  pricing?: ProductPricing
  keyFeatures?: KeyFeature[]
  specifications?: Specification[]
  seo?: SeoFields
  blocks?: ContentSection[]
  relatedProducts?: RelatedProduct[]
}

export interface RelatedProduct {
  _id: string
  name: string
  slug: string
  tagline?: string
  heroImage?: string | null
  pricing?: ProductPricing
}

export interface ServiceData {
  _id: string
  name: string
  slug: string
  category?: string
  tagline?: string
  description?: unknown
  heroImage?: string | null
  pricing?: ProductPricing
  keyFeatures?: KeyFeature[]
  specifications?: Specification[]
  seo?: SeoFields
  blocks?: ContentSection[]
  benefits?: KeyFeature[]
}

export interface SiteSettings {
  siteName: string
  tagline: string
  contactInfo: {
    email: string
    phone: string
    address: string
    supportHours: string
  }
  defaultSeo: SeoFields
  socialLinks: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  footerCta: {
    headline: string
    description: string
    cta: {
      label: string
      url: string
      style: string
      openInNewTab?: boolean
    }
  }
}
