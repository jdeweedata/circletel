/**
 * HeroSimple Slice
 *
 * Simple hero section with heading, subheading, CTA button, and background image.
 * Used for landing pages without the coverage checker.
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps, PrismicRichText } from '@prismicio/react';
import { PrismicNextImage, PrismicNextLink } from '@prismicio/next';

export type HeroSimpleSlice = SliceComponentProps<Content.HeroSimpleSlice>;

const HeroSimple = ({ slice }: HeroSimpleSlice): JSX.Element => {
  return (
    <section
      className="relative min-h-[500px] flex items-center justify-center overflow-hidden"
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {/* Background Image */}
      {slice.primary.background_image?.url && (
        <div className="absolute inset-0 z-0">
          <PrismicNextImage
            field={slice.primary.background_image}
            fill
            className="object-cover"
            priority
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        {/* Heading */}
        {slice.primary.heading && (
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            {slice.primary.heading}
          </h1>
        )}

        {/* Subheading */}
        {slice.primary.subheading && (
          <div className="text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto">
            <PrismicRichText field={slice.primary.subheading} />
          </div>
        )}

        {/* CTA Button */}
        {slice.primary.cta_link && (
          <PrismicNextLink
            field={slice.primary.cta_link}
            className="inline-block bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {slice.primary.cta_text || 'Learn More'}
          </PrismicNextLink>
        )}
      </div>
    </section>
  );
};

export default HeroSimple;
