import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { PrismicNextLink } from "@prismicio/next";

/**
 * Props for `PricingTable`.
 */
export type PricingTableProps = SliceComponentProps<Content.PricingTableSlice>;

/**
 * Component for "PricingTable" Slices.
 */
const PricingTable = ({ slice }: PricingTableProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 px-4 bg-circleTel-lightNeutral"
    >
      <div className="max-w-7xl mx-auto">
        {/* Title Section */}
        <div className="text-center mb-12">
          <PrismicRichText
            field={slice.primary.title}
            components={{
              heading1: ({ children }) => (
                <h1 className="text-4xl md:text-5xl font-extrabold text-circleTel-darkNeutral mb-4">
                  {children}
                </h1>
              ),
              heading2: ({ children }) => (
                <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                  {children}
                </h2>
              ),
              paragraph: ({ children }) => (
                <p className="text-xl font-semibold text-circleTel-darkNeutral mb-4">
                  {children}
                </p>
              ),
            }}
          />

          <PrismicRichText
            field={slice.primary.subtitle}
            components={{
              paragraph: ({ children }) => (
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {children}
                </p>
              ),
            }}
          />
        </div>

        {/* Pricing Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {slice.items.map((tier, index) => (
            <div
              key={index}
              className={`
                relative rounded-lg overflow-hidden transition-all duration-300
                ${
                  tier.is_featured
                    ? "bg-gradient-to-br from-circleTel-orange to-orange-600 text-white shadow-2xl transform scale-105 border-4 border-circleTel-orange"
                    : "bg-white text-circleTel-darkNeutral shadow-lg hover:shadow-xl border border-gray-200"
                }
              `}
            >
              {/* Featured Badge */}
              {tier.is_featured && (
                <div className="absolute top-0 right-0 bg-white text-circleTel-orange px-4 py-1 text-sm font-bold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Tier Name */}
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    tier.is_featured ? "text-white" : "text-circleTel-darkNeutral"
                  }`}
                >
                  {tier.tier_name}
                </h3>

                {/* Description */}
                {tier.description && (
                  <p
                    className={`text-sm mb-6 ${
                      tier.is_featured ? "text-white/90" : "text-gray-600"
                    }`}
                  >
                    {tier.description}
                  </p>
                )}

                {/* Price */}
                <div className="mb-6">
                  <p
                    className={`text-4xl font-extrabold ${
                      tier.is_featured ? "text-white" : "text-circleTel-orange"
                    }`}
                  >
                    {tier.price}
                  </p>
                </div>

                {/* Features List */}
                <div className="mb-8">
                  <PrismicRichText
                    field={tier.features}
                    components={{
                      listItem: ({ children }) => (
                        <li
                          className={`flex items-start mb-3 ${
                            tier.is_featured ? "text-white" : "text-gray-700"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${
                              tier.is_featured ? "text-white" : "text-green-500"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm">{children}</span>
                        </li>
                      ),
                      oListItem: ({ children }) => (
                        <li
                          className={`flex items-start mb-3 ${
                            tier.is_featured ? "text-white" : "text-gray-700"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${
                              tier.is_featured ? "text-white" : "text-green-500"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm">{children}</span>
                        </li>
                      ),
                      list: ({ children }) => (
                        <ul className="space-y-0">{children}</ul>
                      ),
                      oList: ({ children }) => (
                        <ol className="space-y-0">{children}</ol>
                      ),
                    }}
                  />
                </div>

                {/* CTA Button */}
                <PrismicNextLink
                  field={tier.cta_button_link}
                  className={`
                    block w-full text-center py-3 px-6 rounded-lg font-bold text-lg
                    transition-all duration-200 transform hover:scale-105
                    ${
                      tier.is_featured
                        ? "bg-white text-circleTel-orange hover:bg-gray-100"
                        : "bg-circleTel-orange text-white hover:bg-orange-600"
                    }
                  `}
                >
                  {tier.cta_button_text || "Get Started"}
                </PrismicNextLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingTable;
