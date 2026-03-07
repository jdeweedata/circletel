// lib/sanity/schemas/index.ts

// Document types
import homepage from './documents/homepage'
import page from './documents/page'
import productPage from './documents/productPage'
import servicePage from './documents/servicePage'
import resourcePage from './documents/resourcePage'
import testimonial from './documents/testimonial'
import siteSettings from './documents/siteSettings'

// New document types
import post from './documents/post'
import teamMember from './documents/teamMember'
import campaign from './documents/campaign'
import resource from './documents/resource'
import category from './documents/category'

// Block types
import heroBlock from './blocks/heroBlock'
import featureGridBlock from './blocks/featureGridBlock'
import pricingBlock from './blocks/pricingBlock'
import faqBlock from './blocks/faqBlock'
import comparisonBlock from './blocks/comparisonBlock'
import testimonialBlock from './blocks/testimonialBlock'
import productShowcaseBlock from './blocks/productShowcaseBlock'

// New block types
import textBlock from './blocks/textBlock'
import imageBlock from './blocks/imageBlock'
import ctaBlock from './blocks/ctaBlock'
import formBlock from './blocks/formBlock'
import separatorBlock from './blocks/separatorBlock'
import galleryBlock from './blocks/galleryBlock'

// Object types
import seo from './objects/seo'
import cta from './objects/cta'
import portableText from './objects/portableText'
import link from './objects/link'

export const schemaTypes = [
  // Documents
  homepage,
  page,
  productPage,
  servicePage,
  resourcePage,
  testimonial,
  siteSettings,
  post,
  teamMember,
  campaign,
  resource,
  category,

  // Blocks
  heroBlock,
  featureGridBlock,
  pricingBlock,
  faqBlock,
  comparisonBlock,
  testimonialBlock,
  productShowcaseBlock,
  textBlock,
  imageBlock,
  ctaBlock,
  formBlock,
  separatorBlock,
  galleryBlock,

  // Objects
  seo,
  cta,
  portableText,
  link,
]
