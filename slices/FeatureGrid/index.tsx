import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";

/**
 * Props for `FeatureGrid`.
 */
export type FeatureGridProps = SliceComponentProps<Content.FeatureGridSlice>;

/**
 * Component for "FeatureGrid" Slices.
 *
 * Responsive feature grid with icons, titles, and descriptions.
 * Styled with CircleTel branding (orange accents #F5831F).
 */
const FeatureGrid: FC<FeatureGridProps> = ({ slice }) => {
  const { section_title, features } = slice.primary;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-20 bg-white"
    >
      <div className="container mx-auto px-4">
        {/* Section Title */}
        {section_title && (
          <div className="text-center mb-16">
            <PrismicRichText
              field={section_title}
              components={{
                heading2: ({ children }) => (
                  <h2 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
                    {children}
                  </h2>
                ),
                heading3: ({ children }) => (
                  <h3 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                    {children}
                  </h3>
                ),
                paragraph: ({ children }) => (
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    {children}
                  </p>
                ),
              }}
            />
          </div>
        )}

        {/* Features Grid */}
        {features && features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-xl bg-circleTel-lightNeutral hover:bg-white hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-circleTel-orange"
              >
                {/* Icon */}
                {feature.icon && feature.icon.url && (
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-circleTel-orange/10 p-4 group-hover:scale-110 transition-transform duration-300">
                      <PrismicNextImage
                        field={feature.icon}
                        fill
                        className="object-contain"
                        alt={feature.icon.alt || ""}
                      />
                    </div>
                  </div>
                )}

                {/* Title */}
                {feature.title && (
                  <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4 text-center group-hover:text-circleTel-orange transition-colors duration-300">
                    {feature.title}
                  </h3>
                )}

                {/* Description */}
                {feature.description && (
                  <div className="text-gray-600 text-center">
                    <PrismicRichText
                      field={feature.description}
                      components={{
                        paragraph: ({ children }) => (
                          <p className="leading-relaxed">{children}</p>
                        ),
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeatureGrid;
