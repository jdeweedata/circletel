import { cn } from '@/lib/utils'

interface TextBlockProps {
  eyebrow?: string
  title?: string
  content: string | Array<{ _type: string; children?: Array<{ text: string }> }>
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

function renderContent(content: TextBlockProps['content']): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((block) =>
      block.children?.map((child) => child.text).join('') ?? ''
    )
    .join('\n')
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
      <div className={cn(maxWidthClasses[maxWidth], alignmentClasses[alignment])}>
        {eyebrow && (
          <p className="text-sm font-medium text-circleTel-orange uppercase tracking-wide mb-2">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-3xl font-heading font-bold mb-6">{title}</h2>
        )}
        <div className="prose prose-lg max-w-none">
          {renderContent(content)}
        </div>
      </div>
    </div>
  )
}
