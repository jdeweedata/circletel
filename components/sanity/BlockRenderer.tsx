// components/sanity/BlockRenderer.tsx
import { cn } from '@/lib/utils'
import { SanitySection } from '@/lib/sanity/types'
import { blockRegistry } from './blocks'

interface BlockRendererProps {
  sections: SanitySection[]
  className?: string
}

const paddingClasses = {
  none: '',
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
  xl: 'py-16',
}

const visibilityClasses = {
  none: '',
  mobile: 'hidden md:block',
  desktop: 'md:hidden',
}

const themeClasses = {
  default: '',
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 text-white',
  brand: 'bg-circleTel-orange text-white',
}

export function BlockRenderer({ sections, className }: BlockRendererProps) {
  if (!sections?.length) return null

  return (
    <div className={className}>
      {sections.map((section) => {
        const Component = blockRegistry[section._type]

        if (!Component) {
          console.warn(`[Sanity] Unknown block type: ${section._type}`)
          return null
        }

        const paddingTop = paddingClasses[section.paddingTop || 'md']
        const paddingBottom = paddingClasses[section.paddingBottom || 'md']
        const visibility = visibilityClasses[section.hideOn || 'none']
        const theme = themeClasses[section.theme || 'default']

        return (
          <section
            key={section._key}
            id={section.anchorId}
            data-block-type={section._type}
            data-theme={section.theme || 'default'}
            className={cn(
              paddingTop,
              paddingBottom,
              visibility,
              theme
            )}
          >
            <Component {...section} />
          </section>
        )
      })}
    </div>
  )
}
