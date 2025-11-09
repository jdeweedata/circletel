/**
 * ServiceGrid Slice
 *
 * Display services in a grid format with icons, titles, and descriptions.
 * Can be used to wrap ServicesSnapshot component or standalone.
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps, PrismicRichText } from '@prismicio/react';
import { PrismicNextLink, PrismicNextImage } from '@prismicio/next';

export type ServiceGridSlice = SliceComponentProps<Content.ServiceGridSlice>;

const ServiceGrid = ({ slice }: ServiceGridSlice): JSX.Element => {
  return (
    <section
      className="py-16 md:py-24 bg-circleTel-lightNeutral"
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        {slice.primary.heading && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
              {slice.primary.heading}
            </h2>
            {slice.primary.subheading && (
              <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
                {slice.primary.subheading}
              </p>
            )}
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {slice.items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {/* Service Icon/Image */}
              {item.icon?.url && (
                <div className="mb-4">
                  <PrismicNextImage
                    field={item.icon}
                    width={64}
                    height={64}
                    className="mx-auto"
                  />
                </div>
              )}

              {/* Service Title */}
              <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-3 text-center">
                {item.title}
              </h3>

              {/* Service Description */}
              {item.description && (
                <div className="text-circleTel-secondaryNeutral mb-4 text-center">
                  <PrismicRichText field={item.description} />
                </div>
              )}

              {/* CTA Link (optional) */}
              {item.link && (
                <div className="text-center mt-4">
                  <PrismicNextLink
                    field={item.link}
                    className="inline-block text-circleTel-orange hover:text-circleTel-orange/80 font-semibold transition-colors"
                  >
                    {item.link_text || 'Learn More'} →
                  </PrismicNextLink>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceGrid;
