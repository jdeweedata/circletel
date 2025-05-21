
import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const BusinessFAQ = ({ faqs }: { faqs: FAQItem[] }) => {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-circleTel-darkNeutral mb-2">{faq.question}</h3>
                <p className="text-circleTel-secondaryNeutral">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessFAQ;
