import Image from 'next/image'
import { useNextSanityImage } from 'next-sanity/image'
import { client } from '@/lib/sanity/client'

interface SanityImageProps {
  image: any
  alt: string
  className?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
}

export function SanityImage({ 
  image, 
  alt, 
  className = '', 
  priority = false,
  fill = false,
  width,
  height
}: SanityImageProps) {
  const imageProps = useNextSanityImage(client, image)

  if (!image || !image.asset) return null

  if (fill) {
    return (
      <div className={`relative ${className}`} style={{ width: width || '100%', height: height || '100%' }}>
        <Image
          {...imageProps}
          alt={alt}
          className="object-cover"
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    )
  }

  return (
    <Image
      {...imageProps}
      width={width || imageProps.width}
      height={height || imageProps.height}
      alt={alt}
      className={className}
      priority={priority}
      style={{ width: '100%', height: 'auto' }}
    />
  )
}
