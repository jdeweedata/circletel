import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";

/**
 * Props for `CaseStudy`.
 */
export type CaseStudyProps = SliceComponentProps<Content.CaseStudySlice>;

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
