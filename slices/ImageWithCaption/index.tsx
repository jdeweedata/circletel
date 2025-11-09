/**
 * ImageWithCaption Slice
 * Media block with optional caption
 */

import { Content } from '@prismicio/client';
import { SliceComponentProps } from '@prismicio/react';
import { PrismicNextImage } from '@prismicio/next';

export type ImageWithCaptionSlice = SliceComponentProps<Content.ImageWithCaptionSlice>;

const ImageWithCaption = ({ slice }: ImageWithCaptionSlice): JSX.Element => {
  return (
    <section className="py-16 md:py-24 bg-white" data-slice-type={slice.slice_type}>
      <div className="container mx-auto px-4 max-w-4xl">
        {slice.primary.image?.url && (
          <figure className="mb-8">
            <div className="relative overflow-hidden rounded-lg shadow-lg">
              <PrismicNextImage
                field={slice.primary.image}
                className="w-full h-auto"
              />
            </div>
            {slice.primary.caption && (
              <figcaption className="mt-4 text-center text-sm text-circleTel-secondaryNeutral italic">
                {slice.primary.caption}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  );
};

export default ImageWithCaption;
