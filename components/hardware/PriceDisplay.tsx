'use client'

interface PriceDisplayProps {
  retailPrice: number
  size?: 'sm' | 'md' | 'lg'
  showVatNote?: boolean
}

export function PriceDisplay({
  retailPrice,
  size = 'md',
  showVatNote = true,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div>
      <span
        className={`font-bold text-[#1B2A4A] ${sizeClasses[size]}`}
      >
        R{retailPrice.toLocaleString('en-ZA', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
      {showVatNote && (
        <span className="ml-1 text-xs font-semibold text-[#7C93AF]">
          incl VAT
        </span>
      )}
    </div>
  )
}
