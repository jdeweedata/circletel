'use client';
import { PiCaretDownBold, PiMinusBold, PiPlusBold } from 'react-icons/pi';

import { useState } from 'react';

const faqs = [
  {
    question: 'What does "founding partner pilot" mean?',
    answer: 'We are launching the programme with a small first group so every partner gets personal onboarding and a direct line to the team. Founding partners keep their commission terms as the programme grows.',
  },
  {
    question: 'How much do I earn, exactly?',
    answer: '10% of your referral\'s monthly subscription, every month, for as long as they stay connected. A referral on a R999/month package earns you R99 a month — ten of those is R999 a month, ongoing.',
  },
  {
    question: 'When exactly do I get paid?',
    answer: 'Monthly, by the 5th, for the previous month\'s collected payments. Your referral pays their March bill; your commission is in your account by 5 April. Balances under R200 roll over to the next month so you\'re never paid in cents.',
  },
  {
    question: 'What can I refer people to?',
    answer: 'Qualifying CircleTel packages across fibre, fixed-wireless and LTE/5G — for homes and businesses. We\'ll give you the current qualifying list when you join; you earn the same 10% on all of them.',
  },
  {
    question: 'Do I need any experience to join?',
    answer: 'No. If you know people who need reliable internet — tenants, neighbours, clients, a community group — you have what the programme needs. We handle quotes, installation and support.',
  },
  {
    question: 'Is there a contract or lock-in?',
    answer: 'No. You can pause or stop at any time. No minimums, no penalties — and commission already earned still gets paid.',
  },
  {
    question: 'Can I do this alongside my current job?',
    answer: 'Yes — it\'s designed as side income. Property managers, IT freelancers and community admins are a natural fit, because one referral network can produce many connections.',
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
            <h2 className="text-3xl font-bold text-circleTel-navy mb-4">
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
                    <span className="font-semibold text-circleTel-navy">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <PiMinusBold className="h-5 w-5 text-circleTel-orange flex-shrink-0" />
                    ) : (
                      <PiPlusBold className="h-5 w-5 text-circleTel-orange flex-shrink-0" />
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
