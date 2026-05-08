'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  _key: string;
  question: string;
  answer: string;
}

interface FAQBlockProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
  defaultOpen?: string;
}

export function FAQBlock({
  title,
  subtitle,
  items,
  defaultOpen,
}: FAQBlockProps) {
  return (
    <section className="py-16 md:py-20 bg-circleTel-grey200">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="font-heading text-display-2 text-circleTel-navy mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="font-body text-lg text-circleTel-grey600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion
            type="single"
            collapsible
            defaultValue={defaultOpen || items?.[0]?._key}
            className="space-y-4"
          >
            {items?.map((item) => (
              <AccordionItem
                key={item._key}
                value={item._key}
                className="bg-white rounded-xl px-6 shadow-sm border-none"
              >
                <AccordionTrigger className="font-heading text-left text-base md:text-lg font-semibold text-circleTel-navy hover:no-underline py-5 [&[data-state=open]>svg]:text-circleTel-orange">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm md:text-base text-circleTel-navy/80 pb-5 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
