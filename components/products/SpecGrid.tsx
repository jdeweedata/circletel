'use client'

import { SpecGridSection } from '@/lib/types/strapi'
import { Wifi, Zap, Clock, Shield, Award, CheckCircle } from 'lucide-react'

interface SpecGridProps {
  section: SpecGridSection
}

// Icon mapping for common spec types
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  speed: Zap,
  time: Clock,
  security: Shield,
  award: Award,
  check: CheckCircle,
}

export function SpecGrid({ section }: SpecGridProps) {
  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    const IconComponent = iconMap[iconName.toLowerCase()]
    return IconComponent ? <IconComponent className="w-8 h-8" /> : null
  }

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

      {/* Specs Grid */}
      <div
        className={`
          grid gap-6
          ${section.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}
          ${section.columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
          ${section.columns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : ''}
          ${section.columns > 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : ''}
        `}
      >
        {section.items.map((item) => (
          <div
            key={item.id}
            className="
              flex flex-col items-center text-center
              p-6 rounded-lg border border-gray-200
              bg-white shadow-sm hover:shadow-md
              transition-all duration-200
              hover:border-circleTel-orange
              group
            "
          >
            {/* Icon */}
            {item.icon && (
              <div className="mb-4 text-circleTel-orange group-hover:scale-110 transition-transform duration-200">
                {getIcon(item.icon) || (
                  <div className="text-4xl">{item.icon}</div>
                )}
              </div>
            )}

            {/* Label */}
            <h3 className="text-sm font-medium text-circleTel-secondaryNeutral mb-2 uppercase tracking-wide">
              {item.label}
            </h3>

            {/* Value */}
            <p className="text-2xl md:text-3xl font-bold text-circleTel-darkNeutral">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}