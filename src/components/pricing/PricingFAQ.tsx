
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const PricingFAQ = () => {
  const faqs = [
    {
      question: "What's included in each recipe?",
      answer: "Each recipe includes a specific set of IT services designed for different business sizes and needs. The basic components include helpdesk support, monitoring, and security with additional services added as you move up tiers. You can see the full breakdown in our comparison table above."
    },
    {
      question: "Are there any setup fees?",
      answer: "We keep our pricing transparent with no hidden fees. For most standard deployments, there are no additional setup fees. For complex migrations or specialized configurations, our team will provide a custom quote before any work begins."
    },
    {
      question: "Can I change my plan later?",
      answer: "Absolutely! We understand that business needs change. You can upgrade or downgrade your plan at any time. Our flexible approach ensures you only pay for what you need as your business evolves."
    },
    {
      question: "Do you offer discounts for annual payment?",
      answer: "Yes, we offer a 10% discount for clients who choose to pay annually rather than monthly. This can lead to significant savings over the course of a year."
    },
    {
      question: "How many support tickets can I submit?",
      answer: "All plans include unlimited support tickets. We believe in providing comprehensive support without creating artificial limits that could impact your business operations."
    },
    {
      question: "What if I need more devices than my plan includes?",
      answer: "Additional devices can be added to any plan for a per-device fee. The exact cost varies by plan level, with enterprise plans offering the most cost-effective per-device pricing for large deployments."
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-8">
          Frequently Asked Questions
        </h2>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-circleTel-darkNeutral hover:text-circleTel-orange font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-circleTel-secondaryNeutral">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default PricingFAQ;
