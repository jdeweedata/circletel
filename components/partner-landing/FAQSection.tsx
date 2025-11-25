'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'Do I need any experience to join?',
    answer: 'Nope! If you can share a link and chat to people, you\'re qualified. We provide all the training and support you need to succeed.',
  },
  {
    question: 'What can I sell through the programme?',
    answer: 'Everything CircleTel offers—Fibre packages from R399/month, LTE and 5G for areas without fibre, and business connectivity solutions. You earn on all of it.',
  },
  {
    question: 'How and when do I get paid?',
    answer: 'Commission is paid monthly, directly into your bank account. You can track your earnings in real-time through your partner dashboard. No waiting around.',
  },
  {
    question: 'Is there a minimum I need to sell?',
    answer: 'No minimums, no quotas, no pressure. Earn as much or as little as you want. Some partners do this full-time, others just share their link when it comes up naturally.',
  },
  {
    question: 'What support do I get?',
    answer: 'You get a dedicated partner manager, WhatsApp support, marketing materials, and access to our partner community. We\'re here to help you succeed.',
  },
  {
    question: 'Can I do this alongside my current job?',
    answer: 'Absolutely! Most of our partners have other jobs or businesses. This is perfect side-income that grows over time as your referrals stay connected.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-circleTel-secondaryNeutral">
              Everything you need to know about the partner programme
            </p>
          </div>

          {/* FAQ Accordion - Matching home page style */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                >
                  {/* Question */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full py-3 flex items-center justify-between gap-4 text-left hover:text-circleTel-orange transition-colors"
                  >
                    <span className="font-semibold text-circleTel-darkNeutral">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <Minus className="h-5 w-5 text-circleTel-orange flex-shrink-0" />
                    ) : (
                      <Plus className="h-5 w-5 text-circleTel-orange flex-shrink-0" />
                    )}
                  </button>

                  {/* Answer */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openIndex === index ? 'max-h-96 pt-2' : 'max-h-0'
                    }`}
                  >
                    <p className="text-circleTel-secondaryNeutral leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Still have questions */}
          <div className="text-center mt-8">
            <p className="text-circleTel-secondaryNeutral">
              Still have questions?{' '}
              <a href="mailto:partners@circletel.co.za" className="text-circleTel-orange font-semibold hover:underline">
                Contact our partner team
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
