import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, PrismicLink, SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";

/**
 * Props for `HeroSection`.
 */
export type HeroSectionProps = SliceComponentProps<Content.HeroSectionSlice>;

/**
 * Component for "HeroSection" Slices.
 *
 * Hero section with headline, subheadline, CTA button, and background image.
 * Styled with CircleTel branding (orange #F5831F, dark neutral #1F2937).
 */
const HeroSection: FC<HeroSectionProps> = ({ slice }) => {
  const { headline, subheadline, cta_button_text, cta_button_link, background_image } = slice.primary;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      {background_image.url && (
        <div className="absolute inset-0 z-0">
          <PrismicNextImage
            field={background_image}
            fill
            className="object-cover"
            priority
            alt=""
          />
          <div className="absolute inset-0 bg-circleTel-darkNeutral/70" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Headline */}
        {headline && (
          <div className="mb-6 text-white">
            <PrismicRichText
              field={headline}
              components={{
                heading1: ({ children }) => (
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                    {children}
                  </h1>
                ),
                heading2: ({ children }) => (
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    {children}
                  </h2>
                ),
                paragraph: ({ children }) => (
                  <p className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                    {children}
                  </p>
                ),
              }}
            />
          </div>
        )}

        {/* Subheadline */}
        {subheadline && (
          <div className="mb-8 text-circleTel-lightNeutral max-w-3xl mx-auto">
            <PrismicRichText
              field={subheadline}
              components={{
                paragraph: ({ children }) => (
                  <p className="text-xl md:text-2xl font-normal leading-relaxed">
                    {children}
                  </p>
                ),
              }}
            />
          </div>
        )}

        {/* CTA Button */}
        {cta_button_text && cta_button_link && (
          <div className="mt-10">
            <PrismicLink
              field={cta_button_link}
              className="inline-block bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold text-lg px-10 py-4 rounded-lg shadow-lg shadow-circleTel-orange/50 hover:shadow-xl hover:shadow-circleTel-orange/60 transition-all duration-300 transform hover:scale-105"
            >
              {cta_button_text}
            </PrismicLink>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
