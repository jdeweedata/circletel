// components/sanity/blocks/index.ts
import { ComponentType } from 'react'
import { BlockType } from '@/lib/sanity/types'

// Existing blocks
import { HeroBlock } from './HeroBlock'
import { FeatureGridBlock } from './FeatureGridBlock'
import { PricingBlock } from './PricingBlock'
import { FAQBlock } from './FAQBlock'
import { ComparisonBlock } from './ComparisonBlock'
import { TestimonialBlock } from './TestimonialBlock'
import { ProductShowcaseBlock } from './ProductShowcaseBlock'

// New blocks
import { TextBlock } from './TextBlock'
import { ImageBlock } from './ImageBlock'
import { CtaBlock } from './CtaBlock'
import { FormBlock } from './FormBlock'
import { SeparatorBlock } from './SeparatorBlock'
import { GalleryBlock } from './GalleryBlock'
import { BundleGridBlock } from './BundleGridBlock'
import { TrustStripBlock } from './TrustStripBlock'
import { DualListBlock } from './DualListBlock'
import { WhatsAppQuoteBlock } from './WhatsAppQuoteBlock'

// Re-export all blocks
export { HeroBlock } from './HeroBlock'
export { FeatureGridBlock } from './FeatureGridBlock'
export { PricingBlock } from './PricingBlock'
export { FAQBlock } from './FAQBlock'
export { ComparisonBlock } from './ComparisonBlock'
export { TestimonialBlock } from './TestimonialBlock'
export { ProductShowcaseBlock } from './ProductShowcaseBlock'
export { TextBlock } from './TextBlock'
export { ImageBlock } from './ImageBlock'
export { CtaBlock } from './CtaBlock'
export { FormBlock } from './FormBlock'
export { SeparatorBlock } from './SeparatorBlock'
export { GalleryBlock } from './GalleryBlock'
export { BundleGridBlock } from './BundleGridBlock'
export { TrustStripBlock } from './TrustStripBlock'
export { DualListBlock } from './DualListBlock'
export { WhatsAppQuoteBlock } from './WhatsAppQuoteBlock'

// Block registry for BlockRenderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const blockRegistry: Record<BlockType, ComponentType<any>> = {
  // Existing blocks
  heroBlock: HeroBlock,
  featureGridBlock: FeatureGridBlock,
  pricingBlock: PricingBlock,
  faqBlock: FAQBlock,
  comparisonBlock: ComparisonBlock,
  testimonialBlock: TestimonialBlock,
  productShowcaseBlock: ProductShowcaseBlock,

  // New blocks
  textBlock: TextBlock,
  imageBlock: ImageBlock,
  ctaBlock: CtaBlock,
  formBlock: FormBlock,
  separatorBlock: SeparatorBlock,
  galleryBlock: GalleryBlock,
  bundleGridBlock: BundleGridBlock,
  trustStripBlock: TrustStripBlock,
  dualListBlock: DualListBlock,
  whatsappQuoteBlock: WhatsAppQuoteBlock,
}
