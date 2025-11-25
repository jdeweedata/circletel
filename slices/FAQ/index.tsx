import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Props for `FAQ`.
 */
export type FAQProps = SliceComponentProps<Content.FaqSlice>;

/**
 * Component for "FAQ" Slices.
 */
const FAQ = ({ slice }: FAQProps): JSX.Element => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="bg-circleTel-lightNeutral py-16"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {slice.primary.section_title && (
            <div className="text-center mb-12">
              <PrismicRichText
                field={slice.primary.section_title}
                components={{
                  heading2: ({ children }) => (
                    <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
                      {children}
                    </h2>
                  ),
                }}
              />
              {slice.primary.section_description && (
                <div className="text-lg text-circleTel-secondaryNeutral">
                  <PrismicRichText field={slice.primary.section_description} />
                </div>
              )}
            </div>
          )}

          <Accordion type="single" collapsible className="w-full">
            {slice.items.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <PrismicRichText field={item.answer} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
