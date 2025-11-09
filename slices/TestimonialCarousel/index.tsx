/**
 * TestimonialCarousel Slice
 *
 * Display customer testimonials in a carousel format.
 * Can wrap existing SuccessStories component or display standalone.
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';

export type TestimonialCarouselSlice = SliceComponentProps<Content.TestimonialCarouselSlice>;

const TestimonialCarousel = ({ slice }: TestimonialCarouselSlice): JSX.Element => {
  return (
    <section
      className="py-16 md:py-24 bg-white"
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

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {slice.items.map((item, index) => (
            <div
              key={index}
              className="bg-circleTel-lightNeutral rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              {/* Quote Icon */}
              <div className="text-4xl text-circleTel-orange mb-4">"</div>

              {/* Testimonial Text */}
              <p className="text-circleTel-darkNeutral mb-6 italic leading-relaxed">
                {item.quote}
              </p>

              {/* Author Info */}
              <div className="flex items-center">
                {item.author_photo?.url && (
                  <PrismicNextImage
                    field={item.author_photo}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                )}
                <div>
                  <div className="font-semibold text-circleTel-darkNeutral">
                    {item.author_name}
                  </div>
                  {item.author_title && (
                    <div className="text-sm text-circleTel-secondaryNeutral">
                      {item.author_title}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating (optional) */}
              {item.rating && (
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${
                        i < parseInt(item.rating || '0')
                          ? 'text-circleTel-orange'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
