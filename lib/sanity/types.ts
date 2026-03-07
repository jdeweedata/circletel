// lib/sanity/types.ts
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

export interface BlockCommonFields {
  _key: string
  _type: BlockType
  anchorId?: string
  theme?: 'default' | 'light' | 'dark' | 'brand'
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hideOn?: 'none' | 'mobile' | 'desktop'
}

export type SanitySection = BlockCommonFields & Record<string, unknown>
