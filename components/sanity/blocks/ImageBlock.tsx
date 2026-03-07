// components/sanity/blocks/ImageBlock.tsx
import { cn } from '@/lib/utils'
import { SanityImage, SanityLink } from '../primitives'

interface ImageBlockProps {
  image: {
    _type: 'image'
    asset: { _ref: string; _type: 'reference' }
    hotspot?: { x: number; y: number }
    alt?: string
  }
  caption?: string
  link?: {
    linkType: 'internal' | 'external'
    internalLink?: { _type: string; slug?: { current: string } }
    externalUrl?: string
    openInNewTab?: boolean
  }
  size?: 'small' | 'medium' | 'large' | 'full'
  alignment?: 'left' | 'center' | 'right'
  rounded?: boolean
}

const sizeClasses = {
  small: 'max-w-sm',
  medium: 'max-w-2xl',
  large: 'max-w-4xl',
  full: 'max-w-full',
}

const alignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
}

export function ImageBlock({
  image,
  caption,
  link,
  size = 'medium',
  alignment = 'center',
  rounded = false,
}: ImageBlockProps) {
  const imageElement = (
    <figure
      className={cn(
        sizeClasses[size],
        alignmentClasses[alignment]
      )}
    >
      <SanityImage
        image={image}
        className={cn(
          'w-full h-auto',
          rounded && 'rounded-lg'
        )}
        width={size === 'full' ? 1920 : size === 'large' ? 1200 : size === 'medium' ? 800 : 400}
      />
      {caption && (
        <figcaption className="mt-3 text-sm text-gray-500 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )

  if (link) {
    return (
      <div className="container mx-auto px-4">
        <SanityLink link={link} className="block">
          {imageElement}
        </SanityLink>
      </div>
    )
  }

  return <div className="container mx-auto px-4">{imageElement}</div>
}
