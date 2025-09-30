"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function WirelessFAQ() {
  const faqs = [
    {
      question: "How do I check if wireless coverage is available at my location?",
      answer: "Use our coverage checker tool above to verify MTN 5G and LTE availability at your business address. We'll show you exactly what speeds and packages are available in your area with real-time coverage data."
    },
    {
      question: "How quickly can I get connected?",
      answer: "Most wireless connections are activated within 24-48 hours. For SIM + Device packages, we deliver pre-configured equipment that you simply plug in and start using immediately. Professional installation is available for complex setups."
    },
    {
      question: "What are the contract terms?",
      answer: "All wireless packages require a 24-month initial contract term. After this period, services continue month-to-month with no exit penalties. You can upgrade, downgrade, or cancel anytime with 30 days notice."
    },
    {
      question: "What happens after I reach my Fair Usage Policy (FUP) limit?",
      answer: "Your service continues without interruption, but speeds are reduced to the specified threshold speeds. There are no additional charges or hard caps - you get truly unlimited data. FUP allocations reset monthly on your billing cycle."
    },
    {
      question: "Do I get a static IP address?",
      answer: "Yes! Every business wireless package includes a free static IP address, enabling remote access to your systems and professional email hosting. Additional IP addresses are available for R99/month each."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We provide 24/7 South African-based technical support via phone, email, and WhatsApp. Business customers get priority support with guaranteed response times. Enterprise packages include dedicated account managers."
    },
    {
      question: "Can I use my own router?",
      answer: "Absolutely! SIM-only packages work with any 5G or LTE-compatible router. We also offer pre-configured routers for plug-and-play convenience, or you can bring your own device (BYOD) to save on monthly costs."
    },
    {
      question: "What areas have 5G coverage?",
      answer: "5G coverage is available in major metros including Johannesburg, Cape Town, Durban, and Pretoria. All packages automatically fall back to our extensive LTE network when 5G isn't available, ensuring consistent connectivity nationwide."
    }
  ]

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Frequently Asked Questions</h2>
          <p className="text-circleTel-secondaryNeutral text-lg">
            Everything you need to know about CircleTel wireless services
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg px-6 bg-white"
            >
              <AccordionTrigger className="text-left hover:no-underline font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-circleTel-secondaryNeutral">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <div className="bg-circleTel-orange/5 rounded-lg p-6 border border-circleTel-orange/20">
            <h3 className="font-semibold text-circleTel-orange mb-2">Need more help?</h3>
            <p className="text-circleTel-darkNeutral mb-4">
              Our technical team is available 24/7 to answer your questions and help with setup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <span>📞 <strong>Phone:</strong> 087 073 0000</span>
              <span>📧 <strong>Email:</strong> support@circletel.co.za</span>
              <span>💬 <strong>WhatsApp:</strong> 073 728 8016</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}