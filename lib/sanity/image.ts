import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from './client';

// Type for Sanity image source
type SanityImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>['image']>[0];

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Helper to generate responsive image URLs
export function getImageDimensions(source: SanityImageSource) {
  if (!source || typeof source !== 'object') return null;

  const asset = 'asset' in source ? source.asset : source;
  if (!asset || typeof asset !== 'object') return null;

  const ref = '_ref' in asset ? asset._ref : null;
  if (!ref || typeof ref !== 'string') return null;

  // Parse dimensions from asset reference (e.g., "image-abc123-1200x800-jpg")
  const dimensions = ref.split('-')[2];
  if (!dimensions) return null;

  const [width, height] = dimensions.split('x').map(Number);
  return { width, height, aspectRatio: width / height };
}

// Generate srcSet for responsive images
export function getSrcSet(source: SanityImageSource, widths: number[] = [320, 640, 960, 1280, 1600]) {
  return widths
    .map((width) => `${urlFor(source).width(width).url()} ${width}w`)
    .join(', ');
}
