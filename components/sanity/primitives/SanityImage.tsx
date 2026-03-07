// components/sanity/primitives/SanityImage.tsx
import Image from 'next/image'
import { urlFor } from '@/lib/sanity/image'

interface SanityImageAsset {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    width: number
    height: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  alt?: string
}

interface SanityImageProps {
  image: SanityImageAsset
  alt?: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  className?: string
  priority?: boolean
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9'
}

export function SanityImage({
  image,
  alt,
  width = 1200,
  height,
  fill = false,
  sizes,
  className,
  priority = false,
  aspectRatio = 'auto',
}: SanityImageProps) {
  if (!image?.asset) {
    return null
  }

  const imageUrl = urlFor(image).width(width).auto('format').url()

  // Calculate height based on aspect ratio if not provided
  const calculatedHeight = height || (() => {
    switch (aspectRatio) {
      case 'square':
        return width
      case '4:3':
        return Math.round(width * 0.75)
      case '16:9':
        return Math.round(width * 0.5625)
      default:
        return Math.round(width * 0.5625)
    }
  })()

  // Extract hotspot for object-position
  const hotspot = image.hotspot
  const objectPosition = hotspot
    ? `${hotspot.x * 100}% ${hotspot.y * 100}%`
    : 'center'

  const altText = image.alt || alt || ''

  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={altText}
        fill
        sizes={sizes || '100vw'}
        className={className}
        style={{ objectPosition }}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={altText}
      width={width}
      height={calculatedHeight}
      className={className}
      style={{ objectPosition }}
      priority={priority}
    />
  )
}
