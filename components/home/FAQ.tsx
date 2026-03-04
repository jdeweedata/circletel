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
    id: 'video-calls',
    question: 'Is this fast enough for video conferencing?',
    answer: 'Absolutely. Even our entry-level 50Mbps plans handle HD video calls with room to spare. For back-to-back Zoom or Teams meetings, we recommend 100Mbps or higher for the smoothest experience. All our plans are uncapped, so you\'ll never run out of data mid-call.',
  },
  {
    id: 'multiple-devices',
    question: 'Can this handle multiple streaming devices?',
    answer: 'Yes! Our 100Mbps plans support 4+ devices streaming HD simultaneously. For households with gamers, multiple 4K TVs, and remote workers, we recommend 200Mbps. No throttling, no fair-usage caps — just fast internet for everyone.',
  },
  {
    id: 'downtime',
    question: 'What happens if my connection goes down?',
    answer: 'For home users, our 24/7 support team will troubleshoot and dispatch a technician if needed. Business customers get priority response with a 4-hour fix guarantee. For critical operations, add our 5G Failover — it automatically switches to 5G backup so you never go offline.',
  },
  {
    id: 'contract',
    question: 'Is there a contract or lock-in period?',
    answer: 'No contracts on residential plans — cancel anytime with 30 days notice. No hidden fees, no early termination penalties. For businesses wanting SLA guarantees, we offer flexible 12-month agreements with discounted rates.',
  },
  {
    id: 'installation',
    question: 'How long does installation take?',
    answer: 'For Fixed Wireless and 5G: 3-7 days. For Fibre: 7-14 days depending on whether your area is already trenched. All installations are free and performed by our certified technicians. We\'ll confirm your installation date before you commit.',
  },
  {
    id: 'support',
    question: 'What support is included?',
    answer: 'All plans include 24/7 technical support via phone, email, and WhatsApp. Our support team is based in South Africa — no overseas call centres. Business plans include dedicated account managers and priority response.',
  },
];

export function FAQ() {
  return (
    <section className="bg-circleTel-grey200 py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <h2 className="font-heading text-display-2-mobile md:text-display-2 text-circleTel-navy text-center mb-8 md:mb-12">
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
