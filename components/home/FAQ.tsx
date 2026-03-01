'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'coverage',
    question: 'How do I check if CircleTel is available at my address?',
    answer: 'Enter your address in our coverage checker at the top of this page. You\'ll see all available plans and technologies (Fibre, 5G, LTE) for your location within seconds.',
  },
  {
    id: 'support',
    question: 'What support is included?',
    answer: 'All plans include 24/7 technical support via phone, email, and WhatsApp. Our local support team is based in South Africa for faster response times. Business plans also include dedicated account managers and priority SLA response.',
  },
  {
    id: 'contract',
    question: 'Is there a contract or lock-in period?',
    answer: 'No! All our residential plans are month-to-month. You can cancel anytime with 30 days notice. For business plans with SLA guarantees, we offer 12-month agreements with discounted rates.',
  },
  {
    id: 'speeds',
    question: 'What speeds can I expect?',
    answer: 'Speeds depend on your location and the technology available. Fibre typically delivers 25-1000Mbps, 5G delivers 50-500Mbps, and LTE delivers 10-50Mbps. Use our coverage checker to see exactly what\'s available at your address.',
  },
  {
    id: 'installation',
    question: 'How long does installation take?',
    answer: 'For Fibre: 7-14 days depending on whether your area is already trenched. For 5G/LTE: 3-5 days as it only requires router delivery and setup. All installations are free and performed by our certified technicians.',
  },
];

export function FAQ() {
  return (
    <section className="bg-circleTel-grey200 py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-circleTel-navy text-center mb-8 md:mb-12">
          Frequently asked questions
        </h2>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible defaultValue="coverage" className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
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

        {/* Show More Link */}
        <div className="text-center mt-8">
          <a
            href="/faq"
            className="font-body text-circleTel-orange-accessible hover:text-circleTel-orange font-medium text-sm md:text-base inline-flex items-center gap-1 transition-colors"
          >
            Show more questions
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
