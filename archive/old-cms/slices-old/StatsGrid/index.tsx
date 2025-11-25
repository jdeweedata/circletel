/**
 * StatsGrid Slice
 *
 * Displays statistics/achievements in a grid format.
 * Can be used to wrap ValueProposition component or standalone.
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';

export type StatsGridSlice = SliceComponentProps<Content.StatsGridSlice>;

const StatsGrid = ({ slice }: StatsGridSlice): JSX.Element => {
  return (
    <section
      className="py-16 md:py-24 bg-white"
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div className="container mx-auto px-4">
        {/* Section Heading (Optional) */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {slice.items.map((item, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-lg border border-circleTel-lightNeutral hover:border-circleTel-orange transition-all duration-300 hover:shadow-lg"
            >
              {/* Icon (optional) */}
              {item.icon && (
                <div className="text-4xl mb-4">{item.icon}</div>
              )}

              {/* Stat Value */}
              <div className="text-4xl md:text-5xl font-bold text-circleTel-orange mb-2">
                {item.value}
              </div>

              {/* Stat Label */}
              <div className="text-lg font-semibold text-circleTel-darkNeutral mb-2">
                {item.label}
              </div>

              {/* Description (optional) */}
              {item.description && (
                <p className="text-sm text-circleTel-secondaryNeutral">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsGrid;
