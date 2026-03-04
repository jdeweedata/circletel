// Document types
import homepage from './homepage';
import page from './page';
import productPage from './productPage';
import servicePage from './servicePage';
import resourcePage from './resourcePage';
import testimonial from './testimonial';
import siteSettings from './siteSettings';

// Block types (page sections)
import heroBlock from './blocks/heroBlock';
import featureGridBlock from './blocks/featureGridBlock';
import pricingBlock from './blocks/pricingBlock';
import faqBlock from './blocks/faqBlock';
import comparisonBlock from './blocks/comparisonBlock';
import testimonialBlock from './blocks/testimonialBlock';
import productShowcaseBlock from './blocks/productShowcaseBlock';

// Object types (reusable fields)
import seo from './objects/seo';
import cta from './objects/cta';
import portableText from './objects/portableText';

export const schemaTypes = [
  // Documents
  homepage,
  page,
  productPage,
  servicePage,
  resourcePage,
  testimonial,
  siteSettings,

  // Blocks
  heroBlock,
  featureGridBlock,
  pricingBlock,
  faqBlock,
  comparisonBlock,
  testimonialBlock,
  productShowcaseBlock,

  // Objects
  seo,
  cta,
  portableText,
];
