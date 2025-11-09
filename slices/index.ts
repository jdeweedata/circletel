/**
 * CircleTel Prismic Slices Index
 *
 * Export all Prismic slice components for use in SliceZone
 */

export { default as HeroWithCoverageChecker } from './HeroWithCoverageChecker';
export { default as HeroSimple } from './HeroSimple';
export { default as StatsGrid } from './StatsGrid';
export { default as ServiceGrid } from './ServiceGrid';
export { default as TestimonialCarousel } from './TestimonialCarousel';
export { default as PackageGrid } from './PackageGrid';
export { default as RichTextBlock } from './RichTextBlock';
export { default as CallToAction } from './CallToAction';
export { default as FeatureComparison } from './FeatureComparison';
export { default as ImageWithCaption } from './ImageWithCaption';

// Slice components object for SliceZone
export const components = {
  hero_with_coverage_checker: HeroWithCoverageChecker,
  hero_simple: HeroSimple,
  stats_grid: StatsGrid,
  service_grid: ServiceGrid,
  testimonial_carousel: TestimonialCarousel,
  package_grid: PackageGrid,
  rich_text_block: RichTextBlock,
  call_to_action: CallToAction,
  feature_comparison: FeatureComparison,
  image_with_caption: ImageWithCaption,
};
