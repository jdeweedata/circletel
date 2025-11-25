import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrismicNextLink } from "@prismicio/next";

/**
 * Props for `Recipe`.
 */
export type RecipeProps = SliceComponentProps<Content.RecipeSlice>;

const badgeColorMap = {
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
};

const backgroundColorMap = {
  white: "",
  "light-gray": "bg-circleTel-lightNeutral p-8 rounded-lg",
  "orange-tint": "bg-orange-50 p-8 rounded-lg",
};

/**
 * Component for "Recipe" Slices.
 */
const Recipe = ({ slice }: RecipeProps): JSX.Element => {
  const badgeColorClass = badgeColorMap[slice.primary.badge_color as keyof typeof badgeColorMap] || badgeColorMap.blue;
  const backgroundClass = backgroundColorMap[slice.primary.background_color as keyof typeof backgroundColorMap] || "";

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-8"
    >
      <div className={backgroundClass}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Recipe Details */}
          <div>
            {slice.primary.badge_text && (
              <Badge className={`${badgeColorClass} mb-4`}>
                {slice.primary.badge_text}
              </Badge>
            )}

            <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">
              {slice.primary.title}
            </h3>

            <div className="text-circleTel-secondaryNeutral mb-6">
              <PrismicRichText field={slice.primary.description} />
            </div>

            {/* Ingredients */}
            <div className="mb-6">
              <h4 className="font-bold text-circleTel-darkNeutral mb-3">
                {slice.primary.ingredients_title || "Ingredients:"}
              </h4>
              <div className="space-y-2">
                <PrismicRichText
                  field={slice.primary.ingredients}
                  components={{
                    listItem: ({ children }) => (
                      <li className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{children}</span>
                      </li>
                    ),
                  }}
                />
              </div>
            </div>

            {/* Price */}
            {slice.primary.price && (
              <div className="text-2xl font-bold text-circleTel-orange mb-4">
                {slice.primary.price}
              </div>
            )}

            {/* CTA Button */}
            {slice.primary.cta_text && slice.primary.cta_link && (
              <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                <PrismicNextLink field={slice.primary.cta_link}>
                  {slice.primary.cta_text}
                </PrismicNextLink>
              </Button>
            )}
          </div>

          {/* Testimonial Card */}
          {slice.primary.testimonial_quote && (
            <Card>
              <CardContent className="p-6">
                <blockquote className="italic text-circleTel-secondaryNeutral mb-4">
                  <PrismicRichText field={slice.primary.testimonial_quote} />
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-circleTel-orange text-white rounded-full flex items-center justify-center font-bold mr-4">
                    {slice.primary.testimonial_initials || "CT"}
                  </div>
                  <div>
                    {slice.primary.testimonial_author && (
                      <div className="font-bold text-circleTel-darkNeutral">
                        {slice.primary.testimonial_author}
                      </div>
                    )}
                    {slice.primary.testimonial_company && (
                      <div className="text-sm text-circleTel-secondaryNeutral">
                        {slice.primary.testimonial_company}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default Recipe;
