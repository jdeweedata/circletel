'use client'

import { HowItWorksSection as HowItWorksSectionType } from '@/lib/types/strapi'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

interface HowItWorksSectionProps {
  section: HowItWorksSectionType
}

export function HowItWorksSection({ section }: HowItWorksSectionProps) {
  return (
    <div className="w-full">
      {/* Section Header */}
      {section.title && (
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-2">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-lg text-circleTel-secondaryNeutral max-w-3xl mx-auto">
              {section.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-12 md:space-y-16">
        {section.steps.map((step, index) => {
          const isEven = index % 2 === 0

          return (
            <div
              key={step.id}
              className={`
                flex flex-col gap-8
                ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}
                items-center
              `}
            >
              {/* Step Number & Content */}
              <div className={`flex-1 ${isEven ? 'md:pr-8' : 'md:pl-8'}`}>
                {/* Step Number */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-circleTel-orange to-orange-600 text-white font-bold text-2xl shadow-lg">
                    {step.stepNumber}
                  </div>
                  {index < section.steps.length - 1 && (
                    <ArrowRight className="hidden md:block w-6 h-6 text-circleTel-orange" />
                  )}
                </div>

                {/* Step Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral mb-3">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-lg text-circleTel-secondaryNeutral leading-relaxed">
                  {step.description}
                </p>

                {/* Icon (if no image) */}
                {!step.image && step.icon && (
                  <div className="mt-6 text-6xl opacity-20">
                    {step.icon}
                  </div>
                )}
              </div>

              {/* Step Image */}
              <div className="flex-1 w-full">
                {step.image ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100">
                    <Image
                      src={step.image.url}
                      alt={step.image.alternativeText || step.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-8xl text-gray-200">
                      {step.icon || '📋'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Connection Line (Desktop Only) */}
      <div className="hidden md:block absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-circleTel-orange via-orange-400 to-transparent opacity-20" />
    </div>
  )
}