// components/sanity/blocks/GalleryBlock.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SanityImage } from '../primitives'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface GalleryImage {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number }
  alt?: string
  caption?: string
}

interface GalleryBlockProps {
  heading?: string
  images: GalleryImage[]
  layout?: 'grid' | 'masonry' | 'carousel'
  lightbox?: boolean
  columns?: 2 | 3 | 4
  gap?: 'none' | 'sm' | 'md' | 'lg'
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9'
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}

export function GalleryBlock({
  heading,
  images,
  layout = 'grid',
  lightbox = true,
  columns = 3,
  gap = 'md',
  aspectRatio = 'auto',
}: GalleryBlockProps) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null)

  if (!images?.length) return null

  const handleImageClick = (image: GalleryImage) => {
    if (lightbox) {
      setLightboxImage(image)
    }
  }

  return (
    <div className="container mx-auto px-4">
      {heading && (
        <h2 className="text-2xl font-heading font-bold mb-6">{heading}</h2>
      )}

      {/* Grid / Masonry layout */}
      {(layout === 'grid' || layout === 'masonry') && (
        <div className={cn('grid', columnClasses[columns], gapClasses[gap])}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(image)}
              className={cn(
                'relative overflow-hidden rounded-lg',
                lightbox && 'cursor-zoom-in',
                aspectRatio === 'square' && 'aspect-square',
                aspectRatio === '4:3' && 'aspect-[4/3]',
                aspectRatio === '16:9' && 'aspect-video'
              )}
            >
              <SanityImage
                image={image}
                fill={aspectRatio !== 'auto'}
                className={cn(
                  'transition-transform duration-300 hover:scale-105',
                  aspectRatio !== 'auto' && 'object-cover'
                )}
                width={aspectRatio === 'auto' ? 600 : undefined}
              />
            </button>
          ))}
        </div>
      )}

      {/* Carousel layout */}
      {layout === 'carousel' && (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(image)}
              className="flex-none w-80 snap-center rounded-lg overflow-hidden"
            >
              <SanityImage
                image={image}
                width={320}
                className="w-full h-auto"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox dialog */}
      {lightbox && lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
            <SanityImage
              image={lightboxImage}
              width={1200}
              className="w-full h-auto rounded-lg"
            />
            {lightboxImage.caption && (
              <p className="text-white text-center mt-4">{lightboxImage.caption}</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
