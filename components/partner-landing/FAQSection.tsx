'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How much can I earn as a CircleTel partner?',
    answer: 'Your earnings depend on your sales volume and the packages you sell. Commission rates range from 1.43% to 4.13% based on monthly package values. Our active partners earn an average of R18,500/month, with top performers earning over R45,000/month in recurring commission.',
  },
  {
    question: 'When and how do I receive commission payments?',
    answer: 'Commission is paid monthly, typically within 7 business days after month-end. Payments are made via EFT directly to your registered bank account. You can track all pending and paid commissions in real-time through your partner portal.',
  },
  {
    question: 'What documents do I need to apply?',
    answer: 'Requirements vary by business type. Sole proprietors need 5 documents (ID, proof of address, banking details), while companies need 11 documents including CIPC registration, directors info, and tax documents. The full checklist is provided during the online application.',
  },
  {
    question: 'How long does the approval process take?',
    answer: 'Typical approval takes 5-7 business days. This includes document verification, FICA compliance checks, and system setup. Once approved, you\'ll receive your unique partner number and immediate access to the partner portal.',
  },
  {
    question: 'Do I need technical knowledge to be a partner?',
    answer: 'No technical expertise required. CircleTel handles all installations, technical support, and customer service. Your role is to generate leads and close sales. We provide comprehensive training on products, pricing, and the sales process.',
  },
  {
    question: 'Can I see package availability for specific addresses?',
    answer: 'Yes! Your partner portal includes a real-time coverage checker integrated with MTN WMS, Vumatel, DFA, and other providers. Simply enter an address to see all available packages, pricing, and installation timelines.',
  },
  {
    question: 'What marketing support do you provide?',
    answer: 'Partners receive downloadable brochures, email templates, social media graphics, and co-branded materials. We also provide sample sales scripts, objection handling guides, and monthly webinars covering best practices and new products.',
  },
  {
    question: 'Is there a minimum sales requirement?',
    answer: 'No monthly minimum. We understand that sales fluctuate, especially when starting. However, partners with zero sales for 6 consecutive months may be reviewed. Our account managers work with you to develop strategies for consistent growth.',
  },
  {
    question: 'Can I partner if I already work with other ISPs?',
    answer: 'Absolutely! Most of our partners represent multiple ISPs. Our partner agreement is non-exclusive, allowing you to offer CircleTel alongside other providers. Many partners find our commission structure and portal features superior.',
  },
  {
    question: 'How do I track my leads and customers?',
    answer: 'Your partner portal provides real-time visibility into all leads, quotes, pending orders, active customers, and commission history. You can also set up automated email notifications for status changes and payment updates.',
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
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral">
            Everything you need to know about the CircleTel Partner Programme
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
            Still Have Questions?
          </h3>
          <p className="text-circleTel-secondaryNeutral mb-6">
            Our partner success team is here to help you get started
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
              Call Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
