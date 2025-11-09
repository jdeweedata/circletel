/**
 * CallToAction Slice
 * CTA banner with gradient background
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import { PrismicNextLink } from '@prismicio/next';

export type CallToActionSlice = SliceComponentProps<Content.CallToActionSlice>;

const CallToAction = ({ slice }: CallToActionSlice): JSX.Element => {
  return (
    <section className="py-16 md:py-24" data-slice-type={slice.slice_type}>
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-circleTel-orange to-circleTel-orange/80 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
          {slice.primary.heading && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {slice.primary.heading}
            </h2>
          )}
          {slice.primary.description && (
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
              {slice.primary.description}
            </p>
          )}
          {slice.primary.cta_link && (
            <PrismicNextLink
              field={slice.primary.cta_link}
              className="inline-block bg-white text-circleTel-orange px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {slice.primary.cta_text || 'Get Started'}
            </PrismicNextLink>
          )}
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
