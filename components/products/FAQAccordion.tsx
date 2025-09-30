'use client'

import { FAQSection } from '@/lib/types/strapi'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FAQAccordionProps {
  section: FAQSection
  defaultOpenIndex?: number
}

export function FAQAccordion({ section, defaultOpenIndex }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex ?? null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  // Group FAQs by category if categories exist
  const groupedFAQs = section.faqs.reduce((acc, faq) => {
    const category = faq.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(faq)
    return acc
  }, {} as Record<string, typeof section.faqs>)

  const hasCategories = Object.keys(groupedFAQs).length > 1

  return (
    <div className="w-full">
      {/* Section Header */}
      {section.title && (
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral">
            {section.title}
          </h2>
        </div>
      )}

      {/* FAQs */}
      <div className="max-w-4xl mx-auto">
        {hasCategories ? (
          // Render by category
          Object.entries(groupedFAQs).map(([category, faqs]) => (
            <div key={category} className="mb-8">
              <h3 className="text-xl font-bold text-circleTel-orange mb-4 pl-2">
                {category}
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, index) => {
                  const globalIndex = section.faqs.indexOf(faq)
                  const isOpen = openIndex === globalIndex

                  return (
                    <div
                      key={faq.id}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Question Button */}
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-circleTel-darkNeutral text-lg">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-circleTel-secondaryNeutral flex-shrink-0 transition-transform duration-200 ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Answer */}
                      <div
                        className={`
                          overflow-hidden transition-all duration-300 ease-in-out
                          ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                        `}
                      >
                        <div className="px-5 pb-5 text-circleTel-secondaryNeutral leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          // Render without categories
          <div className="space-y-3">
            {section.faqs.map((faq, index) => {
              const isOpen = openIndex === index

              return (
                <div
                  key={faq.id}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Question Button */}
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-circleTel-darkNeutral text-lg">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-circleTel-secondaryNeutral flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Answer */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="px-5 pb-5 text-circleTel-secondaryNeutral leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}