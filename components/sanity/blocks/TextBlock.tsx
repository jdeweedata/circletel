// components/sanity/blocks/TextBlock.tsx
import { cn } from '@/lib/utils'
import { PortableText } from '../primitives'
import { PortableTextBlock } from '@portabletext/react'

interface TextBlockProps {
  eyebrow?: string
  title?: string
  content: PortableTextBlock[]
  alignment?: 'left' | 'center' | 'right'
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full'
  backgroundColor?: string
}

const maxWidthClasses = {
  narrow: 'max-w-xl',
  medium: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-full',
}

const alignmentClasses = {
  left: 'text-left',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
}

export function TextBlock({
  eyebrow,
  title,
  content,
  alignment = 'left',
  maxWidth = 'medium',
  backgroundColor,
}: TextBlockProps) {
  return (
    <div
      className="container mx-auto px-4"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div
        className={cn(
          maxWidthClasses[maxWidth],
          alignmentClasses[alignment]
        )}
      >
        {eyebrow && (
          <p className="text-sm font-medium text-circleTel-orange uppercase tracking-wide mb-2">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-3xl font-heading font-bold mb-6">{title}</h2>
        )}
        <PortableText value={content} className="prose prose-lg max-w-none" />
      </div>
    </div>
  )
}
