'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How is this different from typical ISP partnerships?',
    answer: 'Traditional ISPs give you a catalog and expect you to sell. We ask what your customers need first, then build solutions together. Your market insights directly shape our product roadmap. Think product co-creation, not just commission sales.',
  },
  {
    question: 'Do I need to sell specific products?',
    answer: 'No quota or product mandates. We want you selling solutions that actually fit your customers. If you tell us a product does not work for your market, we will work with you to build something that does. Blue ocean strategy means better fit equals easier sales.',
  },
  {
    question: 'What if customers I talk to do not fit current offerings?',
    answer: 'Perfect—that is exactly what we want to hear. Document the gap in your partner dashboard. We review partner feedback quarterly and prioritize builds based on demand signals from the field. Many of our best products came from partner insights.',
  },
  {
    question: 'How do you decide which partner suggestions to build?',
    answer: 'We look at frequency of requests, market size, and whether it serves an underserved segment. If 3+ partners flag the same customer problem, it goes to our product team for feasibility analysis. Quarterly roadmap sessions include partner voting on priorities.',
  },
  {
    question: 'What is the time commitment?',
    answer: '5-7 days for approval and onboarding. After that, it is flexible—sell as much or as little as you want. Most successful partners spend 2-3 hours per week on sales and 30 minutes per month giving product feedback. No minimums, just collaboration.',
  },
  {
    question: 'Do you work with partners outside major metros?',
    answer: 'Absolutely! We specifically want partners in underserved areas where traditional ISPs do not focus. Your local market knowledge is exactly what helps us identify blue ocean opportunities. If you know a customer segment being ignored, we want to talk.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 mb-4">
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">Have Questions?</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            Common Questions
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral">
            Understanding how partnership and product co-creation works
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-circleTel-orange/30 transition-colors duration-300"
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="font-semibold text-circleTel-darkNeutral text-lg">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-6 w-6 text-circleTel-orange flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5 text-circleTel-secondaryNeutral leading-relaxed border-t border-gray-100 pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Help Text */}
        <div className="mt-12 text-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200">
          <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">
            Want to Discuss Your Market?
          </h3>
          <p className="text-circleTel-secondaryNeutral mb-6">
            Talk to our team about customer segments you think we should serve
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:partners@circletel.co.za"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-circleTel-orange bg-white border-2 border-circleTel-orange rounded-lg hover:bg-circleTel-orange hover:text-white transition-all duration-300"
            >
              <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us
            </a>
            <a
              href="tel:+27876543210"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-circleTel-orange rounded-lg hover:bg-circleTel-orange/90 transition-all duration-300"
            >
              <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Schedule a Call
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
