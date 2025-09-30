'use client'

import { PricingTableSection } from '@/lib/types/strapi'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import Link from 'next/link'

interface PricingComparisonTableProps {
  section: PricingTableSection
}

export function PricingComparisonTable({ section }: PricingComparisonTableProps) {
  return (
    <div className="w-full">
      {/* Section Header */}
      {section.title && (
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-2">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
              {section.description}
            </p>
          )}
        </div>
      )}

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${section.columns.length}, minmax(250px, 1fr))` }}>
            {section.columns.map((column, index) => (
              <div
                key={index}
                className={`
                  flex flex-col rounded-lg overflow-hidden border
                  ${column.highlighted
                    ? 'border-2 border-circleTel-orange shadow-xl scale-105 bg-white'
                    : 'border-gray-200 shadow-md bg-white'
                  }
                `}
              >
                {/* Column Header */}
                <div className={`p-6 ${column.highlighted ? 'bg-gradient-to-br from-circleTel-orange to-orange-600' : 'bg-gray-50'}`}>
                  <h3 className={`text-2xl font-bold ${column.highlighted ? 'text-white' : 'text-circleTel-darkNeutral'}`}>
                    {column.title}
                  </h3>
                  {column.price !== undefined && (
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-bold ${column.highlighted ? 'text-white' : 'text-circleTel-darkNeutral'}`}>
                          {column.currency || 'R'}{column.price.toFixed(2)}
                        </span>
                      </div>
                      {column.billingCycle && (
                        <p className={`text-sm mt-1 ${column.highlighted ? 'text-white/90' : 'text-circleTel-secondaryNeutral'}`}>
                          {column.billingCycle}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="flex-1 p-6">
                  <ul className="space-y-3">
                    {column.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        {feature.startsWith('✓') || feature.startsWith('✔') ? (
                          <>
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-circleTel-darkNeutral">{feature.replace(/^[✓✔]\s*/, '')}</span>
                          </>
                        ) : feature.startsWith('✗') || feature.startsWith('×') ? (
                          <>
                            <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-400">{feature.replace(/^[✗×]\s*/, '')}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-circleTel-darkNeutral">{feature}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                {column.ctaText && (
                  <div className="p-6 pt-0">
                    {column.ctaLink ? (
                      <Link href={column.ctaLink} className="block">
                        <Button
                          className={`w-full ${
                            column.highlighted
                              ? 'bg-circleTel-orange hover:bg-orange-600 text-white'
                              : 'bg-circleTel-darkNeutral hover:bg-gray-800 text-white'
                          }`}
                          size="lg"
                        >
                          {column.ctaText}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className={`w-full ${
                          column.highlighted
                            ? 'bg-circleTel-orange hover:bg-orange-600 text-white'
                            : 'bg-circleTel-darkNeutral hover:bg-gray-800 text-white'
                        }`}
                        size="lg"
                      >
                        {column.ctaText}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View - Stacked Cards */}
      <div className="md:hidden space-y-4">
        {section.columns.map((column, index) => (
          <div
            key={index}
            className={`
              flex flex-col rounded-lg overflow-hidden border
              ${column.highlighted
                ? 'border-2 border-circleTel-orange shadow-xl bg-white'
                : 'border-gray-200 shadow-md bg-white'
              }
            `}
          >
            {/* Column Header */}
            <div className={`p-4 ${column.highlighted ? 'bg-gradient-to-br from-circleTel-orange to-orange-600' : 'bg-gray-50'}`}>
              <h3 className={`text-xl font-bold ${column.highlighted ? 'text-white' : 'text-circleTel-darkNeutral'}`}>
                {column.title}
              </h3>
              {column.price !== undefined && (
                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${column.highlighted ? 'text-white' : 'text-circleTel-darkNeutral'}`}>
                      {column.currency || 'R'}{column.price.toFixed(2)}
                    </span>
                  </div>
                  {column.billingCycle && (
                    <p className={`text-sm mt-1 ${column.highlighted ? 'text-white/90' : 'text-circleTel-secondaryNeutral'}`}>
                      {column.billingCycle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="p-4">
              <ul className="space-y-2">
                {column.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    {feature.startsWith('✓') || feature.startsWith('✔') ? (
                      <>
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-circleTel-darkNeutral">{feature.replace(/^[✓✔]\s*/, '')}</span>
                      </>
                    ) : feature.startsWith('✗') || feature.startsWith('×') ? (
                      <>
                        <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-400">{feature.replace(/^[✗×]\s*/, '')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-circleTel-darkNeutral">{feature}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            {column.ctaText && (
              <div className="p-4 pt-0">
                {column.ctaLink ? (
                  <Link href={column.ctaLink} className="block">
                    <Button
                      className={`w-full ${
                        column.highlighted
                          ? 'bg-circleTel-orange hover:bg-orange-600 text-white'
                          : 'bg-circleTel-darkNeutral hover:bg-gray-800 text-white'
                      }`}
                    >
                      {column.ctaText}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className={`w-full ${
                      column.highlighted
                        ? 'bg-circleTel-orange hover:bg-orange-600 text-white'
                        : 'bg-circleTel-darkNeutral hover:bg-gray-800 text-white'
                    }`}
                  >
                    {column.ctaText}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}