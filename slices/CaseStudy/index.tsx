import * as prismic from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";

/**
 * Local type definition for CaseStudy slice (not yet in generated types)
 */
interface CaseStudySlice {
  slice_type: "case_study";
  slice_label: string | null;
  variation: string;
  version: string;
  primary: {
    title?: prismic.KeyTextField;
    quote?: prismic.RichTextField;
    author?: prismic.KeyTextField;
    company?: prismic.KeyTextField;
    background_color?: prismic.KeyTextField;
    [key: string]: unknown;
  };
  items: never[];
}

/**
 * Props for `CaseStudy`.
 */
export interface CaseStudyProps {
  slice: CaseStudySlice;
  index: number;
  slices: CaseStudySlice[];
  context: unknown;
}

const backgroundStyleMap = {
  white: "bg-white p-4 rounded-lg",
  "light-gray": "bg-circleTel-lightNeutral p-6 rounded-lg",
  "orange-border": "bg-white border-2 border-circleTel-orange p-4 rounded-lg",
};

/**
 * Component for "CaseStudy" Slices.
 */
const CaseStudy = ({ slice }: CaseStudyProps): JSX.Element => {
  const backgroundClass = backgroundStyleMap[slice.primary.background_color as keyof typeof backgroundStyleMap] || backgroundStyleMap.white;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-8"
    >
      <div className={backgroundClass}>
        {slice.primary.title && (
          <h4 className="font-bold mb-2 text-circleTel-darkNeutral">
            {slice.primary.title}
          </h4>
        )}

        {slice.primary.quote && (
          <div className="text-sm italic mb-3 text-circleTel-secondaryNeutral">
            <PrismicRichText field={slice.primary.quote} />
          </div>
        )}

        {(slice.primary.author || slice.primary.company) && (
          <p className="text-sm font-bold text-circleTel-darkNeutral">
            {slice.primary.author && `- ${slice.primary.author}`}
            {slice.primary.author && slice.primary.company && ", "}
            {slice.primary.company}
          </p>
        )}
      </div>
    </section>
  );
};

export default CaseStudy;
