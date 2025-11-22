import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  heading?: string
  items: FAQItem[]
}

export function FAQSection({ heading = "Frequently Asked Questions", items }: FAQSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-circleTel-darkNeutral mb-12">
          {heading}
        </h2>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full">
            {items?.map((item, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-circleTel-orange">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

      </div>
    </section>
  )
}
