// components/sanity/blocks/SeparatorBlock.tsx
import { cn } from '@/lib/utils'

interface SeparatorBlockProps {
  mode?: 'divider' | 'spacer'
  style?: 'line' | 'gradient' | 'dashed' | 'dots'
  width?: 'full' | 'three-quarters' | 'half' | 'quarter'
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

const spacingClasses = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
  xl: 'py-16',
}

const widthClasses = {
  full: 'w-full',
  'three-quarters': 'w-3/4',
  half: 'w-1/2',
  quarter: 'w-1/4',
}

export function SeparatorBlock({
  mode = 'divider',
  style = 'line',
  width = 'full',
  spacing = 'md',
  color,
}: SeparatorBlockProps) {
  // Spacer mode: just empty space
  if (mode === 'spacer') {
    return <div className={spacingClasses[spacing]} aria-hidden="true" />
  }

  // Divider mode: visible line
  const dividerStyles = {
    line: 'border-t border-gray-200',
    gradient: 'h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent',
    dashed: 'border-t border-dashed border-gray-300',
    dots: 'border-t-2 border-dotted border-gray-300',
  }

  return (
    <div className={cn('flex justify-center', spacingClasses[spacing])}>
      <hr
        className={cn(
          dividerStyles[style],
          widthClasses[width]
        )}
        style={color ? { borderColor: color } : undefined}
      />
    </div>
  )
}
