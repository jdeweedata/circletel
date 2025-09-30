"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MessageCircle, HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "Is CircleTel Business Internet available at my address?",
    answer: "Use our coverage checker tool at the top of this page to verify fibre, 5G, and LTE availability at your business address. We'll show you exactly what speeds and packages are available in your area with real-time coverage data."
  },
  {
    question: "What is 5G Business Internet?",
    answer: "5G Business Internet delivers ultra-fast wireless connectivity using MTN's 5G network. With speeds up to 300Mbps and low latency, it's perfect for businesses that need reliable internet without waiting for fibre installation."
  },
  {
    question: "What is Business Fibre Internet?",
    answer: "Our Business Fibre delivers dedicated internet with guaranteed speeds up to 1Gbps. Unlike residential connections, business fibre includes SLA guarantees, priority support, and enhanced security features designed for professional use."
  },
  {
    question: "Can CircleTel help with early termination fees when I switch?",
    answer: "Yes! We offer termination fee assistance for qualifying business customers switching from competitors. Our team will review your current contract and provide options to minimize switching costs."
  },
  {
    question: "What business internet plans does CircleTel offer?",
    answer: "We offer three main business internet solutions: Fibre Business (up to 1Gbps), 5G Business (up to 300Mbps), and LTE Business (up to 20Mbps). All plans include static IP addresses, 24/7 support, and SLA guarantees."
  },
  {
    question: "How quickly can my business get connected?",
    answer: "Connection times vary by solution: 5G and LTE Business can be activated within 24-48 hours, while Fibre Business typically takes 5-10 working days depending on infrastructure availability in your area."
  },
  {
    question: "Do you offer managed WiFi for businesses?",
    answer: "Yes! Our Managed WiFi Pro service includes enterprise-grade access points, 24/7 monitoring, automatic updates, and on-site support. Perfect for offices, retail spaces, and hospitality businesses."
  },
  {
    question: "What makes CircleTel different from other business ISPs?",
    answer: "We're 100% South African with local support teams, guaranteed SLAs, transparent pricing with no hidden costs, and specialized business features like static IPs, priority support, and flexible contracts designed for SMEs."
  }
]

export function DemoFAQSection() {
  return (
    <section className="py-16 lg:py-24 bg-circleTel-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-4 py-2 bg-circleTel-blue-600/10 text-circleTel-blue-600 border-circleTel-blue-600/20">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support Center
            </Badge>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-circleTel-darkNeutral">
              Have questions? We've got answers.
            </h2>

            <p className="text-xl text-circleTel-secondaryNeutral max-w-2xl mx-auto">
              Everything you need to know about CircleTel Business Internet services
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="mb-12">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white border border-circleTel-gray-200 rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left hover:no-underline font-semibold text-circleTel-darkNeutral py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-circleTel-secondaryNeutral pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Support */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-circleTel-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-2">
                Need more help?
              </h3>
              <p className="text-circleTel-secondaryNeutral">
                Our business support team is available 24/7 to answer your questions and help with setup.
              </p>
            </div>

            {/* Contact Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-xl bg-circleTel-orange/5 border border-circleTel-orange/20 hover:bg-circleTel-orange/10 transition-colors">
                <Phone className="w-8 h-8 text-circleTel-orange mx-auto mb-3" />
                <div className="font-semibold text-circleTel-darkNeutral mb-1">Phone Support</div>
                <div className="text-sm text-circleTel-secondaryNeutral mb-3">24/7 Business Line</div>
                <Button variant="outline" size="sm" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                  087 073 0000
                </Button>
              </div>

              <div className="text-center p-6 rounded-xl bg-circleTel-blue-600/5 border border-circleTel-blue-600/20 hover:bg-circleTel-blue-600/10 transition-colors">
                <Mail className="w-8 h-8 text-circleTel-blue-600 mx-auto mb-3" />
                <div className="font-semibold text-circleTel-darkNeutral mb-1">Email Support</div>
                <div className="text-sm text-circleTel-secondaryNeutral mb-3">Business Priority</div>
                <Button variant="outline" size="sm" className="border-circleTel-blue-600 text-circleTel-blue-600 hover:bg-circleTel-blue-600 hover:text-white">
                  business@circletel.co.za
                </Button>
              </div>

              <div className="text-center p-6 rounded-xl bg-circleTel-red/5 border border-circleTel-red/20 hover:bg-circleTel-red/10 transition-colors">
                <MessageCircle className="w-8 h-8 text-circleTel-red mx-auto mb-3" />
                <div className="font-semibold text-circleTel-darkNeutral mb-1">WhatsApp Business</div>
                <div className="text-sm text-circleTel-secondaryNeutral mb-3">Instant Support</div>
                <Button variant="outline" size="sm" className="border-circleTel-red text-circleTel-red hover:bg-circleTel-red hover:text-white">
                  073 728 8016
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}