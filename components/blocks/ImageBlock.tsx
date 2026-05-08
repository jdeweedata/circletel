import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface ImageBlockProps {
  image: string
  alt?: string
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

const sizeWidths = {
  small: 400,
  medium: 800,
  large: 1200,
  full: 1920,
}

const alignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
}

export function ImageBlock({
  image,
  alt,
  caption,
  link,
  size = 'medium',
  alignment = 'center',
  rounded = false,
}: ImageBlockProps) {
  if (!image) return null

  const imageElement = (
    <figure className={cn(sizeClasses[size], alignmentClasses[alignment])}>
      <Image
        src={image}
        alt={alt || ''}
        width={sizeWidths[size]}
        height={Math.round(sizeWidths[size] * 0.5625)}
        className={cn('w-full h-auto', rounded && 'rounded-lg')}
      />
      {caption && (
        <figcaption className="mt-3 text-sm text-gray-500 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )

  if (link) {
    const href =
      link.linkType === 'internal' && link.internalLink?.slug?.current
        ? `/${link.internalLink.slug.current}`
        : link.externalUrl || '#'

    return (
      <div className="container mx-auto px-4">
        <Link
          href={href}
          target={link.openInNewTab ? '_blank' : undefined}
          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
          className="block"
        >
          {imageElement}
        </Link>
      </div>
    )
  }

  return <div className="container mx-auto px-4">{imageElement}</div>
}
